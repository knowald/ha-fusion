<script lang="ts">
	import Modal from '$lib/Modal/Index.svelte';

	let { isOpen }: { isOpen: boolean } = $props();
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">dev</h1>
		<br />
		<a href="/playground/theme_editor" target="_blank">theme_editor (prototype)</a>
	</Modal>
{/if}

<style>
	a {
		color: lightblue;
	}
</style>
