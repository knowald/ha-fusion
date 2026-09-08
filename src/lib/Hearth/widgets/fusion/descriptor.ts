import * as v from 'valibot';
import type { RailWidget } from '../../types';
import { normalizeHeight } from '../../normalizers';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import { HeightSchema } from '../../schema';

export type FusionWidget = Extract<RailWidget, { type: 'fusion' }>;

/** Original sidebar widget types embeddable through the fusion rail widget. */
export const FUSION_WIDGET_TYPES: { value: string; label: string }[] = [
	{ value: 'sensor', label: 'Sensor' },
	{ value: 'camera', label: 'Camera' },
	{ value: 'image', label: 'Image' },
	{ value: 'time', label: 'Time' },
	{ value: 'date', label: 'Date' },
	{ value: 'weather', label: 'Weather (compact)' },
	{ value: 'weather_forecast', label: 'Weather forecast' },
	{ value: 'divider', label: 'Divider' }
];

export const fusionWidget: WidgetDescriptor<FusionWidget> = {
	type: 'fusion',
	label: 'hearth_widget_fusion_label',
	name: 'hearth_widget_fusion_name',
	sub: 'hearth_widget_fusion_sub',
	icon: 'widgets',
	normalize: (widget) => ({ height: normalizeHeight(widget.height) }),
	schema: v.looseObject({
		config: v.optional(v.record(v.string(), v.unknown(), 'must be a mapping')),
		height: HeightSchema
	}),
	needsConfiguration: (widget) =>
		!widget.config?.type ||
		(['sensor', 'camera', 'image', 'weather', 'weather_forecast'].includes(widget.config.type) &&
			!widget.config.entity_id),
	component: Widget,
	editor: () => import('./Editor.svelte')
};
