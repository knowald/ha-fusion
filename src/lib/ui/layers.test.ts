import { get } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';
import { autocompleteOpen } from './codeEditorState';
import { layer, layerDepth, pushLayer } from './layers';

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

describe('layer action', () => {
	it('closes through the latest callback and returns focus to the opener', () => {
		const opener = document.createElement('button');
		const node = document.createElement('div');
		node.tabIndex = -1;
		document.body.append(opener, node);
		opener.focus();
		const first = vi.fn();
		const second = vi.fn();
		const action = layer(node, first);
		node.focus();
		action.update(second);
		pressEscape();
		expect(second).toHaveBeenCalledTimes(1);
		expect(first).not.toHaveBeenCalled();
		action.destroy();
		expect(document.activeElement).toBe(opener);
		expect(get(layerDepth)).toBe(0);
		opener.remove();
		node.remove();
	});

	it('leaves Escape to an open code completion list', () => {
		const close = vi.fn();
		const release = pushLayer(close);
		autocompleteOpen.set(true);
		pressEscape();
		expect(close).not.toHaveBeenCalled();
		autocompleteOpen.set(false);
		pressEscape();
		expect(close).toHaveBeenCalledTimes(1);
		release();
	});
});
