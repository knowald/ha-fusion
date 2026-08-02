<script lang="ts">
	import { states } from '$lib/Stores';
	import type { OverviewCard } from './config';

	let { card }: { card: Extract<OverviewCard, { type: 'image' }> } = $props();

	let entity = $derived(card.entity ? $states?.[card.entity] : undefined);
	let entityPicture = $derived(entity?.attributes?.entity_picture as string | undefined);
	let imageSource = $derived.by(() => {
		if (!entityPicture) return undefined;
		const revision = entity?.state ?? entity?.last_updated;
		if (!revision) return entityPicture;
		const separator = entityPicture.includes('?') ? '&' : '?';
		return `${entityPicture}${separator}hearth=${encodeURIComponent(revision)}`;
	});
	// the source that failed to load rather than a flag, so a new revision is
	// retried without an effect to reset it
	let failedSource = $state<string | undefined>(undefined);
</script>

<div class="section">
	{#if card.title}
		<div class="section-title">{card.title}</div>
	{/if}

	{#if !card.entity}
		<div class="placeholder">Pick an image entity in the card editor</div>
	{:else if entity?.state === 'unavailable'}
		<div class="placeholder">Image unavailable</div>
	{:else if imageSource && imageSource !== failedSource}
		<div class="image-frame">
			<img
				src={imageSource}
				alt={card.title ?? entity?.attributes?.friendly_name ?? card.entity}
				onerror={() => (failedSource = imageSource)}
			/>
		</div>
	{:else}
		<div class="placeholder">Image not available</div>
	{/if}
</div>

<style>
	.section-title {
		font-size: 19px;
		font-weight: 600;
		color: var(--h-text-2);
		margin-bottom: 14px;
	}

	.image-frame {
		display: grid;
		place-items: center;
		min-height: 120px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
		border-radius: var(--h-radius-md);
		background: var(--h-inset);
		box-shadow: var(--h-card-shadow);
		overflow: hidden;
	}

	img {
		display: block;
		width: 100%;
		height: auto;
		max-height: 60dvh;
		object-fit: contain;
	}

	.placeholder {
		padding: 22px;
		border-radius: var(--h-radius-md);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: 14px;
		text-align: center;
	}
</style>
