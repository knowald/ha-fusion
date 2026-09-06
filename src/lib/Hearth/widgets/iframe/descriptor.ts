import * as v from 'valibot';
import type { RailWidget } from '../../types';
import { normalizeEmbedUrl, normalizeHeight } from '../../normalizers';
import type { WidgetDescriptor } from '../types';
import Widget from './Widget.svelte';
import { HeightSchema } from '../../schema';

export type IframeWidget = Extract<RailWidget, { type: 'iframe' }>;

export const iframeWidget: WidgetDescriptor<IframeWidget> = {
	type: 'iframe',
	label: 'hearth_widget_iframe_label',
	name: 'hearth_widget_iframe_name',
	sub: 'hearth_widget_iframe_sub',
	icon: 'web',
	normalize: (widget) => ({
		url: normalizeEmbedUrl(widget.url),
		height: normalizeHeight(widget.height)
	}),
	schema: v.looseObject({
		url: v.optional(
			v.pipe(
				v.string('must be text'),
				v.check(
					(url) => normalizeEmbedUrl(url) !== undefined,
					'must be an http(s) address or a path on this server'
				)
			)
		),
		height: HeightSchema
	}),
	needsConfiguration: (widget) => !widget.url,
	entityIds: () => [],
	component: Widget,
	editor: () => import('./Editor.svelte')
};
