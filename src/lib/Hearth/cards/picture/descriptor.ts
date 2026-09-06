import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import { OptionalText } from '../../schema';

export type PictureCard = Extract<OverviewCard, { type: 'picture' }>;

/** Entity ids referenced by the Konva elements, for attention and search. */
function elementEntityIds(elements: unknown[]): string[] {
	const ids = new Set<string>();
	const visit = (element: any) => {
		if (!element || typeof element !== 'object') return;
		if (typeof element.attrs?.entity_id === 'string') ids.add(element.attrs.entity_id);
		if (Array.isArray(element.children)) element.children.forEach(visit);
	};
	elements.forEach(visit);
	return [...ids];
}

export const pictureCard: CardDescriptor<PictureCard> = {
	type: 'picture',
	label: 'hearth_card_picture_label',
	name: 'hearth_card_picture_name',
	sub: 'hearth_card_picture_sub',
	icon: 'photo_library',
	sizable: true,
	normalize: (card) => ({
		title: trimmedOrUndefined(card.title),
		elements: Array.isArray(card.elements) ? card.elements : []
	}),
	schema: v.looseObject({
		title: OptionalText,
		elements: v.optional(v.array(v.unknown(), 'must be a list'))
	}),
	needsConfiguration: (card) => card.elements.length === 0,
	entityIds: (card) => elementEntityIds(card.elements),
	component: Card,
	editor: () => import('./Editor.svelte')
};
