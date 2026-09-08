import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type ClimateCard = Extract<OverviewCard, { type: 'climate' }>;

export const climateCard: CardDescriptor<ClimateCard> = {
	type: 'climate',
	label: 'Climate (thermostat)',
	name: 'Climate',
	sub: 'thermostat control',
	icon: 'thermostat',
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: Editor
};
