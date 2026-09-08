import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
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
			expectSchemaContract(descriptor.type, descriptor.schema, descriptor.normalize({}));
		}
	});

	it('gives every rail widget type a complete, unique descriptor', async () => {
		expect(new Set(RAIL_WIDGET_TYPES.map(({ type }) => type)).size).toBe(RAIL_WIDGET_TYPES.length);
		for (const descriptor of RAIL_WIDGET_TYPES) {
			expect(descriptor).toMatchObject({
				type: expect.any(String),
				icon: expect.any(String),
				entityIds: expect.any(Function)
			});
			expect(descriptor.entityIds({ id: 'x', type: descriptor.type } as never)).toEqual([]);
			for (const key of [descriptor.label, descriptor.name, descriptor.sub]) {
				expect(translated(key), `${descriptor.type}: ${key} missing from en.json`).toBe(true);
			}
			expect(descriptor.component).toEqual(expect.any(Function));
			// option-free widgets have nothing to edit
			if (!['nav', 'search', 'notifications'].includes(descriptor.type)) {
				expect((await descriptor.editor?.())?.default).toEqual(expect.any(Function));
			}
			expectSchemaContract(descriptor.type, descriptor.schema, descriptor.normalize?.({}) ?? {});
		}
	});
});

/**
 * Every type owns a loose object schema. Its defaults (the normalizer's output
 * for an empty mapping) must pass it, and every declared field must reject a
 * value of the wrong shape, so a typo in YAML surfaces before Apply.
 */
function expectSchemaContract(type: string, schema: v.GenericSchema, defaults: object) {
	expect(schema, `${type} has no schema`).toBeDefined();
	const entries = (schema as unknown as { entries: Record<string, unknown> }).entries;
	expect(entries, `${type} schema is not an object schema`).toBeDefined();
	const fresh = { id: type, type, ...defaults };
	expect(v.safeParse(schema, fresh).issues, `${type} defaults fail its schema`).toBeUndefined();
	for (const key of Object.keys(entries)) {
		const bad = { ...fresh, [key]: () => undefined };
		expect(v.safeParse(schema, bad).success, `${type}.${key} accepts a function`).toBe(false);
	}
}
