import { get, writable } from 'svelte/store';
import { base } from '$app/paths';
import { callService, type HassEntities, type HassEntity } from 'home-assistant-js-websocket';
import { connected, connection, states } from '$lib/Stores';
import type { SliderUpdateMode } from '$lib/Types';
import { getTogglableService } from '$lib/Utils';
import { DEFAULT_HEARTH_CONFIG, type HearthConfig, type SceneRef } from './config';

/* configuration */

export const hearthConfig = writable<HearthConfig>(structuredClone(DEFAULT_HEARTH_CONFIG));

// Non-null when the source file exists but could not be parsed/read. Editing
// stays locked so fallback rendering can never overwrite that source.
export const hearthLoadError = writable<string | null>(null);

// True only when the server found no usable source document. The dashboard
// can offer discovery automatically without confusing parse/I/O failures with
// a first run.
export const hearthNeedsSetup = writable(false);

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
	| { kind: 'room'; id: string | null }
	// column indexes into the page's card columns; with stackId the target list
	// is that stack's cards array within the column instead
	| { kind: 'card'; roomId: string; column: number; index: number | null; stackId?: string }
	| { kind: 'stack'; roomId: string; column: number; index: number }
	| { kind: 'railWidget'; index: number | null }
	| { kind: 'theme' }
	| { kind: 'settings' }
	| { kind: 'code' };

export const editor = writable<Editor | null>(null);

