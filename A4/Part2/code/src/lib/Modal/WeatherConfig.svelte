<script lang="ts">
	import { states, lang, ripple, entityList } from '$lib/Stores';
	import Weather from '$lib/Sidebar/Weather.svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import Icon from '@iconify/svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Ripple from '$lib/Actions/ripple';
	import type { WeatherItem } from '$lib/Types';

	let {
		isOpen,
		sel = $bindable(),
		demo = undefined
	}: {
		isOpen: boolean;
		sel: WeatherItem;
		demo?: string;
	} = $props();

	let icon: string | undefined = $state(sel?.icon);

	let entity = $derived(sel?.entity_id && ($states?.[sel?.entity_id] as any));
	let attributes = $derived(entity && entity?.attributes);

	const iconOptions = [{ id: 'meteocons', label: 'meteocons' }];

	let options = $derived($entityList('weather'));

	let sensorOptions = $derived(
		Object.keys($states)
			.filter((key) => key.startsWith('sensor.'))
			.sort()
			.map((key) => ({ id: key, label: key }))
	);
</script>

<ConfigModal {isOpen} bind:sel {demo} title={$lang('weather')}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Weather {sel} />
		</div>

		<h2>{$lang('entity')}</h2>

		{#if options}
			<Select
				computeIcons={true}
				{options}
				placeholder={$lang('entity')}
				value={sel?.entity_id}
				defaultIcon="mdi:weather-cloudy"
				onchange={(event) => set('entity_id', event)}
			/>
		{/if}

		<h2>{$lang('state')}</h2>

		{#if sensorOptions}
			<Select
				computeIcons={true}
				defaultIcon="mdi:weather-cloudy"
				options={sensorOptions}
				placeholder="{$lang('state')} ({$lang('optional')})"
				value={sel?.state}
				onchange={(event) => set('state', event)}
				clearable={true}
			/>
		{/if}

		<h2>{$lang('icons')}</h2>

		{#if iconOptions}
			<Select
				options={iconOptions}
				placeholder={$lang('icon')}
				value={sel?.icon_pack || 'meteocons'}
				onchange={(event) => set('icon_pack', event)}
			/>
		{/if}

		<h2>{$lang('sensor')}</h2>

		{#if sensorOptions}
			<Select
				computeIcons={true}
				defaultIcon="mdi:weather-cloudy"
				options={sensorOptions}
				placeholder="{$lang('sensor')} ({$lang('optional')})"
				value={sel?.sensor}
				onchange={(event) => set('sensor', event)}
				clearable={true}
			/>
		{/if}

		<h2>
			{$lang('icon')}
		</h2>

		<div class="icon-gallery-container">
			<InputClear
				condition={icon}
				onclear={() => {
					icon = undefined;
					set('icon');
				}}
			>
				{#snippet children(padding)}
					<input
						class="input"
						type="text"
						placeholder="codicon:blank"
						bind:value={icon}
						onchange={(event) => set('icon', event)}
						style:padding
						autocomplete="off"
						spellcheck="false"
					/>
				{/snippet}
			</InputClear>

			<button
				use:Ripple={$ripple}
				title={$lang('icon')}
				class="icon-gallery"
				onclick={() => {
					window.open('https://icon-sets.iconify.design/', '_blank');
				}}
				style:padding="0.84rem"
			>
				<Icon icon="majesticons:open-line" height="none" />
			</button>
		</div>

		{#if attributes?.apparent_temperature}
			<h2>{$lang('apparent_temperature')}</h2>

			<div class="button-container">
				<button
					class:selected={!sel?.show_apparent}
					onclick={() => set('show_apparent', false)}
					use:Ripple={$ripple}
				>
					{$lang('no')}
				</button>

				<button
					class:selected={sel?.show_apparent}
					onclick={() => set('show_apparent', true)}
					use:Ripple={$ripple}
				>
					{$lang('yes')}
				</button>
			</div>
		{/if}

		<h2>{$lang('mobile')}</h2>

		<div class="button-container">
			<button
				class:selected={sel?.hide_mobile !== true}
				onclick={() => set('hide_mobile')}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>

			<button
				class:selected={sel?.hide_mobile === true}
				onclick={() => set('hide_mobile', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>
	{/snippet}
</ConfigModal>
