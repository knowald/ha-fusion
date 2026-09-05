import { get } from 'svelte/store';
import type { HassEntities } from 'home-assistant-js-websocket';
import {
	entityAvailability,
	entityAvailable,
	states,
	type EntityAvailability
} from '../ha/entities';
import { clamp, markPending, service, setControlOverride, throttled } from '../ha/commands';

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
	const attributes = entity?.attributes ?? {};
	const overrideLevel = availability === 'available' ? $overrides[`level:${entityId}`] : undefined;
	const overrideActive =
		availability === 'available' ? $overrides[`active:${entityId}`] : undefined;
	const actualLevel =
		typeof attributes.brightness === 'number' ? Math.round((attributes.brightness / 255) * 100) : 0;
	const level = clamp(overrideLevel ?? actualLevel, 0, 100);
	const on =
		availability === 'available' &&
		(overrideLevel !== undefined
			? overrideLevel > 0
			: overrideActive !== undefined
				? overrideActive > 0
				: entity?.state === 'on');

	const rgb: [number, number, number] | undefined = attributes.rgb_color;
	const colorMode: string | undefined = attributes.color_mode;
	const colorCss =
		on && rgb && colorMode !== 'color_temp' && colorMode !== 'white'
			? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
			: null;

	const minKelvin = attributes.min_color_temp_kelvin ?? 2700;
	const maxKelvin = attributes.max_color_temp_kelvin ?? 6500;
	const actualKelvin = attributes.color_temp_kelvin ?? minKelvin;
	const actualTempPct =
		maxKelvin > minKelvin
			? Math.round(((actualKelvin - minKelvin) / (maxKelvin - minKelvin)) * 100)
			: 0;
	const overrideTemp = availability === 'available' ? $overrides[`temp:${entityId}`] : undefined;
	const tempPct = clamp(overrideTemp ?? actualTempPct, 0, 100);
	const kelvin = Math.round(minKelvin + (tempPct / 100) * (maxKelvin - minKelvin));

	return {
		availability,
		on,
		level,
		colorCss,
		mode: colorCss ? 'color' : 'temp',
		tempPct,
		kelvin
	};
}

export function toggleLight(entityId: string) {
	const entity = get(states)?.[entityId];
	if (!entityAvailable(entity)) return;
	setControlOverride(`active:${entityId}`, entity.state === 'on' ? 0 : 1);
	markPending(entityId);
	service('light', 'toggle', { entity_id: entityId });
}

export function setLightLevel(entityId: string, value: number, commit = true) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	const level = clamp(Math.max(1, value), 1, 100);
	setControlOverride(`level:${entityId}`, level);
	if (!commit) return;
	throttled(`level:${entityId}`, () =>
		service('light', 'turn_on', { entity_id: entityId, brightness_pct: level })
	);
}

export function setLightTemp(entityId: string, pct: number, commit = true) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	setControlOverride(`temp:${entityId}`, clamp(pct, 0, 100));
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

/** Header verb for a lights section: everything listed goes off in one call. */
export function turnAllOff(entityIds: string[]) {
	const available = entityIds.filter((entityId) => entityAvailable(get(states)?.[entityId]));
	if (!available.length) return;
	for (const entityId of available) {
		setControlOverride(`active:${entityId}`, 0);
		setControlOverride(`level:${entityId}`, 0);
		markPending(entityId);
	}
	service('homeassistant', 'turn_off', { entity_id: available });
}
