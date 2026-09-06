import { render } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushLayer } from '$lib/ui/layers';
import { DEFAULT_HEARTH_CONFIG } from '../config';
import { cancelEdit, enterEditMode, hearthConfig, hearthEditMode, updateConfig } from '../store';
import Keyboard from './Keyboard.svelte';

function press(key: string, init: KeyboardEventInit = {}) {
	window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true, ...init }));
}

describe('Keyboard', () => {
	afterEach(() => {
		if (get(hearthEditMode)) cancelEdit();
		hearthConfig.set(structuredClone(DEFAULT_HEARTH_CONFIG));
	});

	it('opens search on f only when a search widget exists and nothing is layered', () => {
		const onsearch = vi.fn();
		render(Keyboard, { onsearch });
		hearthConfig.set({ ...structuredClone(DEFAULT_HEARTH_CONFIG), rail: [] });
		press('f');
		expect(onsearch).not.toHaveBeenCalled();
		hearthConfig.set({
			...structuredClone(DEFAULT_HEARTH_CONFIG),
			rail: [{ id: 'search', type: 'search' }]
		});
		const release = pushLayer(() => {});
		press('f');
		expect(onsearch).not.toHaveBeenCalled();
		release();
		press('f');
		expect(onsearch).toHaveBeenCalledTimes(1);
	});

	it('undoes and redoes with cmd+z while editing', () => {
		render(Keyboard, { onsearch: () => {} });
		enterEditMode();
		updateConfig((config) => {
			config.padding_x = 42;
		});
		press('z', { metaKey: true });
		expect(get(hearthConfig).padding_x).not.toBe(42);
		press('z', { metaKey: true, shiftKey: true });
		expect(get(hearthConfig).padding_x).toBe(42);
	});
});
