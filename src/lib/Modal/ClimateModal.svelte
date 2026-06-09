<script lang="ts">
	import { states, lang, connection } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import WheelPicker from '$lib/Components/WheelPicker.svelte';
	import Icon from '@iconify/svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { getName, getSupport } from '$lib/Utils';
	import { callService } from 'home-assistant-js-websocket';
	import Select from '$lib/Components/Select.svelte';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	// buttons or select, based on how many items
	const MAX_ITEMS = 4;

	let entity = $derived($states[sel?.entity_id]);
	let entity_id = $derived(entity?.entity_id);
	let attributes = $derived(entity?.attributes);
	let supported_features = $derived(attributes?.supported_features);

	let supports = $derived(getSupport(supported_features, {
		TARGET_TEMPERATURE: 1,
		TARGET_TEMPERATURE_RANGE: 2,
		TARGET_HUMIDITY: 4,
		FAN_MODE: 8,
		PRESET_MODE: 16,
		SWING_MODE: 32,
		AUX_HEAT: 64
	}));

	/**
	 * Handles click
	 */
	function handleClick(service: string, to_state: string | number) {
		callService($connection, 'climate', 'set_' + service, {
			entity_id,
			[service]: to_state
		});
		// console.debug('climate.set_' + service, '->', to_state);
	}

	/**
	 * Handles change
	 */
	function handleChange() {
		callService($connection, 'climate', 'set_temperature', {
			entity_id,
			target_temp_low: attributes?.target_temp_low,
			target_temp_high: attributes?.target_temp_high
		});
	}

	/**
	 * Options
	 */
	const hvacModesIcons: Record<string, string> = {
		cool: 'mdi:snowflake',
		dry: 'mdi:water-percent',
		fan_only: 'mdi:fan',
		auto: 'mdi:thermostat-auto',
		heat: 'mdi:fire',
		off: 'mdi:power',
		heat_cool: 'mdi:sun-snowflake-variant'
	};

	let optionsHvacModes = $derived(attributes?.hvac_modes?.map((option: string) => ({
		id: option,
		label: $lang(option),
		icon: hvacModesIcons?.[option] || 'mdi:fan'
	})));

	const fanModeIcons: Record<string, string> = {
		on: 'mdi:fan',
		off: 'mdi:fan-off',
		auto: 'mdi:fan-auto',
		low: 'mdi:speedometer-slow',
		medium: 'mdi:speedometer-medium',
		high: 'mdi:speedometer',
		middle: 'mdi:speedometer-medium',
		focus: 'mdi:target',
		diffuse: 'mdi:weather-windy'
	};

	let optionsFanModes = $derived(attributes?.fan_modes?.map((option: string) => ({
		id: option,
		label: $lang(option),
		icon: fanModeIcons?.[option] || 'mdi:fan'
	})));

	const swingModeIcons: Record<string, string> = {
		on: 'mdi:arrow-oscillating',
		off: 'mdi:arrow-oscillating-off',
		vertical: 'mdi:arrow-up-down',
		horizontal: 'mdi:arrow-left-right',
		both: 'mdi:arrow-all'
	};

	let optionsSwingModes = $derived(attributes?.swing_modes?.map((option: string) => ({
		id: option,
		label: $lang(option),
		icon: swingModeIcons?.[option] || 'mdi:fan'
	})));
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(sel, entity)}</h1>{/snippet}

		{#if attributes?.hvac_modes}
			<h2>{$lang('hvac_modes')}</h2>

			{#if attributes?.hvac_modes?.length <= MAX_ITEMS}
				<div class="button-container">
					{#each attributes?.hvac_modes as hvacMode}
						<button
							title={$lang(hvacMode)}
							onclick={() => handleClick('hvac_mode', hvacMode)}
							class:selected={hvacMode === entity?.state}
						>
							<div class="icon">
								<Icon icon={hvacModesIcons?.[hvacMode]} height="none" />
							</div>
						</button>
					{/each}
				</div>
			{:else if optionsHvacModes}
				<Select
					options={optionsHvacModes}
					placeholder={$lang('hvac_modes')}
					value={entity?.state}
					onchange={(event) => {
						if (event == null) return;
						handleClick('hvac_mode', event);
					}}
				/>
			{/if}
		{/if}

		{#if supports?.TARGET_TEMPERATURE}
			<WheelPicker
				stateObj={entity}
				onchange={(event) => {
					handleClick('temperature', event);
				}}
			/>
		{/if}

		{#if supports?.TARGET_TEMPERATURE_RANGE}
			<h2>{$lang('target_temperature')}</h2>

			<div>
				<div class="slider-title">{$lang('target_temp_low')}</div>
				<div class="slider-row">
					<input
						class="slider-input"
						type="range"
						min={attributes?.min_temp}
						max={attributes?.max_temp}
						bind:value={attributes.target_temp_low}
						onchange={handleChange}
					/>
					<div class="slider-value">{attributes?.target_temp_low}°</div>
				</div>
			</div>

			<div>
				<div class="slider-title">{$lang('target_temp_high')}</div>
				<div class="slider-row">
					<input
						class="slider-input"
						type="range"
						min={attributes?.min_temp}
						max={attributes?.max_temp}
						bind:value={attributes.target_temp_high}
						onchange={handleChange}
					/>
					<div class="slider-value">{attributes?.target_temp_high}°</div>
				</div>
			</div>
		{/if}

		{#if attributes?.fan_modes}
			<h2>{$lang('fan_modes')}</h2>
			{#if attributes?.fan_modes?.length <= MAX_ITEMS}
				<div class="button-container">
					{#each attributes?.fan_modes as fanMode}
						<button
							onclick={() => handleClick('fan_mode', fanMode)}
							class:selected={attributes?.fan_mode === fanMode}
						>
							{$lang(fanMode)}
						</button>
					{/each}
				</div>
			{:else if optionsFanModes}
				<Select
					options={optionsFanModes}
					placeholder={$lang('fan_modes')}
					value={attributes?.fan_mode}
					onchange={(event) => {
						if (event == null) return;
						handleClick('fan_mode', event);
					}}
				/>
			{/if}
		{/if}

		{#if attributes?.swing_modes}
			<h2>{$lang('swing_modes')}</h2>
			{#if attributes?.swing_modes?.length <= MAX_ITEMS}
				<div class="button-container">
					{#each attributes?.swing_modes as swingMode}
						<button
							onclick={() => handleClick('swing_mode', swingMode)}
							class:selected={attributes?.swing_mode === swingMode}
						>
							{$lang(swingMode)}
						</button>
					{/each}
				</div>
			{:else if optionsSwingModes}
				<Select
					options={optionsSwingModes}
					placeholder={$lang('swing_modes')}
					value={attributes?.swing_mode}
					onchange={(event) => {
						if (event == null) return;
						handleClick('swing_mode', event);
					}}
				/>
			{/if}
		{/if}

		<ConfigButtons />
	</Modal>
{/if}

<style>
	.icon {
		height: 1.25rem;
		width: 1.25rem;
		margin-right: 0.25rem;
		vertical-align: middle;
		display: inline-block;
		color: inherit;
	}

	.slider-row {
		display: flex;
		align-items: center;
	}

	.slider-input {
		flex-grow: 1;
	}

	.slider-value {
		text-align: right;
		width: 3rem;
	}

	.slider-title {
		margin-top: 0.3rem;
		margin-bottom: 0.3rem;
	}
</style>
