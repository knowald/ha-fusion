import type { SliderUpdateMode } from '$lib/Types';
import type { VerdictBands } from '$lib/core/domains/sensor';
import type { DayNightSwitch, HearthTheme } from '$lib/core/theme';

export type { DayNightSwitch, HearthTheme, VerdictBands };

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

export interface EntityRef {
	entity: string;
	name?: string;
	icon?: string;
	// per-entity presentation; falls back to the card's style when unset
	display?: 'tile' | 'stat';
	// display-only tile, for entities whose integration exposes no working
	// toggle (a PlayStation media_player, a read-only sensor)
	readonly?: boolean;
	// overrides the containing entities card's slider update behavior
	slider_updates?: SliderUpdateMode;
	// stat readouts judge known air sensors by device_class; false suppresses
	// that, custom bands extend it to any ascending numeric sensor
	verdict?: false | VerdictBands;
}

export interface SceneRef extends EntityRef {
	// small caption under the name in the scene bar, replaced by "active" while
	// this scene is the active one
	caption?: string;
	// marks the scene active while this entity holds active_state ('on' when
	// omitted); without it activity comes from which listed scene was applied
	// most recently
	active_entity?: string;
	active_state?: string;
}

export interface VacuumModeRef extends EntityRef {
	// what the mode covers, so a one-tap run is safe to commit to without
	// opening the vacuum app first
	detail?: string;
	// expected run time, shown next to the detail
	duration?: string;
	// tags the mode as the recommended one. It stays the same size and costs
	// the same single tap as the rest; the tag is the only difference
	default?: boolean;
}

/**
 * Per-item visibility condition, mirroring the original's section conditions
 * but trimmed to the two cases Hearth's builder exposes. All conditions on an
 * item AND together.
 */
export type VisibilityCondition =
	{ entity: string; state?: string; state_not?: string } | { media: string };

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
	| { id: string; type: 'label'; text?: string }
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
	| { id: string; type: 'media'; entity?: string; height?: number }
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

export function isStack(item: OverviewItem): item is OverviewStack {
	return 'kind' in item && item.kind === 'stack';
}

/** Mutable list containing an id-addressed card or stack. */
export function findOverviewItemList(
	config: HearthConfig,
	id: string,
	roomId?: string
): OverviewItem[] | undefined {
	for (const room of config.rooms) {
		if (roomId && room.id !== roomId) continue;
		for (const column of room.cards) {
			if (column.some((item) => item.id === id)) return column;
			for (const item of column) {
				if (isStack(item) && item.cards.some((card) => card.id === id)) return item.cards;
			}
		}
	}
	return undefined;
}

export function findOverviewCard(
	config: HearthConfig,
	id: string,
	roomId?: string
): OverviewCard | undefined {
	const item = findOverviewItemList(config, id, roomId)?.find((entry) => entry.id === id);
	return item && !isStack(item) ? item : undefined;
}

/** Expands the same simple `*` glob used by Fusion's legacy entities object. */
export function wildcardEntityIds(pattern: string | undefined, entityIds: string[]): string[] {
	if (!pattern?.trim()) return [];
	const source = pattern
		.trim()
		.split('*')
		.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.join('.*');
	const regex = new RegExp(`^${source}$`);
	return entityIds.filter((entityId) => regex.test(entityId)).sort();
}

/** Card types that take a share of the leftover height unless told otherwise. */
const FILL_BY_DEFAULT = ['media', 'temperature'];

/**
 * How many shares of its column's leftover height an item takes. 0 means it
 * sizes to its content.
 */
export function fillWeight(item: OverviewItem): number {
	if (!isStack(item) && 'height' in item && item.height) return 0;
	if (typeof item.fill === 'number') return Math.max(0, item.fill);
	return !isStack(item) && FILL_BY_DEFAULT.includes(item.type) ? 1 : 0;
}

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

export interface HearthTypeDescriptor<T extends string> {
	value: T;
	label: string;
	name: string;
	sub: string;
	icon: string;
}

/** Single source of truth for rail validation and the add-widget gallery. */
export const RAIL_WIDGET_TYPES = [
	{ value: 'clock', label: 'Clock', name: 'Clock', sub: 'time + date', icon: 'schedule' },
	{
		value: 'weather',
		label: 'Weather',
		name: 'Weather',
		sub: 'current + forecast',
		icon: 'clear_day'
	},
	{
		value: 'nav',
		label: 'Page navigation',
		name: 'Page navigation',
		sub: 'room links',
		icon: 'home'
	},
	{
		value: 'search',
		label: 'Search',
		name: 'Search',
		sub: 'pages + entities',
		icon: 'search'
	},
	{ value: 'spacer', label: 'Spacer', name: 'Spacer', sub: 'flexible gap', icon: 'unfold_more' },
	{
		value: 'label',
		label: 'Section label',
		name: 'Section label',
		sub: 'small heading',
		icon: 'label'
	},
	{ value: 'energy', label: 'Energy today', name: 'Energy today', sub: 'kWh + cost', icon: 'bolt' },
	{
		value: 'progress',
		label: 'Progress (running activity)',
		name: 'Progress',
		sub: 'running activity',
		icon: 'progress_activity'
	},
	{
		value: 'calendar',
		label: 'Calendar (next event)',
		name: 'Calendar',
		sub: 'next event',
		icon: 'event'
	},
	{ value: 'status', label: 'Status pill', name: 'Status pill', sub: 'icon + text', icon: 'eco' },
	{
		value: 'entity',
		label: 'Entity',
		name: 'Entity',
		sub: 'value from an entity',
		icon: 'monitoring'
	},
	{
		value: 'fusion',
		label: 'Fusion widget (graph, bar, camera, ...)',
		name: 'Fusion widget',
		sub: 'graphs, cameras, more',
		icon: 'widgets'
	}
] satisfies HearthTypeDescriptor<RailWidget['type']>[];

