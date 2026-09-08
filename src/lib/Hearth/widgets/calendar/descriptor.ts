import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';

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
		)
	}),
	needsConfiguration: (widget) => !widget.entities?.length,
	component: Widget,
	editor: () => import('./Editor.svelte')
};
