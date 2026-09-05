import type { EntityRef, OverviewCard } from '../../types';
import { entityRefIssues, normalizeEntityRef, trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type EntitiesCard = Extract<OverviewCard, { type: 'entities' }>;

export const entitiesCard: CardDescriptor<EntitiesCard> = {
	type: 'entities',
	label: 'Entity grid',
	name: 'Entities',
	sub: 'tiles or readings',
	icon: 'grid_view',
	previewReorder: true,
	normalize: (card) => ({
		entities: (Array.isArray(card.entities) ? card.entities : [])
			.map(normalizeEntityRef)
			.filter((ref: EntityRef | null): ref is EntityRef => ref !== null),
		style: card.style === 'stat' ? 'stat' : undefined,
		columns:
			typeof card.columns === 'number' && card.columns >= 1 ? Math.floor(card.columns) : undefined,
		// tri-state: a titled section counts by default, false opts out
		show_count: typeof card.show_count === 'boolean' ? card.show_count : undefined,
		group_actions: card.group_actions === false ? false : undefined,
		tune_button: card.tune_button === true ? true : undefined,
		vertical_padding: card.vertical_padding === 'compact' ? 'compact' : undefined,
		readonly: card.readonly === true ? true : undefined,
		wildcard: trimmedOrUndefined(card.wildcard),
		slider_updates:
			card.slider_updates === 'release' || card.slider_updates === 'continuous'
				? card.slider_updates
				: undefined,
		collapsed: card.collapsed === true ? true : undefined,
		icon: trimmedOrUndefined(card.icon),
		summary: trimmedOrUndefined(card.summary),
		summary_entity: trimmedOrUndefined(card.summary_entity)
	}),
	issues: (raw, path) => entityRefIssues(raw.entities, `${path}.entities`),
	needsConfiguration: (card) => card.entities.length === 0 && !card.wildcard?.trim(),
	entityIds: (card) => [
		...card.entities.map((ref) => ref.entity),
		...(card.summary_entity ? [card.summary_entity] : [])
	],
	component: Card,
	editor: Editor
};
