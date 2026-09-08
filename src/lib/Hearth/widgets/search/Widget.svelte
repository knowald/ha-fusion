<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import Icon from '../../Icon.svelte';

	let { onsearch = () => {} }: { onsearch?: () => void } = $props();
	const onclick = () => onsearch();
</script>

<button type="button" class="search-button pressable" {onclick}>
	<Icon name="search" size={ICON.control} />
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
		padding: 16px 16px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
		border-radius: var(--h-radius-md);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		color: var(--h-text-4);
		font: inherit;
		font-size: var(--h-type-body);
		text-align: left;
		cursor: pointer;
	}

	.search-button:hover {
		background: rgb(var(--h-surface-rgb) / calc(0.075 * var(--h-fill-scale)));
	}
</style>
