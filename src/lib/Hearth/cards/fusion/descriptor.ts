import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type FusionCard = Extract<OverviewCard, { type: 'fusion' }>;

/** Original main object types embeddable through the fusion card. */
export const FUSION_OBJECT_TYPES: { value: string; label: string }[] = [
	{ value: 'button', label: 'Button' },
	{ value: 'entities', label: 'Entities list' },
	{ value: 'camera', label: 'Camera' },
	{ value: 'picture_elements', label: 'Picture elements' },
	{ value: 'conditional_media', label: 'Conditional media' },
	{ value: 'days_since', label: 'Days since' },
	{ value: 'spotify_player', label: 'Spotify player' },
	{ value: 'spotify_player_large', label: 'Spotify player (large)' },
	{ value: 'empty', label: 'Empty spacer' }
];

export const fusionCard: CardDescriptor<FusionCard> = {
	type: 'fusion',
	label: 'Fusion object (template, picture elements, ...)',
	name: 'Fusion',
	sub: 'legacy objects',
	icon: 'widgets',
	sizable: true,
	needsConfiguration: (card) => !card.config?.type,
	entityIds: (card) => (typeof card.config?.entity_id === 'string' ? [card.config.entity_id] : []),
	component: Card,
	editor: Editor
};
