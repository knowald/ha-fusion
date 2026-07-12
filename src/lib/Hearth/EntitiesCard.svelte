<script lang="ts">
	import type { OverviewCard } from './config';
	import EntityTile from './EntityTile.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'entities' }> } = $props();
</script>

<div class="section">
	{#if card.title}
		<div class="section-title">{card.title}</div>
	{/if}
	{#if card.entities.length === 0}
		<div class="placeholder">Add entities in the card editor</div>
	{:else}
		<div class="grid">
			{#each card.entities as ref, index (index)}
				<EntityTile entity={ref.entity} name={ref.name} icon={ref.icon} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.section-title {
		font-size: 19px;
		font-weight: 600;
		color: var(--h-text-2);
		margin-bottom: 14px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		gap: 12px;
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
