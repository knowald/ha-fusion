<script lang="ts">
	import Camera from '$lib/Main/Camera.svelte';
	import type { OverviewCard } from './config';

	let { card }: { card: Extract<OverviewCard, { type: 'camera' }> } = $props();
</script>

<div class="section">
	{#if card.title}
		<div class="section-title">{card.title}</div>
	{/if}
	{#if card.entity}
		<div class="camera">
			<Camera
				sel={{ id: card.id, type: 'camera', entity_id: card.entity, stream: card.stream } as any}
				responsive={true}
				muted={true}
				controls={false}
				allowEditStream={true}
			/>
		</div>
	{:else}
		<div class="placeholder">Pick a camera entity in the card editor</div>
	{/if}
</div>

<style>
	.section-title {
		font-size: 19px;
		font-weight: 600;
		color: var(--h-text-2);
		margin-bottom: 14px;
	}

	.camera {
		border-radius: var(--h-radius-md);
		overflow: hidden;
		border: 1px solid rgb(var(--h-surface-rgb) / 0.06);
	}

	.placeholder {
		padding: 22px;
		border-radius: var(--h-radius-md);
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		color: var(--h-text-6);
		font-size: 14px;
		text-align: center;
	}
</style>
