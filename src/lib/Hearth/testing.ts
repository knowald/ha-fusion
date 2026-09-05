import type { HassEntity } from 'home-assistant-js-websocket';

/** A minimal entity state object for tests. */
export function hassEntity(
	entityId: string,
	state: string,
	attributes: Record<string, unknown> = {}
): HassEntity {
	return {
		entity_id: entityId,
		state,
		attributes,
		last_changed: '2026-01-01T00:00:00Z',
		last_updated: '2026-01-01T00:00:00Z',
		context: { id: 'test', user_id: null, parent_id: null }
	};
}
