import * as v from 'valibot';
import { OptionalEntityId, OptionalFlag, VacuumModeRefSchema } from '../../schema';
import type { OverviewCard, VacuumModeRef } from '../../types';
import { normalizeVacuumModeRef, trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';

export type VacuumCard = Extract<OverviewCard, { type: 'vacuum' }>;

export const vacuumCard: CardDescriptor<VacuumCard> = {
	type: 'vacuum',
	label: 'hearth_card_vacuum_label',
	name: 'hearth_card_vacuum_name',
	sub: 'hearth_card_vacuum_sub',
	previewInteractive: true,
	icon: 'robot_2',
	normalize: (card) => ({
		modes: (Array.isArray(card.modes) ? card.modes : [])
			.map(normalizeVacuumModeRef)
			.filter((ref: VacuumModeRef | null): ref is VacuumModeRef => ref !== null),
		battery_entity: trimmedOrUndefined(card.battery_entity),
		bin_entity: trimmedOrUndefined(card.bin_entity),
		quick_action: card.quick_action === true ? true : undefined
	}),
	schema: v.looseObject({
		entity: OptionalEntityId,
		modes: v.optional(v.array(VacuumModeRefSchema, 'must be a list')),
		battery_entity: OptionalEntityId,
		bin_entity: OptionalEntityId,
		quick_action: OptionalFlag
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => [
		...(card.entity ? [card.entity] : []),
		...(card.modes ?? []).map((ref) => ref.entity),
		...(card.battery_entity ? [card.battery_entity] : []),
		...(card.bin_entity ? [card.bin_entity] : [])
	],
	component: Card,
	editor: () => import('./Editor.svelte')
};
