import { describe, expect, it } from 'vitest';
import { CARD_TYPES } from './cards';
import { RAIL_WIDGET_TYPES } from './widgets';

describe('Hearth type registries', () => {
	it('gives every card type a complete, unique descriptor', () => {
		expect(new Set(CARD_TYPES.map(({ type }) => type)).size).toBe(CARD_TYPES.length);
		for (const descriptor of CARD_TYPES) {
			expect(descriptor).toMatchObject({
				type: expect.any(String),
				label: expect.any(String),
				name: expect.any(String),
				sub: expect.any(String),
				icon: expect.any(String),
				needsConfiguration: expect.any(Function),
				entityIds: expect.any(Function),
				component: expect.any(Function),
				editor: expect.any(Function)
			});
		}
	});

	it('gives every rail widget type a complete, unique descriptor', () => {
		expect(new Set(RAIL_WIDGET_TYPES.map(({ type }) => type)).size).toBe(RAIL_WIDGET_TYPES.length);
		for (const descriptor of RAIL_WIDGET_TYPES) {
			expect(descriptor).toMatchObject({
				type: expect.any(String),
				label: expect.any(String),
				name: expect.any(String),
				sub: expect.any(String),
				icon: expect.any(String)
			});
			// only the spacer is drawn by the rail itself and has nothing to edit
			if (descriptor.type !== 'spacer') expect(descriptor.component).toEqual(expect.any(Function));
			if (!['spacer', 'nav', 'search'].includes(descriptor.type)) {
				expect(descriptor.editor).toEqual(expect.any(Function));
			}
		}
	});
});
