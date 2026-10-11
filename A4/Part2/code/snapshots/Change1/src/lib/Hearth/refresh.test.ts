import { afterEach, describe, expect, it, vi } from 'vitest';
import { cachedData, startDataRefresh } from './refresh';

afterEach(() => vi.useRealTimers());

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
