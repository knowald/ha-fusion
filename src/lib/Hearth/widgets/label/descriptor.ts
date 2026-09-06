import * as v from 'valibot';
import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import { OptionalText, OptionalFlag } from '../../schema';

export type LabelWidget = Extract<RailWidget, { type: 'label' }>;

export const labelWidget: WidgetDescriptor<LabelWidget> = {
	type: 'label',
	label: 'hearth_widget_label_label',
	name: 'hearth_widget_label_name',
	sub: 'hearth_widget_label_sub',
	icon: 'label',
	normalize: (widget) => ({
		text: typeof widget.text === 'string' && widget.text.trim() ? widget.text : undefined,
		divider: widget.divider === true ? true : undefined
	}),
	schema: v.looseObject({ text: OptionalText, divider: OptionalFlag }),
	entityIds: () => [],
	component: Widget,
	editor: () => import('./Editor.svelte')
};
