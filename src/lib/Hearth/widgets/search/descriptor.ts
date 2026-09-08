import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';

export type SearchWidget = Extract<RailWidget, { type: 'search' }>;

export const searchWidget: WidgetDescriptor<SearchWidget> = {
	type: 'search',
	label: 'hearth_widget_search_label',
	name: 'hearth_widget_search_name',
	sub: 'hearth_widget_search_sub',
	icon: 'search',
	component: Widget
};
