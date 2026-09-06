import { describe, expect, it } from 'vitest';
import en from '../../../static/translations/en.json';
import { CARD_TYPES } from './cards';
import { RAIL_WIDGET_TYPES } from './widgets';

const translated = (key: string) => typeof (en as Record<string, unknown>)[key] === 'string';

describe('Hearth type registries', () => {
	it('gives every card type a complete, unique descriptor', async () => {
		expect(new Set(CARD_TYPES.map(({ type }) => type)).size).toBe(CARD_TYPES.length);
		for (const descriptor of CARD_TYPES) {
			expect(descriptor).toMatchObject({
				type: expect.any(String),
				icon: expect.any(String),
				normalize: expect.any(Function),
				needsConfiguration: expect.any(Function),
				entityIds: expect.any(Function),
				component: expect.any(Function),
				editor: expect.any(Function)
			});
			for (const key of [descriptor.label, descriptor.name, descriptor.sub]) {
				expect(translated(key), `${descriptor.type}: ${key} missing from en.json`).toBe(true);
			}
			if (descriptor.heightHint) expect(translated(descriptor.heightHint)).toBe(true);
			expect((await descriptor.editor()).default).toEqual(expect.any(Function));
			// raw YAML is spread into the card, so a garbage document must come
			// out with every typed field coerced rather than passed through
			expect(() =>
				descriptor.normalize({ type: descriptor.type, entity: 42, title: [] })
			).not.toThrow();
		}
	});

	it('gives every rail widget type a complete, unique descriptor', async () => {
		expect(new Set(RAIL_WIDGET_TYPES.map(({ type }) => type)).size).toBe(RAIL_WIDGET_TYPES.length);
		for (const descriptor of RAIL_WIDGET_TYPES) {
			expect(descriptor).toMatchObject({
				type: expect.any(String),
				icon: expect.any(String)
			});
			for (const key of [descriptor.label, descriptor.name, descriptor.sub]) {
				expect(translated(key), `${descriptor.type}: ${key} missing from en.json`).toBe(true);
			}
			// only the spacer is drawn by the rail itself and has nothing to edit
			if (descriptor.type !== 'spacer') expect(descriptor.component).toEqual(expect.any(Function));
			if (!['spacer', 'nav', 'search', 'notifications'].includes(descriptor.type)) {
				expect((await descriptor.editor?.())?.default).toEqual(expect.any(Function));
			}
		}
	});
});
