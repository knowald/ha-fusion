import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { authentication, connected, health } from './connection';

describe('authentication', () => {
	it('keeps the caller retrying when the Home Assistant URL is missing', async () => {
		health.set('connected');
		await expect(authentication({})).rejects.toThrow('Home Assistant URL is not configured');
		expect(get(health)).toBe('lost');
		expect(get(connected)).toBe(false);
	});
});
