<script lang="ts">
	import {
		dashboard,
		entityList,
		history,
		historyIndex,
		lang,
		record,
		ripple,
		states
	} from '$lib/Stores';
	import { onDestroy, tick } from 'svelte';
	import Sensor from '$lib/Sidebar/Sensor.svelte';
	import Select from '$lib/Components/Select.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Ripple from '$lib/Actions/ripple';
	import { updateObj } from '$lib/Utils';
	import type { SensorItem } from '$lib/Types';
	import { isTimestamp } from '$lib/Utils';

	let { isOpen, sel = $bindable(), demo = undefined }: {
		isOpen: boolean;
		sel: SensorItem;
		demo?: string;
	} = $props();

	if (demo) {
		// replace history entry with demo
		$history.splice($historyIndex, 1);
		set('entity_id', demo);
	}

	let prefix: string | undefined = $state(sel?.prefix);
	let suffix: string | undefined = $state(sel?.suffix);

	let entity_id = $derived(sel?.entity_id);

	let date = $derived(sel?.date);

	let options = $derived($entityList('sensor'));

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());

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
				set('date', true);
			} else {
				set('date');
			}
		}
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{$lang('sensor')}</h1>

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
			let:padding
		>
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
		</InputClear>

		<h2>{$lang('after')}</h2>

		<InputClear
			condition={suffix}
			onclear={() => {
				suffix = undefined;
				set('suffix');
			}}
			let:padding
		>
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

		<ConfigButtons {sel} />
	</Modal>
{/if}
