import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const ws = vi.hoisted(() => ({
	createConnection: vi.fn(),
	getUser: vi.fn()
}));

vi.mock('home-assistant-js-websocket', async (importOriginal) => ({
	...(await importOriginal<typeof import('home-assistant-js-websocket')>()),
	createLongLivedTokenAuth: vi.fn(() => ({})),
	createConnection: ws.createConnection,
	getUser: ws.getUser,
	getAuth: vi.fn(),
	subscribeConfig: vi.fn(),
	subscribeEntities: vi.fn(),
	subscribeServices: vi.fn()
}));

vi.mock('$lib/Stores', async () => {
	const { writable } = await import('svelte/store');
	return {
		states: writable(),
		connection: writable(),
		config: writable(),
		services: writable(),
		connected: writable(),
		event: writable(),
		persistentNotifications: writable()
	};
});

const modals = vi.hoisted(() => ({ openModal: vi.fn(), closeModal: vi.fn() }));
vi.mock('$lib/Modals', () => modals);

import { authentication } from './Socket';
import { connection, connected } from '$lib/Stores';

const reload = vi.fn();
vi.stubGlobal('location', { search: '', pathname: '/', reload });
vi.stubGlobal('sessionStorage', { setItem: vi.fn() });

function mockConnection() {
	const conn = {
		close: vi.fn(),
		addEventListener: vi.fn(),
		subscribeMessage: vi.fn<
			(callback: (message: unknown) => void, message: any) => Promise<() => void>
		>(() => Promise.resolve(() => {}))
	};
	ws.createConnection.mockResolvedValue(conn);
	return conn;
}

function subscription(conn: ReturnType<typeof mockConnection>, type: string) {
	const call = conn.subscribeMessage.mock.calls.find(([, message]) => message.type === type);
	return call && { callback: call[0], message: call[1] };
}

const configuration = { hassUrl: 'http://ha.local:8123', token: 'token' };

describe('authentication event subscriptions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		connection.set(undefined as any);
	});

	it('subscribes admins to HA_FUSION events only', async () => {
		const conn = mockConnection();
		ws.getUser.mockResolvedValue({ is_admin: true });

		await authentication(configuration);

		expect(subscription(conn, 'subscribe_trigger')?.message.trigger.event_type).toBe('HA_FUSION');
		expect(subscription(conn, 'subscribe_entities')).toBeUndefined();
	});

	it('skips the admin-only trigger for non-admins', async () => {
		const conn = mockConnection();
		ws.getUser.mockResolvedValue({ is_admin: false });

		await authentication(configuration);

		expect(subscription(conn, 'subscribe_trigger')).toBeUndefined();
		expect(subscription(conn, 'subscribe_entities')).toBeUndefined();
	});

	it('follows event_entity for admins and non-admins', async () => {
		for (const is_admin of [true, false]) {
			const conn = mockConnection();
			ws.getUser.mockResolvedValue({ is_admin });

			await authentication({ ...configuration, event_entity: 'input_text.fusion' });

			expect(subscription(conn, 'subscribe_entities')?.message.entity_ids).toEqual([
				'input_text.fusion'
			]);
			expect(!!subscription(conn, 'subscribe_trigger')).toBe(is_admin);
		}
	});

	it('ignores the initial snapshot and acts on state changes', async () => {
		const conn = mockConnection();
		ws.getUser.mockResolvedValue({ is_admin: false });
		await authentication({ ...configuration, event_entity: 'input_text.fusion' });
		const { callback } = subscription(conn, 'subscribe_entities')!;

		callback({ a: { 'input_text.fusion': { s: 'refresh' } } });
		expect(reload).not.toHaveBeenCalled();

		callback({ c: { 'input_text.fusion': { '+': { s: 'close_popup' } } } });
		expect(modals.closeModal).toHaveBeenCalledOnce();

		// attribute-only change, no new state string
		callback({ c: { 'input_text.fusion': { '+': { lu: 1 } } } });
		callback({ c: { 'input_text.fusion': { '+': { s: 'refresh' } } } });
		expect(reload).toHaveBeenCalledOnce();
	});

	it('logs a rejected event_entity subscription without marking the socket disconnected', async () => {
		const conn = mockConnection();
		const error = { code: 'invalid_format', message: 'Entity ID fusion is an invalid entity ID' };
		conn.subscribeMessage.mockImplementation((_callback, message) =>
			message.type === 'subscribe_entities' ? Promise.reject(error) : Promise.resolve(() => {})
		);
		ws.getUser.mockResolvedValue({ is_admin: false });
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		await authentication({ ...configuration, event_entity: 'fusion' });
		await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());

		expect(consoleError).toHaveBeenCalledWith(
			'Home Assistant event_entity subscription failed',
			error
		);
		expect(get(connected)).toBe(true);
	});

	it('closes the connection and rejects when the user lookup fails', async () => {
		const conn = mockConnection();
		const error = new Error('lookup failed');
		ws.getUser.mockRejectedValue(error);
		vi.spyOn(console, 'error').mockImplementation(() => {});

		await expect(authentication(configuration)).rejects.toBe(error);

		expect(conn.close).toHaveBeenCalledOnce();
		expect(conn.subscribeMessage).not.toHaveBeenCalled();
		expect(get(connection)).toBeUndefined();
	});
});
