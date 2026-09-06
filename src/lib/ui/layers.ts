import { readable } from 'svelte/store';

/*
 * One stack for everything that opens above the page: sheets, popups,
 * popovers, pickers, confirmations, the search overlay. The layer on top owns
 * Escape, so nested overlays close one at a time in the order they opened and
 * no component needs its own window listener or propagation tricks. Window
 * shortcuts read the depth so they never open another layer over an open one.
 */

interface Layer {
	close: () => void;
}

const stack: Layer[] = [];
let notify: (depth: number) => void = () => {};

export const layerDepth = readable(0, (set) => {
	notify = set;
	set(stack.length);
	return () => {
		notify = () => {};
	};
});

function handleKeydown(event: KeyboardEvent) {
	if (event.key !== 'Escape' || event.defaultPrevented) return;
	const top = stack[stack.length - 1];
	if (!top) return;
	event.preventDefault();
	event.stopImmediatePropagation();
	top.close();
}

/** Register an open layer; call the returned function when it closes. */
export function pushLayer(close: () => void): () => void {
	if (typeof window === 'undefined') return () => {};
	const layer: Layer = { close };
	if (stack.length === 0) window.addEventListener('keydown', handleKeydown, true);
	stack.push(layer);
	notify(stack.length);
	return () => {
		const index = stack.indexOf(layer);
		if (index === -1) return;
		stack.splice(index, 1);
		if (stack.length === 0) window.removeEventListener('keydown', handleKeydown, true);
		notify(stack.length);
	};
}

/** Svelte action form: the node is a layer while mounted. */
export function layer(node: HTMLElement, close: () => void) {
	let current = close;
	const release = pushLayer(() => current());
	return {
		update(next: () => void) {
			current = next;
		},
		destroy: release
	};
}
