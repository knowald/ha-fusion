import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';

export type NavWidget = Extract<RailWidget, { type: 'nav' }>;

export const navWidget: WidgetDescriptor<NavWidget> = {
	type: 'nav',
	label: 'Page navigation',
	name: 'Page navigation',
	sub: 'room links',
	icon: 'home',
	component: Widget
};
