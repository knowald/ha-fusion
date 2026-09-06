<script lang="ts">
	import { ICON } from './iconSizes';
	import Icon from './Icon.svelte';

	/**
	 * One look for "nothing here": a dashed frame with an optional icon, a
	 * line of copy and an optional hint. `inline` drops the frame for lists
	 * and panels that already have a border of their own.
	 */
	let {
		text,
		hint = undefined,
		icon = undefined,
		inline = false
	}: { text: string; hint?: string; icon?: string; inline?: boolean } = $props();
</script>

<div class="empty-state" class:inline role="status">
	{#if icon}<Icon name={icon} size={ICON.control} />{/if}
	<div class="copy">
		<span class="text">{text}</span>
		{#if hint}<span class="hint">{hint}</span>{/if}
	</div>
</div>

<style>
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 18px;
		border-radius: var(--h-radius-sm);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: var(--h-type-secondary);
		text-align: center;
	}

	.empty-state.inline {
		justify-content: flex-start;
		padding: 8px;
		border: 0;
		text-align: left;
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.hint {
		font-size: var(--h-type-small);
		color: var(--h-text-6);
	}
</style>
