<script lang="ts">
	import { itemHeight, editMode, disableMenuButton, showDrawer, motion } from '$lib/Stores';
	import { openModal } from 'svelte-modals/legacy';
	import { onDestroy, tick } from 'svelte';

	let { sel }: { sel: any } = $props();

	let timeout: ReturnType<typeof setTimeout> | null;

	/**
	 * Opens `MainItemConfig`
	 */
	async function handleClick() {
		if (!$disableMenuButton) {
			openModal(() => import('$lib/Modal/MainItemConfig.svelte'), { sel });

			await tick();

			timeout = setTimeout(() => {
				$editMode = true;
				$showDrawer = true;
			}, $motion);
		}
	}

	onDestroy(() => {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	});
</script>

<div
	style:min-height="{$itemHeight}px"
	onclick={handleClick}
	style:cursor={$editMode ? 'unset' : 'pointer'}

	role="button"
	tabindex="0"
></div>

<style>
	div {
		border-radius: 0.65rem;
		background-color: rgba(255, 190, 10, 0.25);
		outline: rgb(255, 192, 8) dashed 2px;
		outline-offset: -2px;
		height: 100%;
	}
</style>
