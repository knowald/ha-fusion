import type { RailWidget } from '../../types';
import { normalizeWholeNumber, trimmedOrUndefined } from '../../normalizers';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';

export type ChartWidget = Extract<RailWidget, { type: 'chart' }>;

export const CHART_STYLES = ['line', 'history', 'bar', 'radial'] as const;
export const CHART_PERIODS = ['hour', 'day', 'week', 'month'] as const;

export const chartWidget: WidgetDescriptor<ChartWidget> = {
	type: 'chart',
	label: 'hearth_widget_chart_label',
	name: 'hearth_widget_chart_name',
	sub: 'hearth_widget_chart_sub',
	icon: 'show_chart',
	normalize: (widget) => ({
		entity: trimmedOrUndefined(widget.entity),
		name: trimmedOrUndefined(widget.name),
		style: CHART_STYLES.includes(widget.style) ? widget.style : undefined,
		period: CHART_PERIODS.includes(widget.period) ? widget.period : undefined,
		math: trimmedOrUndefined(widget.math),
		stroke: normalizeWholeNumber(widget.stroke, 1)
	}),
	needsConfiguration: (widget) => !widget.entity,
	component: Widget,
	editor: () => import('./Editor.svelte')
};
