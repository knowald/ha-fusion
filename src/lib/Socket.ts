import {
	getAuth,
	createLongLivedTokenAuth,
	createConnection,
	subscribeConfig,
	subscribeEntities,
	subscribeServices,
	ERR_CANNOT_CONNECT,
	ERR_INVALID_AUTH,
	ERR_CONNECTION_LOST,
	ERR_HASS_HOST_REQUIRED,
	ERR_INVALID_HTTPS_TO_HTTP,
	ERR_INVALID_AUTH_CALLBACK
} from 'home-assistant-js-websocket';
import type { Auth, AuthData } from 'home-assistant-js-websocket';
import {
	states,
	connection,
	config,
	services,
	connected,
	event,
	persistentNotifications
} from '$lib/Stores';
import { openModal, closeModal } from '$lib/Modals';
import type { Configuration, PersistentNotification } from '$lib/Types';

const options = {
	hassUrl: undefined as string | undefined,
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

export async function authentication(configuration: Configuration) {
	if (!configuration?.hassUrl) {
		console.error('hassUrl is undefined...');
		return;
	}

	let auth: Auth | undefined;

	try {
		// long lived access token
		if (configuration?.token) {
			auth = createLongLivedTokenAuth(configuration?.hassUrl, configuration?.token);

			// companion app and ingress causes issues with auth redirect
			// open special modal to enter long lived access token
		} else if (navigator.userAgent.includes('Home Assistant')) {
			openModal(() => import('$lib/Components/TokenModal.svelte'));
			return;

			// default auth flow
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
				...options,
				hassUrl: configuration?.hassUrl,
				...(redirectUrl && { redirectUrl })
			});
			if (auth.expired) await auth.refreshAccessToken();
		}

		// connection
		const conn = await createConnection({ auth });
		connection.set(conn);

		// the lib fires "ready" inside the Connection constructor, before any
		// listener can be attached, so the initial connect must be set manually
		connected.set(true);

		// states
		subscribeEntities(conn, (hassEntities) => {
			states.set(hassEntities);
		});

		// config
		subscribeConfig(conn, (hassConfig) => {
			config.set(hassConfig);
		});

		// services
		subscribeServices(conn, (hassServices) => {
			services.set(hassServices);
		});

		// events
		conn.addEventListener('ready', () => {
			console.debug('connected.');
			connected.set(true);
		});

		conn.addEventListener('disconnected', () => {
			console.debug('connecting...');
			connected.set(false);
		});

		conn.addEventListener('reconnect-error', () => {
			console.error('ERR_INVALID_AUTH.');
			connected.set(false);
		});

		// clear auth query string
		if (location.search.includes('auth_callback=1')) {
			history.replaceState(null, '', location.pathname);
		}

		// custom events
		conn?.subscribeMessage(
			(message: any) => {
				const trigger = message?.variables?.trigger?.event?.data?.event;

				// close_popup
				if (trigger === 'close_popup') {
					event.set('close_popup');
					closeModal();
				}

				// refresh
				else if (trigger === 'refresh') {
					sessionStorage.setItem('event', 'refresh');
					location.reload();
				}
			},
			{
				type: 'subscribe_trigger',
				trigger: {
					platform: 'event',
					event_type: 'HA_FUSION'
				}
			}
		);

		// notifications
		conn?.subscribeMessage(
			(data: {
				type: 'added' | 'removed' | 'current' | 'updated';
				notifications: Record<string, PersistentNotification>;
			}) => {
				// initial
				if (data?.type === 'current') {
					persistentNotifications.set(data?.notifications);

					// update
				} else if (data?.type === 'added' || data?.type === 'updated') {
					persistentNotifications.update((notifications) => ({
						...notifications,
						...data?.notifications
					}));

					// remove
				} else if (data?.type === 'removed') {
					persistentNotifications.update((notifications) => {
						Object.keys(data?.notifications).forEach((notificationId) => {
							delete notifications[notificationId];
						});
						return { ...notifications };
					});
				}
			},
			{
				type: 'persistent_notification/subscribe'
			}
		);
	} catch (_error) {
		handleError(_error);
	}
}

// error string instead of code
function handleError(_error: unknown) {
	switch (_error) {
		case ERR_INVALID_AUTH:
			console.error('ERR_INVALID_AUTH');
			options.clearTokens();
			break;
		case ERR_INVALID_AUTH_CALLBACK:
			// raised by getAuth() when the auth callback state (client id /
			// hass url) doesn't match, clear the stale tokens and query
			// string so the next retry restarts the auth flow cleanly
			console.error('ERR_INVALID_AUTH_CALLBACK');
			options.clearTokens();
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
			console.error(_error);
	}
	throw _error;
}
