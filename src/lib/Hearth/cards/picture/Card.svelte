<script lang="ts">
	import { onDestroy } from 'svelte';
	import { mountPictureViewer, type PictureViewer } from '$lib/legacy/bridge/pictureElements';
	import type { PictureCard } from './descriptor';

	let { card }: { card: PictureCard } = $props();

	let container = $state<HTMLDivElement>();
	let viewer: PictureViewer | undefined;

	// Konva needs the container's size, so the stage mounts once the element
	// exists and re-renders its layer whenever the elements change
	$effect(() => {
		const target = container;
		if (!target || viewer) return;
		let cancelled = false;
		mountPictureViewer(target, card.id, $state.snapshot(card.elements)).then((mounted) => {
			if (cancelled) mounted.destroy();
			else viewer = mounted;
		});
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const elements = $state.snapshot(card.elements);
		void viewer?.update(elements);
	});

	onDestroy(() => viewer?.destroy());
</script>

<div class="section">
	{#if card.title}
		<div class="section-title">{card.title}</div>
	{/if}
	<div class="stage" bind:this={container} style:height="{card.height ?? 240}px"></div>
</div>

<style>
	.section-title {
		margin-bottom: 10px;
		font-size: 13px;
		font-weight: 500;
		letter-spacing: 0.5px;
		color: var(--h-text-4);
	}

	.stage {
		width: 100%;
		border-radius: var(--h-radius-md);
		overflow: hidden;
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
	}
</style>
