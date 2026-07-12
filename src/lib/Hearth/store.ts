import { derived, get, writable } from 'svelte/store';
import { callService, type HassEntities, type HassEntity } from 'home-assistant-js-websocket';
import { connection, states } from '$lib/Stores';
import { getTogglableService } from '$lib/Utils';
import { DEFAULT_HEARTH_CONFIG, type HearthConfig } from './config';

/* configuration */

export const hearthConfig = writable<HearthConfig>(structuredClone(DEFAULT_HEARTH_CONFIG));

// server-managed save counter for conflict detection between tabs
export const hearthRevision = writable(0);

const undoStack: HearthConfig[] = [];
const redoStack: HearthConfig[] = [];

export const canUndo = writable(false);
export const canRedo = writable(false);

function syncHistoryFlags() {
	canUndo.set(undoStack.length > 0);
	canRedo.set(redoStack.length > 0);
}

export function updateConfig(mutate: (config: HearthConfig) => void) {
	hearthConfig.update((config) => {
		undoStack.push(config);
		if (undoStack.length > 50) undoStack.shift();
		redoStack.length = 0;
		const next = structuredClone(config);
		mutate(next);
		return next;
	});
	syncHistoryFlags();
}

export function undoConfig() {
	const previous = undoStack.pop();
	if (!previous) return;
	redoStack.push(get(hearthConfig));
	hearthConfig.set(previous);
	syncHistoryFlags();
}

export function redoConfig() {
	const next = redoStack.pop();
	if (!next) return;
	undoStack.push(get(hearthConfig));
	hearthConfig.set(next);
	syncHistoryFlags();
}

/* edit mode */

export const hearthEditMode = writable(false);

export type Editor =
	| { kind: 'light'; id: string | null }
	| { kind: 'blind'; id: string | null }
	| { kind: 'device'; roomId: string; index: number | null }
	| { kind: 'room'; id: string | null }
	// with roomId the target list is that room's cards array (column ignored)
	| { kind: 'card'; column: number; index: number | null; roomId?: string }
	| { kind: 'railWidget'; index: number | null }
	| { kind: 'theme' };

export const editor = writable<Editor | null>(null);

let editSnapshot: HearthConfig | null = null;

export function enterEditMode() {
	editSnapshot = structuredClone(get(hearthConfig));
	undoStack.length = 0;
	redoStack.length = 0;
	syncHistoryFlags();
	hearthEditMode.set(true);
}

export function cancelEdit() {
	if (editSnapshot) hearthConfig.set(editSnapshot);
	editSnapshot = null;
	undoStack.length = 0;
	redoStack.length = 0;
	syncHistoryFlags();
	editor.set(null);
	hearthEditMode.set(false);
}

export const saveState = writable<'idle' | 'saved' | 'conflict' | 'error'>('idle');
let savedToastTimer: ReturnType<typeof setTimeout>;

/** Returns false on a revision conflict (another tab saved first). */
export async function saveEdit(): Promise<boolean> {
	const response = await fetch('/_api/save_hearth', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ revision: get(hearthRevision), config: get(hearthConfig) })
	});
	if (response.status === 409) {
		saveState.set('conflict');
		return false;
	}
	if (!response.ok) {
		saveState.set('error');
		throw new Error(`save failed: ${response.status}`);
	}
	const { revision } = await response.json();
	hearthRevision.set(revision);
	saveState.set('saved');
	clearTimeout(savedToastTimer);
	savedToastTimer = setTimeout(() => saveState.set('idle'), 2500);
	editSnapshot = null;
	undoStack.length = 0;
	redoStack.length = 0;
	syncHistoryFlags();
	editor.set(null);
	hearthEditMode.set(false);
	return true;
}

/* navigation & popups */

export const currentRoom = writable<string>('home');

export type Popup =
	| { kind: 'light'; id: string; name: string }
	| { kind: 'blind'; id: string; name: string }
	| { kind: 'fan'; entity: string; name: string };

export const popup = writable<Popup | null>(null);

export function closePopup() {
	popup.set(null);
}

/**
 * Optimistic overrides keyed by "<kind>:<id>". While a drag is in progress the
 * dragged value wins over the entity state, then expires so the entity state
 * (updated via websocket) takes back over.
 */
const overrides = writable<Record<string, number>>({});
const overrideTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function setOverride(key: string, value: number, ttl = 2000) {
	clearTimeout(overrideTimers[key]);
	overrides.update((current) => ({ ...current, [key]: value }));
	overrideTimers[key] = setTimeout(() => {
		overrides.update((current) => {
			const next = { ...current };
			delete next[key];
			return next;
		});
	}, ttl);
}

// trailing-edge throttle per key so drags emit at most one service call per
// interval but the final value is always sent
const throttleState: Record<string, { last: number; timer?: ReturnType<typeof setTimeout> }> = {};

