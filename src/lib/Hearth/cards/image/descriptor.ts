import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type ImageCard = Extract<OverviewCard, { type: 'image' }>;

export const imageCard: CardDescriptor<ImageCard> = {
	type: 'image',
	label: 'hearth_card_image_label',
	name: 'hearth_card_image_name',
	sub: 'hearth_card_image_sub',
	icon: 'image',
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: Editor
};
