<script lang="ts">
	import type { LabelWidget } from './descriptor';

	let { widget }: { widget: LabelWidget } = $props();
</script>

{#if widget.divider}<hr class="divider" />{/if}
{#if widget.text}<div class="section-label">{widget.text}</div>{/if}

<style>
	.divider {
		border: 0;
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.12 * var(--h-line-scale)));
		margin: 14px 0 4px;
	}

	.section-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-text-6);
		margin: 18px 0 10px;
	}
</style>
