<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<section class="section">
	<div class="title">{title}</div>
	<div class="content">{@render children()}</div>
</section>

<style>
	.section {
		margin-top: 22px;
		padding-top: 18px;
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
	}

	.title {
		margin-bottom: 12px;
		color: var(--h-label);
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
	}
</style>
