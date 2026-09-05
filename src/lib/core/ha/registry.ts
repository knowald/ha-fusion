import { get } from 'svelte/store';
import { connection } from './connection';

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

/** One snapshot of the area, device and entity registries. */
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
