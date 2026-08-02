export const HEARTH_REFRESH_MS = 5 * 60 * 1000;

/**
 * Shared polling lifetime for Hearth's request/response surfaces. It loads
 * immediately, avoids overlapping requests, retains the last good value on a
 * transient error, and ignores a response after its consumer is destroyed.
 */
export function startDataRefresh<T>(
	load: () => Promise<T>,
	apply: (value: T) => void,
	interval = HEARTH_REFRESH_MS
): () => void {
	let active = true;
	let inFlight = false;

	async function refresh() {
		if (!active || inFlight) return;
		inFlight = true;
		try {
			const value = await load();
			if (active) apply(value);
		} catch {
			// Preserve the last successful value; the next interval or reconnect
			// retries instead of blanking a useful surface.
		} finally {
			inFlight = false;
		}
	}

	void refresh();
	const timer = setInterval(refresh, interval);
	return () => {
		active = false;
		clearInterval(timer);
	};
}
