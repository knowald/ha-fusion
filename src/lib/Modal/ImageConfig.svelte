<script lang="ts">
	import { lang, ripple, entityList } from '$lib/Stores';
	import Image from '$lib/Sidebar/Image.svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import type { ImageItem } from '$lib/Types';
	import Ripple from '$lib/Actions/ripple';

	let {
		isOpen,
		sel = $bindable(),
		demo = undefined
	}: {
		isOpen: boolean;
		sel: ImageItem;
		demo?: string;
	} = $props();

	let url = $state(sel?.url);

	let options = $derived($entityList('image'));
</script>

<ConfigModal {isOpen} bind:sel title={$lang('picture')} {demo} demoKey="url">
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Image entity_id={sel?.entity_id} {url} />
		</div>

		<h2>{$lang('entity')}</h2>

		<div class:disabled={url}>
			{#if sel && options}
				<Select
					value={sel?.entity_id}
					placeholder={$lang('entity')}
					defaultIcon="mdi:image"
					onchange={(event) => set('entity_id', event)}
					{options}
					computeIcons={true}
				/>
			{/if}
		</div>

		<h2>{$lang('url')}</h2>

		<InputClear
			condition={url}
			onclear={() => {
				url = undefined;
				set('url');
			}}
		>
			{#snippet children(padding)}
				<input
					type="text"
					class="input"
					bind:value={url}
					placeholder="https://"
					onchange={(event) => set('url', event)}
					autocomplete="off"
					spellcheck="false"
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
	.preview {
		max-width: 25rem;
	}

	.disabled {
		opacity: 0.3;
		pointer-events: none;
	}
</style>
