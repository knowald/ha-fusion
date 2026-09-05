import type { OverviewCard, SceneRef } from '../../types';
import { entityRefIssues, normalizeSceneRef } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type ScenesCard = Extract<OverviewCard, { type: 'scenes' }>;

export const scenesCard: CardDescriptor<ScenesCard> = {
	type: 'scenes',
	label: 'Scenes (chips or bar)',
	name: 'Scenes',
	sub: 'scene shortcuts',
	icon: 'palette',
	normalize: (card) => ({
		style: card.style === 'bar' ? 'bar' : undefined,
		scenes: (Array.isArray(card.scenes) ? card.scenes : [])
			.map(normalizeSceneRef)
			.filter((ref: SceneRef | null): ref is SceneRef => ref !== null)
	}),
	issues: (raw, path) => entityRefIssues(raw.scenes, `${path}.scenes`),
	needsConfiguration: (card) => card.scenes.length === 0,
	entityIds: (card) =>
		card.scenes.flatMap((ref) => [ref.entity, ...(ref.active_entity ? [ref.active_entity] : [])]),
	component: Card,
	editor: Editor
};
