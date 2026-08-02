import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { authentication } from '$lib/Socket';
import { connected } from '$lib/Stores';

describe('Hearth connection authentication', () => {
	it('keeps the caller retrying when the Home Assistant URL is missing', async () => {
		connected.set(true);
		await expect(authentication({})).rejects.toThrow('Home Assistant URL is not configured');
		expect(get(connected)).toBe(false);
	});
});
