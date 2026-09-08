import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type EntityWidget = Extract<RailWidget, { type: 'entity' }>;

export const entityWidget: WidgetDescriptor<EntityWidget> = {
	type: 'entity',
	label: 'hearth_widget_entity_label',
	name: 'hearth_widget_entity_name',
	sub: 'hearth_widget_entity_sub',
	icon: 'monitoring',
	normalize: (widget) => ({
		vertical_padding: widget.vertical_padding === 'compact' ? ('compact' as const) : undefined
	}),
	needsConfiguration: (widget) => !widget.entity,
	component: Widget,
	editor: Editor
};
