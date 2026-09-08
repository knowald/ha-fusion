import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type HeaderCard = Extract<OverviewCard, { type: 'header' }>;

export const headerCard: CardDescriptor<HeaderCard> = {
	type: 'header',
	label: 'hearth_card_header_label',
	name: 'hearth_card_header_name',
	sub: 'hearth_card_header_sub',
	icon: 'view_agenda',
	needsConfiguration: () => false,
	entityIds: (card) => [
		...(card.temp_entity ? [card.temp_entity] : []),
		...(card.humidity_entity ? [card.humidity_entity] : [])
	],
	component: Card,
	editor: Editor
};
