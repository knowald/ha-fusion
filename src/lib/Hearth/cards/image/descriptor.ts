import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type ImageCard = Extract<OverviewCard, { type: 'image' }>;

export const imageCard: CardDescriptor<ImageCard> = {
	type: 'image',
	label: 'hearth_card_image_label',
	name: 'hearth_card_image_name',
	sub: 'hearth_card_image_sub',
	icon: 'image',
	normalize: (card) => ({
		entity: trimmedOrUndefined(card.entity),
		title: trimmedOrUndefined(card.title)
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: () => import('./Editor.svelte')
};
