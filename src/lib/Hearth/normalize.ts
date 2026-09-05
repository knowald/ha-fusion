import type {
	EntityRef,
	HearthConfig,
	HearthRoom,
	OverviewCard,
	OverviewItem,
	OverviewStack,
	RailWidget
} from './types';
import {
	DEFAULT_HEARTH_CONFIG,
	isStack,
	normalizeVisibility,
	resizeCardColumns,
	uniqueId
} from './config';
import {
	isRecord,
	normalizeFill,
	normalizeHeight,
	reserveId,
	trimmedOrUndefined
} from './normalizers';
import { CARD_TYPES, cardDescriptor } from './cards';
import { RAIL_WIDGET_TYPES, widgetDescriptor } from './widgets';

/*
 * Turns whatever is in hearth.yaml into a HearthConfig: current files, the
 * older shapes, and garbage. Per-type field rules come from the card and
 * widget descriptors, so a new type never needs a branch here.
 */

const VALID_CARD_TYPES = new Set<string>(CARD_TYPES.map(({ type }) => type));
const VALID_RAIL_WIDGET_TYPES = new Set<string>(RAIL_WIDGET_TYPES.map(({ type }) => type));

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
		issues.push(...(cardDescriptor(value.type)?.issues?.(value, path) ?? []));
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

function normalizeCard(
	raw: any,
	fallbackId: string,
	registries: LegacyRegistries,
	taken: string[]
): OverviewCard {
	const card = migrateLegacyCard(raw, registries);
	const id = reserveId(card.id, fallbackId, taken);
	const descriptor = cardDescriptor(card.type);
	return {
		...card,
		id,
		...(descriptor?.normalize?.(card) ?? {}),
		...(descriptor?.sizable ? { height: normalizeHeight(card.height) } : {}),
		fill: normalizeFill(card.fill),
		visibility: normalizeVisibility(card.visibility)
	} as OverviewCard;
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
			...(widgetDescriptor(widget.type)?.normalize?.(widget) ?? {}),
			hide_mobile: widget.hide_mobile === true ? true : undefined,
			visibility: normalizeVisibility(widget.visibility)
		})) as RailWidget[];

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
