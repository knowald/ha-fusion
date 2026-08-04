<script lang="ts">
	import { lang } from '$lib/Stores';
	import Icon from './Icon.svelte';

	let { onclick }: { onclick: () => void } = $props();
</script>

<button type="button" class="search-button pressable" {onclick}>
	<Icon name="search" size={20} />
	<span>{$lang('hearth_search_placeholder')}</span>
</button>

<style>
	.search-button {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		min-height: 52px;
		margin-bottom: 8px;
		padding: 15px 16px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
		border-radius: var(--h-radius-md);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		color: var(--h-text-4);
		font: inherit;
		font-size: 14px;
		text-align: left;
		cursor: pointer;
	}

	.search-button:hover {
		background: rgb(var(--h-surface-rgb) / calc(0.075 * var(--h-fill-scale)));
	}
</style>
