import * as v from 'valibot';
import type { OverviewCard } from '../../types';
import { normalizeVerdict, trimmedOrUndefined } from '../../normalizers';
import type { CardDescriptor } from '../types';
import Card from './Card.svelte';
import { OptionalText, OptionalEntityId, VerdictBandsSchema } from '../../schema';

export type TemperatureCard = Extract<OverviewCard, { type: 'temperature' }>;

export const temperatureCard: CardDescriptor<TemperatureCard> = {
	type: 'temperature',
	label: 'hearth_card_temperature_label',
	name: 'hearth_card_temperature_name',
	sub: 'hearth_card_temperature_sub',
	icon: 'monitoring',
	fillByDefault: true,
	sizable: true,
	stretchMinHeight: 110,
	normalize: (card) => ({
		climate_entity: trimmedOrUndefined(card.climate_entity),
		verdict: normalizeVerdict(card.verdict)
	}),
	schema: v.looseObject({
		label: OptionalText,
		entity: OptionalEntityId,
		unit: OptionalText,
		climate_entity: OptionalEntityId,
		verdict: v.optional(v.union([v.literal(false), VerdictBandsSchema], 'must be false or bands'))
	}),
	needsConfiguration: (card) => !card.entity,
	entityIds: (card) => [
		...(card.entity ? [card.entity] : []),
		...(card.climate_entity ? [card.climate_entity] : [])
	],
	component: Card,
	editor: () => import('./Editor.svelte')
};
