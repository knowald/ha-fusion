import * as v from 'valibot';
import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import { OptionalText, OptionalEntityId } from '../../schema';
import { trimmedOrUndefined } from '../../normalizers';

export type StatusWidget = Extract<RailWidget, { type: 'status' }>;

export const statusWidget: WidgetDescriptor<StatusWidget> = {
	type: 'status',
	label: 'hearth_widget_status_label',
	name: 'hearth_widget_status_name',
	sub: 'hearth_widget_status_sub',
	icon: 'eco',
	normalize: (widget) => ({
		icon: trimmedOrUndefined(widget.icon),
		text: trimmedOrUndefined(widget.text),
		entity: trimmedOrUndefined(widget.entity)
	}),
	schema: v.looseObject({ icon: OptionalText, text: OptionalText, entity: OptionalEntityId }),
	entityIds: (widget) => (widget.entity ? [widget.entity] : []),
	component: Widget,
	editor: () => import('./Editor.svelte')
};
