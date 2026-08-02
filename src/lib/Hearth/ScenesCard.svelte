<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import { PRESS_RIPPLE } from './config';
	import type { OverviewCard } from './config';
	import { activateScene, activeSceneIndex, pendingEntities } from './store';
	import Icon from './Icon.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'scenes' }> } = $props();

	let bar = $derived(card.style === 'bar');
	let activeIndex = $derived(activeSceneIndex(card.scenes, $states));

	function sceneName(ref: { entity: string; name?: string }) {
		return ref.name || $states?.[ref.entity]?.attributes?.friendly_name || ref.entity;
	}
</script>

<div class="section">
	{#if card.title}
		<div class="section-title">{card.title}</div>
	{/if}
	{#if card.scenes.length === 0}
		<div class="placeholder">Add scenes in the card editor</div>
	{:else}
		<div class="scenes" class:bar>
			{#each card.scenes as ref, index (index)}
				{@const active = index === activeIndex}
				<div
					class="scene pressable"
					class:active
					class:pending={$pendingEntities[ref.entity] !== undefined}
					use:Ripple={PRESS_RIPPLE}
					onclick={() => activateScene(ref.entity)}
				>
					<Icon
						name={ref.icon || 'palette'}
						size={bar ? 24 : 18}
						color={active ? 'var(--h-accent-icon)' : undefined}
						fill={active}
					/>
					<span class="scene-name">{sceneName(ref)}</span>
					{#if bar && (active || ref.caption)}
						<span class="scene-caption">{active ? 'active' : ref.caption}</span>
					{/if}
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

	.scenes {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.scene {
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 11px 16px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		color: var(--h-icon);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.scene.active {
		background: rgb(var(--h-accent-rgb) / calc(0.13 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.34 * var(--h-accent-scale)));
	}

	.scene-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--h-text-3);
		white-space: nowrap;
	}

	.scene.active .scene-name {
		color: var(--h-text-1);
	}

	/* the persistent row: equal-width tiles on one line. Keep it to four scenes
	   and it never scrolls; past that it scrolls rather than clipping. */
	.scenes.bar {
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.scenes.bar::-webkit-scrollbar {
		display: none;
	}

	.scenes.bar .scene {
		flex: 1 0 84px;
		min-width: 0;
		flex-direction: column;
		gap: 8px;
		padding: 15px 10px;
		border-radius: var(--h-radius-md);
	}

	.scenes.bar .scene-name {
		font-size: 13.5px;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.scene-caption {
		font-family: var(--h-font-mono);
		font-size: 10px;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--h-text-6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.scene.active .scene-caption {
		color: var(--h-accent-dim-text);
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
