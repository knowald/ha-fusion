<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import type { OverviewCard } from './config';
	import { onDndReceive } from './drag';
	import { editor, hearthConfig, hearthEditMode, updateConfig } from './store';
	import AddTile from './AddTile.svelte';
	import AirCard from './AirCard.svelte';
	import BlindsSection from './BlindsSection.svelte';
	import CameraCard from './CameraCard.svelte';
	import EditChip from './EditChip.svelte';
	import EntitiesCard from './EntitiesCard.svelte';
	import FusionCard from './FusionCard.svelte';
	import LightsSection from './LightsSection.svelte';
	import MediaCard from './MediaCard.svelte';
	import TemperatureCard from './TemperatureCard.svelte';
	import VacuumRow from './VacuumRow.svelte';

	function reorderColumn(column: number, items: OverviewCard[]) {
		updateConfig((config) => {
			config.overview[column] = items.filter(Boolean);
		});
	}

	// a card dropped from another column: move it in one config update; the
	// source column's onRemove then finds nothing and no-ops
	function receiveCard(column: number, id: string, newIndex: number) {
		updateConfig((config) => {
			for (const sourceColumn of config.overview) {
				const index = sourceColumn.findIndex((card) => card.id === id);
				if (index >= 0) {
					const [card] = sourceColumn.splice(index, 1);
					config.overview[column].splice(newIndex, 0, card);
					return;
				}
			}
		});
	}
</script>

<div class="overview" style:--overview-columns={$hearthConfig.overview.length}>
	{#each $hearthConfig.overview as column, columnIndex (columnIndex)}
		<div
			class="column"
			use:sortable={{
				group: 'hearth-cards',
				handle: '.drag-handle',
				filter: '.add-tile',
				disabled: !$hearthEditMode,
				items: column,
				onFinalize: (items: OverviewCard[]) => reorderColumn(columnIndex, items)
			}}
			use:onDndReceive={(detail) => receiveCard(columnIndex, detail.id, detail.newIndex)}
		>
			{#each column as card, index (card.id)}
				<div
					class="card-slot"
					data-id={card.id}
					class:stretch={card.type === 'media' || card.type === 'temperature'}
				>
					{#if $hearthEditMode}
						<EditChip onedit={() => editor.set({ kind: 'card', column: columnIndex, index })} />
					{/if}
					{#if card.type === 'lights'}
						<LightsSection {card} />
					{:else if card.type === 'blinds'}
						<BlindsSection {card} />
					{:else if card.type === 'temperature'}
						<TemperatureCard {card} />
					{:else if card.type === 'air'}
						<AirCard {card} />
					{:else if card.type === 'media'}
						<MediaCard {card} />
					{:else if card.type === 'vacuum'}
						<VacuumRow {card} />
					{:else if card.type === 'entities'}
						<EntitiesCard {card} />
					{:else if card.type === 'camera'}
						<CameraCard {card} />
					{:else if card.type === 'fusion'}
						<FusionCard {card} />
					{/if}
				</div>
			{/each}
			{#if $hearthEditMode}
				<AddTile
					label="Add card"
					onadd={() => editor.set({ kind: 'card', column: columnIndex, index: null })}
				/>
			{/if}
		</div>
	{/each}
</div>

<style>
	.overview {
		display: grid;
		grid-template-columns: repeat(var(--overview-columns, 2), 1fr);
		gap: 30px;
		min-height: 100%;
	}

	@media (max-width: 1200px) {
		.overview {
			grid-template-columns: 1fr;
		}
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 18px;
		min-height: 0;
	}

	.card-slot {
		position: relative;
	}

	.card-slot.stretch {
		flex: 1;
		min-height: 0;
	}
</style>
