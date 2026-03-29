<script lang="ts">
	import { onMount } from 'svelte';

	let { resizing = $bindable(), container, panelsWidth = $bindable() }: { resizing: boolean; container: HTMLDivElement; panelsWidth: number } = $props();

	let minWidth: number;

	onMount(() => {
		const _3remInPx = 3 * parseFloat(getComputedStyle(document.documentElement).fontSize);
		minWidth = _3remInPx;
	});

	function handlePointermove(event: PointerEvent) {
		if (!resizing) return;

		const containerRect = container.getBoundingClientRect();
		const maxWidth = containerRect.width - minWidth * 2;
		const newWidth = containerRect.right - event.clientX;
		panelsWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
	}
</script>

<svelte:window onpointermove={handlePointermove} onpointerup={() => (resizing = false)} />

<div onpointerdown={() => (resizing = true)}></div>

<style>
	div {
		cursor: col-resize;
		position: relative;
		border-left: 1px solid rgba(255, 255, 255, 0.2);
	}

	div::before,
	div::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -3px;
		width: 6px;
	}
</style>
