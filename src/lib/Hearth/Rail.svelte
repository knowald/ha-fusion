<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import { slugify, uniqueId, type RailWidget } from './config';
	import { editor, hearthConfig, hearthEditMode, updateConfig } from './store';
	import AddTile from './AddTile.svelte';
	import ClockWidget from './ClockWidget.svelte';
	import EditChip from './EditChip.svelte';
	import EntityTile from './EntityTile.svelte';
	import FusionWidget from './FusionWidget.svelte';
	import NavWidget from './NavWidget.svelte';
	import StatusWidget from './StatusWidget.svelte';
	import VisibilityGate from './VisibilityGate.svelte';
	import WeatherCard from './WeatherCard.svelte';
</script>

<div
	class="rail"
	use:sortable={{
		group: 'hearth-rail',
		handle: '.drag-handle',
		filter: '.add-tile',
		disabled: !$hearthEditMode,
		clone: true,
		cloneItem: (widget: RailWidget) => {
			const cloned = structuredClone(widget);
			cloned.id = uniqueId(
				slugify(widget.type),
				$hearthConfig.rail.map((entry) => entry.id)
			);
			return cloned;
		},
		items: $hearthConfig.rail,
		onFinalize: (items: RailWidget[]) =>
			updateConfig((config) => {
				config.rail = items;
			})
	}}
>
	{#each $hearthConfig.rail as widget, index (widget.id)}
		<VisibilityGate conditions={widget.visibility}>
			{#snippet children(visible)}
				{#if $hearthEditMode || visible}
					<div
						class="widget"
						class:spacer={widget.type === 'spacer' && !$hearthEditMode}
						class:spacer-visible={widget.type === 'spacer' && $hearthEditMode}
						class:hide-mobile={widget.hide_mobile && !$hearthEditMode}
						class:hide-mobile-editing={widget.hide_mobile && $hearthEditMode}
						class:visibility-dimmed={$hearthEditMode && !visible}
						data-id={widget.id}
					>
						{#if $hearthEditMode}
							<EditChip onedit={() => editor.set({ kind: 'railWidget', index })} />
						{/if}
						{#if widget.type === 'clock'}
							<ClockWidget city={widget.city} />
						{:else if widget.type === 'weather'}
							<WeatherCard entity={widget.entity} />
						{:else if widget.type === 'nav'}
							<NavWidget />
						{:else if widget.type === 'status'}
							<StatusWidget icon={widget.icon} text={widget.text} entity={widget.entity} />
						{:else if widget.type === 'entity'}
							{#if widget.entity}
								<EntityTile entity={widget.entity} name={widget.name} icon={widget.icon} />
							{:else}
								<div class="widget-placeholder">Pick an entity in the widget editor</div>
							{/if}
						{:else if widget.type === 'fusion'}
							<FusionWidget {widget} />
						{/if}
					</div>
				{/if}
			{/snippet}
		</VisibilityGate>
	{/each}
	{#if $hearthEditMode}
		<AddTile label="Add widget" onadd={() => editor.set({ kind: 'railWidget', index: null })} />
	{/if}
</div>

<style>
	.rail {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.widget {
		position: relative;
	}

	.widget.spacer {
		flex: 1;
	}

	.widget.spacer-visible {
		flex: 1;
		min-height: 40px;
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.1);
		border-radius: var(--h-radius-sm);
		margin: 6px 0;
	}

	.widget.visibility-dimmed {
		opacity: 0.45;
	}

	.widget-placeholder {
		padding: 14px;
		border-radius: var(--h-radius-sm);
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		color: var(--h-text-6);
		font-size: 13px;
		text-align: center;
	}

	@media (max-width: 900px) {
		.widget.hide-mobile {
			display: none;
		}

		.widget.hide-mobile-editing {
			opacity: 0.45;
		}
	}
</style>