/** Single source of truth for card validation and the add-card gallery. */
export const OVERVIEW_CARD_TYPES = [
	{
		value: 'entities',
		label: 'Entity grid',
		name: 'Entities',
		sub: 'tiles or readings',
		icon: 'grid_view'
	},
	{
		value: 'header',
		label: 'Header',
		name: 'Header',
		sub: 'title and room stats',
		icon: 'view_agenda'
	},
	{
		value: 'temperature',
		label: 'Sensor reading + sparkline',
		name: 'Sensor',
		sub: 'reading and history',
		icon: 'monitoring'
	},
	{ value: 'media', label: 'Media player', name: 'Media', sub: 'now playing', icon: 'music_note' },
	{ value: 'vacuum', label: 'Vacuum', name: 'Vacuum', sub: 'cleaning control', icon: 'robot_2' },
	{ value: 'camera', label: 'Camera', name: 'Camera', sub: 'live camera feed', icon: 'videocam' },
	{ value: 'image', label: 'Image', name: 'Image', sub: 'maps and still images', icon: 'image' },
	{
		value: 'climate',
		label: 'Climate (thermostat)',
		name: 'Climate',
		sub: 'thermostat control',
		icon: 'thermostat'
	},
	{
		value: 'scenes',
		label: 'Scenes (chips or bar)',
		name: 'Scenes',
		sub: 'scene shortcuts',
		icon: 'palette'
	},
	{
		value: 'fusion',
		label: 'Fusion object (template, picture elements, ...)',
		name: 'Fusion',
		sub: 'legacy objects',
		icon: 'widgets'
	}
] satisfies HearthTypeDescriptor<OverviewCard['type']>[];

const VALID_CARD_TYPES = new Set<string>(OVERVIEW_CARD_TYPES.map(({ value }) => value));
const VALID_RAIL_WIDGET_TYPES = new Set<string>(RAIL_WIDGET_TYPES.map(({ value }) => value));

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Reports structural problems that normalization would otherwise have to
 * discard or repair. The visual YAML editor uses this before Apply so a typo
 * cannot silently remove a card, widget or entity reference.
 */
export function hearthConfigIssues(raw: unknown): string[] {
	if (!isRecord(raw)) return ['Configuration must be a YAML mapping'];

	const issues: string[] = [];
	const widgetIds = new Map<string, string>();
	const itemIds = new Map<string, string>();
	const checkId = (value: unknown, path: string, seen: Map<string, string>) => {
		if (typeof value !== 'string' || !value.trim()) {
			issues.push(`${path}.id must be a non-empty string`);
			return;
		}
		const previous = seen.get(value);
		if (previous) issues.push(`${path}.id duplicates ${previous}`);
		else seen.set(value, `${path}.id`);
	};
	const checkRefs = (value: unknown, path: string) => {
		if (!Array.isArray(value)) {
			issues.push(`${path} must be a list`);
			return;
		}
		value.forEach((entry, index) => {
			if (!isRecord(entry) || typeof entry.entity !== 'string' || !entry.entity.trim()) {
				issues.push(`${path}[${index}].entity must be a non-empty string`);
			}
		});
	};
	const checkCard = (value: unknown, path: string, allowStack: boolean) => {
		if (!isRecord(value)) {
			issues.push(`${path} must be a card mapping`);
			return;
		}
		checkId(value.id, path, itemIds);
		if (value.kind === 'stack') {
			if (!allowStack) issues.push(`${path}: nested stacks are not supported`);
			if (!Array.isArray(value.cards)) issues.push(`${path}.cards must be a list`);
			else value.cards.forEach((card, index) => checkCard(card, `${path}.cards[${index}]`, false));
			return;
		}
		if (typeof value.type !== 'string' || !VALID_CARD_TYPES.has(value.type)) {
			issues.push(`${path}.type is not a supported card type`);
			return;
		}
		if (value.type === 'entities') checkRefs(value.entities, `${path}.entities`);
		if (value.type === 'scenes') checkRefs(value.scenes, `${path}.scenes`);
		if (value.type === 'vacuum' && value.modes !== undefined) {
			checkRefs(value.modes, `${path}.modes`);
		}
	};

	if (!Array.isArray(raw.rail)) issues.push('rail must be a list');
	else {
		raw.rail.forEach((widget, index) => {
			const path = `rail[${index}]`;
			if (!isRecord(widget)) {
				issues.push(`${path} must be a widget mapping`);
				return;
			}
			checkId(widget.id, path, widgetIds);
			if (typeof widget.type !== 'string' || !VALID_RAIL_WIDGET_TYPES.has(widget.type)) {
				issues.push(`${path}.type is not a supported widget type`);
			}
		});
	}

	if (!Array.isArray(raw.rooms)) issues.push('rooms must be a list');
	else {
		const roomIds = new Map<string, string>();
		raw.rooms.forEach((room, roomIndex) => {
			const path = `rooms[${roomIndex}]`;
			if (!isRecord(room)) {
				issues.push(`${path} must be a page mapping`);
				return;
			}
			checkId(room.id, path, roomIds);
			if (!Array.isArray(room.cards)) {
				issues.push(`${path}.cards must be a list of columns`);
				return;
			}
			room.cards.forEach((column, columnIndex) => {
				const columnPath = `${path}.cards[${columnIndex}]`;
				if (!Array.isArray(column)) {
					issues.push(`${columnPath} must be a card list`);
					return;
				}
				column.forEach((card, cardIndex) => checkCard(card, `${columnPath}[${cardIndex}]`, true));
			});
		});
	}

	return issues;
}

