import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import { OptionalText } from '../../schema';

export type DaysSinceCard = Extract<OverviewCard, { type: 'days_since' }>;

export const daysSinceCard: CardDescriptor<DaysSinceCard> = {
	type: 'days_since',
	label: 'hearth_card_days_since_label',
	name: 'hearth_card_days_since_name',
	sub: 'hearth_card_days_since_sub',
	icon: 'event_repeat',
	normalize: (card) => ({
		// the reset writes input_datetime.set_datetime; any other domain cannot hold the date
		entity: trimmedOrUndefined(card.entity)?.startsWith('input_datetime.')
			? trimmedOrUndefined(card.entity)
			: undefined,
		title: trimmedOrUndefined(card.title),
		icon: trimmedOrUndefined(card.icon)
	}),
	schema: v.looseObject({
		entity: v.optional(
			v.pipe(v.string('must be text'), v.startsWith('input_datetime.', 'must be an input_datetime'))
		),
		title: OptionalText,
		icon: OptionalText
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: () => import('./Editor.svelte')
};
