import { describe, expect, it } from 'vitest';
import { cardNeedsConfiguration, railWidgetNeedsConfiguration } from './configurationState';

describe('Hearth configuration placeholders', () => {
	it('covers every entity-backed card before rendering controls', () => {
		for (const type of ['temperature', 'media', 'vacuum', 'camera', 'image', 'climate'] as const) {
			expect(cardNeedsConfiguration({ id: type, type } as any)).toBe(true);
		}
	});

	it('accepts configured list and embed cards', () => {
		expect(
			cardNeedsConfiguration({
				id: 'entities',
				type: 'entities',
				entities: [],
				wildcard: 'light.*'
			})
		).toBe(false);
		expect(cardNeedsConfiguration({ id: 'scenes', type: 'scenes', scenes: [] })).toBe(true);
		expect(
			cardNeedsConfiguration({ id: 'fusion', type: 'fusion', config: { type: 'sensor' } })
		).toBe(false);
	});

	it('uses the same readiness rule for rail widgets', () => {
		expect(railWidgetNeedsConfiguration({ id: 'weather', type: 'weather' })).toBe(true);
		expect(
			railWidgetNeedsConfiguration({
				id: 'calendar',
				type: 'calendar',
				entities: ['calendar.home']
			})
		).toBe(false);
		expect(railWidgetNeedsConfiguration({ id: 'clock', type: 'clock' })).toBe(false);
	});
});