function throttled(key: string, fn: () => void, interval = 200) {
	const entry = (throttleState[key] ??= { last: 0 });
	clearTimeout(entry.timer);
	const elapsed = Date.now() - entry.last;
	if (elapsed >= interval) {
		entry.last = Date.now();
		fn();
	} else {
		entry.timer = setTimeout(() => {
			entry.last = Date.now();
			fn();
		}, interval - elapsed);
	}
}

/**
 * Entities with a command in flight: marked when a discrete command is sent,
 * cleared when the websocket delivers a state change for that entity (or after
 * a timeout for commands that never produce one). Drives the "processing"
 * pulse in the UI. Drag-driven commands are excluded - they already have
 * optimistic overrides.
 */
export const pendingEntities = writable<Record<string, true>>({});
const pendingTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function clearPending(entityId: string) {
	clearTimeout(pendingTimers[entityId]);
	pendingEntities.update((current) => {
		if (!(entityId in current)) return current;
		const next = { ...current };
		delete next[entityId];
		return next;
	});
}

function markPending(entityId: string, ttl = 5000) {
	clearTimeout(pendingTimers[entityId]);
	pendingEntities.update((current) => ({ ...current, [entityId]: true }));
	pendingTimers[entityId] = setTimeout(() => clearPending(entityId), ttl);
}

// subscribeEntities replaces an entity's object only when it changed, so an
// identity check per pending entity detects the confirming update
let previousStates: HassEntities | undefined;
states.subscribe(($states) => {
	if ($states) {
		for (const entityId of Object.keys(get(pendingEntities))) {
			const previous = previousStates?.[entityId];
			if (previous && $states[entityId] && previous !== $states[entityId]) {
				clearPending(entityId);
			}
		}
	}
	previousStates = $states;
});

