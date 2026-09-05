import { markPending, service, setControlOverride } from '../ha/commands';

export function setClimateTemperature(entity: string, temperature: number) {
	setControlOverride(`climate:${entity}`, temperature, 5000);
	markPending(entity);
	service('climate', 'set_temperature', { entity_id: entity, temperature });
}

export function setClimateHvacMode(entity: string, mode: string) {
	markPending(entity);
	service('climate', 'set_hvac_mode', { entity_id: entity, hvac_mode: mode });
}
