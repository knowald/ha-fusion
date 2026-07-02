<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import Iframe from '$lib/Sidebar/Iframe.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import type { IframeItem } from '$lib/Types';
	import Ripple from '$lib/Actions/ripple';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: IframeItem } = $props();

	let url = $state(sel?.url);
	let size = $state(sel?.size);
</script>

<ConfigModal {isOpen} bind:sel title={$lang('iframe')}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Iframe {url} {size} preview={true} />
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

		<h2>{$lang('size')}</h2>

		<InputClear
			condition={size}
			onclear={() => {
				size = undefined;
				set('size');
			}}
		>
			{#snippet children(padding)}
				<input
					type="text"
					class="input"
					bind:value={size}
					placeholder="150px"
					onchange={(event) => set('size', event)}
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
