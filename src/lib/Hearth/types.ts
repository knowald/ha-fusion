import type * as v from 'valibot';
import type { SliderUpdateMode } from '$lib/core/app/configuration';
import type {
	EntityRefSchema,
	MediaShortcutSchema,
	SceneRefSchema,
	VacuumModeRefSchema,
	VisibilityConditionSchema
} from './schema';
import type { VerdictBands } from '$lib/core/domains/sensor';
import type { DayNightSwitch, HearthTheme } from '$lib/core/theme';

export type { DayNightSwitch, HearthTheme, VerdictBands };

/*
 * The configuration vocabulary: pages, cards, widgets and their references.
 * Per-type card and widget shapes are declared next to their descriptors under
 * cards/ and widgets/ and assembled into the unions here.
 */

/**
 * A dashboard page. Home is one of these too - it has no special layout, no
 * special storage and no special editing path.
 */
export interface HearthRoom {
	id: string;
	name: string;
	icon: string;
	summary?: string;
	temp_entity?: string;
	humidity_entity?: string;
	// drops the built-in page header; a `header` card can take its place
	hide_header?: boolean;
	// the page fills the screen instead of scrolling: cards that stretch share
	// the leftover height and anything past the bottom edge is clipped
	fill_screen?: boolean;
	// fixes the page's card column count
	columns?: number;
	cards: OverviewItem[][];
}

export type EntityRef = v.InferOutput<typeof EntityRefSchema>;
export type SceneRef = v.InferOutput<typeof SceneRefSchema>;
export type VacuumModeRef = v.InferOutput<typeof VacuumModeRefSchema>;
export type VisibilityCondition = v.InferOutput<typeof VisibilityConditionSchema>;
export type MediaShortcut = v.InferOutput<typeof MediaShortcutSchema>;

type RailWidgetVariant =
	| {
			id: string;
			type: 'clock';
			/** @deprecated Legacy display-only field. Use timezone. */
			city?: string;
			timezone?: string;
			hour_format?: 'auto' | '12' | '24';
			show_seconds?: boolean;
	  }
	| { id: string; type: 'weather'; entity?: string }
	| { id: string; type: 'search' }
	| { id: string; type: 'nav' }
	| { id: string; type: 'spacer' }
	| { id: string; type: 'label'; text?: string; divider?: boolean }
	// price is a static amount per kWh; price_entity overrides it when set
	| {
			id: string;
			type: 'energy';
			entity?: string;
			price?: number;
			price_entity?: string;
			currency?: string;
	  }
	// generic running-activity row (washer, 3d print, charging, ...); hidden
	// unless the status entity is active - by the active_states list when given,
	// otherwise by not being in a common idle-state set
	| {
			id: string;
			type: 'progress';
			name?: string;
			icon?: string;
			status_entity?: string;
			progress_entity?: string;
			// appended verbatim to the progress value readout, e.g. "%"
			unit?: string;
			remaining_entity?: string;
			active_states?: string[];
			// states that mark a just-finished activity; the row remains dismissible
			// for completion_delay_minutes before hiding automatically
			completed_states?: string[];
			completion_delay_minutes?: number;
	  }
	| {
			id: string;
			type: 'calendar';
			entities?: string[];
			travel_entity?: string;
			lookahead_hours?: number;
	  }
	| { id: string; type: 'status'; icon?: string; text?: string; entity?: string }
	| {
			id: string;
			type: 'entity';
			entity?: string;
			name?: string;
			icon?: string;
			vertical_padding?: 'compact';
	  }
	// one sensor drawn as a line over time, a state timeline, a bar or a radial
	// gauge; math rewrites the value (x) before display
	| {
			id: string;
			type: 'chart';
			entity?: string;
			name?: string;
			style?: 'line' | 'history' | 'bar' | 'radial';
			period?: 'hour' | 'day' | 'week' | 'month';
			math?: string;
			stroke?: number;
	  }
	| { id: string; type: 'template'; template?: string }
	| { id: string; type: 'timer'; entity?: string; name?: string }
	| { id: string; type: 'notifications' }
	| { id: string; type: 'iframe'; url?: string; height?: number }
	| { id: string; type: 'fusion'; config?: Record<string, any>; height?: number };

// hidden below Hearth's mobile breakpoint, mirroring the original sidebar's hide_mobile
export type RailWidget = RailWidgetVariant & {
	hide_mobile?: boolean;
	visibility?: VisibilityCondition[];
};

