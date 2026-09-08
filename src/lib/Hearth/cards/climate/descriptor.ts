import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type ClimateCard = Extract<OverviewCard, { type: 'climate' }>;

export const climateCard: CardDescriptor<ClimateCard> = {
	type: 'climate',
	label: 'hearth_card_climate_label',
	name: 'hearth_card_climate_name',
	sub: 'hearth_card_climate_sub',
	icon: 'thermostat',
	normalize: (card) => ({
		entity: trimmedOrUndefined(card.entity),
		title: trimmedOrUndefined(card.title)
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: () => import('./Editor.svelte')
};