/** Original main object types embeddable through the fusion card. */
export const FUSION_OBJECT_TYPES: { value: string; label: string }[] = [
	{ value: 'button', label: 'Button' },
	{ value: 'entities', label: 'Entities list' },
	{ value: 'camera', label: 'Camera' },
	{ value: 'picture_elements', label: 'Picture elements' },
	{ value: 'conditional_media', label: 'Conditional media' },
	{ value: 'days_since', label: 'Days since' },
	{ value: 'spotify_player', label: 'Spotify player' },
	{ value: 'spotify_player_large', label: 'Spotify player (large)' },
	{ value: 'empty', label: 'Empty spacer' }
];

/** Original sidebar widget types embeddable through the fusion rail widget. */
export const FUSION_WIDGET_TYPES: { value: string; label: string }[] = [
	{ value: 'sensor', label: 'Sensor' },
	{ value: 'template', label: 'Template' },
	{ value: 'graph', label: 'Graph' },
	{ value: 'bar', label: 'Bar' },
	{ value: 'radial', label: 'Radial' },
	{ value: 'history', label: 'History' },
	{ value: 'camera', label: 'Camera' },
	{ value: 'image', label: 'Image' },
	{ value: 'iframe', label: 'Iframe' },
	{ value: 'time', label: 'Time' },
	{ value: 'date', label: 'Date' },
	{ value: 'timer', label: 'Timer' },
	{ value: 'weather', label: 'Weather (compact)' },
	{ value: 'weather_forecast', label: 'Weather forecast' },
	{ value: 'notifications', label: 'Notifications' },
	{ value: 'divider', label: 'Divider' }
];

export const DEFAULT_HEARTH_CONFIG: HearthConfig = {
	// sun.sun is part of a standard Home Assistant installation; without a
	// configured night theme this switch is inert.
	day_night: { entity: 'sun.sun' },
	rail: [
		{ id: 'clock', type: 'clock' },
		{ id: 'nav', type: 'nav' },
		{ id: 'spacer', type: 'spacer' }
	],
	rooms: [
		{
			id: 'home',
			name: 'Home',
			icon: 'home',
			hide_header: true,
			cards: [[]]
		}
	]
};

function normalizeVisibilityCondition(raw: any): VisibilityCondition | null {
	if (!raw || typeof raw !== 'object') return null;
	if (typeof raw.media === 'string' && raw.media.trim()) {
		return { media: raw.media };
	}
	if (typeof raw.entity === 'string' && raw.entity.trim()) {
		const condition: VisibilityCondition = { entity: raw.entity };
		if (typeof raw.state === 'string' && raw.state !== '') condition.state = raw.state;
		if (typeof raw.state_not === 'string' && raw.state_not !== '')
			condition.state_not = raw.state_not;
		return condition;
	}
	return null;
}

/** Drops the field entirely rather than keeping an empty array. */
export function normalizeVisibility(raw: unknown): VisibilityCondition[] | undefined {
	if (!Array.isArray(raw)) return undefined;
	const conditions = raw
		.map(normalizeVisibilityCondition)
		.filter((condition): condition is VisibilityCondition => condition !== null);
	return conditions.length ? conditions : undefined;
}

/**
 * v2 kept named light and blind registries at the top level, referenced by id
 * from each room. Both are gone - a tile is an entity reference like any other -
 * but migration still needs them to resolve those ids.
 */
interface LegacyRegistries {
	lights: { id: string; name: string; entity: string }[];
	blinds: { id: string; name: string; entity: string }[];
}

function registryEntityRefs(registry: { entity: string; name: string }[]): EntityRef[] {
	return registry.map(({ entity, name }) => ({ entity, name }));
}

/**
 * Converts the retired single-purpose card types (lights grid, blinds grid,
 * air quality) into equivalent entity-grid cards. The grids mirrored the
 * top-level lights/blinds registries, so their entities come from there.
 */
