import { writable } from 'svelte/store';
import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';

/** Every entity state, replaced wholesale on each websocket update. */
export const states = writable<HassEntities>();

/**
 * Returns the domain from a given entity_id
 * @example getDomain("light.bedroom") // "light"
 */
export function getDomain(entityId: string | undefined) {
	return entityId?.split('.')?.[0];
}

export type EntityAvailability = 'available' | 'unavailable' | 'unknown' | 'missing';

/** The shared reachability vocabulary for every entity surface. */
export function entityAvailability(entity: HassEntity | undefined): EntityAvailability {
	if (!entity) return 'missing';
	if (entity.state === 'unavailable') return 'unavailable';
	if (entity.state === 'unknown') return 'unknown';
	return 'available';
}

export function entityAvailable(entity: HassEntity | undefined): boolean {
	return entityAvailability(entity) === 'available';
}

export const UNAVAILABLE_STATES = ['unavailable', 'unknown'];

/** States the original dashboard's button treats as active, across domains. */
export const ACTIVE_STATES = [
	'active',
	'auto',
	'cool',
	'dry',
	'fan_only',
	'heat',
	'heat_cool',
	'heating',
	'home',
	'on',
	'open',
	'playing',
	'unlocking',
	'unlocked',
	// vacuum
	'cleaning',
	'returning',
	// water_heater
	'eco',
	'electric',
	'performance',
	'high_demand',
	'heat_pump',
	'gas'
];

export const OPENING_STATES = ['open', 'opening', 'closing'];
export const MEDIA_OFF_STATES = ['off', 'unavailable', 'unknown', 'standby', 'idle'];

/** One domain-aware answer to whether an entity is visually active. */
export function entityActive(entityId: string, entity: HassEntity | undefined) {
	if (!entity) return false;
	const domain = getDomain(entityId);
	if (domain === 'cover' || domain === 'valve') return OPENING_STATES.includes(entity.state);
	if (domain === 'lock') return entity.state === 'unlocked';
	if (domain === 'media_player') return !MEDIA_OFF_STATES.includes(entity.state);
	if (domain === 'vacuum') return entity.state === 'cleaning' || entity.state === 'returning';
	return entity.state === 'on';
}

/** Active state with an optimistic `active:` override applied while the entity is reachable. */
export function entityActiveFor(
	entityId: string,
	entity: HassEntity | undefined,
	$overrides: Record<string, number>
): boolean {
	const override = entityAvailable(entity) ? $overrides[`active:${entityId}`] : undefined;
	return override === undefined ? entityActive(entityId, entity) : override > 0;
}

/** The `domain.service` that flips an entity, or undefined for domains without one. */
export function getTogglableService(entity: HassEntity) {
	const domain = getDomain(entity?.entity_id);
	const state = entity?.state;

	if (!domain || !state) return;

	let service;

	switch (domain) {
		case 'automation':
		case 'button':
		case 'cover':
		case 'fan':
		case 'humidifier':
		case 'input_boolean':
		case 'light':
		case 'media_player':
		case 'script':
		case 'siren':
		case 'switch':
			service = 'toggle';
			break;

		case 'input_button':
			service = 'press';
			break;

		case 'lock':
			service = state === 'locked' ? 'unlock' : 'lock';
			break;

		// group members span domains, so only homeassistant.toggle covers them;
		// without this, Button falls back to a handler that recurses into toggle
		case 'group':
		case 'remote':
			return 'homeassistant.toggle';

		case 'scene':
			service = 'turn_on';
			break;

		case 'timer':
			service = state === 'active' ? 'cancel' : 'start';
			break;

		case 'vacuum':
			service = state === 'cleaning' ? 'pause' : 'start';
			break;
	}

	if (service) {
		return `${domain}.${service}`;
	}
}

/** Parses a sensor state as a number, or null for anything non-numeric. */
export function sensorNumber(state: string | undefined): number | null {
	if (state === undefined) return null;
	const value = parseFloat(state);
	return Number.isFinite(value) ? value : null;
}

/* entity groups */

const OPEN_CLOSED_CLASSES = ['door', 'window', 'garage_door', 'opening'];

/** Domains whose entities read as active or inactive in a group summary. */
const SUMMARY_DOMAINS = [
	'light',
	'switch',
	'input_boolean',
	'fan',
	'cover',
	'valve',
	'binary_sensor',
	'media_player',
	'lock',
	'humidifier'
];

/** Active/inactive wording for one entity. */
export function summaryWords(entityId: string, entity: HassEntity | undefined): [string, string] {
	const domain = getDomain(entityId);
	if (domain === 'cover' || domain === 'valve') return ['open', 'closed'];
	if (domain === 'lock') return ['unlocked', 'locked'];
	if (domain === 'binary_sensor') {
		const deviceClass: string | undefined = entity?.attributes?.device_class;
		if (deviceClass && OPEN_CLOSED_CLASSES.includes(deviceClass)) return ['open', 'closed'];
		if (deviceClass === 'motion' || deviceClass === 'occupancy') return ['detected', 'clear'];
	}
	return ['on', 'off'];
}

/**
 * Collapsed-group caption, e.g. "5 open · 3 closed". Entities without an on/off
 * notion (sensors) and entities that are unavailable are not counted, since
 * calling either of those "off" would be a lie; a group with nothing countable
 * falls back to its size. Wording follows the group's entities only while they
 * agree - a mixed group says on/off. `badge` is the active half alone, for the
 * popover header.
 */
export function entityGroupSummary(
	entityIds: string[],
	$states: HassEntities | undefined
): { text: string; badge: string | null; activeLabel: string } {
	// eligible by domain, so the wording holds before any state has arrived
	const eligible = entityIds.filter((entityId) => SUMMARY_DOMAINS.includes(entityId.split('.')[0]));
	if (!eligible.length) {
		const size = `${entityIds.length} ${entityIds.length === 1 ? 'entity' : 'entities'}`;
		return { text: size, badge: null, activeLabel: size };
	}
	// counted only where the state says something: an unavailable or not yet
	// loaded entity is neither active nor inactive
	const countable = eligible.filter((entityId) => {
		const entity = $states?.[entityId];
		return entity !== undefined && !UNAVAILABLE_STATES.includes(entity.state);
	});
	const words = eligible.map((entityId) => summaryWords(entityId, $states?.[entityId]));
	const [activeWord, inactiveWord] = words.every(
		([active, inactive]) => active === words[0][0] && inactive === words[0][1]
	)
		? words[0]
		: (['on', 'off'] as [string, string]);
	const active = countable.filter((entityId) => entityActive(entityId, $states?.[entityId])).length;
	const inactive = countable.length - active;
	const activeLabel = `${active} ${activeWord}`;
	const parts = [
		...(active ? [activeLabel] : []),
		...(inactive ? [`${inactive} ${inactiveWord}`] : [])
	];
	// nothing countable yet: still say it in the group's own words
	return {
		text: parts.length ? parts.join(' · ') : activeLabel,
		badge: active ? activeLabel : null,
		activeLabel
	};
}
