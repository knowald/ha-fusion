<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import { slugify, uniqueId, type RailWidget } from './config';
	import { editor, hearthConfig, hearthEditMode, updateConfig } from './store';
	import AddControl from './AddControl.svelte';
	import EditChip from './EditChip.svelte';
	import RailWidgetRenderer from './RailWidgetRenderer.svelte';
	import VisibilityGate from './VisibilityGate.svelte';
	import Icon from './Icon.svelte';

	let { onsearch }: { onsearch: () => void } = $props();
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
	{#if !$hearthEditMode}
		<button type="button" class="search-button pressable" onclick={onsearch}>
			<Icon name="search" size={20} />
			<span>Search pages and entities</span>
		</button>
	{/if}
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
						<RailWidgetRenderer {widget} />
					</div>
				{/if}
			{/snippet}
		</VisibilityGate>
	{/each}
	{#if $hearthEditMode}
		<AddControl label="Add widget" onadd={() => editor.set({ kind: 'railWidget', index: null })} />
	{/if}
</div>

<style>
	.rail {
		display: flex;
		flex-direction: column;
		/* fill the rail-scroll viewport so spacer widgets have space to absorb,
		   but never shrink below content height - overflow scrolls instead */
		flex: 1 0 auto;
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
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		border-radius: var(--h-radius-sm);
		margin: 6px 0;
	}

	.widget.visibility-dimmed {
		opacity: 0.45;
	}

	.search-button {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		min-height: 44px;
		margin-bottom: 10px;
		padding: 10px 14px;
		border: 1px solid rgb(var(--h-line-rgb) / 0.1);
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / 0.05);
		color: var(--h-text-4);
		font: inherit;
		font-size: 14px;
		cursor: pointer;
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
