import { describe, expect, it } from 'vitest';
import { transferLegacyItem, transferLegacySection } from './legacyDrag';

function dashboardSections() {
	return [
		{ id: 'first', items: [{ id: 'light' }] },
		{
			id: 'horizontal',
			sections: [
				{ id: 'nested', items: [{ id: 'cover' }] },
				{ id: 'vertical', sections: [{ id: 'deep', items: [{ id: 'sensor' }] }] }
			]
		},
		{ id: 'last', items: [] }
	];
}

describe('legacy cross-container dragging', () => {
	it('moves objects between root and deeply nested sections', () => {
		const sections = dashboardSections();

		expect(transferLegacyItem(sections, 'deep', 'light', 1)).toBe(true);
		expect(sections[0].items).toEqual([]);
		expect(sections[1].sections?.[1].sections?.[0].items?.map(({ id }) => id)).toEqual([
			'sensor',
			'light'
		]);
	});

	it('moves sections into and out of stacks', () => {
		const sections = dashboardSections();

		expect(transferLegacySection(sections, 'horizontal', 'last', 1)).toBe(true);
		expect(sections.map(({ id }) => id)).toEqual(['first', 'horizontal']);
		expect(sections[1].sections?.map(({ id }) => id)).toEqual(['nested', 'last', 'vertical']);

		expect(transferLegacySection(sections, null, 'nested', 0)).toBe(true);
		expect(sections.map(({ id }) => id)).toEqual(['nested', 'first', 'horizontal']);
	});

	it('clones on an Alt-drop without removing the source', () => {
		const sections = dashboardSections();
		const clone = (entry: any) => ({ ...entry, id: 'light-copy' });

		expect(transferLegacyItem(sections, 'last', 'light', 0, clone)).toBe(true);
		expect(sections[0].items?.map(({ id }) => id)).toEqual(['light']);
		expect(sections[2].items?.map(({ id }) => id)).toEqual(['light-copy']);
	});

	it('rejects an unknown source or target without mutating data', () => {
		const sections = dashboardSections();
		const before = structuredClone(sections);

		expect(transferLegacyItem(sections, 'missing', 'light', 0)).toBe(false);
		expect(transferLegacySection(sections, null, 'missing', 0)).toBe(false);
		expect(sections).toEqual(before);
	});
});
