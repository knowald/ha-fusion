import * as v from 'valibot';
import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import { OptionalText, OptionalEntityId, optionalNumberAtLeast } from '../../schema';
import { trimmedOrUndefined } from '../../normalizers';

export type EnergyWidget = Extract<RailWidget, { type: 'energy' }>;

export const energyWidget: WidgetDescriptor<EnergyWidget> = {
	type: 'energy',
	label: 'hearth_widget_energy_label',
	name: 'hearth_widget_energy_name',
	sub: 'hearth_widget_energy_sub',
	icon: 'bolt',
	normalize: (widget) => ({
		entity: trimmedOrUndefined(widget.entity),
		price:
			typeof widget.price === 'number' && Number.isFinite(widget.price) && widget.price >= 0
				? widget.price
				: undefined,
		price_entity: trimmedOrUndefined(widget.price_entity),
		currency: trimmedOrUndefined(widget.currency)
	}),
	schema: v.looseObject({
		entity: OptionalEntityId,
		price: optionalNumberAtLeast(0),
		price_entity: OptionalEntityId,
		currency: OptionalText
	}),
	needsConfiguration: (widget) => !widget.entity,
	entityIds: (widget) => [widget.entity, widget.price_entity].filter((id): id is string => !!id),
	component: Widget,
	editor: () => import('./Editor.svelte')
};
