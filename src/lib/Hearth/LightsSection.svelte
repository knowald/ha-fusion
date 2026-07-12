<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import type { HearthLight, OverviewCard } from './config';
	import { editor, hearthConfig, hearthEditMode, lightsOnCount, updateConfig } from './store';
	import AddTile from './AddTile.svelte';
	import LightTile from './LightTile.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'lights' }> } = $props();
</script>

<div class="section">
	<div class="section-header">
		<div class="section-title">{card.title ?? 'Lights'}</div>
		<div class="section-hint">{$lightsOnCount} on · tap toggles, drag dims</div>
	</div>
	<div
		class="grid"
		use:sortable={{
			group: 'hearth-lights',
			handle: '.drag-handle',
			disabled: !$hearthEditMode,
			filter: '.add-tile',
			items: $hearthConfig.lights,
			onFinalize: (items: HearthLight[]) =>
				updateConfig((config) => {
					config.lights = items.filter(Boolean);
				})
		}}
	>
		{#each $hearthConfig.lights as light (light.id)}
			<LightTile id={light.id} />
		{/each}
		{#if $hearthEditMode}
			<AddTile label="Add light" onadd={() => editor.set({ kind: 'light', id: null })} />
		{/if}
	</div>
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
</style>
