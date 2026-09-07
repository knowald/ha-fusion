import { afterEach, describe, expect, it, vi } from 'vitest';
import { callService } from 'home-assistant-js-websocket';
import type { Connection } from 'home-assistant-js-websocket';
import { connection, health } from './connection';
import { cachedData, callServiceForResult, startDataRefresh } from './history';

vi.mock('home-assistant-js-websocket', async (importOriginal) => ({
	...(await importOriginal<typeof import('home-assistant-js-websocket')>()),
	callService: vi.fn()
}));

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
	connection.set(undefined as unknown as Connection);
	health.set('lost');
});

describe('callServiceForResult', () => {
	it('returns the service result and null when there is none', async () => {
		connection.set({} as Connection);
		health.set('connected');
		vi.mocked(callService).mockResolvedValueOnce({ response: { result: { queue: [] } } } as never);
		expect(await callServiceForResult('spotifyplus', 'get_player_queue_info', {})).toEqual({
			queue: []
		});
		vi.mocked(callService).mockResolvedValueOnce(undefined as never);
		expect(await callServiceForResult('spotifyplus', 'get_player_queue_info', {})).toBeNull();
		expect(callService).toHaveBeenLastCalledWith(
			{},
			'spotifyplus',
			'get_player_queue_info',
			{},
			undefined,
			true
		);
	});

	it('throws instead of asking while the websocket is down', async () => {
		await expect(callServiceForResult('spotifyplus', 'x', {})).rejects.toThrow(/Not connected/);
		connection.set({} as Connection);
		health.set('lost');
		await expect(callServiceForResult('spotifyplus', 'x', {})).rejects.toThrow(/Not connected/);
		expect(callService).not.toHaveBeenCalled();
		// a degraded socket (one stale subscription) still carries requests
		health.set('degraded');
		vi.mocked(callService).mockResolvedValueOnce({ response: { result: 1 } } as never);
		expect(await callServiceForResult('spotifyplus', 'x', {})).toBe(1);
	});
});

describe('startDataRefresh', () => {
	it('retains the last value across failures and stops after cleanup', async () => {
		vi.useFakeTimers();
		const load = vi
			.fn<() => Promise<number>>()
			.mockResolvedValueOnce(1)
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(2);
		const apply = vi.fn();
		const stop = startDataRefresh(load, apply, 1000);

		await vi.advanceTimersByTimeAsync(0);
		expect(apply).toHaveBeenLastCalledWith(1);
		await vi.advanceTimersByTimeAsync(1000);
		expect(apply).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1000);
		expect(apply).toHaveBeenLastCalledWith(2);

		stop();
		await vi.advanceTimersByTimeAsync(1000);
		expect(load).toHaveBeenCalledTimes(3);
	});

	it('shares one in-flight load between concurrent callers', async () => {
		let resolve: (value: string) => void = () => {};
		const load = vi.fn(() => new Promise<string>((done) => (resolve = done)));
		const first = cachedData('shared:series', load, 1000);
		const second = cachedData('shared:series', load, 1000);
		resolve('points');
		expect(await Promise.all([first, second])).toEqual(['points', 'points']);
		expect(load).toHaveBeenCalledOnce();
	});

	it('reuses recorder data across component remounts within the TTL', async () => {
		vi.useFakeTimers();
		const load = vi.fn().mockResolvedValue('points');
		expect(await cachedData('temperature:sensor.office', load, 1000)).toBe('points');
		expect(await cachedData('temperature:sensor.office', load, 1000)).toBe('points');
		expect(load).toHaveBeenCalledOnce();
		await vi.advanceTimersByTimeAsync(1001);
		expect(await cachedData('temperature:sensor.office', load, 1000)).toBe('points');
		expect(load).toHaveBeenCalledTimes(2);
	});
});
