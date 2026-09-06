import * as v from 'valibot';
import { SceneRefSchema } from '../../schema';
import type { OverviewCard, SceneRef } from '../../types';
import { normalizeSceneRef } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type ScenesCard = Extract<OverviewCard, { type: 'scenes' }>;

export const scenesCard: CardDescriptor<ScenesCard> = {
	type: 'scenes',
	label: 'hearth_card_scenes_label',
	name: 'hearth_card_scenes_name',
	sub: 'hearth_card_scenes_sub',
	icon: 'palette',
	normalize: (card) => ({
		style: card.style === 'bar' ? 'bar' : undefined,
		scenes: (Array.isArray(card.scenes) ? card.scenes : [])
			.map(normalizeSceneRef)
			.filter((ref: SceneRef | null): ref is SceneRef => ref !== null)
	}),
	schema: v.looseObject({ scenes: v.array(SceneRefSchema, 'must be a list') }),
	needsConfiguration: (card) => card.scenes.length === 0,
	entityIds: (card) =>
		card.scenes.flatMap((ref) => [ref.entity, ...(ref.active_entity ? [ref.active_entity] : [])]),
	component: Card,
	editor: () => import('./Editor.svelte')
};
