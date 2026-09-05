import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type EnergyWidget = Extract<RailWidget, { type: 'energy' }>;

export const energyWidget: WidgetDescriptor<EnergyWidget> = {
	type: 'energy',
	label: 'Energy today',
	name: 'Energy today',
	sub: 'kWh + cost',
	icon: 'bolt',
	needsConfiguration: (widget) => !widget.entity,
	component: Widget,
	editor: Editor
};
