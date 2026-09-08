import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type CameraCard = Extract<OverviewCard, { type: 'camera' }>;

export const cameraCard: CardDescriptor<CameraCard> = {
	type: 'camera',
	label: 'hearth_card_camera_label',
	name: 'hearth_card_camera_name',
	sub: 'hearth_card_camera_sub',
	icon: 'videocam',
	normalize: (card) => ({
		entity: trimmedOrUndefined(card.entity),
		title: trimmedOrUndefined(card.title),
		stream: typeof card.stream === 'boolean' ? card.stream : undefined
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: () => import('./Editor.svelte')
};
