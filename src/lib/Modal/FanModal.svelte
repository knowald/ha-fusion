<script lang="ts">
	import RangeSlider from '$lib/Components/RangeSlider.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { connection, lang, selectedLanguage, states, ripple } from '$lib/Stores';
	import { getName, getSupport } from '$lib/Utils';
	import { callService, type HassEntity } from 'home-assistant-js-websocket';
	import Ripple from '$lib/Actions/ripple';
	import Select from '$lib/Components/Select.svelte';
	import Toggle from '$lib/Components/Toggle.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';

	let { isOpen, selected }: { isOpen: boolean; selected: any } = $props();

	let request: Promise<unknown> | undefined = undefined;

	let entity = $derived($states?.[selected?.entity_id] as HassEntity);
	let attributes = $derived(entity?.attributes);
	let toggle = $derived(entity?.state === 'on');
	let supported_features = $derived(attributes?.supported_features);

	let supports = $derived(getSupport(supported_features, {
		SET_SPEED: 1,
		OSCILLATE: 2,
		DIRECTION: 4,
		PRESET_MODE: 8
	}));

	let options = $derived(attributes?.preset_modes?.map((option: string) => ({
		id: option,
		label: option
	})));

	async function handleChange(
		service: string,
		attribute: string,
		payload: string | number | boolean
	) {
		if (request) return;

		request = callService($connection, 'fan', service, {
			entity_id: entity?.entity_id,
			[attribute]: payload
		});

		try {
			await request;
		} catch (error) {
			console.error(`Failed to set fan ${attribute}:`, error);
		} finally {
			request = undefined;
		}
	}

	function format(value: number) {
		return Intl.NumberFormat($selectedLanguage, {
			style: 'percent'
		}).format(value / 100);
	}
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(selected, entity)}</h1>{/snippet}

		<!-- TOGGLE -->
		<h2>{$lang('toggle')}</h2>

		<Toggle
			bind:checked={toggle}
			onchange={() => {
				callService($connection, 'fan', 'toggle', {
					entity_id: entity?.entity_id
				});
			}}
		/>

		<!-- SET_SPEED -->
		{#if supports?.SET_SPEED}
			<h2>
				{$lang('fan_speed')}

				<span class="align-right">
					{#if attributes?.percentage === 0}
						{$lang('off')}
					{:else if attributes?.percentage}
						{format(attributes?.percentage)}
					{/if}
				</span>
			</h2>

			<RangeSlider
				bind:value={attributes.percentage}
				min={0}
				max={100}
				step={attributes?.percentage_step.toFixed(2)}
				onchange={(event) => {
					request = undefined;
					handleChange('set_percentage', 'percentage', Math.round(event));
				}}
			/>
		{/if}

		<!-- OSCILLATE -->
		{#if supports?.OSCILLATE}
			<h2>{$lang('fan_oscillate')}</h2>

			<div class="button-container">
				<button
					class:selected={attributes?.oscillating === true}
					onclick={() => {
						handleChange('oscillate', 'oscillating', true);
					}}
					use:Ripple={$ripple}
				>
					{$lang('yes')}
				</button>

				<button
					class:selected={attributes?.oscillating === false}
					onclick={() => {
						handleChange('oscillate', 'oscillating', false);
					}}
					use:Ripple={$ripple}
				>
					{$lang('no')}
				</button>
			</div>
		{/if}

		<!-- DIRECTION -->
		{#if supports?.DIRECTION}
			<h2>{$lang('fan_direction')}</h2>

			<div class="button-container">
				<button
					class:selected={attributes?.direction === 'forward'}
					onclick={() => {
						handleChange('set_direction', 'direction', 'forward');
					}}
					use:Ripple={$ripple}
				>
					{$lang('fan_forward')}
				</button>

				<button
					class:selected={attributes?.direction === 'reverse'}
					onclick={() => {
						handleChange('set_direction', 'direction', 'reverse');
					}}
					use:Ripple={$ripple}
				>
					{$lang('fan_reverse')}
				</button>
			</div>
		{/if}

		<!-- PRESET_MODE -->
		{#if supports?.PRESET_MODE && options}
			<h2>{$lang('fan_preset_mode')}</h2>

			<Select
				{options}
				defaultIcon="mdi:fan"
				placeholder={$lang('mode')}
				value={attributes?.preset_mode}
				onchange={(event) => {
					handleChange('set_preset_mode', 'preset_mode', event);
				}}
			/>
		{/if}

		<ConfigButtons />
	</Modal>
{/if}
