import type { Component } from 'svelte';
import type { GenericSchema } from 'valibot';
import type { RailWidget } from '../types';

/** The fields a widget editor owns: everything but the id, type and the visibility options the shell adds. */
export type WidgetFields<T extends RailWidget> = Omit<
	T,
	'id' | 'type' | 'hide_mobile' | 'visibility'
>;

export interface WidgetDraft<T extends RailWidget> {
	fields: WidgetFields<T>;
	/** false blocks Done, for example for an unknown time zone */
	valid?: boolean;
}

export interface WidgetEditorProps<T extends RailWidget> {
	initial: T | undefined;
	onchange: (draft: WidgetDraft<T>) => void;
}

export interface WidgetComponentProps<T extends RailWidget> {
	widget: T;
	/** Opens the search overlay; only the search widget uses it. */
	onsearch?: () => void;
}

/**
 * Everything the rail needs to know about one widget type. Adding a type means
 * adding a folder with these parts and one line in widgets/index.ts.
 */
export interface WidgetDescriptor<T extends RailWidget = RailWidget> {
	type: T['type'];
	label: string;
	name: string;
	sub: string;
	icon: string;
	normalize?: (raw: Record<string, any>) => Partial<T>;
	/** Structural rules for the type's own fields; a loose object so extension keys pass. */
	schema?: GenericSchema;
	needsConfiguration?: (widget: T) => boolean;
	/**
	 * Absent for layout-only widgets such as the spacer, which the rail draws
	 * itself. Typed loosely because widgets without options declare no props.
	 */
	component?: Component<any>;
	/** Absent for widgets with no options. */
	editor?: Component<WidgetEditorProps<T>>;
}
