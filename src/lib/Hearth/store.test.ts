import { get } from 'svelte/store';
import { connected, connection } from '$lib/Stores';
import { describe, expect, it } from 'vitest';
import {
	activeSceneIndex,
	blindPositionFor,
	callEntityService,
	commandFailure,
	dismissCommandFailure,
	entityAvailability,
	entityGroupSummary,
	lightViewFor,
	pendingEntities,
	sensorNumber
} from './store';

describe('Hearth store view helpers', () => {
	it('distinguishes missing, unknown, unavailable and available entities', () => {
		expect(entityAvailability(undefined)).toBe('missing');
		expect(entityAvailability({ state: 'unknown' } as any)).toBe('unknown');
		expect(entityAvailability({ state: 'unavailable' } as any)).toBe('unavailable');
		expect(entityAvailability({ state: 'off' } as any)).toBe('available');
	});

	it('does not let an optimistic light override hide lost availability', () => {
		expect(
			lightViewFor(
				'light.desk',
				{ 'light.desk': { state: 'unavailable', attributes: {} } } as any,
				{ 'level:light.desk': 80 }
			)
		).toMatchObject({ availability: 'unavailable', on: false, level: 0 });
	});

	it('surfaces commands attempted while Home Assistant is disconnected', () => {
		connection.set(null);
		connected.set(false);
		callEntityService('light', 'toggle', 'light.desk');
		expect(get(commandFailure)).toEqual({
			entityId: 'light.desk',
			detail: 'Not connected to Home Assistant'
		});
		expect(get(pendingEntities)).toEqual({});
		dismissCommandFailure();
	});

	it('prefers explicit scene indicators over activation timestamps', () => {
		const scenes = [
			{ entity: 'scene.old', active_entity: 'input_boolean.mode' },
			{ entity: 'scene.new' }
		];
		const states = {
			'input_boolean.mode': { state: 'on' },
			'scene.old': { state: '2026-01-01T00:00:00+00:00' },
			'scene.new': { state: '2026-02-01T00:00:00+00:00' }
		} as any;
		expect(activeSceneIndex(scenes, states)).toBe(0);
	});

	it('uses optimistic overrides and clamps cover positions', () => {
		expect(blindPositionFor('cover.blind', undefined, { 'blind:cover.blind': 120 })).toBe(100);
	});

	it('summarizes only available switch-like entities', () => {
		const summary = entityGroupSummary(['light.one', 'light.two', 'sensor.temperature'], {
			'light.one': { state: 'on' },
			'light.two': { state: 'unavailable' }
		} as any);
		expect(summary).toMatchObject({ text: '1 on', badge: '1 on' });
		expect(sensorNumber('12.5 °C')).toBe(12.5);
		expect(sensorNumber('unavailable')).toBeNull();
	});
});
