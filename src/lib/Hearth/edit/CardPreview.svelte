<script lang="ts">
	import { ICON } from '../iconSizes';
	import { lang } from '$lib/core/i18n';
	import type { EntityRef, OverviewCard } from '../types';
	import { cardDescriptor } from '../cards';
	import { provideHearthInteractionMode } from '../interaction';
	import CardRenderer from '../CardRenderer.svelte';
	import Icon from '../Icon.svelte';

	let {
		card,
		onentitiesreorder = undefined
	}: { card: OverviewCard; onentitiesreorder?: (entities: EntityRef[]) => void } = $props();

	provideHearthInteractionMode('preview');

	let reorder = $state(false);
	let reorderable = $derived(cardDescriptor(card.type)?.previewReorder ?? false);
	let interactive = $derived(
		reorderable || (cardDescriptor(card.type)?.previewInteractive ?? false)
	);
</script>

<aside class="pane">
	<div class="heading" class:empty={!reorderable}>
		<div class="label">{$lang('hearth_live_preview')}</div>
		{#if reorderable}
			<button
				type="button"
				class:active={reorder}
				aria-pressed={reorder}
				onclick={() => (reorder = !reorder)}
			>
				<Icon name="drag_indicator" size={ICON.inline} />
				{reorder ? 'Finish reorder' : 'Reorder'}
			</button>
		{/if}
	</div>
	<div class="preview" class:interactive>
		<CardRenderer {card} {onentitiesreorder} showEntityDragHandles={reorderable && reorder} />
	</div>
</aside>

<style>
	.pane {
		position: sticky;
		top: 0;
		min-width: 0;
		align-self: start;
	}

	.heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 10px;
	}

	.label {
		color: var(--h-label);
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 2px;
	}

	button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 8px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.04 * var(--h-fill-scale)));
		color: var(--h-text-5);
		font: inherit;
		font-size: var(--h-type-label);
		cursor: pointer;
	}

	button:hover,
	button.active {
		border-color: rgb(var(--h-accent-rgb) / calc(0.35 * var(--h-accent-scale)));
		background: rgb(var(--h-accent-rgb) / calc(0.1 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}

	.preview {
		max-height: calc(100dvh - 210px);
		padding: 14px;
		margin-bottom: 14px;
		overflow: auto;
		border-radius: var(--h-radius-md);
		background: var(--h-inset);
		pointer-events: none;
	}

	.preview.interactive {
		pointer-events: auto;
	}

	@media (max-width: 820px) {
		.pane {
			z-index: calc(var(--h-layer-raised) + 1);
			grid-row: 1;
			padding: 12px;
			margin: -12px -12px 0;
			border-bottom: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
			background: var(--h-sheet-0);
		}

		.label {
			display: none;
		}

		.heading.empty {
			display: none;
		}

		.preview {
			max-height: 30dvh;
			margin-bottom: 0;
		}
	}
</style>
