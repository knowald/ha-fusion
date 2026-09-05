import { get } from 'svelte/store';
import type { HassEntities } from 'home-assistant-js-websocket';
import { entityAvailable, states } from '../ha/entities';
import {
	clamp,
	controlOverrides,
	controlValueFor,
	markPending,
	service,
	setControlOverride,
	throttled
} from '../ha/commands';

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
	setControlOverride(`blind:${entityId}`, open ? 0 : 100);
	markPending(entityId);
	service('cover', open ? 'close_cover' : 'open_cover', { entity_id: entityId });
}

export function setBlindPosition(entityId: string, position: number, commit = true) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	const target = clamp(position, 0, 100);
	setControlOverride(`blind:${entityId}`, target);
	if (!commit) return;
	throttled(
		`blind:${entityId}`,
		() => service('cover', 'set_cover_position', { entity_id: entityId, position: target }),
		400
	);
}

export function blindTiltFor(
	entityId: string,
	$states: HassEntities | undefined,
	$overrides: Record<string, number>
): number {
	const actual = Math.round($states?.[entityId]?.attributes?.current_tilt_position ?? 0);
	return clamp(controlValueFor(`tilt:${entityId}`, actual, $overrides), 0, 100);
}

export function setBlindTiltPosition(entityId: string, position: number, commit = true) {
	if (!entityAvailable(get(states)?.[entityId])) return;
	const target = clamp(Math.round(position), 0, 100);
	setControlOverride(`tilt:${entityId}`, target);
	if (!commit) return;
	throttled(
		`tilt:${entityId}`,
		() =>
			service('cover', 'set_cover_tilt_position', {
				entity_id: entityId,
				tilt_position: target
			}),
		400
	);
}

/** Header verb for a blinds section: every cover to fully open or closed. */
export function setAllCovers(entityIds: string[], open: boolean) {
	const available = entityIds.filter((entityId) => entityAvailable(get(states)?.[entityId]));
	if (!available.length) return;
	for (const entityId of available) {
		setControlOverride(`blind:${entityId}`, open ? 100 : 0);
		markPending(entityId);
	}
	service('cover', open ? 'open_cover' : 'close_cover', { entity_id: available });
}
