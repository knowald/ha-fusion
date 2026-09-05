import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { states } from '$lib/core/ha/entities';
import { hassEntity } from './testing';
import LightTile from './LightTile.svelte';

vi.mock('$lib/core/domains/light', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/core/domains/light')>()),
	toggleLight: vi.fn()
}));
import { toggleLight } from '$lib/core/domains/light';

describe('LightTile', () => {
	beforeEach(() => {
		vi.mocked(toggleLight).mockClear();
	});

	it('renders a lit light as a pressed, focusable button with its name', () => {
		states.set({
			'light.desk': hassEntity('light.desk', 'on', { friendly_name: 'Desk', brightness: 128 })
		});
		render(LightTile, { entity: 'light.desk' });
		const tile = screen.getByRole('button');
		expect(screen.getByText('Desk')).toBeTruthy();
		expect(tile.getAttribute('aria-pressed')).toBe('true');
		expect(tile.getAttribute('tabindex')).toBe('0');
	});

	it('renders an unavailable light as unreachable and inert, never as off', () => {
		states.set({ 'light.desk': hassEntity('light.desk', 'unavailable') });
		render(LightTile, { entity: 'light.desk' });
		const tile = screen.getByRole('button');
		expect(tile.classList.contains('unreachable')).toBe(true);
		expect(tile.getAttribute('tabindex')).toBe('-1');
		expect(screen.getByText('Unavailable')).toBeTruthy();
	});

	it('names a missing entity rather than drawing it switched off', () => {
		states.set({});
		render(LightTile, { entity: 'light.gone' });
		expect(screen.getByText('Missing entity')).toBeTruthy();
		expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
	});

	it('toggles from the keyboard', async () => {
		states.set({ 'light.desk': hassEntity('light.desk', 'off') });
		render(LightTile, { entity: 'light.desk' });
		await fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
		expect(toggleLight).toHaveBeenCalledWith('light.desk');
	});

	it('does not send a command while read only', async () => {
		states.set({ 'light.desk': hassEntity('light.desk', 'off') });
		render(LightTile, { entity: 'light.desk', readonly: true });
		const tile = screen.getByRole('button');
		expect(tile.getAttribute('tabindex')).toBe('-1');
		await fireEvent.keyDown(tile, { key: 'Enter' });
		expect(toggleLight).not.toHaveBeenCalled();
	});
});
