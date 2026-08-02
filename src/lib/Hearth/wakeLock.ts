import type { Action } from 'svelte/action';
import { writable } from 'svelte/store';

export type WakeLockState = 'disabled' | 'requesting' | 'active' | 'unsupported' | 'denied';
export const wakeLockState = writable<WakeLockState>('disabled');

/**
 * Keeps the screen awake via navigator.wakeLock while the parameter is true.
 * The browser drops the lock whenever the tab hides, so it is re-requested on
 * every visibilitychange back to visible. No-ops where the API is missing
 * (HTTP contexts, older browsers).
 */
export const wakeLock: Action<HTMLElement, boolean> = (node, enabled) => {
	let wanted = enabled;
	let sentinel: WakeLockSentinel | null = null;

	async function acquire() {
		if (!wanted) {
			wakeLockState.set('disabled');
			return;
		}
		if (!('wakeLock' in navigator)) {
			wakeLockState.set('unsupported');
			return;
		}
		if (document.visibilityState !== 'visible') return;
		if (sentinel && !sentinel.released) return;
		wakeLockState.set('requesting');
		try {
			const lock = await navigator.wakeLock.request('screen');
			// the parameter may have flipped while the request was in flight
			if (wanted) {
				sentinel = lock;
				wakeLockState.set('active');
				lock.addEventListener('release', () => {
					if (sentinel === lock) sentinel = null;
					if (wanted) wakeLockState.set('requesting');
				});
			} else lock.release().catch(() => {});
		} catch {
			wakeLockState.set('denied');
		}
	}

	function release() {
		sentinel?.release().catch(() => {});
		sentinel = null;
		if (!wanted) wakeLockState.set('disabled');
	}

	function handleVisibility() {
		if (document.visibilityState === 'visible') acquire();
	}

	document.addEventListener('visibilitychange', handleVisibility);
	acquire();

	return {
		update(next) {
			wanted = next;
			if (wanted) acquire();
			else release();
		},
		destroy() {
			document.removeEventListener('visibilitychange', handleVisibility);
			wanted = false;
			release();
		}
	};
};
