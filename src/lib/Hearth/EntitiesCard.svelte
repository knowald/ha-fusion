<script lang="ts">
	import { states } from '$lib/Stores';
	import type { OverviewCard } from './config';
	import { entityOn } from './store';
	import EntityTile from './EntityTile.svelte';
	import StatTile from './StatTile.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'entities' }> } = $props();

	let onCount = $derived(
		card.entities.filter((ref) => entityOn(ref.entity, $states?.[ref.entity])).length
	);
</script>

<div class="section">
	{#if card.title || card.show_count}
		<div class="section-header">
			<div class="section-title">{card.title ?? ''}</div>
			{#if card.show_count}
				<div class="section-hint">{onCount} on</div>
			{/if}
		</div>
	{/if}
	{#if card.entities.length === 0}
		<div class="placeholder">Add entities in the card editor</div>
	{:else}
		<div
			class="grid"
			style:grid-template-columns={card.columns
				? `repeat(${card.columns}, minmax(0, 1fr))`
				: undefined}
		>
			{#each card.entities as ref, index (index)}
				{#if (ref.display ?? card.style ?? 'tile') === 'stat'}
					<StatTile entity={ref.entity} name={ref.name} />
				{:else}
					<EntityTile entity={ref.entity} name={ref.name} icon={ref.icon} />
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.section-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.section-title {
		font-size: 19px;
		font-weight: 600;
		color: var(--h-text-2);
	}

	.section-hint {
		font-size: 13px;
		color: var(--h-text-5);
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
