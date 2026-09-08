import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type StatusWidget = Extract<RailWidget, { type: 'status' }>;

export const statusWidget: WidgetDescriptor<StatusWidget> = {
	type: 'status',
	label: 'hearth_widget_status_label',
	name: 'hearth_widget_status_name',
	sub: 'hearth_widget_status_sub',
	icon: 'eco',
	component: Widget,
	editor: Editor
};
