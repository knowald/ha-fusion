<script lang="ts">
	import { dashboard, entityList, lang, ripple, states } from '$lib/Stores';
	import { tick } from 'svelte';
	import Sensor from '$lib/Sidebar/Sensor.svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import Ripple from '$lib/Actions/ripple';
	import { updateObj } from '$lib/Utils';
	import type { SensorItem } from '$lib/Types';
	import { isTimestamp } from '$lib/Utils';

	let {
		isOpen,
		sel = $bindable(),
		demo = undefined
	}: {
		isOpen: boolean;
		sel: SensorItem;
		demo?: string;
	} = $props();

	let prefix: string | undefined = $state(sel?.prefix);
	let suffix: string | undefined = $state(sel?.suffix);

	let entity_id = $derived(sel?.entity_id);

	let date = $derived(sel?.date);

	let options = $derived($entityList('sensor'));

	/**
	 * If entity_id changes check if state is a timestamp
	 */

	$effect(() => {
		if (entity_id) {
			validate();
		}
	});

	async function validate() {
		await tick();
		if (entity_id && $states) {
			const state = $states?.[entity_id]?.state;

			if (isTimestamp(state)) {
				sel = updateObj(sel, 'date', true);
			} else {
				sel = updateObj(sel, 'date');
			}
			$dashboard = $dashboard;
		}
	}
</script>

<ConfigModal {isOpen} bind:sel {demo} title={$lang('sensor')}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Sensor {entity_id} {date} {prefix} {suffix} />
		</div>

		<h2>{$lang('entity')}</h2>

		{#if sel && options}
			<Select
				computeIcons={true}
				{options}
				placeholder={$lang('sensor')}
				value={entity_id}
				onchange={(event) => set('entity_id', event)}
			/>
		{/if}

		<h2>{$lang('before')}</h2>

		<InputClear
			condition={prefix}
			onclear={() => {
				prefix = undefined;
				set('prefix');
			}}
		>
			{#snippet children(padding)}
				<input
					id="sensor_prefix"
					class="input"
					type="text"
					bind:value={prefix}
					placeholder="Prefix"
					onchange={(event) => set('prefix', event)}
					style:padding
					autocomplete="off"
					spellcheck="false"
				/>
			{/snippet}
		</InputClear>

		<h2>{$lang('after')}</h2>

		<InputClear
			condition={suffix}
			onclear={() => {
				suffix = undefined;
				set('suffix');
			}}
		>
			{#snippet children(padding)}
				<input
					id="sensor_suffix"
					class="input"
					type="text"
					bind:value={suffix}
					placeholder="Suffix"
					onchange={(event) => set('suffix', event)}
					style:padding
					autocomplete="off"
					spellcheck="false"
				/>
			{/snippet}
		</InputClear>

		<h2>{$lang('date')}</h2>

		<div class="button-container">
			<button class:selected={!sel?.date} onclick={() => set('date', false)} use:Ripple={$ripple}>
				{$lang('no')}
			</button>

			<button class:selected={sel?.date} onclick={() => set('date', true)} use:Ripple={$ripple}>
				{$lang('yes')}
			</button>
		</div>

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
