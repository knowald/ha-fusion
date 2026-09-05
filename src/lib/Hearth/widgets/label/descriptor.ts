import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type LabelWidget = Extract<RailWidget, { type: 'label' }>;

export const labelWidget: WidgetDescriptor<LabelWidget> = {
	type: 'label',
	label: 'Section label',
	name: 'Section label',
	sub: 'small heading',
	icon: 'label',
	component: Widget,
	editor: Editor
};
