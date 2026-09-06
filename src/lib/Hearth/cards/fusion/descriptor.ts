import type { OverviewCard } from '../../types';
import { isRecord } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type FusionCard = Extract<OverviewCard, { type: 'fusion' }>;

/** Original main object types embeddable through the fusion card. */
export const FUSION_OBJECT_TYPES: { value: string; label: string }[] = [
	{ value: 'button', label: 'Button' },
	{ value: 'entities', label: 'Entities list' },
	{ value: 'camera', label: 'Camera' },
	{ value: 'empty', label: 'Empty spacer' }
];

export const fusionCard: CardDescriptor<FusionCard> = {
	type: 'fusion',
	label: 'hearth_card_fusion_label',
	name: 'hearth_card_fusion_name',
	sub: 'hearth_card_fusion_sub',
	icon: 'widgets',
	sizable: true,
	heightHint: 'hearth_height_hint_embed',
	normalize: (card) => ({ config: isRecord(card.config) ? card.config : undefined }),
	// an embed without its entity draws the original "Unknown" tile; keep the
	// placeholder until it has one (the spacer needs none)
	needsConfiguration: (card) =>
		!card.config?.type ||
		(card.config.type !== 'empty' && !card.config.entity_id && !card.config.entities),
	entityIds: (card) => (typeof card.config?.entity_id === 'string' ? [card.config.entity_id] : []),
	component: Card,
	editor: () => import('./Editor.svelte')
};
