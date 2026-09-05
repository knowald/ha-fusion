import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type HeaderCard = Extract<OverviewCard, { type: 'header' }>;

export const headerCard: CardDescriptor<HeaderCard> = {
	type: 'header',
	label: 'Header',
	name: 'Header',
	sub: 'title and room stats',
	icon: 'view_agenda',
	needsConfiguration: () => false,
	entityIds: (card) => [
		...(card.temp_entity ? [card.temp_entity] : []),
		...(card.humidity_entity ? [card.humidity_entity] : [])
	],
	component: Card,
	editor: Editor
};
