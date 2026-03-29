<script lang="ts">
	import Camera from '$lib/Main/Camera.svelte';
	import { editMode } from '$lib/Stores';

	let { sel }: { sel: any } = $props();
</script>

<div style:cursor={$editMode ? 'unset' : 'pointer'}>
	<Camera {sel} responsive={true} muted={true} controls={false} />
</div>

<style>
	div {
		aspect-ratio: 16 / 9;
		padding: var(--theme-sidebar-item-padding);
	}
</style>
