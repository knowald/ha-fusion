import { get } from 'svelte/store';
import type { Connection } from 'home-assistant-js-websocket';
import { connection } from './connection';

/*
 * Read-side Home Assistant calls: recorder statistics, state history,
 * calendar events, template renders and weather forecasts. Components consume
 * these instead of speaking the websocket protocol themselves.
 */

/** How often request/response surfaces poll; subscriptions push instead. */
export const DATA_REFRESH_MS = 5 * 60 * 1000;
/** @deprecated use DATA_REFRESH_MS */
export const HEARTH_REFRESH_MS = DATA_REFRESH_MS;

function requireConnection(): Connection {
	const conn = get(connection);
	if (!conn) throw new Error('Not connected to Home Assistant');
	return conn;
}

export type StatisticPeriod = '5minute' | 'hour' | 'day' | 'week' | 'month';

export interface StatisticRow {
	start: number;
	end: number;
	mean?: number;
	min?: number;
	max?: number;
	state?: number;
	sum?: number;
	change?: number;
}

export async function fetchStatistics(
	statisticIds: string[],
	start: Date,
	end: Date,
	period: StatisticPeriod
): Promise<Record<string, StatisticRow[]>> {
	const result = await requireConnection().sendMessagePromise<Record<string, StatisticRow[]>>({
		type: 'recorder/statistics_during_period',
		start_time: start.toISOString(),
		end_time: end.toISOString(),
		statistic_ids: statisticIds,
		period
	});
	return result ?? {};
}

/** The mean (or last state) per bucket for one statistic; null with fewer than two points. */
export async function fetchStatisticSeries(
	statisticId: string,
	start: Date,
	end: Date,
	period: StatisticPeriod
): Promise<number[] | null> {
	const rows = (await fetchStatistics([statisticId], start, end, period))[statisticId] ?? [];
	const values = rows
		.map((row) => row.mean ?? row.state)
		.filter((entry): entry is number => typeof entry === 'number');
	return values.length < 2 ? null : values;
}

/** A compact state change: `s` is the state, `lu` the last-updated time in seconds. */
export interface StateChange {
	s: string;
	lu: number;
}

export async function fetchStateHistory(
	entityIds: string[],
	start: Date,
	end: Date
): Promise<Record<string, StateChange[]>> {
	const result = await requireConnection().sendMessagePromise<Record<string, StateChange[]>>({
		type: 'history/history_during_period',
		start_time: start.toISOString(),
		end_time: end.toISOString(),
		entity_ids: entityIds,
		minimal_response: true,
		no_attributes: true
	});
	return result ?? {};
}

export interface CalendarEvent {
	summary?: string;
	/** ISO string; date-only for all-day events. Older clients send an object. */
	start?: string | { dateTime?: string; date?: string };
	end?: string | { dateTime?: string; date?: string };
}

/** Upcoming events across the given calendars, unsorted. */
export async function fetchCalendarEvents(
	entityIds: string[],
	start: Date,
	end: Date
): Promise<CalendarEvent[]> {
	const result = await requireConnection().sendMessagePromise<{
		response?: Record<string, { events?: CalendarEvent[] }>;
	}>({
		type: 'call_service',
		domain: 'calendar',
		service: 'get_events',
		target: { entity_id: entityIds },
		service_data: { start_date_time: start.toISOString(), end_date_time: end.toISOString() },
		return_response: true
	});
	return Object.values(result?.response ?? {}).flatMap((calendar) => calendar?.events ?? []);
}

/** Renders a template and re-renders whenever a referenced state changes. Resolves with the unsubscribe. */
export function subscribeTemplate(
	template: string,
	onRender: (result: string) => void
): Promise<() => void> {
	return requireConnection().subscribeMessage<{ result?: unknown }>(
		(response) => {
			if (typeof response?.result === 'string') onRender(response.result);
		},
		{ type: 'render_template', template }
	);
}

export interface ForecastEntry {
	datetime: string;
	temperature?: number;
	templow?: number;
	condition?: string;
	precipitation_probability?: number;
}

export function subscribeForecast(
	entityId: string,
	forecastType: 'daily' | 'hourly' | 'twice_daily',
	onForecast: (forecast: ForecastEntry[]) => void
): Promise<() => void> {
	return requireConnection().subscribeMessage<{ forecast?: ForecastEntry[] }>(
		(message) => onForecast(message?.forecast ?? []),
		{ type: 'weather/subscribe_forecast', entity_id: entityId, forecast_type: forecastType }
	);
}

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
