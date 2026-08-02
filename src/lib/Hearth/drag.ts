import type { Action } from 'svelte/action';
import type { SliderUpdateMode } from '$lib/Types';

interface DragOptions {
	/** Updates the preview. `commit` says whether device state should also be sent. */
	set: (value: number, commit: boolean) => void;
	tap?: () => void;
	end?: (value: number) => void;
	updateMode?: SliderUpdateMode;
	/** Skip gesture handling entirely (used in edit mode so SortableJS gets the pointer) */
	disabled?: boolean;
	/**
	 * Selector for interactive children the gesture must not swallow. Needed
	 * because Svelte 5 delegates the child's own handlers to the app root, so
	 * their stopPropagation runs after this action's native pointerdown -
	 * without this check the tile captures the pointer and the child's click
	 * retargets to the tile.
	 */
	ignore?: string;
}

/**
 * Horizontal drag-to-value with tap detection: movement under 4px counts as a
 * tap, anything more sets a 0-100 value from the pointer's position within the
 * element. Apply `touch-action: none` on the element so touch drags work.
 */
export const horizontalDrag: Action<HTMLElement, DragOptions> = (node, options) => {
	let current = options;
	let tracking: { moved: boolean; pointerId: number; startX: number } | null = null;

	function fraction(event: PointerEvent) {
		const rect = node.getBoundingClientRect();
		return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
	}

	function handleDown(event: PointerEvent) {
		if (current.disabled) return;
		if (current.ignore && (event.target as Element).closest?.(current.ignore)) return;
		try {
			node.setPointerCapture(event.pointerId);
		} catch {
			// pointer capture is best-effort
		}
		tracking = { moved: false, pointerId: event.pointerId, startX: event.clientX };
	}

	function handleMove(event: PointerEvent) {
		if (!tracking || event.pointerId !== tracking.pointerId) return;
		if (Math.abs(event.clientX - tracking.startX) > 4) tracking.moved = true;
		if (tracking.moved) {
			current.set(Math.round(fraction(event) * 100), current.updateMode !== 'release');
		}
	}

	function handleUp(event: PointerEvent) {
		if (!tracking || event.pointerId !== tracking.pointerId) return;
		if (!tracking.moved && current.tap) {
			current.tap();
		} else if (tracking.moved) {
			const value = Math.round(fraction(event) * 100);
			// Always commit the final value. In release mode this is the gesture's
			// only service call; in continuous mode it guarantees the exact endpoint.
			current.set(value, true);
			current.end?.(value);
		}
		finishTracking(event.pointerId);
	}

	function finishTracking(pointerId: number) {
		tracking = null;
		try {
			node.releasePointerCapture(pointerId);
		} catch {
			// capture may already have been released by the browser
		}
	}

	function handleCancel(event: PointerEvent) {
		if (!tracking || event.pointerId !== tracking.pointerId) return;
		// Cancellation means the browser handed the gesture to scrolling or
		// navigation. Clean up without turning that interruption into a command.
		finishTracking(event.pointerId);
	}

	node.addEventListener('pointerdown', handleDown);
	node.addEventListener('pointermove', handleMove);
	node.addEventListener('pointerup', handleUp);
	node.addEventListener('pointercancel', handleCancel);

	return {
		update(next) {
			current = next;
		},
		destroy() {
			node.removeEventListener('pointerdown', handleDown);
			node.removeEventListener('pointermove', handleMove);
			node.removeEventListener('pointerup', handleUp);
			node.removeEventListener('pointercancel', handleCancel);
			if (tracking) finishTracking(tracking.pointerId);
		}
	};
};

/** Listens for the sortable action's cross-container `dndreceive` event. */
export const onDndReceive: Action<
	HTMLElement,
	(detail: { id: string; newIndex: number; alt?: boolean }) => void
> = (node, handler) => {
	let current = handler;
	const listener = (event: Event) => {
		// the event bubbles (a stack's container is nested inside its column's
		// container) - the innermost drop zone must be the only handler, or a
		// drop into a stack would also be processed by the column
		event.stopPropagation();
		current((event as CustomEvent).detail);
	};
	node.addEventListener('dndreceive', listener);
	return {
		update(next) {
			current = next;
		},
		destroy() {
			node.removeEventListener('dndreceive', listener);
		}
	};
};
