<script lang="ts">
	import Icon from './Icon.svelte';

	let { onedit }: { onedit: () => void } = $props();
</script>

<!-- the drag handle must NOT stop propagation - SortableJS listens on the container -->
<div class="chip">
	<span class="drag-handle"><Icon name="drag_indicator" size={17} /></span>
	<span
		class="pencil pressable"
		onclick={(event) => {
			event.stopPropagation();
			onedit();
		}}
		onpointerdown={(event) => event.stopPropagation()}
	>
		<Icon name="edit" size={17} />
	</span>
</div>

<style>
	.chip {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 5px 7px;
		border-radius: 10px;
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
</style>
