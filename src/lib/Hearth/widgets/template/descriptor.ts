import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';

export type TemplateWidget = Extract<RailWidget, { type: 'template' }>;

export const templateWidget: WidgetDescriptor<TemplateWidget> = {
	type: 'template',
	label: 'hearth_widget_template_label',
	name: 'hearth_widget_template_name',
	sub: 'hearth_widget_template_sub',
	icon: 'code',
	normalize: (widget) => ({
		template:
			typeof widget.template === 'string' && widget.template.trim() ? widget.template : undefined
	}),
	needsConfiguration: (widget) => !widget.template,
	component: Widget,
	editor: () => import('./Editor.svelte')
};
