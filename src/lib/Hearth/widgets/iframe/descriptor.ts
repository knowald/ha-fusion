import type { RailWidget } from '../../types';
import { normalizeHeight, trimmedOrUndefined } from '../../normalizers';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import Editor from './Editor.svelte';

export type IframeWidget = Extract<RailWidget, { type: 'iframe' }>;

export const iframeWidget: WidgetDescriptor<IframeWidget> = {
	type: 'iframe',
	label: 'hearth_widget_iframe_label',
	name: 'hearth_widget_iframe_name',
	sub: 'hearth_widget_iframe_sub',
	icon: 'web',
	normalize: (widget) => ({
		url: trimmedOrUndefined(widget.url),
		height: normalizeHeight(widget.height)
	}),
	needsConfiguration: (widget) => !widget.url,
	component: Widget,
	editor: Editor
};
