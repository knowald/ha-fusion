import type { OverviewCard } from '../../types';
import { normalizeVerdict, trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import Editor from './Editor.svelte';

export type TemperatureCard = Extract<OverviewCard, { type: 'temperature' }>;

export const temperatureCard: CardDescriptor<TemperatureCard> = {
	type: 'temperature',
	label: 'Sensor reading + sparkline',
	name: 'Sensor',
	sub: 'reading and history',
	icon: 'monitoring',
	fillByDefault: true,
	sizable: true,
	normalize: (card) => ({
		climate_entity: trimmedOrUndefined(card.climate_entity),
		verdict: normalizeVerdict(card.verdict)
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => [
		...(card.entity ? [card.entity] : []),
		...(card.climate_entity ? [card.climate_entity] : [])
	],
	component: Card,
	editor: Editor
};
