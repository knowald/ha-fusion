<script lang="ts">
	import type { SpacerWidget } from './descriptor';

	let { widget }: { widget: SpacerWidget } = $props();
</script>

<div class="spacer" style:height={widget.height ? `${widget.height}px` : undefined}>
	{#if widget.line}<hr class="line" />{/if}
</div>

<style>
	.spacer {
		display: flex;
		align-items: center;
		/* fills the rail slot, which is flexible unless a height is set */
		flex: 1;
		min-height: 0;
	}

	.line {
		width: 100%;
		margin: 0;
		border: 0;
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.12 * var(--h-line-scale)));
	}
</style>