function migrateLegacyCard(card: any, registries: LegacyRegistries): any {
	if (card?.type === 'lights') {
		return {
			id: card.id,
			type: 'entities',
			title: card.title ?? 'Lights',
			show_count: true,
			entities: registryEntityRefs(registries.lights),
			visibility: card.visibility
		};
	}
	if (card?.type === 'blinds') {
		return {
			id: card.id,
			type: 'entities',
			title: card.title ?? 'Blinds',
			entities: registryEntityRefs(registries.blinds),
			visibility: card.visibility
		};
	}
	if (card?.type === 'air') {
		return {
			id: card.id,
			type: 'entities',
			title: card.title ?? 'Air',
			entities: [
				...(card.pm25_entity
					? [{ entity: card.pm25_entity, name: 'Home PM2.5', display: 'stat' }]
					: []),
				...(card.humidity_entity
					? [{ entity: card.humidity_entity, name: 'Humidity', display: 'stat' }]
					: []),
				...(Array.isArray(card.filters) ? card.filters : [])
					.filter((filter: any) => typeof filter?.entity === 'string')
					.map((filter: any) => ({ entity: filter.entity, name: filter.label, icon: 'mode_fan' }))
			],
			visibility: card.visibility
		};
	}
	return card;
}

/** A fill weight; anything unusable means "use the type's default". */
function normalizeFill(raw: unknown): number | undefined {
	return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0
		? Math.min(12, Math.round(raw * 10) / 10)
		: undefined;
}

/** A card or widget height in px; anything unusable means "size to content". */
function normalizeHeight(raw: unknown): number | undefined {
	return typeof raw === 'number' && Number.isFinite(raw) && raw >= 40 ? Math.round(raw) : undefined;
}

function normalizeVerdict(raw: unknown): false | VerdictBands | undefined {
	if (raw === false) return false;
	if (
		isRecord(raw) &&
		typeof raw.good === 'number' &&
		typeof raw.fair === 'number' &&
		raw.good < raw.fair
	) {
		return {
			good: raw.good,
			fair: raw.fair,
			max: typeof raw.max === 'number' && raw.max > raw.fair ? raw.max : undefined
		};
	}
	return undefined;
}

function normalizeEntityRef(raw: any): EntityRef | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const entity = trimmedOrUndefined(raw.entity);
	if (!entity) return null;
	return {
		...raw,
		entity,
		name: trimmedOrUndefined(raw.name),
		icon: trimmedOrUndefined(raw.icon),
		display: raw?.display === 'stat' || raw?.display === 'tile' ? raw.display : undefined,
		// kept as a tri-state: an explicit false opts one entity out of a
		// card-wide `readonly`
		readonly: typeof raw?.readonly === 'boolean' ? raw.readonly : undefined,
		slider_updates:
			raw?.slider_updates === 'release' || raw?.slider_updates === 'continuous'
				? raw.slider_updates
				: undefined,
		verdict: normalizeVerdict(raw?.verdict)
	};
}

