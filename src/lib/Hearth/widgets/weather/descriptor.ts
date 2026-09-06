import * as v from 'valibot';
import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import { OptionalEntityId } from '../../schema';
import { trimmedOrUndefined } from '../../normalizers';

export type WeatherWidget = Extract<RailWidget, { type: 'weather' }>;

export const weatherWidget: WidgetDescriptor<WeatherWidget> = {
	type: 'weather',
	label: 'hearth_widget_weather_label',
	name: 'hearth_widget_weather_name',
	sub: 'hearth_widget_weather_sub',
	icon: 'clear_day',
	normalize: (widget) => ({ entity: trimmedOrUndefined(widget.entity) }),
	schema: v.looseObject({ entity: OptionalEntityId }),
	needsConfiguration: (widget) => !widget.entity,
	entityIds: (widget) => (widget.entity ? [widget.entity] : []),
	component: Widget,
	editor: () => import('./Editor.svelte')
};
