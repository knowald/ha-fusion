import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { states } from '$lib/core/ha/entities';
import { hassEntity } from './testing';
import { closePopup, popup } from './store';
import StatTile from './StatTile.svelte';

describe('StatTile', () => {
	beforeEach(() => closePopup());

	it('renders a numeric reading as a button that opens its history', async () => {
		states.set({
			'sensor.co2': hassEntity('sensor.co2', '812', {
				friendly_name: 'CO2',
				unit_of_measurement: 'ppm',
				device_class: 'carbon_dioxide'
			})
		});
		render(StatTile, { entity: 'sensor.co2' });
		const tile = screen.getByRole('button');
		expect(tile.textContent).toContain('812');
		expect(tile.textContent).toContain('ppm');
		await fireEvent.click(tile);
		expect(get(popup)).toMatchObject({ kind: 'sensor', entity: 'sensor.co2', name: 'CO2' });
	});

	it('renders a non-numeric or unreachable reading as plain text with nothing to open', () => {
		states.set({ 'sensor.mode': hassEntity('sensor.mode', 'unavailable') });
		render(StatTile, { entity: 'sensor.mode', name: 'Mode' });
		expect(screen.queryByRole('button')).toBeNull();
		expect(screen.getByText('Unavailable')).toBeTruthy();
		expect(get(popup)).toBeNull();
	});
});
