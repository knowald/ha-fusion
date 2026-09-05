import { markPending, service } from '../ha/commands';

export function setFanSpeed(entityId: string, pct: number) {
	markPending(entityId);
	if (pct === 0) {
		service('fan', 'turn_off', { entity_id: entityId });
	} else {
		service('fan', 'set_percentage', { entity_id: entityId, percentage: pct });
	}
}
