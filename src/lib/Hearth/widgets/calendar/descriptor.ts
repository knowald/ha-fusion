import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type CalendarWidget = Extract<RailWidget, { type: 'calendar' }>;

export const calendarWidget: WidgetDescriptor<CalendarWidget> = {
	type: 'calendar',
	label: 'Calendar (next event)',
	name: 'Calendar',
	sub: 'next event',
	icon: 'event',
	normalize: (widget) => ({
		entities: (Array.isArray(widget.entities) ? widget.entities : []).filter(
			(entry: unknown): entry is string => typeof entry === 'string'
		)
	}),
	needsConfiguration: (widget) => !widget.entities?.length,
	component: Widget,
	editor: Editor
};