function service(domain: string, name: string, data: Record<string, unknown>) {
	const conn = get(connection);
	if (!conn) return;
	callService(conn, domain, name, data).catch((error) => console.error(error));
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

/* lights */

export interface LightView {
	on: boolean;
	level: number;
	colorCss: string | null;
	mode: 'temp' | 'color';
	tempPct: number;
	kelvin: number;
}

function lightEntity(id: string) {
	return get(hearthConfig).lights.find((light) => light.id === id)?.entity;
}

export const lightViews = derived(
	[states, overrides, hearthConfig],
	([$states, $overrides, $config]) => {
		const views: Record<string, LightView> = {};
		for (const light of $config.lights) {
			const entity = $states?.[light.entity];
			const attributes = entity?.attributes ?? {};
			const actualOn = entity?.state === 'on';
			const levelOverride = $overrides[`level:${light.id}`];
			const on = levelOverride !== undefined ? levelOverride > 0 : actualOn;
			const level =
				levelOverride ?? (actualOn ? Math.round((attributes.brightness ?? 255) / 2.55) : 0);

			const minKelvin = attributes.min_color_temp_kelvin ?? 2700;
			const maxKelvin = attributes.max_color_temp_kelvin ?? 6500;
			const actualKelvin = attributes.color_temp_kelvin ?? (minKelvin + maxKelvin) / 2;
			const tempPct = clamp(
				$overrides[`temp:${light.id}`] ??
					Math.round(((actualKelvin - minKelvin) / (maxKelvin - minKelvin)) * 100),
				0,
				100
			);
			const kelvin = Math.round((minKelvin + (tempPct / 100) * (maxKelvin - minKelvin)) / 50) * 50;

			const rgb = attributes.rgb_color;
			const inColorMode = actualOn && attributes.color_mode !== 'color_temp' && Array.isArray(rgb);

			views[light.id] = {
				on,
				level,
				colorCss: inColorMode ? `rgb(${rgb.join(',')})` : null,
				mode: inColorMode ? 'color' : 'temp',
				tempPct,
				kelvin
			};
		}
		return views;
	}
);

export const lightsOnCount = derived(
	lightViews,
	(views) => Object.values(views).filter((view) => view.on).length
);

export function toggleLight(id: string) {
	const entity = lightEntity(id);
	if (!entity) return;
	markPending(entity);
	service('light', 'toggle', { entity_id: entity });
}

export function setLightLevel(id: string, value: number) {
	const entity = lightEntity(id);
	if (!entity) return;
	const level = clamp(Math.max(1, value), 1, 100);
	setOverride(`level:${id}`, level);
	throttled(`level:${id}`, () =>
		service('light', 'turn_on', { entity_id: entity, brightness_pct: level })
	);
}

export function setLightTemp(id: string, pct: number) {
	const entity = lightEntity(id);
	if (!entity) return;
	setOverride(`temp:${id}`, clamp(pct, 0, 100));
	const attributes = get(states)?.[entity]?.attributes ?? {};
	const minKelvin = attributes.min_color_temp_kelvin ?? 2700;
	const maxKelvin = attributes.max_color_temp_kelvin ?? 6500;
	const kelvin = Math.round(minKelvin + (clamp(pct, 0, 100) / 100) * (maxKelvin - minKelvin));
	throttled(`temp:${id}`, () =>
		service('light', 'turn_on', { entity_id: entity, color_temp_kelvin: kelvin })
	);
}

export function setLightColor(id: string, hex: string) {
	const entity = lightEntity(id);
	if (!entity) return;
	markPending(entity);
	service('light', 'turn_on', { entity_id: entity, rgb_color: hexToRgb(hex) });
}

export function hexToRgb(hex: string): [number, number, number] {
	return [
		parseInt(hex.slice(1, 3), 16),
		parseInt(hex.slice(3, 5), 16),
		parseInt(hex.slice(5, 7), 16)
	];
}

/* blinds */

function blindEntity(id: string) {
	return get(hearthConfig).blinds.find((blind) => blind.id === id)?.entity;
}

export const blindViews = derived(
	[states, overrides, hearthConfig],
	([$states, $overrides, $config]) => {
		const views: Record<string, number> = {};
		for (const blind of $config.blinds) {
			const entity = $states?.[blind.entity];
			const actual = entity?.attributes?.current_position ?? (entity?.state === 'open' ? 100 : 0);
			views[blind.id] = clamp($overrides[`blind:${blind.id}`] ?? Math.round(actual), 0, 100);
		}
		return views;
	}
);

export function toggleBlind(id: string) {
	const entity = blindEntity(id);
	if (!entity) return;
	const open = get(blindViews)[id] > 0;
	markPending(entity);
	service('cover', open ? 'close_cover' : 'open_cover', { entity_id: entity });
}

export function setBlindPosition(id: string, position: number) {
	const entity = blindEntity(id);
	if (!entity) return;
	const target = clamp(position, 0, 100);
	setOverride(`blind:${id}`, target);
	throttled(
		`blind:${id}`,
		() => service('cover', 'set_cover_position', { entity_id: entity, position: target }),
		400
	);
}

/* devices */

const MEDIA_OFF_STATES = ['off', 'unavailable', 'unknown', 'standby', 'idle'];

export function entityOn(entityId: string, entity: HassEntity | undefined) {
	if (!entity) return false;
	if (entityId.startsWith('media_player.')) return !MEDIA_OFF_STATES.includes(entity.state);
	return entity.state === 'on';
}

export function toggleDevice(entityId: string) {
	markPending(entityId);
	service('homeassistant', 'toggle', { entity_id: entityId });
}

/**
 * Toggles any entity via its domain's togglable service. Returns false when
 * the domain has none, so callers can open the entity modal instead.
 */
export function toggleEntity(entityId: string): boolean {
	const entity = get(states)?.[entityId];
	const togglable = entity && getTogglableService(entity);
	if (!togglable) return false;
	const [domain, name] = togglable.split('.');
	markPending(entityId);
	service(domain, name, { entity_id: entityId });
	return true;
}

export function setFanSpeed(entityId: string, pct: number) {
	markPending(entityId);
	if (pct === 0) {
		service('fan', 'turn_off', { entity_id: entityId });
	} else {
		service('fan', 'set_percentage', { entity_id: entityId, percentage: pct });
	}
}

/* media */

export function toggleMediaPlayback(entity: string) {
	markPending(entity);
	service('media_player', 'media_play_pause', { entity_id: entity });
}

export function seekMedia(entity: string, fraction: number) {
	const duration = get(states)?.[entity]?.attributes?.media_duration;
	if (!duration) return;
	service('media_player', 'media_seek', {
		entity_id: entity,
		seek_position: clamp(fraction, 0, 1) * duration
	});
}

/* climate */

export function setClimateTemperature(entity: string, temperature: number) {
	markPending(entity);
	service('climate', 'set_temperature', { entity_id: entity, temperature });
}

export function setClimateHvacMode(entity: string, mode: string) {
	markPending(entity);
	service('climate', 'set_hvac_mode', { entity_id: entity, hvac_mode: mode });
}

/* scenes */

export function activateScene(entity: string) {
	markPending(entity);
	service('scene', 'turn_on', { entity_id: entity });
}

/* vacuum */

export function toggleVacuum(entity: string) {
	markPending(entity);
	const state = get(states)?.[entity]?.state;
	if (state === 'cleaning' || state === 'returning') {
		service('vacuum', 'return_to_base', { entity_id: entity });
	} else {
		service('vacuum', 'start', { entity_id: entity });
	}
}

/* sensors */

export function sensorNumber(state: string | undefined): number | null {
	if (state === undefined) return null;
	const value = parseFloat(state);
	return Number.isFinite(value) ? value : null;
}
