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

	it('compares numeric windows and any-of groups', () => {
		const states = { 'sensor.t': { state: '21.5' }, 'switch.a': { state: 'off' } } as any;
		expect(evaluateVisibility([{ entity: 'sensor.t', above: 20 }], states, {})).toBe(true);
		expect(evaluateVisibility([{ entity: 'sensor.t', above: 20, below: 21 }], states, {})).toBe(
			false
		);
		expect(
			evaluateVisibility(
				[
					{
						or: [
							{ entity: 'switch.a', state: 'on' },
							{ entity: 'sensor.t', below: 30 }
						]
					}
				],
				states,
				{}
			)
		).toBe(true);
		expect(evaluateVisibility([{ or: [{ entity: 'switch.a', state: 'on' }] }], states, {})).toBe(
			false
		);
	});
});
