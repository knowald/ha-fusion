import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import { EntityIdSchema, optionalNumberAtLeast } from '../../schema';

export type ConditionalMediaCard = Extract<OverviewCard, { type: 'conditional_media' }>;

export const conditionalMediaCard: CardDescriptor<ConditionalMediaCard> = {
	type: 'conditional_media',
	label: 'hearth_card_conditional_media_label',
	name: 'hearth_card_conditional_media_name',
	sub: 'hearth_card_conditional_media_sub',
	icon: 'play_circle',
	fillByDefault: true,
	sizable: true,
	normalize: (card) => ({
		media_players: (Array.isArray(card.media_players) ? card.media_players : []).filter(
			(entry: unknown): entry is string => typeof entry === 'string' && entry.trim() !== ''
		),
		timeout:
			typeof card.timeout === 'number' && Number.isFinite(card.timeout) && card.timeout >= 0
				? Math.round(card.timeout)
				: undefined
	}),
	schema: v.looseObject({
		media_players: v.optional(v.array(EntityIdSchema, 'must be a list of entity ids')),
		timeout: optionalNumberAtLeast(0)
	}),
	needsConfiguration: (card) => card.media_players.length === 0,
	entityIds: (card) => card.media_players,
	component: Card,
	editor: () => import('./Editor.svelte')
};
