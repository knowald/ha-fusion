import type { OverviewCard } from '../../types';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type CameraCard = Extract<OverviewCard, { type: 'camera' }>;

export const cameraCard: CardDescriptor<CameraCard> = {
	type: 'camera',
	label: 'Camera',
	name: 'Camera',
	sub: 'live camera feed',
	icon: 'videocam',
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: Editor
};
