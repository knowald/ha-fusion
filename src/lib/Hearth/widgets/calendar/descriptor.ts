import * as v from 'valibot';
import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import { OptionalEntityId, OptionalEntityIdList, optionalNumberAtLeast } from '../../schema';
import { normalizeWholeNumber, trimmedOrUndefined } from '../../normalizers';

export type CalendarWidget = Extract<RailWidget, { type: 'calendar' }>;

export const calendarWidget: WidgetDescriptor<CalendarWidget> = {
	type: 'calendar',
	label: 'hearth_widget_calendar_label',
	name: 'hearth_widget_calendar_name',
	sub: 'hearth_widget_calendar_sub',
	icon: 'event',
	normalize: (widget) => ({
		entities: (Array.isArray(widget.entities) ? widget.entities : []).filter(
			(entry: unknown): entry is string => typeof entry === 'string'
		),
		travel_entity: trimmedOrUndefined(widget.travel_entity),
		lookahead_hours: normalizeWholeNumber(widget.lookahead_hours, 1)
	}),
	schema: v.looseObject({
		entities: OptionalEntityIdList,
		travel_entity: OptionalEntityId,
		lookahead_hours: optionalNumberAtLeast(1)
	}),
	needsConfiguration: (widget) => !widget.entities?.length,
	component: Widget,
	editor: () => import('./Editor.svelte')
};
