import type { RailWidget } from '../../types';
import { normalizeHeight } from '../../normalizers';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type FusionWidget = Extract<RailWidget, { type: 'fusion' }>;

/** Original sidebar widget types embeddable through the fusion rail widget. */
export const FUSION_WIDGET_TYPES: { value: string; label: string }[] = [
	{ value: 'sensor', label: 'Sensor' },
	{ value: 'template', label: 'Template' },
	{ value: 'graph', label: 'Graph' },
	{ value: 'bar', label: 'Bar' },
	{ value: 'radial', label: 'Radial' },
	{ value: 'history', label: 'History' },
	{ value: 'camera', label: 'Camera' },
	{ value: 'image', label: 'Image' },
	{ value: 'iframe', label: 'Iframe' },
	{ value: 'time', label: 'Time' },
	{ value: 'date', label: 'Date' },
	{ value: 'timer', label: 'Timer' },
	{ value: 'weather', label: 'Weather (compact)' },
	{ value: 'weather_forecast', label: 'Weather forecast' },
	{ value: 'notifications', label: 'Notifications' },
	{ value: 'divider', label: 'Divider' }
];

export const fusionWidget: WidgetDescriptor<FusionWidget> = {
	type: 'fusion',
	label: 'hearth_widget_fusion_label',
	name: 'hearth_widget_fusion_name',
	sub: 'hearth_widget_fusion_sub',
	icon: 'widgets',
	normalize: (widget) => ({ height: normalizeHeight(widget.height) }),
	needsConfiguration: (widget) => !widget.config?.type,
	component: Widget,
	editor: Editor
};
