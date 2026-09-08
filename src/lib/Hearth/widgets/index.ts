import { get } from 'svelte/store';
import { lang } from '$lib/core/i18n';
import type { RailWidget } from '../types';
import type { WidgetDescriptor } from './types';
import { calendarWidget } from './calendar/descriptor';
import { clockWidget } from './clock/descriptor';
import { energyWidget } from './energy/descriptor';
import { entityWidget } from './entity/descriptor';
import { fusionWidget } from './fusion/descriptor';
import { labelWidget } from './label/descriptor';
import { navWidget } from './nav/descriptor';
import { progressWidget } from './progress/descriptor';
import { searchWidget } from './search/descriptor';
import { spacerWidget } from './spacer/descriptor';
import { statusWidget } from './status/descriptor';
import { weatherWidget } from './weather/descriptor';

export type { WidgetDescriptor, WidgetDraft, WidgetEditorProps, WidgetFields } from './types';

/** Every rail widget type, in gallery order. Register a new type here and nowhere else. */
export const RAIL_WIDGET_TYPES: WidgetDescriptor<any>[] = [
	clockWidget,
	weatherWidget,
	navWidget,
	searchWidget,
	spacerWidget,
	labelWidget,
	energyWidget,
	progressWidget,
	calendarWidget,
	statusWidget,
	entityWidget,
	fusionWidget
];

const BY_TYPE = new Map<string, WidgetDescriptor<any>>(
	RAIL_WIDGET_TYPES.map((widget) => [widget.type, widget])
);

export function widgetDescriptor<T extends RailWidget>(type: T['type']): WidgetDescriptor<T>;
export function widgetDescriptor(type: string): WidgetDescriptor<any> | undefined;
export function widgetDescriptor(type: string) {
	return BY_TYPE.get(type);
}

export function railWidgetNeedsConfiguration(widget: RailWidget): boolean {
	return widgetDescriptor(widget.type).needsConfiguration?.(widget) ?? false;
}

export function railConfigurationLabel(widget: RailWidget): string {
	return get(lang)(widgetDescriptor(widget.type).name);
}
