<script lang="ts">
	import { ICON } from './iconSizes';
	import { lang } from '$lib/core/i18n';
	import { activateOnKeyboard } from './interaction';
	import Icon from './Icon.svelte';

	let { onedit }: { onedit: () => void } = $props();
</script>

<!-- the drag handle must NOT stop propagation - SortableJS listens on the container -->
<div class="chip">
	<span class="drag-handle"><Icon name="drag_indicator" size={ICON.inline} /></span>
	<span
		class="pencil pressable"
		onclick={(event) => {
			event.stopPropagation();
			onedit();
		}}
		onpointerdown={(event) => event.stopPropagation()}
		role="button"
		tabindex="0"
		aria-label={$lang('edit')}
		onkeydown={(event) =>
			activateOnKeyboard(event, () =>
				((event) => {
					event.stopPropagation();
					onedit();
				})(event)
			)}
	>
		<Icon name="edit" size={ICON.inline} />
	</span>
</div>

<style>
	/* straddles the top edge so it covers a border, not a title */
	.chip {
		position: absolute;
		top: -12px;
		right: 12px;
		z-index: var(--h-layer-chip);
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 8px;
		border-radius: var(--h-radius-tight);
		/* solid, not a color-mix: older tablet webviews drop the whole
		   declaration and the chip becomes invisible over the card */
		background: var(--h-sheet-0);
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.35 * var(--h-accent-scale)));
		color: var(--h-text-2);
	}

	.drag-handle {
		cursor: grab;
		display: inline-flex;
	}

	.pencil {
		cursor: pointer;
		display: inline-flex;
	}

	.pencil:hover {
		color: var(--h-accent-text);
	}

	@media (max-width: 900px) {
		.chip {
			top: -10px;
			right: 8px;
			padding: 4px 6px;
			gap: 2px;
		}
	}
</style>