// The dashboard previews this slot while the theme editor is open.
export const editedThemeSlot = writable<'day' | 'night'>('day');

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
	const loadError = get(hearthLoadError);
	if (loadError) {
		saveState.set('error');
		throw new Error(`Cannot save an unreadable Hearth configuration: ${loadError}`);
	}
	const response = await fetch(`${base}/_api/save_hearth`, {
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

export type Popup = {
	kind: 'light' | 'blind' | 'fan' | 'media';
	entity: string;
	name: string;
	sliderUpdates?: SliderUpdateMode;
};

export const popup = writable<Popup | null>(null);

// open anchored popovers (collapsed groups); window-level shortcuts check this
// so they cannot open another layer on top of one
export const openPopovers = writable(0);

export function closePopup() {
	popup.set(null);
}

/**
 * Optimistic overrides keyed by "<kind>:<entity_id>". While a drag is in
 * progress the dragged value wins over the entity state, then expires so the
 * entity state (updated via websocket) takes back over. Exported read-only so
 * tiles can feed it into lightViewFor/blindPositionFor.
 */
export const controlOverrides = writable<Record<string, number>>({});
const overrideTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function setOverride(key: string, value: number, ttl = 2000) {
	clearTimeout(overrideTimers[key]);
	controlOverrides.update((current) => ({ ...current, [key]: value }));
	overrideTimers[key] = setTimeout(() => {
		controlOverrides.update((current) => {
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

export interface CommandFailure {
	entityId: string | null;
	detail: string;
}

/** Latest failed device command, rendered by the dashboard as an alert. */
export const commandFailure = writable<CommandFailure | null>(null);
let commandFailureTimer: ReturnType<typeof setTimeout>;

export function dismissCommandFailure() {
	clearTimeout(commandFailureTimer);
	commandFailure.set(null);
}

function reportCommandFailure(entityId: string | null, error: unknown) {
	if (entityId) clearPending(entityId);
	const detail = error instanceof Error ? error.message : String(error);
	commandFailure.set({ entityId, detail });
	clearTimeout(commandFailureTimer);
	commandFailureTimer = setTimeout(() => commandFailure.set(null), 8000);
}

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
	// mirrors the edit-mode guard in service(): no command, no pending glow
	if (get(hearthEditMode)) return;
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
	// edit mode arranges layout; taps there must never fire real device commands
	if (get(hearthEditMode)) return;
	const entityId = typeof data.entity_id === 'string' ? data.entity_id : null;
	const conn = get(connection);
	// Socket keeps the connection object across reconnects, so connected is the
	// authoritative guard during a dropped websocket.
	if (!conn || !get(connected)) {
		reportCommandFailure(entityId, new Error('Not connected to Home Assistant'));
		return;
	}
	callService(conn, domain, name, data).catch((error) => {
		console.error(error);
		reportCommandFailure(entityId, error);
	});
}

export function callEntityService(
	domain: string,
	name: string,
	entityId: string,
	data: Record<string, unknown> = {}
) {
	markPending(entityId);
	service(domain, name, { entity_id: entityId, ...data });
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

export type EntityAvailability = 'available' | 'unavailable' | 'unknown' | 'missing';

/** The shared reachability vocabulary for every Hearth entity surface. */
export function entityAvailability(entity: HassEntity | undefined): EntityAvailability {
	if (!entity) return 'missing';
	if (entity.state === 'unavailable') return 'unavailable';
	if (entity.state === 'unknown') return 'unknown';
	return 'available';
}

export function entityAvailable(entity: HassEntity | undefined): boolean {
	return entityAvailability(entity) === 'available';
}

/* lights */

export interface LightView {
	availability: EntityAvailability;
	on: boolean;
	level: number;
	colorCss: string | null;
	mode: 'temp' | 'color';
	tempPct: number;
	kelvin: number;
}

/** Optimistic view of a light, from entity state plus in-flight drag overrides. */
export function lightViewFor(
	entityId: string,
	$states: HassEntities | undefined,
	$overrides: Record<string, number>
): LightView {
	const entity = $states?.[entityId];
	const availability = entityAvailability(entity);
	const available = availability === 'available';
	const attributes = entity?.attributes ?? {};
	const actualOn = available && entity?.state === 'on';
	const levelOverride = available ? $overrides[`level:${entityId}`] : undefined;
	const on = levelOverride !== undefined ? levelOverride > 0 : actualOn;
	const level = levelOverride ?? (actualOn ? Math.round((attributes.brightness ?? 255) / 2.55) : 0);

	const minKelvin = attributes.min_color_temp_kelvin ?? 2700;
	const maxKelvin = attributes.max_color_temp_kelvin ?? 6500;
	const actualKelvin = attributes.color_temp_kelvin ?? (minKelvin + maxKelvin) / 2;
	const tempPct = clamp(
		$overrides[`temp:${entityId}`] ??
			Math.round(((actualKelvin - minKelvin) / (maxKelvin - minKelvin)) * 100),
		0,
		100
	);
	const kelvin = Math.round((minKelvin + (tempPct / 100) * (maxKelvin - minKelvin)) / 50) * 50;

	const rgb = attributes.rgb_color;
	const inColorMode = actualOn && attributes.color_mode !== 'color_temp' && Array.isArray(rgb);

	return {
		availability,
		on,
		level,
		colorCss: inColorMode ? `rgb(${rgb.join(',')})` : null,
		mode: inColorMode ? 'color' : 'temp',
		tempPct,
		kelvin
	};
}

export function toggleLight(entityId: string) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	markPending(entityId);
	service('light', 'toggle', { entity_id: entityId });
}

export function setLightLevel(entityId: string, value: number, commit = true) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	const level = clamp(Math.max(1, value), 1, 100);
	setOverride(`level:${entityId}`, level);
	if (!commit) return;
	throttled(`level:${entityId}`, () =>
		service('light', 'turn_on', { entity_id: entityId, brightness_pct: level })
	);
}

export function setLightTemp(entityId: string, pct: number, commit = true) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	setOverride(`temp:${entityId}`, clamp(pct, 0, 100));
	if (!commit) return;
	const attributes = get(states)?.[entityId]?.attributes ?? {};
	const minKelvin = attributes.min_color_temp_kelvin ?? 2700;
	const maxKelvin = attributes.max_color_temp_kelvin ?? 6500;
	const kelvin = Math.round(minKelvin + (clamp(pct, 0, 100) / 100) * (maxKelvin - minKelvin));
	throttled(`temp:${entityId}`, () =>
		service('light', 'turn_on', { entity_id: entityId, color_temp_kelvin: kelvin })
	);
}

export function setLightColor(entityId: string, hex: string) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	markPending(entityId);
	service('light', 'turn_on', { entity_id: entityId, rgb_color: hexToRgb(hex) });
}

export function hexToRgb(hex: string): [number, number, number] {
	return [
		parseInt(hex.slice(1, 3), 16),
		parseInt(hex.slice(3, 5), 16),
		parseInt(hex.slice(5, 7), 16)
	];
}

/* blinds */

/** Optimistic 0-100 position of a cover, drag overrides included. */
export function blindPositionFor(
	entityId: string,
	$states: HassEntities | undefined,
	$overrides: Record<string, number>
): number {
	const entity = $states?.[entityId];
	const actual = entity?.attributes?.current_position ?? (entity?.state === 'open' ? 100 : 0);
	return clamp($overrides[`blind:${entityId}`] ?? Math.round(actual), 0, 100);
}

export function toggleBlind(entityId: string) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	const open = blindPositionFor(entityId, get(states), get(controlOverrides)) > 0;
	markPending(entityId);
	service('cover', open ? 'close_cover' : 'open_cover', { entity_id: entityId });
}

export function setBlindPosition(entityId: string, position: number, commit = true) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	const target = clamp(position, 0, 100);
	setOverride(`blind:${entityId}`, target);
	if (!commit) return;
	throttled(
		`blind:${entityId}`,
		() => service('cover', 'set_cover_position', { entity_id: entityId, position: target }),
		400
	);
}

/* devices */

const MEDIA_OFF_STATES = ['off', 'unavailable', 'unknown', 'standby', 'idle'];

/** One domain-aware answer to whether an entity is visually active. */
export function entityActive(entityId: string, entity: HassEntity | undefined) {
	if (!entity) return false;
	const domain = entityId.split('.')[0];
	if (domain === 'cover' || domain === 'valve') return OPENING_STATES.includes(entity.state);
	if (domain === 'lock') return entity.state === 'unlocked';
	if (domain === 'media_player') return !MEDIA_OFF_STATES.includes(entity.state);
	if (domain === 'vacuum') return entity.state === 'cleaning' || entity.state === 'returning';
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
	if (!entityAvailable(entity)) return false;
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

export function skipMediaTrack(entity: string, direction: 'next' | 'previous') {
	markPending(entity);
	service('media_player', direction === 'next' ? 'media_next_track' : 'media_previous_track', {
		entity_id: entity
	});
}

export function setMediaShuffle(entity: string, shuffle: boolean) {
	service('media_player', 'shuffle_set', { entity_id: entity, shuffle });
}

const REPEAT_CYCLE: Record<string, string> = { off: 'all', all: 'one', one: 'off' };

export function cycleMediaRepeat(entity: string) {
	const current = get(states)?.[entity]?.attributes?.repeat ?? 'off';
	service('media_player', 'repeat_set', {
		entity_id: entity,
		repeat: REPEAT_CYCLE[current] ?? 'all'
	});
}

/** Optimistic media volume percent, from entity state plus drag overrides. */
export function mediaVolumeFor(
	entityId: string,
	$states: HassEntities | undefined,
	$overrides: Record<string, number>
): number {
	const override = $overrides[`media:${entityId}`];
	if (override !== undefined) return override;
	const level = $states?.[entityId]?.attributes?.volume_level;
	return typeof level === 'number' ? Math.round(level * 100) : 0;
}

export function setMediaVolume(entityId: string, pct: number, commit = true) {
	const target = clamp(pct, 0, 100);
	setOverride(`media:${entityId}`, target);
	if (!commit) return;
	throttled(
		`media:${entityId}`,
		() =>
			service('media_player', 'volume_set', { entity_id: entityId, volume_level: target / 100 }),
		400
	);
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

// only HA's own timestamp shape: Date.parse accepts far looser input, so a
// numeric sensor state like "12" would otherwise parse as a date in 2001
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/**
 * Epoch ms of a scene's last activation - a scene entity's state is that
 * timestamp - or null for a scene that has not run (or a script entity, whose
 * state is on/off and carries no activation time).
 */
export function sceneActivatedAt(
	entityId: string,
	$states: HassEntities | undefined
): number | null {
	const state = $states?.[entityId]?.state;
	if (!state || !ISO_TIMESTAMP.test(state)) return null;
	const time = Date.parse(state);
	return Number.isFinite(time) ? time : null;
}

/**
 * Index of the scene the house is currently in, or -1. An indicator entity is
 * the stronger signal, so every scene that has one is checked first and the
 * first match wins; the rest then compete on which was applied most recently.
 */
export function activeSceneIndex(scenes: SceneRef[], $states: HassEntities | undefined): number {
	const indicated = scenes.findIndex((ref) => {
		if (!ref.active_entity) return false;
		const state = $states?.[ref.active_entity]?.state;
		return state !== undefined && state === (ref.active_state ?? 'on');
	});
	if (indicated >= 0) return indicated;

	let latest = -1;
	let latestTime = -Infinity;
	for (const [index, ref] of scenes.entries()) {
		// a scene with an indicator said no above; it never wins on timestamp
		if (ref.active_entity) continue;
		const time = sceneActivatedAt(ref.entity, $states);
		if (time !== null && time > latestTime) {
			latestTime = time;
			latest = index;
		}
	}
	return latest;
}

/* entity groups */

const OPEN_CLOSED_CLASSES = ['door', 'window', 'garage_door', 'opening'];
const OPENING_STATES = ['open', 'opening', 'closing'];

/** Domains whose entities read as active or inactive in a group summary. */
const SUMMARY_DOMAINS = [
	'light',
	'switch',
	'input_boolean',
	'fan',
	'cover',
	'valve',
	'binary_sensor',
	'media_player',
	'lock',
	'humidifier'
];

/** Active/inactive wording for one entity. */
function summaryWords(entityId: string, entity: HassEntity | undefined): [string, string] {
	const domain = entityId.split('.')[0];
	if (domain === 'cover' || domain === 'valve') return ['open', 'closed'];
	if (domain === 'lock') return ['unlocked', 'locked'];
	if (domain === 'binary_sensor') {
		const deviceClass: string | undefined = entity?.attributes?.device_class;
		if (deviceClass && OPEN_CLOSED_CLASSES.includes(deviceClass)) return ['open', 'closed'];
		if (deviceClass === 'motion' || deviceClass === 'occupancy') return ['detected', 'clear'];
	}
	return ['on', 'off'];
}

const UNAVAILABLE_STATES = ['unavailable', 'unknown'];

/**
 * Collapsed-group caption, e.g. "5 open · 3 closed". Entities without an on/off
 * notion (sensors) and entities that are unavailable are not counted, since
 * calling either of those "off" would be a lie; a group with nothing countable
 * falls back to its size. Wording follows the group's entities only while they
 * agree - a mixed group says on/off. `badge` is the active half alone, for the
 * popover header.
 */
export function entityGroupSummary(
	entityIds: string[],
	$states: HassEntities | undefined
): { text: string; badge: string | null; activeLabel: string } {
	// eligible by domain, so the wording holds before any state has arrived
	const eligible = entityIds.filter((entityId) => SUMMARY_DOMAINS.includes(entityId.split('.')[0]));
	if (!eligible.length) {
		const size = `${entityIds.length} ${entityIds.length === 1 ? 'entity' : 'entities'}`;
		return { text: size, badge: null, activeLabel: size };
	}
	// counted only where the state says something: an unavailable or not yet
	// loaded entity is neither active nor inactive
	const countable = eligible.filter((entityId) => {
		const entity = $states?.[entityId];
		return entity !== undefined && !UNAVAILABLE_STATES.includes(entity.state);
	});
	const words = eligible.map((entityId) => summaryWords(entityId, $states?.[entityId]));
	const [activeWord, inactiveWord] = words.every(
		([active, inactive]) => active === words[0][0] && inactive === words[0][1]
	)
		? words[0]
		: (['on', 'off'] as [string, string]);
	const active = countable.filter((entityId) => entityActive(entityId, $states?.[entityId])).length;
	const inactive = countable.length - active;
	const activeLabel = `${active} ${activeWord}`;
	const parts = [
		...(active ? [activeLabel] : []),
		...(inactive ? [`${inactive} ${inactiveWord}`] : [])
	];
	// nothing countable yet: still say it in the group's own words
	return {
		text: parts.length ? parts.join(' · ') : activeLabel,
		badge: active ? activeLabel : null,
		activeLabel
	};
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

export function vacuumCommand(
	entity: string,
	command: 'start' | 'pause' | 'stop' | 'clean_spot' | 'locate' | 'return_to_base'
) {
	callEntityService('vacuum', command, entity);
}

/* sensors */

export function sensorNumber(state: string | undefined): number | null {
	if (state === undefined) return null;
	const value = parseFloat(state);
	return Number.isFinite(value) ? value : null;
}
