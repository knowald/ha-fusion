import * as v from 'valibot';
import type { RailWidget } from '../../types';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';

export type NotificationsWidget = Extract<RailWidget, { type: 'notifications' }>;

export const notificationsWidget: WidgetDescriptor<NotificationsWidget> = {
	type: 'notifications',
	label: 'hearth_widget_notifications_label',
	name: 'hearth_widget_notifications_name',
	sub: 'hearth_widget_notifications_sub',
	icon: 'notifications',
	schema: v.looseObject({}),
	component: Widget
};
