import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type MediaCard = Extract<OverviewCard, { type: 'media' }>;

export const mediaCard: CardDescriptor<MediaCard> = {
	type: 'media',
	label: 'Media player',
	name: 'Media',
	sub: 'now playing',
	icon: 'music_note',
	fillByDefault: true,
	sizable: true,
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: Editor
};
