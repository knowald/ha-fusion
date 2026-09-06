import { get } from 'svelte/store';
import { health } from '$lib/core/ha/connection';
import { describe, expect, it, vi } from 'vitest';
import {
	confirmRequestedAction,
	hearthRevision,
	requestConfirmation,
	requestedConfirmation,
	saveEdit,
	saveState
} from './store';
import { activeSceneIndex } from '$lib/core/domains/scene';
import { blindPositionFor } from '$lib/core/domains/cover';
import {
	callEntityService,
	commandFailure,
	dismissCommandFailure,
	pendingEntities
} from '$lib/core/ha/commands';
import {
	entityActive,
	entityActiveFor,
	entityAvailability,
	entityGroupSummary,
	sensorNumber
} from '$lib/core/ha/entities';
import { lightViewFor } from '$lib/core/domains/light';
import { formatGroupSummary } from './groupSummary';

describe('Hearth store view helpers', () => {
	it('distinguishes missing, unknown, unavailable and available entities', () => {
		expect(entityAvailability(undefined)).toBe('missing');
		expect(entityAvailability({ state: 'unknown' } as any)).toBe('unknown');
		expect(entityAvailability({ state: 'unavailable' } as any)).toBe('unavailable');
		expect(entityAvailability({ state: 'off' } as any)).toBe('available');
	});

	it('uses domain-aware active states consistently', () => {
		expect(entityActive('lock.front_door', { state: 'unlocked' } as any)).toBe(true);
		expect(entityActive('valve.garden', { state: 'open' } as any)).toBe(true);
		expect(entityActive('cover.garage', { state: 'closing' } as any)).toBe(true);
		expect(entityActive('media_player.kitchen', { state: 'paused' } as any)).toBe(true);
		expect(entityActive('lock.front_door', { state: 'locked' } as any)).toBe(false);
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

	it('renders discrete active-state overrides without lying about unavailable entities', () => {
		expect(
			entityActiveFor('switch.desk', { state: 'off' } as any, { 'active:switch.desk': 1 })
		).toBe(true);
		expect(
			entityActiveFor('switch.desk', { state: 'unavailable' } as any, { 'active:switch.desk': 1 })
		).toBe(false);
		expect(
			lightViewFor('light.desk', { 'light.desk': { state: 'off', attributes: {} } } as any, {
				'active:light.desk': 1
			})
		).toMatchObject({ on: true });
	});

	it('surfaces commands attempted while Home Assistant is disconnected', () => {
		health.set('lost');
		callEntityService('light', 'toggle', 'light.desk');
		expect(get(commandFailure)).toEqual({
			entityId: 'light.desk',
			detail: 'Not connected to Home Assistant'
		});
		expect(get(pendingEntities)).toEqual({});
		dismissCommandFailure();
	});

	it('requires an explicit confirmation before a disruptive action runs', () => {
		let calls = 0;
		requestConfirmation({
			title: 'Unlock?',
			message: 'Confirm',
			confirmLabel: 'Unlock',
			action: () => calls++
		});
		expect(calls).toBe(0);
		expect(get(requestedConfirmation)?.title).toBe('Unlock?');
		confirmRequestedAction();
		expect(calls).toBe(1);
		expect(get(requestedConfirmation)).toBeNull();
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
		expect(summary).toMatchObject({ countable: true, active: 1, inactive: 0, activeWord: 'on' });
		expect(formatGroupSummary(summary, (key) => key)).toMatchObject({
			text: '1 on',
			badge: '1 on'
		});
		expect(sensorNumber('12.5 °C')).toBe(12.5);
		expect(sensorNumber('unavailable')).toBeNull();
	});
});

describe('saveEdit conflicts', () => {
	it('keeps the local revision after a 409 so a plain retry conflicts again', async () => {
		hearthRevision.set(3);
		const fetchMock = vi.fn(
			async (_url: string, init: RequestInit) =>
				new Response(JSON.stringify({ revision: 7, sent: init.body }), { status: 409 })
		);
		vi.stubGlobal('fetch', fetchMock);
		try {
			expect(await saveEdit()).toBe(false);
			expect(get(saveState)).toBe('conflict');
			expect(get(hearthRevision)).toBe(3);
			await saveEdit(true);
			const body = JSON.parse(String(fetchMock.mock.calls[1][1].body));
			expect(body).toMatchObject({ revision: 3, force: true });
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
