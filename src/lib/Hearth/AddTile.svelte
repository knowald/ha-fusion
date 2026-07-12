<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from './config';
	import Icon from './Icon.svelte';

	let { label, onadd }: { label: string; onadd: () => void } = $props();
</script>

<div class="add add-tile pressable" use:Ripple={PRESS_RIPPLE} onclick={onadd}>
	<Icon name="add" size={20} />
	<span>{label}</span>
</div>

<style>
	.add {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 15px 16px;
		min-height: 58px;
		border-radius: var(--h-radius-md);
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		color: var(--h-text-6);
		font-size: 14px;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.add:hover {
		color: var(--h-text-4);
		border-color: rgb(var(--h-surface-rgb) / 0.25);
	}
</style>
