import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type WeatherWidget = Extract<RailWidget, { type: 'weather' }>;

export const weatherWidget: WidgetDescriptor<WeatherWidget> = {
	type: 'weather',
	label: 'Weather',
	name: 'Weather',
	sub: 'current + forecast',
	icon: 'clear_day',
	needsConfiguration: (widget) => !widget.entity,
	component: Widget,
	editor: Editor
};
