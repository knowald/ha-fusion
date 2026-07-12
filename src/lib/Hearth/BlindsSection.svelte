<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import type { HearthBlind, OverviewCard } from './config';
	import { editor, hearthConfig, hearthEditMode, updateConfig } from './store';
	import AddTile from './AddTile.svelte';
	import BlindTile from './BlindTile.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'blinds' }> } = $props();
</script>

<div class="section">
	<div class="section-title">{card.title ?? 'Blinds'}</div>
	<div
		class="grid"
		use:sortable={{
			group: 'hearth-blinds',
			handle: '.drag-handle',
			disabled: !$hearthEditMode,
			filter: '.add-tile',
			items: $hearthConfig.blinds,
			onFinalize: (items: HearthBlind[]) =>
				updateConfig((config) => {
					config.blinds = items.filter(Boolean);
				})
		}}
	>
		{#each $hearthConfig.blinds as blind (blind.id)}
			<BlindTile id={blind.id} />
		{/each}
		{#if $hearthEditMode}
			<AddTile label="Add blind" onadd={() => editor.set({ kind: 'blind', id: null })} />
		{/if}
	</div>
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
</style>
