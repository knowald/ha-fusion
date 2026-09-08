import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type EnergyWidget = Extract<RailWidget, { type: 'energy' }>;

export const energyWidget: WidgetDescriptor<EnergyWidget> = {
	type: 'energy',
	label: 'hearth_widget_energy_label',
	name: 'hearth_widget_energy_name',
	sub: 'hearth_widget_energy_sub',
	icon: 'bolt',
	needsConfiguration: (widget) => !widget.entity,
	component: Widget,
	editor: Editor
};
