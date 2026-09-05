import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type ProgressWidget = Extract<RailWidget, { type: 'progress' }>;

export const progressWidget: WidgetDescriptor<ProgressWidget> = {
	type: 'progress',
	label: 'hearth_widget_progress_label',
	name: 'hearth_widget_progress_name',
	sub: 'hearth_widget_progress_sub',
	icon: 'progress_activity',
	normalize: (widget) => ({
		active_states: Array.isArray(widget.active_states)
			? widget.active_states.filter((entry: unknown): entry is string => typeof entry === 'string')
			: undefined,
		completed_states: Array.isArray(widget.completed_states)
			? widget.completed_states.filter(
					(entry: unknown): entry is string => typeof entry === 'string'
				)
			: undefined,
		completion_delay_minutes:
			typeof widget.completion_delay_minutes === 'number' &&
			Number.isFinite(widget.completion_delay_minutes) &&
			widget.completion_delay_minutes >= -1
				? widget.completion_delay_minutes
				: undefined
	}),
	needsConfiguration: (widget) => !widget.status_entity,
	component: Widget,
	editor: Editor
};
