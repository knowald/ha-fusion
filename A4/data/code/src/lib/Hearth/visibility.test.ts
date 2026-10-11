import { describe, expect, it } from 'vitest';
import { evaluateVisibility } from './visibility';

describe('evaluateVisibility', () => {
	const states = {
		'light.desk': { state: 'on' },
		'binary_sensor.window': { state: 'off' }
	} as any;

	it('ANDs entity and media conditions', () => {
		expect(
			evaluateVisibility(
				[{ entity: 'light.desk', state: 'on' }, { media: '(min-width: 800px)' }],
				states,
				{ '(min-width: 800px)': true }
			)
		).toBe(true);
		expect(
			evaluateVisibility(
				[{ entity: 'light.desk', state: 'on' }, { media: '(min-width: 800px)' }],
				states,
				{ '(min-width: 800px)': false }
			)
		).toBe(false);
	});

	it('does not treat a missing entity as satisfying state_not', () => {
		expect(evaluateVisibility([{ entity: 'light.missing', state_not: 'off' }], states, {})).toBe(
			false
		);
	});
});
