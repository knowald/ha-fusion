<script lang="ts">
	import type { LabelWidget } from './descriptor';

	let { widget }: { widget: LabelWidget } = $props();
</script>

<div class="section-label">{widget.text ?? ''}</div>

<style>
	.section-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-text-6);
		margin: 18px 0 10px;
	}
</style>
