<script lang="ts">
	import { dashboard, lang, record, ripple } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Iframe from '$lib/Sidebar/Iframe.svelte';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import type { IframeItem } from '$lib/Types';
	import Ripple from '$lib/Actions/ripple';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: IframeItem } = $props();

	let url = sel?.url;
	let size = sel?.size;

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{$lang('iframe')}</h1>{/snippet}

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

		<ConfigButtons {sel} />
	</Modal>
{/if}
