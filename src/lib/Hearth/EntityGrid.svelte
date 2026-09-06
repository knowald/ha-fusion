<script lang="ts">
	import { ICON } from './iconSizes';
	import { lang } from '$lib/core/i18n';
	import { sortable } from '$lib/ui/actions/sortable';
	import type { EntityRef } from './config';
	import type { SliderUpdateMode } from '$lib/core/app/configuration';
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
		sliderUpdates = 'continuous',
		tuneButton = false,
		// two tracks must survive a two-column page on a padded tablet: page
		// columns bottom out around 350px, and 2x160+gap still fits there
		minTileWidth = 160,
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
		sliderUpdates?: SliderUpdateMode;
		/** restores the per-tile controls glyph beside the long-press gesture */
		tuneButton?: boolean;
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
				<div class="entity-drag-handle" aria-label={$lang('hearth_rearrange_entity')}>
					<Icon name="drag_indicator" size={ICON.inline} />
				</div>
			{/if}
			{#if (ref.display ?? style) === 'stat'}
				<StatTile entity={ref.entity} name={ref.name} verdictBands={ref.verdict} />
			{:else}
				<EntityTile
					entity={ref.entity}
					name={ref.name}
					icon={ref.icon}
					readonly={ref.readonly ?? readonly}
					sliderUpdates={ref.slider_updates ?? sliderUpdates}
					showTune={tuneButton}
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
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		border-radius: var(--h-radius-md);
	}

	.grid.editing.empty::before {
		content: 'Drop entities here';
		align-self: center;
		justify-self: center;
		color: var(--h-text-6);
		font-size: var(--h-type-secondary);
	}

	.entity-slot {
		position: relative;
		min-width: 0;
	}

	.entity-slot > :global(.tile),
	.entity-slot > :global(.stat) {
		height: 100%;
	}

	/* tiles leave room on the right for the handle while editing */
	.grid.editing :global(.entity-slot) {
		--tile-pad-right: 48px;
	}

	.entity-drag-handle {
		position: absolute;
		top: 50%;
		right: 8px;
		transform: translateY(-50%);
		z-index: var(--h-layer-grid-header);
		display: flex;
		padding: 6px;
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.35 * var(--h-accent-scale)));
		border-radius: var(--h-radius-tight);
		background: var(--h-sheet-0);
		color: var(--h-text-2);
		cursor: grab;
		touch-action: none;
	}

	.entity-slot:global(.sortable-ghost) {
		opacity: 0.35;
	}

	@media (max-width: 900px) {
		.grid.editing :global(.entity-slot) {
			--tile-pad-right: 40px;
		}

		.entity-drag-handle {
			right: 6px;
			padding: 4px;
		}
	}
</style>
