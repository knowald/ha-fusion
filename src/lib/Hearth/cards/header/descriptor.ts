import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type HeaderCard = Extract<OverviewCard, { type: 'header' }>;

export const headerCard: CardDescriptor<HeaderCard> = {
	type: 'header',
	label: 'hearth_card_header_label',
	name: 'hearth_card_header_name',
	sub: 'hearth_card_header_sub',
	icon: 'view_agenda',
	normalize: (card) => ({
		title: trimmedOrUndefined(card.title),
		subtitle: trimmedOrUndefined(card.subtitle),
		icon: trimmedOrUndefined(card.icon),
		temp_entity: trimmedOrUndefined(card.temp_entity),
		humidity_entity: trimmedOrUndefined(card.humidity_entity)
	}),
	needsConfiguration: () => false,
	entityIds: (card) => [
		...(card.temp_entity ? [card.temp_entity] : []),
		...(card.humidity_entity ? [card.humidity_entity] : [])
	],
	component: Card,
	editor: () => import('./Editor.svelte')
};
