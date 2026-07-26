import { get } from 'svelte/store';
import type { HassEntities } from 'home-assistant-js-websocket';
import { connection } from '$lib/Stores';
import { slugify, uniqueId, type EntityRef, type HearthRoom } from './config';

export interface RegistryArea {
	area_id: string;
	name: string;
}

export interface RegistryDevice {
	id: string;
	area_id: string | null;
}

export interface RegistryEntity {
	entity_id: string;
	area_id: string | null;
	device_id: string | null;
	disabled_by: string | null;
	hidden_by: string | null;
	original_name?: string | null;
	name?: string | null;
}

export interface RegistrySnapshot {
	areas: RegistryArea[];
	devices: RegistryDevice[];
	entities: RegistryEntity[];
}

export interface HearthProposal {
	rooms: HearthRoom[];
}

export async function fetchRegistry(): Promise<RegistrySnapshot> {
	const conn = get(connection);
	if (!conn) throw new Error('Not connected to Home Assistant');
	const [areas, devices, entities] = await Promise.all([
		conn.sendMessagePromise<RegistryArea[]>({ type: 'config/area_registry/list' }),
		conn.sendMessagePromise<RegistryDevice[]>({ type: 'config/device_registry/list' }),
		conn.sendMessagePromise<RegistryEntity[]>({ type: 'config/entity_registry/list' })
	]);
	return { areas, devices, entities };
}

const AREA_ICON_KEYWORDS: [string[], string][] = [
	[['bed'], 'bed'],
	[['living', 'lounge'], 'weekend'],
	[['kitchen'], 'countertops'],
	[['office', 'study'], 'desk'],
	[['bath'], 'bathtub'],
	[['hall', 'entry'], 'meeting_room'],
	[['garage'], 'garage'],
	[['garden', 'yard'], 'yard'],
	[['kid', 'child'], 'child_care'],
	[['dining'], 'restaurant']
];

function areaIcon(name: string): string {
	const lowered = name.toLowerCase();
	for (const [keywords, icon] of AREA_ICON_KEYWORDS) {
		if (keywords.some((keyword) => lowered.includes(keyword))) return icon;
	}
	return 'meeting_room';
}

/** Drops a redundant room-name prefix, e.g. "Kitchen Ceiling" -> "Ceiling". */
function stripRoomName(name: string, roomName: string): string {
	if (!name.toLowerCase().startsWith(roomName.toLowerCase())) return name;
	const stripped = name
		.slice(roomName.length)
		.replace(/^[\s:,-]+/, '')
		.trim();
	return stripped || name;
}

const DEVICE_DOMAIN_ORDER = [
	'climate',
	'media_player',
	'fan',
	'switch',
	'vacuum',
	'lock',
	'humidifier'
];
const MAX_DEVICES_PER_ROOM = 8;

/**
 * Turns the HA registries into proposed pages, one per area, each with a
 * Lighting and a Devices card. Each entity lands in its own area or falls back
 * to its device's area. Disabled/hidden registry entries and entities without a
 * state object are skipped.
 */
export function buildProposal(
	snapshot: RegistrySnapshot,
	currentStates: HassEntities
): HearthProposal {
	const deviceAreas = new Map(snapshot.devices.map((device) => [device.id, device.area_id]));

	const areaEntities = new Map<string, RegistryEntity[]>();
	for (const entity of snapshot.entities) {
		if (entity.disabled_by || entity.hidden_by) continue;
		if (!currentStates?.[entity.entity_id]) continue;
		const areaId =
			entity.area_id ?? (entity.device_id ? deviceAreas.get(entity.device_id) : null) ?? null;
		if (!areaId) continue;
		const list = areaEntities.get(areaId);
		if (list) list.push(entity);
		else areaEntities.set(areaId, [entity]);
	}

	const friendlyName = (entity: RegistryEntity): string =>
		currentStates[entity.entity_id]?.attributes?.friendly_name ??
		entity.name ??
		entity.original_name ??
		entity.entity_id;

	const rooms: HearthRoom[] = [];
	const roomIds: string[] = [];

	const sortedAreas = [...snapshot.areas].sort((a, b) => a.name.localeCompare(b.name));
	for (const area of sortedAreas) {
		const entities = areaEntities.get(area.area_id);
		if (!entities) continue;

		const lighting: EntityRef[] = [];
		const covers: EntityRef[] = [];
		const deviceCandidates = new Map<string, EntityRef[]>();
		let tempEntity: string | undefined;
		let humidityEntity: string | undefined;

		for (const entity of entities) {
			const domain = entity.entity_id.split('.')[0];
			const name = stripRoomName(friendlyName(entity), area.name);

			if (domain === 'light') {
				lighting.push({ entity: entity.entity_id, name });
			} else if (domain === 'cover') {
				covers.push({ entity: entity.entity_id, name });
			} else if (DEVICE_DOMAIN_ORDER.includes(domain)) {
				const list = deviceCandidates.get(domain) ?? [];
				list.push({ entity: entity.entity_id, name });
				deviceCandidates.set(domain, list);
			} else if (domain === 'sensor') {
				const deviceClass = currentStates[entity.entity_id]?.attributes?.device_class;
				if (deviceClass === 'temperature') tempEntity ??= entity.entity_id;
				if (deviceClass === 'humidity') humidityEntity ??= entity.entity_id;
			}
		}

		const devices = [
			...covers,
			...DEVICE_DOMAIN_ORDER.flatMap((domain) => deviceCandidates.get(domain) ?? []).slice(
				0,
				MAX_DEVICES_PER_ROOM
			)
		];

		if (!lighting.length && !devices.length) continue;

		const roomId = uniqueId(slugify(area.name), roomIds);
		roomIds.push(roomId);
		rooms.push({
			id: roomId,
			name: area.name,
			icon: areaIcon(area.name),
			temp_entity: tempEntity,
			humidity_entity: humidityEntity,
			cards: [
				[
					...(lighting.length
						? [
								{
									id: `${roomId}-lighting`,
									type: 'entities' as const,
									title: 'Lighting',
									show_count: true,
									entities: lighting
								}
							]
						: []),
					...(devices.length
						? [
								{
									id: `${roomId}-devices`,
									type: 'entities' as const,
									title: 'Devices',
									entities: devices
								}
							]
						: [])
				]
			]
		});
	}

	return { rooms };
}
