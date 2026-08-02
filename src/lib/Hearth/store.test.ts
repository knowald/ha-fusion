import { describe, expect, it } from 'vitest';
import { activeSceneIndex, blindPositionFor, entityGroupSummary, sensorNumber } from './store';

describe('Hearth store view helpers', () => {
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