function trimmedOrUndefined(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeSceneRef(raw: any): SceneRef | null {
	const entity = normalizeEntityRef(raw);
	if (!entity) return null;
	// YAML resolves `active_state: on` to a boolean and `active_state: 22` to a
	// number; both are legal HA states once stringified
	const activeState =
		typeof raw?.active_state === 'boolean' || typeof raw?.active_state === 'number'
			? String(raw.active_state)
			: raw?.active_state;
	return {
		...entity,
		caption: trimmedOrUndefined(raw?.caption),
		active_entity: trimmedOrUndefined(raw?.active_entity),
		// an empty state is meaningless, but a whitespace one is a legal HA state
		active_state: typeof activeState === 'string' && activeState !== '' ? activeState : undefined
	};
}

function normalizeVacuumModeRef(raw: any): VacuumModeRef | null {
	const entity = normalizeEntityRef(raw);
	if (!entity) return null;
	// YAML resolves `duration: 48` to a number, which is still a usable caption
	const duration = typeof raw?.duration === 'number' ? String(raw.duration) : raw?.duration;
	return {
		...entity,
		detail: trimmedOrUndefined(raw?.detail),
		duration: trimmedOrUndefined(duration),
		default: raw?.default === true ? true : undefined
	};
}

function reserveId(raw: unknown, fallback: string, taken: string[]): string {
	const id = uniqueId(trimmedOrUndefined(raw) ?? fallback, taken);
	taken.push(id);
	return id;
}

function normalizeCard(
	raw: any,
	fallbackId: string,
	registries: LegacyRegistries,
	taken: string[]
): OverviewCard {
	const card = migrateLegacyCard(raw, registries);
	const id = reserveId(card.id, fallbackId, taken);
	return {
		...card,
		id,
		...(card.type === 'entities'
			? {
					entities: (Array.isArray(card.entities) ? card.entities : [])
						.map(normalizeEntityRef)
						.filter((ref: EntityRef | null): ref is EntityRef => ref !== null),
					style: card.style === 'stat' ? 'stat' : undefined,
					columns:
						typeof card.columns === 'number' && card.columns >= 1
							? Math.floor(card.columns)
							: undefined,
					// tri-state: a titled section counts by default, false opts out
					show_count: typeof card.show_count === 'boolean' ? card.show_count : undefined,
					group_actions: card.group_actions === false ? false : undefined,
					tune_button: card.tune_button === true ? true : undefined,
					vertical_padding: card.vertical_padding === 'compact' ? 'compact' : undefined,
					readonly: card.readonly === true ? true : undefined,
					wildcard: trimmedOrUndefined(card.wildcard),
					slider_updates:
						card.slider_updates === 'release' || card.slider_updates === 'continuous'
							? card.slider_updates
							: undefined,
					collapsed: card.collapsed === true ? true : undefined,
					icon: trimmedOrUndefined(card.icon),
					summary: trimmedOrUndefined(card.summary),
					summary_entity: trimmedOrUndefined(card.summary_entity)
				}
			: {}),
		...(card.type === 'temperature' || card.type === 'media' || card.type === 'fusion'
			? { height: normalizeHeight(card.height) }
			: {}),
		...(card.type === 'temperature'
			? {
					climate_entity: trimmedOrUndefined(card.climate_entity),
					verdict: normalizeVerdict(card.verdict)
				}
			: {}),
		...(card.type === 'scenes'
			? {
					style: card.style === 'bar' ? 'bar' : undefined,
					scenes: (Array.isArray(card.scenes) ? card.scenes : [])
						.map(normalizeSceneRef)
						.filter((ref: SceneRef | null): ref is SceneRef => ref !== null)
				}
			: {}),
		...(card.type === 'vacuum'
			? {
					modes: (Array.isArray(card.modes) ? card.modes : [])
						.map(normalizeVacuumModeRef)
						.filter((ref: VacuumModeRef | null): ref is VacuumModeRef => ref !== null),
					battery_entity: trimmedOrUndefined(card.battery_entity),
					bin_entity: trimmedOrUndefined(card.bin_entity),
					quick_action: card.quick_action === true ? true : undefined
				}
			: {}),
		fill: normalizeFill(card.fill),
		visibility: normalizeVisibility(card.visibility)
	};
}

function normalizeStack(
	raw: any,
	fallbackId: string,
	registries: LegacyRegistries,
	taken: string[]
): OverviewStack {
	const id = reserveId(raw.id, fallbackId, taken);
	const direction: OverviewStack['direction'] =
		raw.direction === 'vertical' ? 'vertical' : 'horizontal';
	const title = typeof raw.title === 'string' ? raw.title.trim() : '';
	const cards = (Array.isArray(raw.cards) ? raw.cards : [])
		// children may be any non-stack card - nesting stops here
		.filter(
			(child: any) =>
				child &&
				typeof child === 'object' &&
				!Array.isArray(child) &&
				child.kind !== 'stack' &&
				VALID_CARD_TYPES.has(child.type)
		)
		.map((child: any, index: number) =>
			normalizeCard(child, `${id}-card-${index}`, registries, taken)
		);
	return {
		...raw,
		id,
		kind: 'stack',
		direction,
		cards,
		fill: normalizeFill(raw.fill),
		...(title ? { title } : {})
	};
}

function normalizeOverviewItem(
	raw: any,
	fallbackId: string,
	registries: LegacyRegistries,
	taken: string[]
): OverviewItem {
	return raw?.kind === 'stack'
		? normalizeStack(raw, fallbackId, registries, taken)
		: normalizeCard(raw, fallbackId, registries, taken);
}

/**
 * Reshapes card columns to `count`: overflow columns merge into the last kept
 * one, missing columns are added empty. Cards are never dropped.
 */
export function resizeCardColumns(columns: OverviewItem[][], count: number): OverviewItem[][] {
	const next: OverviewItem[][] = Array.from({ length: count }, (_, index) => [
		...(columns[index] ?? [])
	]);
	for (const overflow of columns.slice(count)) next[count - 1].push(...overflow);
	return next;
}

/** Initializes a page's card columns (matching its column count) on first use. */
export function ensureRoomCardColumns(room: HearthRoom): OverviewItem[][] {
	if (!room.cards?.length) {
		room.cards = Array.from({ length: room.columns ?? 1 }, (): OverviewItem[] => []);
	}
	return room.cards;
}

/**
 * Room cards were a flat list before card columns; a flat list becomes a
 * single column. When the room fixes its column count the card columns are
 * resized to match.
 */
function normalizeRoomCards(
	room: any,
	roomId: string,
	columns: number | undefined,
	registries: LegacyRegistries,
	taken: string[]
): OverviewItem[][] {
	const raw = Array.isArray(room.cards) ? room.cards : [];
	// a list of cards rather than a list of columns: everything in one column.
	// Distinguished from a column list with a junk entry (a blank YAML sequence
	// item) by requiring every entry to be a non-column, since one bad entry must
	// not collapse the real columns around it.
	const flat = raw.length > 0 && raw.every((entry: any) => !Array.isArray(entry));
	const rawColumns: any[][] = flat
		? [raw]
		: raw.map((column: any) => (Array.isArray(column) ? column : []));
	const cards = rawColumns.map((column, columnIndex) =>
		column
			// blank YAML entries and scalars are not cards; dropping them keeps the
			// surrounding column intact instead of throwing on the way in
			.filter(
				(item: any) =>
					item &&
					typeof item === 'object' &&
					!Array.isArray(item) &&
					(item.kind === 'stack' || VALID_CARD_TYPES.has(migrateLegacyCard(item, registries)?.type))
			)
			.map((item: any, index: number) =>
				normalizeOverviewItem(item, `card-${roomId}-${columnIndex}-${index}`, registries, taken)
			)
	);
	return columns !== undefined && cards.length !== columns
		? resizeCardColumns(cards, columns)
		: cards;
}

/** v2 device entries carried their own shape; only the entity fields survive. */
function deviceEntityRef(device: any): EntityRef | null {
	if (typeof device?.entity !== 'string' || !device.entity.trim()) return null;
	return {
		entity: device.entity,
		name: trimmedOrUndefined(device.name),
		icon: trimmedOrUndefined(device.icon),
		readonly: device.readonly === true ? true : undefined
	};
}

function registryRefs(ids: unknown, registry: LegacyRegistries['lights']): EntityRef[] {
	return (Array.isArray(ids) ? ids : [])
		.map((id) => registry.find((entry) => entry.id === id))
		.filter((entry): entry is LegacyRegistries['lights'][number] => entry !== undefined)
		.map((entry) => ({ entity: entry.entity, name: entry.name }));
}

/**
 * v2 rooms rendered lighting and device grids outside the card layout, so those
 * two groups could not be moved, retitled or removed. They become ordinary
 * entity-grid cards at the top of the page: lighting in the first column,
 * devices in the second when the page has one.
 */
function migrateRoomGrids(
	room: any,
	roomId: string,
	columns: OverviewItem[][],
	registries: LegacyRegistries,
	taken: string[]
): OverviewItem[][] {
	// a half-migrated config (v3 cards kept alongside the v2 grid fields) must
	// not gain a second copy of either card
	const migrated = new Set(
		columns.flat().flatMap((item) => (isStack(item) ? item.cards.map((card) => card.id) : item.id))
	);
	const lighting = migrated.has(`${roomId}-lighting`)
		? []
		: registryRefs(room.lights, registries.lights);
	const devices = migrated.has(`${roomId}-devices`)
		? []
		: [
				...registryRefs(room.blinds, registries.blinds),
				...(Array.isArray(room.devices) ? room.devices : [])
					.map(deviceEntityRef)
					.filter((ref: EntityRef | null): ref is EntityRef => ref !== null)
			];
	if (!lighting.length && !devices.length) return columns;

	const next = columns.length ? columns : [[]];
	const lightingCard: OverviewCard = {
		id: lighting.length ? reserveId(`${roomId}-lighting`, `${roomId}-lighting`, taken) : '',
		type: 'entities',
		title: 'Lighting',
		show_count: true,
		entities: lighting
	};
	const devicesCard: OverviewCard = {
		id: devices.length ? reserveId(`${roomId}-devices`, `${roomId}-devices`, taken) : '',
		type: 'entities',
		title: 'Devices',
		entities: devices
	};
	// side by side when the page has room for both and both exist; otherwise
	// stacked in the first column, so no column is left empty
	if (next.length > 1 && lighting.length && devices.length) {
		next[0] = [lightingCard, ...next[0]];
		next[1] = [devicesCard, ...next[1]];
	} else {
		next[0] = [
			...(lighting.length ? [lightingCard] : []),
			...(devices.length ? [devicesCard] : []),
			...next[0]
		];
	}
	return next;
}

/**
 * `taken` collects the ids already handed out and is mutated here: two pages
 * sharing an id would make every id-keyed lookup (nav, drag, editor targets)
 * ambiguous, and their migrated card ids would collide too.
 */
function normalizeRoom(
	raw: any,
	index: number,
	registries: LegacyRegistries,
	taken: string[],
	takenItems: string[]
): HearthRoom {
	const id = uniqueId(trimmedOrUndefined(raw?.id) ?? `page-${index + 1}`, taken);
	taken.push(id);
	const columns =
		typeof raw?.columns === 'number' && raw.columns >= 1 && raw.columns <= 3
			? Math.floor(raw.columns)
			: undefined;
	return {
		...raw,
		id,
		name: trimmedOrUndefined(raw?.name) ?? id,
		icon: trimmedOrUndefined(raw?.icon) ?? 'meeting_room',
		summary: trimmedOrUndefined(raw?.summary),
		temp_entity: trimmedOrUndefined(raw?.temp_entity),
		humidity_entity: trimmedOrUndefined(raw?.humidity_entity),
		hide_header: raw?.hide_header === true ? true : undefined,
		fill_screen: raw?.fill_screen === true ? true : undefined,
		columns,
		cards: migrateRoomGrids(
			raw,
			id,
			normalizeRoomCards(raw, id, columns, registries, takenItems),
			registries,
			takenItems
		)
	};
}

/**
 * Accepts current config files, the v2 shape (a separate `overview` for Home
 * plus light/blind registries), the pre-card v1 shape (flat entity fields), and
 * garbage. Anything unusable falls back to defaults.
 */
export function normalizeHearthConfig(raw: unknown): HearthConfig {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Object.keys(raw).length) {
		return structuredClone(DEFAULT_HEARTH_CONFIG);
	}
	const config = raw as Record<string, any>;
	const defaults = structuredClone(DEFAULT_HEARTH_CONFIG);

	const registries: LegacyRegistries = {
		lights: Array.isArray(config.lights) ? config.lights : [],
		blinds: Array.isArray(config.blinds) ? config.blinds : []
	};

	const takenRoomIds: string[] = [];
	const takenItemIds: string[] = [];
	const rooms: HearthRoom[] = (Array.isArray(config.rooms) ? config.rooms : []).map(
		(room: any, index: number) => normalizeRoom(room, index, registries, takenRoomIds, takenItemIds)
	);

	// v2 stored the home page separately in `overview`; it becomes the first
	// ordinary page. Its id is uniquified like any other, so a config that
	// already has its own page called `home` keeps both pages rather than losing
	// the overview.
	if (Array.isArray(config.overview)) {
		rooms.unshift(
			normalizeRoom(
				{
					id: 'home',
					name: 'Home',
					icon: 'home',
					hide_header: true,
					// only fix the column count while it is a supported one; a wider
					// overview keeps its columns instead of being merged down
					columns: config.overview.length <= 3 ? Math.max(1, config.overview.length) : undefined,
					cards: config.overview
				},
				0,
				registries,
				takenRoomIds,
				takenItemIds
			)
		);
	}

	let rail: RailWidget[];

	if (Array.isArray(config.rail)) {
		rail = config.rail;
	} else {
		// v1 migration: distribute the old flat entity fields into the default
		// rail widgets and home page cards
		rail = defaults.rail;
		for (const widget of rail) {
			if (widget.type === 'clock' && config.city) widget.city = config.city;
			if (widget.type === 'weather' && config.weather_entity) widget.entity = config.weather_entity;
		}
		// v1 had no pages at all; the default home page carries its entity fields
		if (!rooms.length) {
			rooms.push(
				...defaults.rooms
					.filter((room) => room.id === 'home')
					.map((room) => ({ ...room, id: uniqueId(room.id, takenRoomIds) }))
			);
		}
		for (const card of rooms[0].cards.flat()) {
			if (isStack(card)) continue;
			if (card.type === 'temperature' && config.average_temperature_entity) {
				card.entity = config.average_temperature_entity;
			}
			if (card.type === 'entities' && card.id === 'lights' && registries.lights.length) {
				card.entities = registryEntityRefs(registries.lights);
			}
			if (card.type === 'entities' && card.id === 'blinds' && registries.blinds.length) {
				card.entities = registryEntityRefs(registries.blinds);
			}
			if (card.type === 'entities' && card.id === 'air') {
				const refs: EntityRef[] = [
					...(config.pm25_entity
						? [{ entity: config.pm25_entity, name: 'Home PM2.5', display: 'stat' as const }]
						: []),
					...(config.humidity_entity
						? [{ entity: config.humidity_entity, name: 'Humidity', display: 'stat' as const }]
						: []),
					...(Array.isArray(config.filters) ? config.filters : [])
						.filter((filter: any) => typeof filter?.entity === 'string')
						.map((filter: any) => ({ entity: filter.entity, name: filter.label, icon: 'mode_fan' }))
				];
				if (refs.length) card.entities = refs;
			}
			if (card.type === 'media' && config.media_entity) card.entity = config.media_entity;
			if (card.type === 'vacuum' && config.vacuum_entity) card.entity = config.vacuum_entity;
		}
	}

	// there is always something to render: an empty config gets the default home
	if (!rooms.length) rooms.push(...defaults.rooms.filter((room) => room.id === 'home'));

	const dayNight =
		config.day_night && typeof config.day_night === 'object' && config.day_night.entity
			? {
					entity: String(config.day_night.entity),
					...(config.day_night.night_state
						? { night_state: String(config.day_night.night_state) }
						: {})
				}
			: defaults.day_night;

	const takenWidgetIds: string[] = [];
	const normalizedRail = rail
		.filter(
			(widget) => widget && typeof widget === 'object' && VALID_RAIL_WIDGET_TYPES.has(widget.type)
		)
		.map((widget, index) => ({
			...widget,
			id: reserveId(widget.id, `widget-${index}`, takenWidgetIds),
			...(widget.type === 'calendar'
				? {
						entities: (Array.isArray(widget.entities) ? widget.entities : []).filter(
							(entry: unknown): entry is string => typeof entry === 'string'
						)
					}
				: {}),
			...(widget.type === 'progress'
				? {
						active_states: Array.isArray(widget.active_states)
							? widget.active_states.filter(
									(entry: unknown): entry is string => typeof entry === 'string'
								)
							: undefined,
						completed_states: Array.isArray(widget.completed_states)
							? widget.completed_states.filter(
									(entry: unknown): entry is string => typeof entry === 'string'
								)
							: undefined,
						completion_delay_minutes:
							typeof widget.completion_delay_minutes === 'number' &&
							Number.isFinite(widget.completion_delay_minutes) &&
							widget.completion_delay_minutes >= -1
								? widget.completion_delay_minutes
								: undefined
					}
				: {}),
			...(widget.type === 'entity'
				? {
						vertical_padding:
							widget.vertical_padding === 'compact' ? ('compact' as const) : undefined
					}
				: {}),
			...(widget.type === 'fusion' ? { height: normalizeHeight(widget.height) } : {}),
			hide_mobile: widget.hide_mobile === true ? true : undefined,
			visibility: normalizeVisibility(widget.visibility)
		}));

	const extensions = { ...config };
	for (const key of [
		'theme',
		'theme_night',
		'day_night',
		'rail',
		'rooms',
		'screensaver_minutes',
		'screensaver_drift',
		'screensaver_brightness',
		'keep_screen_on',
		'padding_x',
		'padding_y',
		// recognized legacy migration keys are consumed, not extensions
		'lights',
		'blinds',
		'overview',
		'city',
		'weather_entity',
		'average_temperature_entity',
		'pm25_entity',
		'humidity_entity',
		'filters',
		'media_entity',
		'vacuum_entity'
	]) {
		delete extensions[key];
	}

	return {
		...extensions,
		theme: config.theme && typeof config.theme === 'object' ? config.theme : undefined,
		theme_night:
			config.theme_night && typeof config.theme_night === 'object' ? config.theme_night : undefined,
		day_night: dayNight,
		rail: normalizedRail,
		rooms,
		screensaver_minutes:
			typeof config.screensaver_minutes === 'number' ? config.screensaver_minutes : undefined,
		screensaver_drift: config.screensaver_drift === true ? true : undefined,
		screensaver_brightness:
			typeof config.screensaver_brightness === 'number' &&
			Number.isFinite(config.screensaver_brightness)
				? Math.min(100, Math.max(10, Math.round(config.screensaver_brightness)))
				: undefined,
		keep_screen_on: typeof config.keep_screen_on === 'boolean' ? config.keep_screen_on : undefined,
		padding_x: typeof config.padding_x === 'number' ? config.padding_x : undefined,
		padding_y: typeof config.padding_y === 'number' ? config.padding_y : undefined
	};
}

