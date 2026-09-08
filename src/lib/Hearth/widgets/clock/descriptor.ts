import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';

export type ClockWidget = Extract<RailWidget, { type: 'clock' }>;

export const clockWidget: WidgetDescriptor<ClockWidget> = {
	type: 'clock',
	label: 'hearth_widget_clock_label',
	name: 'hearth_widget_clock_name',
	sub: 'hearth_widget_clock_sub',
	icon: 'schedule',
	component: Widget,
	editor: () => import('./Editor.svelte')
};
