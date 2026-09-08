import * as v from 'valibot';
import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';

export type SpacerWidget = Extract<RailWidget, { type: 'spacer' }>;

export const spacerWidget: WidgetDescriptor<SpacerWidget> = {
	type: 'spacer',
	label: 'hearth_widget_spacer_label',
	name: 'hearth_widget_spacer_name',
	sub: 'hearth_widget_spacer_sub',
	icon: 'unfold_more',
	schema: v.looseObject({})
};
