import { get } from 'svelte/store';
import { states } from '../ha/entities';
import { callEntityService, markPending, service, setControlOverride } from '../ha/commands';

export function toggleVacuum(entity: string) {
	markPending(entity);
	const state = get(states)?.[entity]?.state;
	setControlOverride(`active:${entity}`, state === 'cleaning' || state === 'returning' ? 0 : 1);
	if (state === 'cleaning' || state === 'returning') {
		service('vacuum', 'return_to_base', { entity_id: entity });
	} else {
		service('vacuum', 'start', { entity_id: entity });
	}
}

export type VacuumCommand = 'start' | 'pause' | 'stop' | 'clean_spot' | 'locate' | 'return_to_base';

export function vacuumCommand(entity: string, command: VacuumCommand) {
	callEntityService('vacuum', command, entity);
}
