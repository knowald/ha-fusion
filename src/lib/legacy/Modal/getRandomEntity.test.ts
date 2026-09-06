import { describe, expect, it, vi } from 'vitest';
import { getGraphEntity } from './getRandomEntity';

function connectionStore(initial: unknown) {
	let value = initial;
	const subscribers = new Set<(value: unknown) => void>();
	return {
		unsubscribe: vi.fn(),
		subscribe(run: (value: unknown) => void) {
			subscribers.add(run);
			run(value);
			return () => {
				subscribers.delete(run);
				this.unsubscribe();
			};
		},
		set(next: unknown) {
			value = next;
			subscribers.forEach((run) => run(value));
		}
	};
}

const conn = { sendMessagePromise: vi.fn(async () => []) };

describe('getGraphEntity', () => {
	it('stops listening as soon as the store already holds a connection', async () => {
		const store = connectionStore(conn);
		const callback = vi.fn();
		getGraphEntity({}, store, callback);
		await vi.waitFor(() => expect(callback).toHaveBeenCalled());
		expect(store.unsubscribe).toHaveBeenCalledTimes(1);
		expect(conn.sendMessagePromise).toHaveBeenCalledTimes(2);
	});

	it('waits for a connection, then asks once and stops listening', async () => {
		conn.sendMessagePromise.mockClear();
		const store = connectionStore(undefined);
		const callback = vi.fn();
		getGraphEntity({}, store, callback);
		expect(callback).toHaveBeenCalledWith(undefined);
		store.set(conn);
		store.set(conn);
		await vi.waitFor(() => expect(store.unsubscribe).toHaveBeenCalledTimes(1));
		await vi.waitFor(() => expect(conn.sendMessagePromise).toHaveBeenCalledTimes(2));
	});
});
