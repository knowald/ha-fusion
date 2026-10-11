export const HEARTH_REFRESH_MS = 5 * 60 * 1000;

const dataCache = new Map<string, { expires: number; value: unknown }>();

/** Short-lived cross-mount cache for expensive recorder queries. */
export async function cachedData<T>(key: string, load: () => Promise<T>, ttl = 60_000): Promise<T> {
	const now = Date.now();
	for (const [cacheKey, entry] of dataCache) {
		if (entry.expires <= now) dataCache.delete(cacheKey);
	}
	const cached = dataCache.get(key);
	if (cached) return cached.value as T;
	const value = await load();
	dataCache.set(key, { expires: Date.now() + ttl, value });
	return value;
}

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
