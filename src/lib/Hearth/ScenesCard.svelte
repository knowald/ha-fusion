<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import { PRESS_RIPPLE } from './config';
	import type { OverviewCard } from './config';
	import { activateScene, pendingEntities } from './store';
	import Icon from './Icon.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'scenes' }> } = $props();
</script>

<div class="section">
	{#if card.title}
		<div class="section-title">{card.title}</div>
	{/if}
	{#if card.scenes.length === 0}
		<div class="placeholder">Add scenes in the card editor</div>
	{:else}
		<div class="chips">
			{#each card.scenes as ref, index (index)}
				<div
					class="chip pressable"
					class:pending={$pendingEntities[ref.entity] !== undefined}
					use:Ripple={PRESS_RIPPLE}
					onclick={() => activateScene(ref.entity)}
				>
					<Icon name={ref.icon || 'palette'} size={18} />
					<span class="chip-name">
						{ref.name || $states?.[ref.entity]?.attributes?.friendly_name || ref.entity}
					</span>
				</div>
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

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.chip {
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 11px 16px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.06);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		color: var(--h-icon);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.chip-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--h-text-3);
		white-space: nowrap;
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
