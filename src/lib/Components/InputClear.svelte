<script lang="ts">
	import { motion } from '$lib/Stores';
	import { fade, scale } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	export let condition: any;
	export let select: boolean | undefined = false;
	$: padding = condition ? '0.9em 2.5rem 0.9em 0.9em' : '0.9em';
	export let onclear: (() => void) | undefined = undefined;
	function handleClick() {
		onclear?.();
	}
</script>
<div class="clear">
	<slot {padding} />
	{#if condition}
		<button
			class:select
			tabindex="-1"
			transition:scale={{ duration: $motion }}
			onclick={handleClick}
		>
			<Icon icon="mingcute:close-fill" height="auto" width="100%" />
		</button>
	{/if}
	{#if condition && select}
		<div class="divider" transition:fade={{ duration: $motion / 2 }}></div>
	{/if}
</div>
<style>
	.clear {
		display: grid;
	}
	button {
		display: flex;
		align-items: center;
		padding: 0.8rem;
	}
	.divider {
		position: absolute;
		right: 2.3rem;
		height: 100%;
		width: 1px;
		background-color: rgba(255, 255, 255, 0.2);
	}
	.select {
		margin-right: 2.3rem;
	}
</style>
