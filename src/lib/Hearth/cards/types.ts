import type { Component } from 'svelte';
import type { GenericSchema } from 'valibot';
import type { EntityRef, OverviewCard } from '../types';

/** The fields a card editor owns: everything but the id, type and the layout options the shell adds. */
export type CardFields<T extends OverviewCard> = Omit<
	T,
	'id' | 'type' | 'fill' | 'height' | 'visibility'
>;

export interface CardDraft<T extends OverviewCard> {
	fields: CardFields<T>;
	/** false blocks Done, for example while advanced YAML does not parse */
	valid?: boolean;
}

export interface CardEditorProps<T extends OverviewCard> {
	/** The card being edited when it is of this type; undefined for a new card or after a type switch. */
	initial: T | undefined;
	/** Called with the current draft whenever a field changes, including once on mount. */
	onchange: (draft: CardDraft<T>) => void;
}

export interface CardComponentProps<T extends OverviewCard> {
	card: T;
	/** Draft-card callback used by the card editor's interactive preview. */
	onentitiesreorder?: (entities: EntityRef[]) => void;
	showEntityDragHandles?: boolean;
}

/**
 * Everything the dashboard needs to know about one card type. Adding a type
 * means adding a folder with these three parts and one line in cards/index.ts.
 */
export interface CardDescriptor<T extends OverviewCard = OverviewCard> {
	type: T['type'];
	/** Long label for pickers with room, e.g. "Sensor reading + sparkline". */
	label: string;
	/** Short name for the gallery tile. */
	name: string;
	/** One-line gallery caption. */
	sub: string;
	icon: string;
	/** Takes a share of its column's leftover height unless the card says otherwise. */
	fillByDefault?: boolean;
	/** Accepts a fixed `height` in px. */
	sizable?: boolean;
	/** The editor preview offers drag reordering of the card's entities. */
	previewReorder?: boolean;
	/** The editor preview responds to taps (the card has controls worth trying). */
	previewInteractive?: boolean;
	/** Smallest height in px a filling card may be squeezed to; the column default is 90. */
	stretchMinHeight?: number;
	/** Translation key explaining what an unset height means for this type. */
	heightHint?: string;
	/**
	 * Type-specific field normalization for a raw YAML card; id, fill, height
	 * and visibility are handled by the caller. Every typed field must be
	 * coerced here, since raw YAML is spread into the card unchanged.
	 */
	normalize: (raw: Record<string, any>) => Partial<T>;
	/**
	 * Structural rules for the type's own fields, checked before a YAML edit is
	 * applied. Use a loose object so unknown extension keys pass.
	 */
	schema?: GenericSchema;
	/** True while the card has nothing to render yet and should show the setup placeholder. */
	needsConfiguration: (card: T) => boolean;
	/** Every entity id the card refers to, for attention and search. */
	entityIds: (card: T) => string[];
	component: Component<CardComponentProps<T>>;
	/** Loaded when the edit sheet opens, so editors stay out of the dashboard bundle. */
	editor: () => Promise<{ default: CardEditor<T> }>;
}

export type CardEditor<T extends OverviewCard = OverviewCard> = Component<
	CardEditorProps<T>,
	{ applyPreviewReorder?: (entities: EntityRef[]) => void }
>;
