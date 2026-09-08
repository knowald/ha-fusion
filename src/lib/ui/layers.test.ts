import { get } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';
import { layerDepth, pushLayer } from './layers';

function pressEscape() {
	window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
}

describe('layers', () => {
	it('closes only the topmost layer on Escape', () => {
		const first = vi.fn();
		const second = vi.fn();
		const releaseFirst = pushLayer(first);
		const releaseSecond = pushLayer(second);
		expect(get(layerDepth)).toBe(2);

		pressEscape();
		expect(second).toHaveBeenCalledTimes(1);
		expect(first).not.toHaveBeenCalled();

		releaseSecond();
		pressEscape();
		expect(first).toHaveBeenCalledTimes(1);

		releaseFirst();
		expect(get(layerDepth)).toBe(0);
		pressEscape();
		expect(first).toHaveBeenCalledTimes(1);
	});

	it('ignores a release called twice', () => {
		const release = pushLayer(() => {});
		release();
		release();
		expect(get(layerDepth)).toBe(0);
	});
});
