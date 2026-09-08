import * as v from 'valibot';
import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import { OptionalText, OptionalFlag } from '../../schema';
import { trimmedOrUndefined } from '../../normalizers';

export type ClockWidget = Extract<RailWidget, { type: 'clock' }>;

export const clockWidget: WidgetDescriptor<ClockWidget> = {
	type: 'clock',
	label: 'hearth_widget_clock_label',
	name: 'hearth_widget_clock_name',
	sub: 'hearth_widget_clock_sub',
	icon: 'schedule',
	normalize: (widget) => ({
		city: trimmedOrUndefined(widget.city),
		timezone: trimmedOrUndefined(widget.timezone),
		hour_format: ['auto', '12', '24'].includes(widget.hour_format) ? widget.hour_format : undefined,
		show_seconds: widget.show_seconds === true ? true : undefined
	}),
	schema: v.looseObject({
		city: OptionalText,
		timezone: OptionalText,
		hour_format: v.optional(v.picklist(['auto', '12', '24'], 'must be auto, 12 or 24')),
		show_seconds: OptionalFlag
	}),
	entityIds: () => [],
	component: Widget,
	editor: () => import('./Editor.svelte')
};
