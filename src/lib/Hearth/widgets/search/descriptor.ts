import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';

export type SearchWidget = Extract<RailWidget, { type: 'search' }>;

export const searchWidget: WidgetDescriptor<SearchWidget> = {
	type: 'search',
	label: 'Search',
	name: 'Search',
	sub: 'pages + entities',
	icon: 'search',
	component: Widget
};
