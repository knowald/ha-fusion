import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';

export type SpacerWidget = Extract<RailWidget, { type: 'spacer' }>;

export const spacerWidget: WidgetDescriptor<SpacerWidget> = {
	type: 'spacer',
	label: 'Spacer',
	name: 'Spacer',
	sub: 'flexible gap',
	icon: 'unfold_more'
};
