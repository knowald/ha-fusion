import { derived, writable } from 'svelte/store';
import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { domainDescriptor } from '../domains';

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

/** One domain-aware answer to whether an entity is visually active. */
export function entityActive(entityId: string, entity: HassEntity | undefined) {
	if (!entity) return false;
	return domainDescriptor(getDomain(entityId)).active?.(entity) ?? entity.state === 'on';
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
	if (!entity?.state) return;
	return domainDescriptor(getDomain(entity.entity_id)).toggleService?.(entity);
}

/** Parses a sensor state as a number, or null for anything non-numeric. */
export function sensorNumber(state: string | undefined): number | null {
	if (state === undefined) return null;
	const value = parseFloat(state);
	return Number.isFinite(value) ? value : null;
}

/* entity groups */

/** Active/inactive wording for one entity. */
export function summaryWords(entityId: string, entity: HassEntity | undefined): [string, string] {
	return domainDescriptor(getDomain(entityId)).summaryWords?.(entity) ?? ['on', 'off'];
}

/**
 * Collapsed-group caption, e.g. "5 open · 3 closed". Entities without an on/off
 * notion (sensors) and entities that are unavailable are not counted, since
 * calling either of those "off" would be a lie; a group with nothing countable
 * falls back to its size. Wording follows the group's entities only while they
 * agree - a mixed group says on/off. `badge` is the active half alone, for the
 * popover header.
 */
export interface EntityGroupSummary {
	/** Every entity in the group, countable or not. */
	total: number;
	/** False when no entity's domain counts; the caller then reports the size. */
	countable: boolean;
	active: number;
	inactive: number;
	/** Translation keys for the active and inactive halves, e.g. on/off, open/closed. */
	activeWord: string;
	inactiveWord: string;
}

export function entityGroupSummary(
	entityIds: string[],
	$states: HassEntities | undefined
): EntityGroupSummary {
	// eligible by domain, so the wording holds before any state has arrived
	const eligible = entityIds.filter(
		(entityId) => domainDescriptor(getDomain(entityId)).countable === true
	);
	if (!eligible.length) {
		return {
			total: entityIds.length,
			countable: false,
			active: 0,
			inactive: 0,
			activeWord: 'on',
			inactiveWord: 'off'
		};
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
	return {
		total: entityIds.length,
		countable: true,
		active,
		inactive: countable.length - active,
		activeWord,
		inactiveWord
	};
}

/** Every known entity id, for pickers and editor autocompletion. */
export const entityIds = derived(states, ($states) => Object.keys($states ?? {}));

/** Which of the named feature bits are set in supported_features. */
export function getSupport(
	supportedFeatures: number | undefined,
	features: Record<string, unknown>
): Record<string, boolean> {
	if (!supportedFeatures) return {};
	return Object.entries(features).reduce((supports: Record<string, boolean>, [key, value]) => {
		if (typeof value === 'number') supports[key] = (supportedFeatures & value) !== 0;
		return supports;
	}, {});
}
