<script lang="ts">
	import { dashboard, record, lang, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Ripple from '$lib/Actions/ripple';
	import { updateObj } from '$lib/Utils';
	import type { ViewItem } from '$lib/Types';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: ViewItem } = $props();

	let name = sel?.name;

	let icon: string | undefined = sel?.icon;

	const nameConst = name;

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{$lang('edit_view')}</h1>{/snippet}

		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<div class="inline-preview">
				<div class="view_item">{name || nameConst}</div>
			</div>
		</div>

		<h2>{$lang('name')}</h2>

		<InputClear
			condition={name}
			onclear={() => {
				name = '';
				set('name', nameConst);
			}}
		>
			{#snippet children(padding)}
				<input
					class="input"
					type="text"
					bind:value={name}
					placeholder={nameConst}
					onchange={(event) => set('name', event)}
					style:padding
					autocomplete="off"
					spellcheck="false"
				/>
			{/snippet}
		</InputClear>

		<h2>{$lang('icon')} ({$lang('sidebar')?.toLocaleLowerCase()})</h2>

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
						placeholder="fluent:tab-add-24-filled"
						bind:value={icon}
						onchange={(event) => set('icon', event)}
						style:padding
						autocomplete="off"
						spellcheck="false"
					/>
				{/snippet}
			</InputClear>

			<button
				class="icon-gallery"
				onclick={() => {
					window.open('https://icon-sets.iconify.design/', '_blank');
				}}
				title={$lang('icon')}
				use:Ripple={$ripple}
			>
				<Icon icon="vaadin:grid-small" height="none" />
			</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	.inline-preview {
		width: fit-content;
		padding: 0.6rem 0;
	}

	.view_item {
		border-bottom: 3px solid white;
		color: white;
		font-weight: 700;
		font-size: 1.2rem;
		padding-bottom: 3px;
		white-space: nowrap;
	}
</style>
