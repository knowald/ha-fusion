import { get } from 'svelte/store';
import { entityActive, entityAvailable, getTogglableService, states } from '../ha/entities';
import { markPending, service, setControlOverride } from '../ha/commands';

/** Flips any entity through homeassistant.toggle, with an optimistic active override. */
export function toggleDevice(entityId: string) {
	const entity = get(states)?.[entityId];
	if (!entityAvailable(entity)) return;
	setControlOverride(`active:${entityId}`, entityActive(entityId, entity) ? 0 : 1);
	markPending(entityId);
	service('homeassistant', 'toggle', { entity_id: entityId });
}

/**
 * Toggles any entity via its domain's togglable service. Returns false when
 * the domain has none, so callers can open the entity's detail view instead.
 */
export function toggleEntity(entityId: string): boolean {
	const entity = get(states)?.[entityId];
	if (!entityAvailable(entity)) return false;
	const togglable = entity && getTogglableService(entity);
	if (!togglable) return false;
	const [domain, name] = togglable.split('.');
	setControlOverride(`active:${entityId}`, entityActive(entityId, entity) ? 0 : 1);
	markPending(entityId);
	service(domain, name, { entity_id: entityId });
	return true;
}
