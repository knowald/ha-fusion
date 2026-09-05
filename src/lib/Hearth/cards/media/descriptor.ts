import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type MediaCard = Extract<OverviewCard, { type: 'media' }>;

export const mediaCard: CardDescriptor<MediaCard> = {
	type: 'media',
	label: 'hearth_card_media_label',
	name: 'hearth_card_media_name',
	sub: 'hearth_card_media_sub',
	icon: 'music_note',
	fillByDefault: true,
	sizable: true,
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: Editor
};