const DOMAIN_ICONS: Record<string, string> = {
	light: 'lightbulb',
	switch: 'toggle_on',
	input_boolean: 'toggle_on',
	sensor: 'monitoring',
	binary_sensor: 'radio_button_checked',
	media_player: 'play_circle',
	climate: 'thermostat',
	cover: 'blinds',
	fan: 'mode_fan',
	lock: 'lock',
	camera: 'videocam',
	image: 'image',
	vacuum: 'robot_2',
	scene: 'palette',
	script: 'description',
	automation: 'smart_toy',
	alarm_control_panel: 'shield',
	person: 'person',
	device_tracker: 'near_me',
	weather: 'partly_cloudy_day',
	timer: 'timer',
	calendar: 'calendar_month',
	humidifier: 'humidity_mid',
	water_heater: 'water_heater',
	valve: 'valve',
	button: 'radio_button_checked',
	input_button: 'radio_button_checked',
	update: 'system_update_alt',
	todo: 'checklist',
	counter: 'pin',
	group: 'category',
	remote: 'settings_remote',
	siren: 'notifications_active',
	lawn_mower: 'grass'
};

/** Material Symbols fallback icon for an entity's domain. */
export function domainIcon(entityId?: string): string {
	const domain = entityId?.split('.')[0] ?? '';
	return DOMAIN_ICONS[domain] ?? 'category';
}

