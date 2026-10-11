<script lang="ts">
	import Modal from '$lib/Modal/Index.svelte';

	let { isOpen }: { isOpen: boolean } = $props();
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>dev</h1>{/snippet}
		<br />
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- dev prototype route -->
		<a href="/playground/theme_editor" target="_blank">theme_editor (prototype)</a>
	</Modal>
{/if}

<style>
	a {
		color: lightblue;
	}
</style>
