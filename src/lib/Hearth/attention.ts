import { get } from 'svelte/store';
import type { HassEntities } from 'home-assistant-js-websocket';
import { lang } from '$lib/core/i18n';
import { UNAVAILABLE_STATES } from '$lib/core/ha/entities';
import { isStack, type HearthConfig } from './config';
import { cardEntityIds } from './cards';

/** Every entity id referenced anywhere in the dashboard config. */
export function configEntityIds(config: HearthConfig): string[] {
	const ids = new Set<string>();
	for (const room of config.rooms) {
		for (const column of room.cards ?? []) {
			for (const item of column) {
				const cards = isStack(item) ? item.cards : [item];
				for (const card of cards) for (const id of cardEntityIds(card)) ids.add(id);
			}
		}
	}
	return [...ids];
}

export interface AttentionItem {
	entity: string;
	name: string;
	detail: string;
}

function relativeSince(iso: string | undefined): string | null {
	if (!iso) return null;
	const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
	if (!Number.isFinite(minutes) || minutes < 1) return null;
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 48) return `${hours} h ago`;
	return `${Math.round(hours / 24)} days ago`;
}

/**
 * Unresolved conditions worth a rail line: dashboard entities that are offline.
 * The empty list is the "all systems nominal" case and renders as nothing.
 */
export function attentionItems(
	config: HearthConfig,
	$states: HassEntities | undefined
): AttentionItem[] {
	if (!$states) return [];
	return configEntityIds(config)
		.filter((entityId) => {
			const entity = $states[entityId];
			return entity !== undefined && UNAVAILABLE_STATES.includes(entity.state);
		})
		.map((entityId) => {
			const entity = $states[entityId];
			const since = relativeSince(entity?.last_changed);
			return {
				entity: entityId,
				name: entity?.attributes?.friendly_name ?? entityId,
				detail: since ? `${get(lang)('hearth_last_seen')} ${since}` : get(lang)('hearth_offline')
			};
		});
}
