<script lang="ts">
	import { states, lang, motion } from '$lib/Stores';
	import Select from '$lib/Components/Select.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Entities from '$lib/Main/Entities.svelte';
	import { slide } from 'svelte/transition';

	let {
		isOpen,
		sel = $bindable(),
		demo = undefined
	}: {
		isOpen: boolean;
		sel: any;
		demo?: string;
	} = $props();

	let name = $state(sel?.name);
	let wildcard = $state(sel?.wildcard);

	let options = $derived(
		Object.keys($states)
			?.sort()
			?.map((key) => ({ id: key, label: key }))
	);

	let addEntity = $derived(
		(sel?.entities ?? []).every((entity_id: string) => entity_id) || !sel?.entities?.length
	);

	// don't repeat selected entities across multiple selects
	function filterOptions(active: string) {
		return options.filter(
			(option) => !sel?.entities?.some((id: string) => id === option.id) || option.id === active
		);
	}
</script>

<ConfigModal {isOpen} bind:sel {demo} title={$lang('entities')}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Entities {sel} />
		</div>

		<h2>{$lang('name')}</h2>

		<InputClear
			condition={name}
			onclear={() => {
				name = undefined;
				set('name');
			}}
		>
			{#snippet children(padding)}
				<input
					name={$lang('name')}
					class="input"
					type="text"
					placeholder={$lang('name')}
					autocomplete="off"
					spellcheck="false"
					bind:value={name}
					oninput={(event) => set('name', event)}
					style:padding
				/>
			{/snippet}
		</InputClear>

		<h2>{$lang('entities')}</h2>

		{#each sel?.entities ?? [] as entity_id, index (index)}
			<div transition:slide={{ duration: $motion }}>
				<Select
					computeIcons={true}
					placeholder={$lang('entity')}
					options={filterOptions(entity_id)}
					value={entity_id || ''}
					clearable={true}
					onchange={(event) => {
						// build a new array reference so the change invalidates reactively
						const next = event
							? sel.entities.map((id: string, i: number) => (i === index ? event : id))
							: sel.entities.filter((_: string, i: number) => i !== index);
						set('entities', next);
					}}
				/>

				<br />
			</div>
		{/each}

		<button
			class="options action"
			onclick={() => {
				set('entities', [...(sel?.entities ?? []), '']);
			}}
			disabled={!addEntity}
			style:opacity={!addEntity ? '0.4' : '1'}
			style:cursor={!addEntity ? 'unset' : 'pointer'}
		>
			{$lang('add')}
		</button>

		<h2>{$lang('wildcard')}</h2>

		<InputClear
			condition={wildcard}
			onclear={() => {
				wildcard = undefined;
				set('wildcard');
			}}
		>
			{#snippet children(padding)}
				<input
					name={$lang('wildcard')}
					class="input"
					type="text"
					placeholder="binary_sensor.door_*"
					autocomplete="off"
					spellcheck="false"
					bind:value={wildcard}
					oninput={(event) => set('wildcard', event)}
					style:padding
				/>
			{/snippet}
		</InputClear>
	{/snippet}
</ConfigModal>

<style>
	.preview {
		width: calc(14.5rem * 2 + 0.4rem);
	}
</style>
