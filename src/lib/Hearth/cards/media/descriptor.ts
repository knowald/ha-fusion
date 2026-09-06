import * as v from 'valibot';
import type { MediaShortcut, OverviewCard } from '../../types';
import { MediaShortcutSchema, OptionalEntityId, OptionalText } from '../../schema';
import { trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type MediaCard = Extract<OverviewCard, { type: 'media' }>;

export const mediaCard: CardDescriptor<MediaCard> = {
	type: 'media',
	label: 'hearth_card_media_label',
	name: 'hearth_card_media_name',
	sub: 'hearth_card_media_sub',
	icon: 'music_note',
	fillByDefault: true,
	sizable: true,
	stretchMinHeight: 140,
	normalize: (card) => ({
		shortcuts: Array.isArray(card.shortcuts)
			? card.shortcuts
					.filter(
						(entry: any): entry is MediaShortcut =>
							!!entry && typeof entry.name === 'string' && typeof entry.uri === 'string'
					)
					.map((entry: MediaShortcut) => ({
						name: entry.name.trim(),
						uri: entry.uri.trim(),
						image_url: trimmedOrUndefined(entry.image_url)
					}))
			: undefined,
		default_device: trimmedOrUndefined(card.default_device)
	}),
	schema: v.looseObject({
		entity: OptionalEntityId,
		shortcuts: v.optional(v.array(MediaShortcutSchema, 'must be a list')),
		default_device: OptionalText
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => (card.entity ? [card.entity] : []),
	component: Card,
	editor: () => import('./Editor.svelte')
};
