import { get, writable } from 'svelte/store';
import { callService, type HassEntity } from 'home-assistant-js-websocket';
import { connected, connection } from './connection';
import { states } from './entities';

/*
 * The command pipeline: every device call leaves through service() here, with
 * the optimistic overrides, the pending pulse and the failure report around it.
 */

/**
 * Whether commands may leave right now. A dashboard sets this while its layout
 * editor is open, where a tap arranges cards and must never reach a device.
 */
let commandsAllowed: () => boolean = () => true;

export function setCommandGate(allowed: () => boolean) {
	commandsAllowed = allowed;
}

/* optimistic overrides */

/**
 * Optimistic overrides keyed by "<kind>:<entity_id>". While a drag is in
 * progress the dragged value wins over the entity state, then expires so the
 * entity state (updated via websocket) takes back over.
 */
export const controlOverrides = writable<Record<string, number>>({});
const overrideTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function setControlOverride(key: string, value: number, ttl = 2000) {
	clearTimeout(overrideTimers[key]);
	controlOverrides.update((current) => ({ ...current, [key]: value }));
	overrideTimers[key] = setTimeout(() => {
		delete overrideTimers[key];
		controlOverrides.update((current) => {
			const next = { ...current };
			delete next[key];
			return next;
		});
	}, ttl);
}

function clearControlOverridesForEntity(entityId: string) {
	controlOverrides.update((current) => {
		const next = Object.fromEntries(
			Object.entries(current).filter(([key]) => !key.endsWith(`:${entityId}`))
		);
		return Object.keys(next).length === Object.keys(current).length ? current : next;
	});
	for (const key of Object.keys(overrideTimers)) {
		if (!key.endsWith(`:${entityId}`)) continue;
		clearTimeout(overrideTimers[key]);
		delete overrideTimers[key];
	}
}

export function controlValueFor(
	key: string,
	actual: number,
	$overrides: Record<string, number>
): number {
	return $overrides[key] ?? actual;
}

/* throttling */

// trailing-edge throttle per key so drags emit at most one service call per
// interval but the final value is always sent
const throttleState: Record<
	string,
	{ last: number; timer?: ReturnType<typeof setTimeout>; cleanup?: ReturnType<typeof setTimeout> }
> = {};

export function throttled(key: string, fn: () => void, interval = 200) {
	const entry = (throttleState[key] ??= { last: 0 });
	clearTimeout(entry.timer);
	clearTimeout(entry.cleanup);
	const run = () => {
		entry.timer = undefined;
		entry.last = Date.now();
		fn();
		entry.cleanup = setTimeout(() => {
			if (throttleState[key] === entry && !entry.timer) delete throttleState[key];
		}, interval);
	};
	const elapsed = Date.now() - entry.last;
	if (elapsed >= interval) {
		run();
	} else {
		entry.timer = setTimeout(run, interval - elapsed);
	}
}

/* pending */

/**
 * Entities with a command in flight: marked when a discrete command is sent,
 * cleared when the websocket delivers a state change for that entity (or after
 * a timeout for commands that never produce one). Drives the "processing"
 * pulse in the UI. Drag-driven commands are excluded - they already have
 * optimistic overrides.
 */
export const pendingEntities = writable<Record<string, true>>({});
const pendingTimers: Record<string, ReturnType<typeof setTimeout>> = {};
// subscribeEntities replaces an entity's object only when it changed, so an
// identity check per pending entity detects the confirming update
const pendingBaselines: Record<string, HassEntity | undefined> = {};

function clearPending(entityId: string) {
	clearTimeout(pendingTimers[entityId]);
	delete pendingTimers[entityId];
	delete pendingBaselines[entityId];
	pendingEntities.update((current) => {
		if (!(entityId in current)) return current;
		const next = { ...current };
		delete next[entityId];
		return next;
	});
}

export function markPending(entityId: string, ttl = 5000) {
	// no command, no pending glow
	if (!commandsAllowed()) return;
	clearTimeout(pendingTimers[entityId]);
	pendingEntities.update((current) => ({ ...current, [entityId]: true }));
	pendingBaselines[entityId] = get(states)?.[entityId];
	pendingTimers[entityId] = setTimeout(() => clearPending(entityId), ttl);
}

states.subscribe(($states) => {
	if (!$states) return;
	for (const entityId of Object.keys(get(pendingEntities))) {
		const previous = pendingBaselines[entityId];
		if (previous && $states[entityId] && previous !== $states[entityId]) {
			clearPending(entityId);
			clearControlOverridesForEntity(entityId);
		}
	}
});

/* failures */

export interface CommandFailure {
	entityId: string | null;
	detail: string;
}

/** Latest failed device command, rendered by the dashboard as an alert. */
export const commandFailure = writable<CommandFailure | null>(null);
let commandFailureTimer: ReturnType<typeof setTimeout>;

export function dismissCommandFailure() {
	clearTimeout(commandFailureTimer);
	commandFailure.set(null);
}

function reportCommandFailure(entityId: string | null, error: unknown) {
	if (entityId) {
		clearPending(entityId);
		clearControlOverridesForEntity(entityId);
	}
	const detail = error instanceof Error ? error.message : String(error);
	commandFailure.set({ entityId, detail });
	clearTimeout(commandFailureTimer);
	commandFailureTimer = setTimeout(() => commandFailure.set(null), 8000);
}

/* sending */

export function service(domain: string, name: string, data: Record<string, unknown>) {
	if (!commandsAllowed()) return;
	const entityId = typeof data.entity_id === 'string' ? data.entity_id : null;
	const conn = get(connection);
	// the connection object survives reconnects, so `connected` is the
	// authoritative guard during a dropped websocket
	if (!conn || !get(connected)) {
		reportCommandFailure(entityId, new Error('Not connected to Home Assistant'));
		return;
	}
	callService(conn, domain, name, data).catch((error) => {
		console.error(error);
		reportCommandFailure(entityId, error);
	});
}

export function callEntityService(
	domain: string,
	name: string,
	entityId: string,
	data: Record<string, unknown> = {}
) {
	markPending(entityId);
	service(domain, name, { entity_id: entityId, ...data });
}

export function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}
