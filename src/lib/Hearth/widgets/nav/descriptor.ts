import * as v from 'valibot';
import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';

export type NavWidget = Extract<RailWidget, { type: 'nav' }>;

export const navWidget: WidgetDescriptor<NavWidget> = {
	type: 'nav',
	label: 'hearth_widget_nav_label',
	name: 'hearth_widget_nav_name',
	sub: 'hearth_widget_nav_sub',
	icon: 'home',
	schema: v.looseObject({}),
	entityIds: () => [],
	component: Widget
};
