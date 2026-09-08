import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type StatusWidget = Extract<RailWidget, { type: 'status' }>;

export const statusWidget: WidgetDescriptor<StatusWidget> = {
	type: 'status',
	label: 'Status pill',
	name: 'Status pill',
	sub: 'icon + text',
	icon: 'eco',
	component: Widget,
	editor: Editor
};
