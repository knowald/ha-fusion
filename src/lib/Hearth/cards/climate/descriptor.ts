import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type ClimateCard = Extract<OverviewCard, { type: 'climate' }>;

export const climateCard: CardDescriptor<ClimateCard> = {
	type: 'climate',
	label: 'hearth_card_climate_label',
	name: 'hearth_card_climate_name',
	sub: 'hearth_card_climate_sub',
	icon: 'thermostat',
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: Editor
};
