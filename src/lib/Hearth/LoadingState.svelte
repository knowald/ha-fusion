<script lang="ts">
	/** One look for "still fetching": muted copy with a live region, no spinner theatre. */
	let { text, inline = false }: { text: string; inline?: boolean } = $props();
</script>

<div class="loading-state" class:inline role="status" aria-live="polite">{text}</div>

<style>
	.loading-state {
		padding: 18px;
		color: var(--h-text-6);
		font-size: var(--h-type-secondary);
		text-align: center;
	}

	.loading-state.inline {
		padding: 8px;
		text-align: left;
	}
</style>