export function slugify(name: string) {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '') || 'item'
	);
}

/** Uppercases the first letter, e.g. for lowercase translation values. */
export function capitalize(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function uniqueId(base: string, taken: string[]) {
	let id = base;
	let counter = 2;
	while (taken.includes(id)) id = `${base}-${counter++}`;
	return id;
}

function overviewItemIds(item: OverviewItem): string[] {
	return isStack(item) ? [item.id, ...item.cards.flatMap(overviewItemIds)] : [item.id];
}

/** Every card id on every page, for generating a fresh unique one. */
export function takenCardIds(config: HearthConfig): string[] {
	return config.rooms.flatMap((room) => (room.cards ?? []).flat().flatMap(overviewItemIds));
}

export function overviewItemTypeKey(item: OverviewItem): string {
	return isStack(item) ? 'stack' : item.type;
}

/**
 * Deep clone with a fresh id for the item and, if it's a stack, every child -
 * so an Alt-drag duplicate never collides with an existing id anywhere in the
 * config. Mutates `taken` as it goes so nested clones stay unique against
 * each other too.
 */
export function cloneOverviewItem<T extends OverviewItem>(item: T, taken: string[]): T {
	const cloned = structuredClone(item);
	const assignIds = (node: OverviewItem) => {
		node.id = uniqueId(slugify(overviewItemTypeKey(node)), taken);
		taken.push(node.id);
		if (isStack(node)) node.cards.forEach(assignIds);
	};
	assignIds(cloned);
	return cloned;
}

export function moveItem<T>(list: T[], index: number, delta: number) {
	const target = index + delta;
	if (index < 0 || target < 0 || target >= list.length) return;
	const [item] = list.splice(index, 1);
	list.splice(target, 0, item);
}

export const PRESS_RIPPLE = {
	color: 'rgb(var(--h-line-rgb) / calc(0.12 * var(--h-line-scale)))'
};
