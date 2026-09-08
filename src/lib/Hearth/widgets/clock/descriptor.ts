import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type ClockWidget = Extract<RailWidget, { type: 'clock' }>;

export const clockWidget: WidgetDescriptor<ClockWidget> = {
	type: 'clock',
	label: 'Clock',
	name: 'Clock',
	sub: 'time + date',
	icon: 'schedule',
	component: Widget,
	editor: Editor
};
