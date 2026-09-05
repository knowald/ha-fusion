import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { states } from '$lib/core/ha/entities';
import { hassEntity } from './testing';
import { dismissConfirmation, requestedConfirmation } from './store';
import DetailPopup from './DetailPopup.svelte';

vi.mock('$lib/core/ha/commands', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/core/ha/commands')>()),
	callEntityService: vi.fn()
}));
vi.mock('$lib/core/domains/climate', () => ({
	setClimateHvacMode: vi.fn(),
	setClimateTemperature: vi.fn()
}));
import { callEntityService } from '$lib/core/ha/commands';
import { setClimateHvacMode } from '$lib/core/domains/climate';

const calls = vi.mocked(callEntityService);

describe('DetailPopup', () => {
	beforeEach(() => {
		calls.mockClear();
		dismissConfirmation();
	});

	it('offers on, off and toggle for a switch', async () => {
		states.set({ 'switch.fan': hassEntity('switch.fan', 'on', { friendly_name: 'Fan' }) });
		render(DetailPopup, { entity: 'switch.fan' });
		await fireEvent.click(await screen.findByRole('button', { name: 'Turn off' }));
		expect(calls).toHaveBeenCalledWith('switch', 'turn_off', 'switch.fan');
	});

	it('asks before unlocking and opens a latch only when supported', async () => {
		states.set({
			'lock.front': hassEntity('lock.front', 'locked', {
				friendly_name: 'Front',
				supported_features: 1
			})
		});
		render(DetailPopup, { entity: 'lock.front' });
		await fireEvent.click(await screen.findByRole('button', { name: 'Unlock' }));
		expect(calls).not.toHaveBeenCalled();
		expect(get(requestedConfirmation)?.confirmLabel).toBe('Unlock');
		expect(screen.getByRole('button', { name: 'Open door' })).toBeTruthy();
	});

	it('selects an option', async () => {
		states.set({
			'input_select.mode': hassEntity('input_select.mode', 'Home', { options: ['Home', 'Away'] })
		});
		render(DetailPopup, { entity: 'input_select.mode' });
		await fireEvent.click(await screen.findByRole('button', { name: 'Away' }));
		expect(calls).toHaveBeenCalledWith('input_select', 'select_option', 'input_select.mode', {
			option: 'Away'
		});
	});

	it('steps a number by its configured step', async () => {
		states.set({
			'input_number.volume': hassEntity('input_number.volume', '4', { min: 0, max: 10, step: 2 })
		});
		render(DetailPopup, { entity: 'input_number.volume' });
		await fireEvent.click(await screen.findByRole('button', { name: 'Increase' }));
		expect(calls).toHaveBeenCalledWith('input_number', 'set_value', 'input_number.volume', {
			value: 6
		});
	});

	it('arms an alarm with the modes it supports and passes the code', async () => {
		states.set({
			'alarm_control_panel.home': hassEntity('alarm_control_panel.home', 'disarmed', {
				supported_features: 3,
				code_format: 'number'
			})
		});
		render(DetailPopup, { entity: 'alarm_control_panel.home' });
		await screen.findByRole('button', { name: 'Arm away' });
		expect(screen.queryByRole('button', { name: 'Arm night' })).toBeNull();
		await fireEvent.input(screen.getByPlaceholderText('Code'), { target: { value: '1234' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Arm away' }));
		expect(calls).toHaveBeenCalledWith(
			'alarm_control_panel',
			'alarm_arm_away',
			'alarm_control_panel.home',
			{ code: '1234' }
		);
	});

	it('shows a thermostat with its modes', async () => {
		states.set({
			'climate.living': hassEntity('climate.living', 'heat', {
				temperature: 21,
				current_temperature: 19.5,
				hvac_modes: ['off', 'heat'],
				target_temp_step: 0.5
			})
		});
		render(DetailPopup, { entity: 'climate.living' });
		await fireEvent.click(await screen.findByRole('button', { name: 'Off' }));
		expect(setClimateHvacMode).toHaveBeenCalledWith('climate.living', 'off');
	});

	it('falls back to attributes for a plain readout', async () => {
		states.set({
			'binary_sensor.door': hassEntity('binary_sensor.door', 'off', {
				friendly_name: 'Door',
				device_class: 'door'
			})
		});
		render(DetailPopup, { entity: 'binary_sensor.door' });
		await waitFor(() =>
			expect(screen.getByText('This entity has no controls', { exact: false })).toBeTruthy()
		);
		await fireEvent.click(screen.getByRole('button', { name: /Attributes/ }));
		expect(screen.getByText('device_class')).toBeTruthy();
		expect(screen.getByText('door')).toBeTruthy();
	});
});
