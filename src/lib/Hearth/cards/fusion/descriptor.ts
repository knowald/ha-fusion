import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { isRecord } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type FusionCard = Extract<OverviewCard, { type: 'fusion' }>;

/** Original main object types embeddable through the fusion card; labels are translation keys. */
export const FUSION_OBJECT_TYPES: { value: string; label: string }[] = [
	{ value: 'button', label: 'hearth_fusion_button' },
	{ value: 'entities', label: 'hearth_fusion_entities_list' },
	{ value: 'camera', label: 'hearth_fusion_camera' },
	{ value: 'empty', label: 'hearth_fusion_empty_spacer' }
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
	schema: v.looseObject({
		config: v.optional(v.record(v.string(), v.unknown(), 'must be a mapping'))
	}),
	needsConfiguration: (card) => {
		const config = card.config;
		if (!config?.type) return true;
		if (config.type === 'empty') return false;
		if (config.type === 'entities') {
			const entities = Array.isArray(config.entities) ? config.entities : [];
			const wildcard = typeof config.wildcard === 'string' && config.wildcard.trim();
			return entities.length === 0 && !wildcard;
		}
		return !config.entity_id;
	},
	entityIds: (card) => (typeof card.config?.entity_id === 'string' ? [card.config.entity_id] : []),
	component: Card,
	editor: () => import('./Editor.svelte')
};
