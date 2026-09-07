import * as v from 'valibot';
import { EntityRefListSchema, OptionalEntityId, OptionalFlag, OptionalText } from '../../schema';
import type { EntityRef, OverviewCard } from '../../types';
import { normalizeEntityRef, trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type EntitiesCard = Extract<OverviewCard, { type: 'entities' }>;

export const entitiesCard: CardDescriptor<EntitiesCard> = {
	type: 'entities',
	label: 'hearth_card_entities_label',
	name: 'hearth_card_entities_name',
	sub: 'hearth_card_entities_sub',
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
	schema: v.looseObject({
		title: OptionalText,
		style: v.optional(v.picklist(['tile', 'stat'], 'must be tile or stat')),
		columns: v.optional(v.pipe(v.number('must be a number'), v.minValue(1, 'must be at least 1'))),
		show_count: OptionalFlag,
		group_actions: OptionalFlag,
		tune_button: OptionalFlag,
		vertical_padding: v.optional(v.picklist(['compact'], 'must be compact')),
		readonly: OptionalFlag,
		slider_updates: v.optional(
			v.picklist(['continuous', 'release'], 'must be continuous or release')
		),
		wildcard: OptionalText,
		collapsed: OptionalFlag,
		icon: OptionalText,
		summary: OptionalText,
		summary_entity: OptionalEntityId,
		entities: v.optional(EntityRefListSchema)
	}),
	needsConfiguration: (card) => card.entities.length === 0 && !card.wildcard?.trim(),
	entityIds: (card) => [
		...card.entities.map((ref) => ref.entity),
		...(card.summary_entity ? [card.summary_entity] : [])
	],
	component: Card,
	editor: () => import('./Editor.svelte')
};
