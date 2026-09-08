import type { OverviewCard, VacuumModeRef } from '../../types';
import { entityRefIssues, normalizeVacuumModeRef, trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type VacuumCard = Extract<OverviewCard, { type: 'vacuum' }>;

export const vacuumCard: CardDescriptor<VacuumCard> = {
	type: 'vacuum',
	label: 'Vacuum',
	name: 'Vacuum',
	sub: 'cleaning control',
	icon: 'robot_2',
	normalize: (card) => ({
		modes: (Array.isArray(card.modes) ? card.modes : [])
			.map(normalizeVacuumModeRef)
			.filter((ref: VacuumModeRef | null): ref is VacuumModeRef => ref !== null),
		battery_entity: trimmedOrUndefined(card.battery_entity),
		bin_entity: trimmedOrUndefined(card.bin_entity),
		quick_action: card.quick_action === true ? true : undefined
	}),
	issues: (raw, path) =>
		raw.modes !== undefined ? entityRefIssues(raw.modes, `${path}.modes`) : [],
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => [
		...(card.entity ? [card.entity] : []),
		...(card.modes ?? []).map((ref) => ref.entity),
		...(card.battery_entity ? [card.battery_entity] : []),
		...(card.bin_entity ? [card.bin_entity] : [])
	],
	component: Card,
	editor: Editor
};
