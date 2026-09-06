import type {
	HearthConfig,
	HearthRoom,
	OverviewCard,
	OverviewItem,
	OverviewStack,
	RailWidget
} from './types';
import { DEFAULT_HEARTH_CONFIG, normalizeVisibility, resizeCardColumns, uniqueId } from './config';
import {
	isRecord,
	normalizeFill,
	normalizeHeight,
	reserveId,
	trimmedOrUndefined,
	normalizeWholeNumber
} from './normalizers';
import { CARD_TYPES, cardDescriptor } from './cards';
import { migrateHearthConfig } from './migrate';
import * as v from 'valibot';
import { issueLines } from './schema';
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
		const schema = cardDescriptor(value.type)?.schema;
		if (schema) {
			const parsed = v.safeParse(schema, value);
			if (!parsed.success) issues.push(...issueLines(parsed.issues, path));
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
				return;
			}
			const schema = widgetDescriptor(widget.type)?.schema;
			if (schema) {
				const parsed = v.safeParse(schema, widget);
				if (!parsed.success) issues.push(...issueLines(parsed.issues, path));
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

function normalizeCard(raw: any, fallbackId: string, taken: string[]): OverviewCard {
	const id = reserveId(raw.id, fallbackId, taken);
	const descriptor = cardDescriptor(raw.type);
	return {
		...raw,
		id,
		...(descriptor?.normalize?.(raw) ?? {}),
		...(descriptor?.sizable ? { height: normalizeHeight(raw.height) } : {}),
		fill: normalizeFill(raw.fill),
		visibility: normalizeVisibility(raw.visibility)
	} as OverviewCard;
}

function normalizeStack(raw: any, fallbackId: string, taken: string[]): OverviewStack {
	const id = reserveId(raw.id, fallbackId, taken);
	const direction: OverviewStack['direction'] =
		raw.direction === 'vertical' ? 'vertical' : 'horizontal';
	const title = typeof raw.title === 'string' ? raw.title.trim() : '';
	const cards = (Array.isArray(raw.cards) ? raw.cards : [])
		// children may be any non-stack card - nesting stops here
		.filter(
			(child: any) =>
				isRecord(child) && child.kind !== 'stack' && VALID_CARD_TYPES.has(child.type as string)
		)
		.map((child: any, index: number) => normalizeCard(child, `${id}-card-${index}`, taken));
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

function normalizeOverviewItem(raw: any, fallbackId: string, taken: string[]): OverviewItem {
	return raw?.kind === 'stack'
		? normalizeStack(raw, fallbackId, taken)
		: normalizeCard(raw, fallbackId, taken);
}

/**
 * Card columns; when the room fixes its column count the columns are resized
 * to match. Blank YAML entries and scalars are not cards and are dropped, so
 * one bad entry never collapses the column around it.
 */
function normalizeRoomCards(
	room: any,
	roomId: string,
	columns: number | undefined,
	taken: string[]
): OverviewItem[][] {
	const raw = Array.isArray(room.cards) ? room.cards : [];
	const cards = raw.map((column: unknown, columnIndex: number) =>
		(Array.isArray(column) ? column : [])
			.filter(
				(item: any) =>
					isRecord(item) && (item.kind === 'stack' || VALID_CARD_TYPES.has(item.type as string))
			)
			.map((item: any, index: number) =>
				normalizeOverviewItem(item, `card-${roomId}-${columnIndex}-${index}`, taken)
			)
	);
	return columns !== undefined && cards.length !== columns
		? resizeCardColumns(cards, columns)
		: cards;
}

/**
 * `taken` collects the ids already handed out and is mutated here: two pages
 * sharing an id would make every id-keyed lookup (nav, drag, editor targets)
 * ambiguous.
 */
function normalizeRoom(raw: any, index: number, taken: string[], takenItems: string[]): HearthRoom {
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
		cards: normalizeRoomCards(raw, id, columns, takenItems)
	};
}

/**
 * Accepts any hearth.yaml ever written (older shapes are lifted by
 * migrateHearthConfig first) and garbage. Anything unusable falls back to
 * defaults. Throws ConfigTooNewError for a file from a newer build.
 */
export function normalizeHearthConfig(raw: unknown): HearthConfig {
	const migrated = migrateHearthConfig(raw);
	if (!isRecord(migrated) || !Object.keys(migrated).filter((key) => key !== 'version').length) {
		return structuredClone(DEFAULT_HEARTH_CONFIG);
	}
	const config = migrated as Record<string, any>;
	const defaults = structuredClone(DEFAULT_HEARTH_CONFIG);

	const takenRoomIds: string[] = [];
	const takenItemIds: string[] = [];
	const rooms: HearthRoom[] = (Array.isArray(config.rooms) ? config.rooms : [])
		.filter(isRecord)
		.map((room: any, index: number) => normalizeRoom(room, index, takenRoomIds, takenItemIds));

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
	const rail = (Array.isArray(config.rail) ? config.rail : defaults.rail)
		.filter((widget: any) => isRecord(widget) && VALID_RAIL_WIDGET_TYPES.has(widget.type as string))
		.map((widget: any, index: number) => ({
			...widget,
			id: reserveId(widget.id, `widget-${index}`, takenWidgetIds),
			...(widgetDescriptor(widget.type)?.normalize?.(widget) ?? {}),
			hide_mobile: widget.hide_mobile === true ? true : undefined,
			visibility: normalizeVisibility(widget.visibility)
		})) as RailWidget[];

	const extensions = { ...config };
	for (const key of [
		'version',
		'revision',
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
		'padding_y'
	]) {
		delete extensions[key];
	}

	return {
		...extensions,
		theme: isRecord(config.theme) ? config.theme : undefined,
		theme_night: isRecord(config.theme_night) ? config.theme_night : undefined,
		day_night: dayNight,
		rail,
		rooms,
		screensaver_minutes: normalizeWholeNumber(config.screensaver_minutes, 1),
		screensaver_drift: config.screensaver_drift === true ? true : undefined,
		screensaver_brightness:
			typeof config.screensaver_brightness === 'number' &&
			Number.isFinite(config.screensaver_brightness)
				? Math.min(100, Math.max(10, Math.round(config.screensaver_brightness)))
				: undefined,
		keep_screen_on: typeof config.keep_screen_on === 'boolean' ? config.keep_screen_on : undefined,
		padding_x: normalizeWholeNumber(config.padding_x, 0),
		padding_y: normalizeWholeNumber(config.padding_y, 0)
	};
}
