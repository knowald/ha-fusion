import type { Action } from 'svelte/action';
import type { SliderUpdateMode } from '$lib/Types';

interface DragOptions {
	/** Updates the preview. `commit` says whether device state should also be sent. */
	set: (value: number, commit: boolean) => void;
	tap?: () => void;
	/** Long-press without movement; suppresses the tap for that gesture. */
	hold?: () => void;
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
 * Horizontal drag-to-value with tap detection: movement up to 10px counts as a
 * tap, anything more sets a 0-100 value from the pointer's position within the
 * element. Apply `touch-action: none` on the element so touch drags work.
 */
export const horizontalDrag: Action<HTMLElement, DragOptions> = (node, options) => {
	let current = options;
	let tracking: { moved: boolean; held: boolean; pointerId: number; startX: number } | null = null;
	let holdTimer: ReturnType<typeof setTimeout> | undefined;

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
		tracking = { moved: false, held: false, pointerId: event.pointerId, startX: event.clientX };
		if (current.hold) {
			holdTimer = setTimeout(() => {
				if (!tracking || tracking.moved) return;
				tracking.held = true;
				current.hold?.();
			}, 500);
		}
	}

	function handleMove(event: PointerEvent) {
		if (!tracking || event.pointerId !== tracking.pointerId || tracking.held) return;
		if (Math.abs(event.clientX - tracking.startX) > 10) {
			tracking.moved = true;
			clearTimeout(holdTimer);
		}
		if (tracking.moved) {
			current.set(Math.round(fraction(event) * 100), current.updateMode !== 'release');
		}
	}

	function handleUp(event: PointerEvent) {
		if (!tracking || event.pointerId !== tracking.pointerId) return;
		if (tracking.held) {
			// the hold already acted; the release must not toggle on top of it
		} else if (!tracking.moved && current.tap) {
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
		clearTimeout(holdTimer);
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

export { onDndReceive } from '$lib/Actions/sortable';
