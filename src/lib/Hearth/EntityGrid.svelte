<script lang="ts">
	import type { EntityRef } from './config';
	import EntityTile from './EntityTile.svelte';
	import StatTile from './StatTile.svelte';

	let {
		entities,
		style = 'tile',
		columns = undefined,
		compact = false,
		readonly = false,
		minTileWidth = 190
	}: {
		entities: EntityRef[];
		style?: 'tile' | 'stat';
		columns?: number;
		compact?: boolean;
		/** card-wide default; an entity's own `readonly` wins */
		readonly?: boolean;
		minTileWidth?: number;
	} = $props();
</script>

<div
	class="grid"
	style:--min-tile-width="{minTileWidth}px"
	style:grid-template-columns={columns ? `repeat(${columns}, minmax(0, 1fr))` : undefined}
>
	<!-- keyed by entity (index breaks the tie for duplicates): reusing a tile for
	     a different entity can leave StateLogic showing the previous state -->
	{#each entities as ref, index (`${ref.entity}-${index}`)}
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
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--min-tile-width), 1fr));
		gap: 12px;
	}
</style>
