import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import { OptionalText, OptionalEntityId } from '../../schema';

export type DaysSinceCard = Extract<OverviewCard, { type: 'days_since' }>;

export const daysSinceCard: CardDescriptor<DaysSinceCard> = {
	type: 'days_since',
	label: 'hearth_card_days_since_label',
	name: 'hearth_card_days_since_name',
	sub: 'hearth_card_days_since_sub',
	icon: 'event_repeat',
	normalize: (card) => ({
		entity: trimmedOrUndefined(card.entity),
		title: trimmedOrUndefined(card.title),
		icon: trimmedOrUndefined(card.icon)
	}),
	schema: v.looseObject({ entity: OptionalEntityId, title: OptionalText, icon: OptionalText }),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: () => import('./Editor.svelte')
};
