import type { HassEntities } from 'home-assistant-js-websocket';
import { markPending, service } from '../ha/commands';

/** A scene reference with an optional indicator entity that marks it active. */
export interface SceneIndicator {
	entity: string;
	active_entity?: string;
	active_state?: string;
}

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
export function activeSceneIndex(
	scenes: SceneIndicator[],
	$states: HassEntities | undefined
): number {
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
