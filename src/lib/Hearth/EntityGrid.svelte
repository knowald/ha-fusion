<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import type { EntityRef } from './config';
	import { onDndReceive } from './drag';
	import { hearthEditMode } from './store';
	import EntityTile from './EntityTile.svelte';
	import Icon from './Icon.svelte';
	import StatTile from './StatTile.svelte';

	let {
		entities,
		cardId = undefined,
		style = 'tile',
		columns = undefined,
		compact = false,
		readonly = false,
		minTileWidth = 190,
		showDragHandles = true,
		onreorder = undefined,
		onreceive = undefined
	}: {
		entities: EntityRef[];
		/** Enables edit-mode sorting and uniquely identifies this card's entities. */
		cardId?: string;
		style?: 'tile' | 'stat';
		columns?: number;
		compact?: boolean;
		/** card-wide default; an entity's own `readonly` wins */
		readonly?: boolean;
		minTileWidth?: number;
		showDragHandles?: boolean;
		onreorder?: (entities: EntityRef[]) => void;
		onreceive?: (token: string, newIndex: number) => void;
	} = $props();

	const entityGroup = 'hearth-card-entities';
</script>

<div
	class="grid"
	class:editing={$hearthEditMode && Boolean(cardId) && showDragHandles}
	class:empty={entities.length === 0}
	style:--min-tile-width="{minTileWidth}px"
	style:grid-template-columns={columns ? `repeat(${columns}, minmax(0, 1fr))` : undefined}
	use:sortable={{
		group: entityGroup,
		handle: '.entity-drag-handle',
		disabled: !$hearthEditMode || !cardId || !showDragHandles,
		items: entities,
		onFinalize: (items: EntityRef[]) => onreorder?.(items)
	}}
	use:onDndReceive={(detail) => onreceive?.(detail.id, detail.newIndex)}
>
	<!-- keyed by entity (index breaks the tie for duplicates): reusing a tile for
	     a different entity can leave StateLogic showing the previous state -->
	{#each entities as ref, index (`${ref.entity}-${index}`)}
		<div class="entity-slot" data-id={JSON.stringify([cardId, index])}>
			{#if $hearthEditMode && cardId && showDragHandles}
				<div class="entity-drag-handle" aria-label="Rearrange entity">
					<Icon name="drag_indicator" size={17} />
				</div>
			{/if}
			{#if (ref.display ?? style) === 'stat'}
				<StatTile entity={ref.entity} name={ref.name} />
			{:else}
				<EntityTile
					entity={ref.entity}
					name={ref.name}
					icon={ref.icon}
					readonly={ref.readonly ?? readonly}
					{compact}
				/>
			{/if}
		</div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--min-tile-width), 1fr));
		gap: 12px;
	}

	.grid.editing.empty {
		min-height: 62px;
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		border-radius: var(--h-radius-md);
	}

	.grid.editing.empty::before {
		content: 'Drop entities here';
		align-self: center;
		justify-self: center;
		color: var(--h-text-6);
		font-size: 13px;
	}

	.entity-slot {
		position: relative;
		min-width: 0;
	}

	.entity-slot > :global(.tile),
	.entity-slot > :global(.stat) {
		height: 100%;
	}

	.entity-drag-handle {
		position: absolute;
		top: 7px;
		right: 7px;
		z-index: 6;
		display: flex;
		padding: 5px;
		border: 1px solid rgb(var(--h-accent-rgb) / 0.35);
		border-radius: 8px;
		background: var(--h-sheet-0);
		color: var(--h-text-2);
		cursor: grab;
		touch-action: none;
	}

	.entity-slot:global(.sortable-ghost) {
		opacity: 0.35;
	}
</style>
