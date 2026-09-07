import { get } from 'svelte/store';
import type { HassEntities } from 'home-assistant-js-websocket';
import { lang, selectedLanguage } from '$lib/core/i18n';
import { relativeTime } from '$lib/core/i18n/time';
import { UNAVAILABLE_STATES } from '$lib/core/ha/entities';
import { isStack, type HearthConfig, type VisibilityCondition } from './config';
import { cardEntityIds } from './cards';
import { widgetDescriptor } from './widgets';

/**
 * Entity ids the dashboard shows: card entities, rail widget entities and the
 * page header readings. Entities that only steer what is shown (visibility
 * conditions, the day/night switch) are not displayed and do not belong here.
 */
export function displayedEntityIds(config: HearthConfig): string[] {
	const ids = new Set<string>();
	for (const widget of config.rail) {
		for (const id of widgetDescriptor(widget.type).entityIds(widget)) ids.add(id);
	}
	for (const room of config.rooms) {
		for (const id of [room.temp_entity, room.humidity_entity]) if (id) ids.add(id);
		for (const column of room.cards ?? []) {
			for (const item of column) {
				const cards = isStack(item) ? item.cards : [item];
				for (const card of cards) for (const id of cardEntityIds(card)) ids.add(id);
			}
		}
	}
	return [...ids];
}

function visibilityEntityIds(conditions: VisibilityCondition[] | undefined): string[] {
	return (conditions ?? []).flatMap((condition) =>
		'or' in condition
			? visibilityEntityIds(condition.or)
			: 'entity' in condition
				? [condition.entity]
				: []
	);
}

/** Every entity id the config refers to, displayed or not. */
export function configEntityIds(config: HearthConfig): string[] {
	const ids = new Set<string>(displayedEntityIds(config));
	if (config.day_night?.entity) ids.add(config.day_night.entity);
	for (const widget of config.rail)
		for (const id of visibilityEntityIds(widget.visibility)) ids.add(id);
	for (const room of config.rooms) {
		for (const column of room.cards ?? []) {
			for (const item of column) {
				const cards = isStack(item) ? item.cards : [item];
				for (const card of cards)
					for (const id of visibilityEntityIds(card.visibility)) ids.add(id);
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
	const elapsed = Date.now() - Date.parse(iso);
	if (!Number.isFinite(elapsed) || elapsed < 60_000) return null;
	return relativeTime(iso, get(selectedLanguage));
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
	return displayedEntityIds(config)
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
				detail: since
					? get(lang)('hearth_last_seen_at').replace('{time}', since)
					: get(lang)('hearth_offline')
			};
		});
}
