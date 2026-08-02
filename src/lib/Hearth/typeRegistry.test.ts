import { describe, expect, it } from 'vitest';
import { OVERVIEW_CARD_TYPES, RAIL_WIDGET_TYPES } from './config';

describe('Hearth type registries', () => {
	it.each([
		['card', OVERVIEW_CARD_TYPES],
		['rail widget', RAIL_WIDGET_TYPES]
	] as const)('gives every %s type one complete, unique descriptor', (_name, descriptors) => {
		expect(new Set(descriptors.map(({ value }) => value)).size).toBe(descriptors.length);
		for (const descriptor of descriptors) {
			expect(descriptor).toMatchObject({
				value: expect.any(String),
				label: expect.any(String),
				name: expect.any(String),
				sub: expect.any(String),
				icon: expect.any(String)
			});
		}
	});
});