type OverviewCardVariant =
	// the room-style page header as a plain card, usable on any dashboard
	| {
			id: string;
			type: 'header';
			title?: string;
			subtitle?: string;
			icon?: string;
			temp_entity?: string;
			humidity_entity?: string;
	  }
	// height fixes the card in px; without it the card fills its column
	| {
			id: string;
			type: 'temperature';
			label?: string;
			entity?: string;
			unit?: string;
			// climate entity that turns the card into a thermostat: target readout,
			// +/- controls and a dashed target line on the history chart
			climate_entity?: string;
			// same semantics as EntityRef.verdict, for the card's headline sensor
			verdict?: false | VerdictBands;
			height?: number;
	  }
	// shortcuts are one-tap Spotify URIs; default_device names the Connect
	// device they start on when nothing is playing yet
	| {
			id: string;
			type: 'media';
			entity?: string;
			height?: number;
			shortcuts?: MediaShortcut[];
			default_device?: string;
	  }
	// battery_entity and bin_entity add readings to the popover status line for
	// integrations that expose them as separate entities; battery falls back to
	// the vacuum's own battery_level attribute
	| {
			id: string;
			type: 'vacuum';
			entity?: string;
			modes?: VacuumModeRef[];
			battery_entity?: string;
			bin_entity?: string;
			// restores the one-tap Clean/Stop button next to the summary row
			quick_action?: boolean;
	  }
	// the general-purpose grid: any mix of domains, tiles adapt per domain
	// (lights dim on drag, covers show position). `stat` renders big sensor
	// readouts instead of tiles; `columns` fixes the column count.
	| {
			id: string;
			type: 'entities';
			title?: string;
			style?: 'tile' | 'stat';
			columns?: number;
			// a titled section counts by default; false opts out
			show_count?: boolean;
			// header verbs (All off / Open all / Close all) render automatically
			// for multi-light and multi-cover grids; false hides them
			group_actions?: boolean;
			// restores the per-tile controls glyph for surfaces where the
			// long-press gesture is unwanted
			tune_button?: boolean;
			vertical_padding?: 'compact';
			// every tile is a readout unless the entity overrides it; see
			// EntityRef.readonly
			readonly?: boolean;
			// default for draggable controls; individual entities may override it
			slider_updates?: SliderUpdateMode;
			/** `*` glob expanded against the live Home Assistant entity registry. */
			wildcard?: string;
			// collapses the grid into a single summary row; tapping it opens the
			// entities in a popover anchored to the row, so the layout never shifts
			collapsed?: boolean;
			// summary row icon, defaulting to the first entity's domain icon
			icon?: string;
			// summary row caption: the static text, else the state of summary_entity,
			// else a count of the entities that are on
			summary?: string;
			summary_entity?: string;
			entities: EntityRef[];
	  }
	| { id: string; type: 'camera'; entity?: string; title?: string; stream?: boolean }
	// integration-provided still images, including native Roborock floor maps
	| { id: string; type: 'image'; entity?: string; title?: string }
	| { id: string; type: 'climate'; entity?: string; title?: string }
	// `bar` renders the persistent scene row: equal-width tiles, active one lit
	| { id: string; type: 'scenes'; title?: string; style?: 'chips' | 'bar'; scenes: SceneRef[] }
	// a Konva canvas of images, icons and state badges (floor plans)
	| { id: string; type: 'picture'; title?: string; elements: unknown[]; height?: number }
	// days since an input_datetime was last reset, with a one-tap reset
	| { id: string; type: 'days_since'; entity?: string; title?: string; icon?: string }
	// the media card for whichever listed player is active; a paused player
	// keeps the card for timeout seconds before the next one takes over
	| {
			id: string;
			type: 'conditional_media';
			media_players: string[];
			timeout?: number;
			height?: number;
	  }
	| { id: string; type: 'fusion'; config?: Record<string, any>; height?: number };

/**
 * `fill` is a share of the leftover height in the card's column: 0 (or unset,
 * for most types) sizes to content, 1 takes one share, 2 takes twice as much as
 * a 1. Media and sensor cards fill by default, which is how they behaved before
 * the option existed. A fixed `height` wins over any weight.
 */
export type OverviewCard = OverviewCardVariant & {
	visibility?: VisibilityCondition[];
	fill?: number;
};

/**
 * A named horizontal or vertical layout container, parity with the original
 * dashboard's horizontal-stack/vertical-stack. One level deep only - a
 * stack's children are always plain cards, never another stack.
 */
export interface OverviewStack {
	id: string;
	kind: 'stack';
	title?: string;
	direction: 'horizontal' | 'vertical';
	// same share-of-leftover-height meaning as on a card
	fill?: number;
	cards: OverviewCard[];
}

/** Anything that can occupy a top-level slot in an overview column. */
export type OverviewItem = OverviewCard | OverviewStack;

export interface HearthConfig {
	theme?: HearthTheme;
	// full replacement for theme while day_night resolves to night
	theme_night?: HearthTheme;
	day_night?: DayNightSwitch;
	rail: RailWidget[];
	// every page, Home included; the first one is where the dashboard opens
	rooms: HearthRoom[];
	// display options for wall tablets; screensaver off when unset
	screensaver_minutes?: number;
	screensaver_drift?: boolean;
	/** Clock brightness from 10 to 100 percent. */
	screensaver_brightness?: number;
	keep_screen_on?: boolean;
	// extra edge padding in px, for kiosks whose frame covers screen edges
	padding_x?: number;
	padding_y?: number;
}
