import type { RailWidget } from '../../types';
import { trimmedOrUndefined } from '../../normalizers';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type TimerWidget = Extract<RailWidget, { type: 'timer' }>;

export const timerWidget: WidgetDescriptor<TimerWidget> = {
	type: 'timer',
	label: 'hearth_widget_timer_label',
	name: 'hearth_widget_timer_name',
	sub: 'hearth_widget_timer_sub',
	icon: 'timer',
	normalize: (widget) => ({
		entity: trimmedOrUndefined(widget.entity),
		name: trimmedOrUndefined(widget.name)
	}),
	needsConfiguration: (widget) => !widget.entity,
	component: Widget,
	editor: Editor
};
