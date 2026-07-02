<script lang="ts">
	import { states, barErrors, motion, lang, ripple, entityList } from '$lib/Stores';
	import { slide } from 'svelte/transition';
	import Bar from '$lib/Sidebar/Bar.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import Select from '$lib/Components/Select.svelte';
	import Ripple from '$lib/Actions/ripple';
	import InputClear from '$lib/Components/InputClear.svelte';
	import { getName } from '$lib/Utils';
	import type { BarItem } from '$lib/Types';

	let {
		isOpen,
		sel = $bindable(),
		demo = undefined
	}: {
		isOpen: boolean;
		sel: BarItem;
		demo?: string;
	} = $props();

	let name = $state(sel?.name);

	let entity_id = $derived(sel?.entity_id);

	let math = $state(sel?.math || '');

	let options = $derived($entityList('sensor'));
</script>

<ConfigModal {isOpen} bind:sel title="Bar" {demo}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Bar id={sel?.id} {entity_id} {name} {math} />
		</div>

		<h2>{$lang('entity')}</h2>

		{#if options}
			<Select
				{options}
				placeholder={$lang('entity')}
				value={entity_id}
				onchange={(event) => set('entity_id', event)}
			/>
		{/if}

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
					id="bar_name"
					type="text"
					bind:value={name}
					onchange={(event) => set('name', event)}
					placeholder={getName(sel, (entity_id && $states[entity_id]) || undefined)}
					class:input={true}
					class:placeholder={!name}
					autocomplete="off"
					spellcheck="false"
					style:padding
				/>
			{/snippet}
		</InputClear>

		<h2>{$lang('value')}</h2>

		<div style:height="3rem">
			{#if sel?.id && $barErrors?.[sel?.id] && math !== ''}
				<p class="error-message" transition:slide={{ duration: $motion / 1.5 }}>
					{$barErrors[sel.id.toString()]}
				</p>
			{:else}
				{@const formulas = ['x', '100 - x', 'Math.round(x)', 'x * 100']}

				<div class="pre-container" transition:slide={{ duration: $motion / 1.5 }}>
					{#each formulas as formula (formula)}
						<button class="math" onclick={() => set('math', formula)} use:Ripple={$ripple}>
							<pre>{formula}</pre>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<InputClear
			condition={math}
			onclear={() => {
				math = '';
				set('math');
			}}
		>
			{#snippet children(padding)}
				<input
					id="bar_math"
					class="input"
					type="text"
					oninput={(event) => set('math', event)}
					bind:value={math}
					placeholder="x"
					autocomplete="off"
					spellcheck="false"
					style="font-family: monospace; font-size: 1rem;"
					style:padding
				/>
			{/snippet}
		</InputClear>

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

<style>
	.error-message {
		color: white;
		margin-bottom: 12px;
		background-color: rgb(178 0 0 / 74%);
		padding: 0.6rem 0.7rem 0.45rem 0.7rem;
		border-radius: 0.6rem;
		font-family: monospace;
		font-size: 0.85rem;
		border: 1px solid rgb(255 255 255 / 15%);
	}

	.pre-container {
		display: flex;
		justify-content: space-between;
		gap: 0.8rem;
	}

	.math {
		padding: 0.6rem 0.7rem 0.45rem 0.7rem;
		color: inherit;
		border: none;
		background-color: rgb(73 134 162 / 21%);
		border: 1px solid rgb(255 255 255 / 15%);
		cursor: pointer;
		font-size: 0.85rem;
		border-radius: 0.6rem;
	}

	.math pre {
		margin: 0;
	}

	p {
		margin-block-start: 0;
		margin-block-end: 0;
	}
</style>
