<script lang="ts">
	import {
		dashboard,
		states,
		record,
		lang,
		ripple,
		history,
		historyIndex,
		entityList
	} from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';
	import Ripple from '$lib/Actions/ripple';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { updateObj, getName } from '$lib/Utils';
	import type { ButtonItem } from '$lib/Types';

	let { isOpen, sel = $bindable(), demo = undefined }: {
		isOpen: boolean;
		sel: ButtonItem;
		demo?: string;
	} = $props();

	if (demo) {
		// replace history entry with demo
		$history.splice($historyIndex, 1);
		set('entity_id', demo);
	}

	let entity_id = $derived(sel?.entity_id);
	let name = $state(sel?.name);
	let icon = $state(sel?.icon);
	let computedIcon: string = $state('');

	let options = $derived($entityList(''));

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{$lang('button')}</h1>{/snippet}

		<h2>{$lang('entity')}</h2>

		<div class="full-width">
			<Select
				{options}
				placeholder={$lang('entity')}
				value={entity_id}
				onchange={(event) => {
					if (event === null) return;
					set('entity_id', event);
				}}
				computeIcons={true}
				getIconString={true}
				oniconString={(value) => {
					computedIcon = value ?? '';
				}}
			/>
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
				placeholder={getName(sel, (entity_id && $states[entity_id]) || undefined) || $lang('name')}
				autocomplete="off"
				spellcheck="false"
				bind:value={name}
				onchange={(event) => set('name', event)}
				style:padding
			/>
		{/snippet}
		</InputClear>

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
					name={$lang('icon')}
					class="input"
					type="text"
					placeholder={computedIcon || $lang('icon')}
					autocomplete="off"
					spellcheck="false"
					bind:value={icon}
					onchange={(event) => set('icon', event)}
					style:padding
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

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.full-width {
		width: -webkit-fill-available;
		width: -moz-available;
	}
</style>
