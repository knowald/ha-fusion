import { get } from 'svelte/store';
import type { HassEntities } from 'home-assistant-js-websocket';
import { states } from '../ha/entities';
import { clamp, markPending, service, setControlOverride, throttled } from '../ha/commands';

export function toggleMediaPlayback(entity: string) {
	markPending(entity);
	service('media_player', 'media_play_pause', { entity_id: entity });
}

export function seekMedia(entity: string, fraction: number) {
	const duration = get(states)?.[entity]?.attributes?.media_duration;
	if (!duration) return;
	setControlOverride(`seek:${entity}`, clamp(fraction, 0, 1), 1500);
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
	setControlOverride(`media:${entityId}`, target);
	if (!commit) return;
	throttled(
		`media:${entityId}`,
		() =>
			service('media_player', 'volume_set', { entity_id: entityId, volume_level: target / 100 }),
		400
	);
}
