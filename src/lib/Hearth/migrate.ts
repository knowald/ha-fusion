import { resizeCardColumns } from './config';
import { isRecord, trimmedOrUndefined } from './normalizers';

/*
 * Config format versions. `version` in hearth.yaml names the shape the file
 * was written in; each migration lifts a raw document one step, before any
 * normalization sees it. A file newer than this build refuses to load rather
 * than being normalized into loss.
 */

export const CONFIG_VERSION = 2;

export class ConfigTooNewError extends Error {
	constructor(public readonly version: number) {
		super(
			`Hearth configuration version ${version} is newer than this build supports (${CONFIG_VERSION}); update ha-fusion`
		);
		this.name = 'ConfigTooNewError';
	}
}

interface Migration {
	to: number;
	apply: (raw: Record<string, any>) => Record<string, any>;
}

/**
 * 0 -> 1: the pre-version shapes. v1 kept flat entity fields at the top level
 * and no pages; v2 kept a separate `overview` for Home, named light and blind
 * registries referenced by id from each room, per-room lighting and device
 * grids outside the card layout, and the retired lights/blinds/air card types.
 * Everything becomes ordinary pages holding entity-grid cards.
 */
function toCardPages(raw: Record<string, any>): Record<string, any> {
	const registries = {
		lights: Array.isArray(raw.lights) ? raw.lights : [],
		blinds: Array.isArray(raw.blinds) ? raw.blinds : []
	};
	const registryRefs = (registry: any[]) =>
		registry
			.filter((entry) => isRecord(entry) && typeof entry.entity === 'string')
			.map((entry) => ({ entity: entry.entity, name: entry.name }));
	const refsById = (ids: unknown, registry: any[]) =>
		(Array.isArray(ids) ? ids : [])
			.map((id) => registry.find((entry) => entry?.id === id))
			.filter((entry) => entry && typeof entry.entity === 'string')
			.map((entry) => ({ entity: entry.entity, name: entry.name }));

	const migrateCard = (card: any): any => {
		if (!isRecord(card)) return card;
		if (card.type === 'lights') {
			return {
				id: card.id,
				type: 'entities',
				title: card.title ?? 'Lights',
				show_count: true,
				entities: registryRefs(registries.lights),
				visibility: card.visibility
			};
		}
		if (card.type === 'blinds') {
			return {
				id: card.id,
				type: 'entities',
				title: card.title ?? 'Blinds',
				entities: registryRefs(registries.blinds),
				visibility: card.visibility
			};
		}
		if (card.type === 'air') {
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
		if (card.kind === 'stack' && Array.isArray(card.cards)) {
			return { ...card, cards: card.cards.map(migrateCard) };
		}
		return card;
	};

	const migrateRoom = (room: any, index: number) => {
		if (!isRecord(room)) return room;
		const roomId = trimmedOrUndefined(room.id) ?? `page-${index + 1}`;
		const rawCards = Array.isArray(room.cards) ? room.cards : [];
		// a flat card list predates columns; a list with any column stays one
		const flat = rawCards.length > 0 && rawCards.every((entry: unknown) => !Array.isArray(entry));
		let columns: any[][] = (flat ? [rawCards] : rawCards).map((column: unknown) =>
			Array.isArray(column) ? column.map(migrateCard) : []
		);
		// the grids go side by side only when the page already has the columns
		const count =
			typeof room.columns === 'number' && room.columns >= 1 && room.columns <= 3
				? Math.floor(room.columns)
				: undefined;
		if (count !== undefined && columns.length && columns.length !== count) {
			columns = resizeCardColumns(columns, count);
		}

		// v2 rendered lighting and device grids outside the layout; they become
		// entity cards at the top of the page, once, even for a half-migrated file
		const present = new Set(
			columns
				.flat()
				.flatMap((item) =>
					isRecord(item)
						? [item.id, ...(Array.isArray(item.cards) ? item.cards.map((c: any) => c?.id) : [])]
						: []
				)
		);
		const lighting = present.has(`${roomId}-lighting`)
			? []
			: refsById(room.lights, registries.lights);
		const devices = present.has(`${roomId}-devices`)
			? []
			: [
					...refsById(room.blinds, registries.blinds),
					...(Array.isArray(room.devices) ? room.devices : [])
						.filter((device: any) => isRecord(device) && typeof device.entity === 'string')
						.map((device: any) => ({
							entity: device.entity,
							name: trimmedOrUndefined(device.name),
							icon: trimmedOrUndefined(device.icon),
							readonly: device.readonly === true ? true : undefined
						}))
				];
		const next = columns.length ? columns : [[]];
		if (lighting.length || devices.length) {
			const lightingCard = {
				id: `${roomId}-lighting`,
				type: 'entities',
				title: 'Lighting',
				show_count: true,
				entities: lighting
			};
			const devicesCard = {
				id: `${roomId}-devices`,
				type: 'entities',
				title: 'Devices',
				entities: devices
			};
			// side by side when the page has room for both and both exist;
			// otherwise stacked in the first column so no column is left empty
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
		}
		const migrated: Record<string, any> = { ...room, cards: next };
		delete migrated.lights;
		delete migrated.blinds;
		delete migrated.devices;
		return migrated;
	};

	const rooms = (Array.isArray(raw.rooms) ? raw.rooms : []).map(migrateRoom);

	// v2 stored the home page separately in `overview`; it becomes the first page
	if (Array.isArray(raw.overview)) {
		rooms.unshift(
			migrateRoom(
				{
					id: 'home',
					name: 'Home',
					icon: 'home',
					hide_header: true,
					// only fix the column count while it is a supported one
					columns: raw.overview.length <= 3 ? Math.max(1, raw.overview.length) : undefined,
					cards: raw.overview
				},
				0
			)
		);
	}

	// v1 had no rail and no pages: the default rail carries the old clock city
	let rail = raw.rail;
	if (!Array.isArray(rail)) {
		rail = [
			{ id: 'clock', type: 'clock', ...(raw.city ? { city: raw.city } : {}) },
			{ id: 'nav', type: 'nav' },
			{ id: 'spacer', type: 'spacer' }
		];
		if (!rooms.length)
			rooms.push({ id: 'home', name: 'Home', icon: 'home', hide_header: true, cards: [[]] });
	}

	const next: Record<string, any> = { ...raw, rail, rooms };
	for (const key of [
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
		delete next[key];
	}
	return next;
}

/** 1 -> 2: picture elements became a card type of their own instead of a fusion embed. */
function toPictureCards(raw: Record<string, any>): Record<string, any> {
	const migrateCard = (card: any): any => {
		if (!isRecord(card)) return card;
		if (card.kind === 'stack' && Array.isArray(card.cards)) {
			return { ...card, cards: card.cards.map(migrateCard) };
		}
		const config = card.config as Record<string, any> | undefined;
		if (card.type !== 'fusion' || !config || config.type !== 'picture_elements') return card;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { config: _embed, ...rest } = card;
		return {
			...rest,
			type: 'picture',
			elements: Array.isArray(config.elements) ? config.elements : [],
			...(typeof config.name === 'string' ? { title: config.name } : {})
		};
	};
	const rooms = (Array.isArray(raw.rooms) ? raw.rooms : []).map((room: any) =>
		isRecord(room) && Array.isArray(room.cards)
			? {
					...room,
					cards: room.cards.map((column: unknown) =>
						Array.isArray(column) ? column.map(migrateCard) : column
					)
				}
			: room
	);
	return { ...raw, rooms };
}

const MIGRATIONS: Migration[] = [
	{ to: 1, apply: toCardPages },
	{ to: 2, apply: toPictureCards }
];

/** The document's declared format version; 0 for files written before versioning. */
export function configVersion(raw: unknown): number {
	const version = isRecord(raw) ? raw.version : undefined;
	return typeof version === 'number' && Number.isInteger(version) ? version : 0;
}

/**
 * Lifts a raw hearth.yaml document to the current format. Documents at the
 * current version pass through untouched apart from the version stamp.
 */
export function migrateHearthConfig(raw: unknown): unknown {
	if (!isRecord(raw)) return raw;
	const version = configVersion(raw);
	if (version > CONFIG_VERSION) throw new ConfigTooNewError(version);
	let config: Record<string, any> = { ...raw };
	for (const migration of MIGRATIONS) {
		if (migration.to > version) config = migration.apply(config);
	}
	return { ...config, version: CONFIG_VERSION };
}
