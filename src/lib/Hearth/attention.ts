import type { HassEntities } from 'home-assistant-js-websocket';
import { UNAVAILABLE_STATES } from '$lib/core/ha/entities';
import { isStack, type HearthConfig, type OverviewCard } from './config';

/** Every entity id referenced anywhere in the dashboard config. */
export function configEntityIds(config: HearthConfig): string[] {
	const ids = new Set<string>();
	const addCard = (card: OverviewCard) => {
		if ('entity' in card && card.entity) ids.add(card.entity);
		if (card.type === 'entities') {
			for (const ref of card.entities) ids.add(ref.entity);
			if (card.summary_entity) ids.add(card.summary_entity);
		}
		if (card.type === 'scenes') {
			for (const ref of card.scenes) {
				ids.add(ref.entity);
				if (ref.active_entity) ids.add(ref.active_entity);
			}
		}
		if (card.type === 'vacuum') {
			for (const ref of card.modes ?? []) ids.add(ref.entity);
			if (card.battery_entity) ids.add(card.battery_entity);
			if (card.bin_entity) ids.add(card.bin_entity);
		}
		if (card.type === 'header') {
			if (card.temp_entity) ids.add(card.temp_entity);
			if (card.humidity_entity) ids.add(card.humidity_entity);
		}
		if (card.type === 'temperature' && card.climate_entity) ids.add(card.climate_entity);
	};
	for (const room of config.rooms) {
		for (const column of room.cards ?? []) {
			for (const item of column) {
				if (isStack(item)) item.cards.forEach(addCard);
				else addCard(item);
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
				detail: since ? `Last seen ${since}` : 'Offline'
			};
		});
}
