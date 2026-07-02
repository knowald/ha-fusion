<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import Icon from '@iconify/svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Ripple from '$lib/Actions/ripple';
	import type { ViewItem } from '$lib/Types';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: ViewItem } = $props();

	const nameConst = sel?.name;

	let name = $state(sel?.name);

	let icon: string | undefined = $state(sel?.icon);
</script>

<ConfigModal {isOpen} bind:sel title={$lang('edit_view')}>
	{#snippet children(set)}
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
	{/snippet}
</ConfigModal>

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
