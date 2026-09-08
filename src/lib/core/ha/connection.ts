import { derived, get, writable } from 'svelte/store';
import {
	createConnection,
	createLongLivedTokenAuth,
	ERR_CANNOT_CONNECT,
	ERR_CONNECTION_LOST,
	ERR_HASS_HOST_REQUIRED,
	ERR_INVALID_AUTH,
	ERR_INVALID_AUTH_CALLBACK,
	ERR_INVALID_HTTPS_TO_HTTP,
	getAuth,
	subscribeConfig,
	subscribeEntities,
	subscribeServices,
	type Auth,
	type AuthData,
	type Connection,
	type HassConfig,
	type HassServices
} from 'home-assistant-js-websocket';
import type { Configuration, PersistentNotification } from '../app/configuration';
import { states } from './entities';

/*
 * The one Home Assistant connection. Everything that reaches the server goes
 * through the stores and functions here: the dashboards never create their own
 * connection or subscriptions.
 */

export const connection = writable<Connection>();
export const config = writable<HassConfig>();
export const services = writable<HassServices>();

/**
 * booting: no connection has succeeded yet
 * connected: socket open and every subscription live
 * degraded: socket open but a subscription failed, so some data is stale
 * lost: the socket dropped and the library is reconnecting
 */
export type ConnectionHealth = 'booting' | 'connected' | 'degraded' | 'lost';
export const health = writable<ConnectionHealth>('booting');

/** True only while the socket is open; the guard for sending commands. */
export const connected = derived(health, ($health) => $health === 'connected');

/** Latest HA_FUSION trigger event name, for surfaces that react to remote commands. */
export const event = writable<string | undefined>();

export const persistentNotifications = writable<Record<string, PersistentNotification>>({});

type TriggerListener = (trigger: string) => void;
const triggerListeners = new Set<TriggerListener>();

/** Runs `listener` for every HA_FUSION trigger event, including repeats of the same name. */
export function subscribeHassTriggers(listener: TriggerListener): () => void {
	triggerListeners.add(listener);
	return () => triggerListeners.delete(listener);
}

const tokenStorage = {
	async loadTokens() {
		try {
			const raw = localStorage.hassTokens;
			// guard against a missing key or the literal "null"/"undefined" string
			if (!raw || raw === 'null' || raw === 'undefined') return undefined;
			const tokens = JSON.parse(raw);
			// treat a value that isn't actually a token object as no tokens
			if (!tokens?.access_token && !tokens?.refresh_token) return undefined;
			return tokens;
		} catch {
			// corrupt json in localStorage, treat as no tokens
			return undefined;
		}
	},
	saveTokens(tokens: AuthData | null) {
		localStorage.hassTokens = JSON.stringify(tokens);
	},
	clearTokens() {
		localStorage.removeItem('hassTokens');
	}
};

export interface ConnectionHooks {
	/**
	 * Called once when the companion app needs a long-lived token; the auth
	 * redirect flow does not work there. The caller shows whatever prompt it
	 * has; authentication keeps failing until the configuration carries a token.
	 */
	onTokenRequired?: () => void;
}

let tokenPromptShown = false;

function trackSubscription(subscription: Promise<unknown>, channel: string) {
	void subscription.catch((error) => {
		console.error(`Home Assistant ${channel} subscription failed`, error);
		health.update((current) => (current === 'connected' ? 'degraded' : current));
	});
}

