import { getContext, setContext } from 'svelte';
import type { Action } from 'svelte/action';

export type HearthInteractionMode = 'runtime' | 'layout-edit' | 'preview';
type HearthInteractionSource = HearthInteractionMode | (() => HearthInteractionMode);

const INTERACTION_MODE = Symbol('hearth-interaction-mode');

/** Sets the interaction contract inherited by a rendered Hearth subtree. */
export function provideHearthInteractionMode(source: HearthInteractionSource) {
	setContext(INTERACTION_MODE, source);
}

/** Runtime is the default for cards rendered outside an explicit wrapper. */
export function getHearthInteractionMode(): HearthInteractionMode {
	const source = getContext<HearthInteractionSource | undefined>(INTERACTION_MODE);
	return typeof source === 'function' ? source() : (source ?? 'runtime');
}

/** Adds native-button Enter/Space behavior to composite controls. */
export function activateOnKeyboard(event: KeyboardEvent, action: () => void) {
	if (event.key !== 'Enter' && event.key !== ' ') return;
	event.preventDefault();
	action();
}

interface LongPressOptions {
	hold: () => void;
	disabled?: boolean;
}

/**
 * Long-press for tiles without a drag gesture: 500ms without moving more than
 * 10px fires `hold` and swallows the click that follows the release.
 */
export const longPress: Action<HTMLElement, LongPressOptions> = (node, options) => {
	let current = options;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let start: { x: number; y: number } | null = null;
	let held = false;

	function handleDown(event: PointerEvent) {
		if (current.disabled) return;
		held = false;
		start = { x: event.clientX, y: event.clientY };
		timer = setTimeout(() => {
			held = true;
			current.hold();
		}, 500);
	}

	function handleMove(event: PointerEvent) {
		if (!start) return;
		if (Math.abs(event.clientX - start.x) > 10 || Math.abs(event.clientY - start.y) > 10) cancel();
	}

	function cancel() {
		clearTimeout(timer);
		start = null;
	}

	// capture phase, so the tile's own onclick never sees a post-hold release
	function handleClick(event: MouseEvent) {
		if (!held) return;
		held = false;
		event.stopPropagation();
		event.preventDefault();
	}

	node.addEventListener('pointerdown', handleDown);
	node.addEventListener('pointermove', handleMove);
	node.addEventListener('pointerup', cancel);
	node.addEventListener('pointercancel', cancel);
	node.addEventListener('click', handleClick, true);

	return {
		update(next: LongPressOptions) {
			current = next;
		},
		destroy() {
			clearTimeout(timer);
			node.removeEventListener('pointerdown', handleDown);
			node.removeEventListener('pointermove', handleMove);
			node.removeEventListener('pointerup', cancel);
			node.removeEventListener('pointercancel', cancel);
			node.removeEventListener('click', handleClick, true);
		}
	};
};