export async function authentication(
	configuration: Configuration,
	hooks: ConnectionHooks = {},
	/** False once a newer startConnection took over; the result is then discarded. */
	isCurrent: () => boolean = () => true
) {
	if (!configuration?.hassUrl) {
		health.set('lost');
		throw new Error('Home Assistant URL is not configured');
	}

	let auth: Auth | undefined;

	try {
		if (configuration?.token) {
			auth = createLongLivedTokenAuth(configuration.hassUrl, configuration.token);
		} else if (navigator.userAgent.includes('Home Assistant')) {
			// companion app and ingress break the auth redirect
			if (!tokenPromptShown) {
				tokenPromptShown = true;
				hooks.onTokenRequired?.();
			}
			health.set('lost');
			// not a successful authentication: callers must keep retrying until
			// the configuration supplies a long-lived token
			throw new Error('A long-lived access token is required in the companion app');
		} else {
			// ingress serves the app from a per-installation path; pass an
			// explicit redirect that keeps that path (origin alone would land
			// the callback on the HA frontend, not this app) and strips the
			// query string so callback state matching stays clean - the lib
			// appends its own auth_callback flag
			const isIngress = window.location.pathname.includes('/api/hassio_ingress/');
			const redirectUrl = isIngress
				? `${window.location.origin}${window.location.pathname}`
				: undefined;

			auth = await getAuth({
				...tokenStorage,
				hassUrl: configuration.hassUrl,
				...(redirectUrl && { redirectUrl })
			});
			if (auth.expired) await auth.refreshAccessToken();
		}

		const conn = await createConnection({ auth });
		if (!isCurrent()) {
			// a newer configuration is connecting; this socket must not become the app's
			conn.close();
			return;
		}
		tokenPromptShown = false;
		connection.set(conn);

		// the lib fires "ready" inside the Connection constructor, before any
		// listener can be attached, so the initial connect is marked by hand
		health.set('connected');

		// these three keep themselves alive across reconnects inside the library
		subscribeEntities(conn, (hassEntities) => states.set(hassEntities));
		subscribeConfig(conn, (hassConfig) => config.set(hassConfig));
		subscribeServices(conn, (hassServices) => services.set(hassServices));

		conn.addEventListener('ready', () => {
			console.debug('connected.');
			health.set('connected');
		});
		conn.addEventListener('disconnected', () => {
			console.debug('connecting...');
			health.set('lost');
		});
		conn.addEventListener('reconnect-error', () => {
			console.error('ERR_INVALID_AUTH.');
			health.set('lost');
		});

		// clear auth query string
		if (location.search.includes('auth_callback=1')) {
			history.replaceState(null, '', location.pathname);
		}

		trackSubscription(
			conn.subscribeMessage(
				(message: { variables?: { trigger?: { event?: { data?: { event?: unknown } } } } }) => {
					const trigger = message?.variables?.trigger?.event?.data?.event;
					if (typeof trigger !== 'string') return;
					event.set(trigger);
					for (const listener of triggerListeners) listener(trigger);
					if (trigger === 'refresh') {
						sessionStorage.setItem('event', 'refresh');
						location.reload();
					}
				},
				{
					type: 'subscribe_trigger',
					trigger: { platform: 'event', event_type: 'HA_FUSION' }
				}
			),
			'HA_FUSION events'
		);

		trackSubscription(
			conn.subscribeMessage(
				(data: {
					type: 'added' | 'removed' | 'current' | 'updated';
					notifications: Record<string, PersistentNotification>;
				}) => {
					if (data?.type === 'current') {
						persistentNotifications.set(data?.notifications);
					} else if (data?.type === 'added' || data?.type === 'updated') {
						persistentNotifications.update((notifications) => ({
							...notifications,
							...data?.notifications
						}));
					} else if (data?.type === 'removed') {
						persistentNotifications.update((notifications) => {
							for (const id of Object.keys(data?.notifications)) delete notifications[id];
							return { ...notifications };
						});
					}
				},
				{ type: 'persistent_notification/subscribe' }
			),
			'persistent notifications'
		);
	} catch (error) {
		handleError(error);
	}
}

function handleError(error: unknown) {
	switch (error) {
		case ERR_INVALID_AUTH:
			console.error('ERR_INVALID_AUTH');
			tokenStorage.clearTokens();
			break;
		case ERR_INVALID_AUTH_CALLBACK:
			// raised by getAuth() when the auth callback state (client id /
			// hass url) doesn't match, clear the stale tokens and query
			// string so the next retry restarts the auth flow cleanly
			console.error('ERR_INVALID_AUTH_CALLBACK');
			tokenStorage.clearTokens();
			if (location.search.includes('auth_callback=1')) {
				history.replaceState(null, '', location.pathname);
			}
			break;
		case ERR_CANNOT_CONNECT:
			console.error('ERR_CANNOT_CONNECT');
			break;
		case ERR_CONNECTION_LOST:
			console.error('ERR_CONNECTION_LOST');
			break;
		case ERR_HASS_HOST_REQUIRED:
			console.error('ERR_HASS_HOST_REQUIRED');
			break;
		case ERR_INVALID_HTTPS_TO_HTTP:
			console.error('ERR_INVALID_HTTPS_TO_HTTP');
			break;
		default:
			console.error(error);
	}
	throw error;
}

const RETRY_MS = 3000;
let retryTimer: ReturnType<typeof setInterval> | undefined;
// bumped by every start, so an attempt from a superseded run cannot stop the
// retry loop of the run that replaced it
let currentRun = 0;

/**
 * Authenticates and keeps retrying every few seconds until it succeeds. Calling
 * it again (after the token changed, say) restarts the loop; the library owns
 * reconnects once a connection exists, so success ends the loop for good.
 */
export function startConnection(configuration: Configuration, hooks: ConnectionHooks = {}) {
	stopConnection();
	const run = ++currentRun;
	let connecting = false;
	const attempt = async () => {
		if (connecting || run !== currentRun) return;
		connecting = true;
		try {
			await authentication(configuration, hooks, () => run === currentRun);
			if (run === currentRun) stopConnection();
		} catch {
			// retried on the interval
		} finally {
			connecting = false;
		}
	};
	void attempt();
	retryTimer = setInterval(attempt, RETRY_MS);
	return stopConnection;
}

export function stopConnection() {
	if (retryTimer) clearInterval(retryTimer);
	retryTimer = undefined;
	// an attempt still awaiting createConnection sees a stale run and discards its socket
	currentRun += 1;
}

/** The live connection, or undefined while booting. */
export function currentConnection(): Connection | undefined {
	return get(connection);
}
