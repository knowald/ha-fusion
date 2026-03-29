<script lang="ts">
	import { states, lang } from '$lib/Stores';

	let { entity_id = undefined, url = undefined }: {
		entity_id?: string | undefined;
		url?: string | undefined;
	} = $props();

	let src = $derived(entity_id && $states?.[entity_id]?.attributes?.entity_picture);
</script>

{#if url}
	<img src={url} alt="url" />
{:else if src}
	<img {src} alt={entity_id} />
{:else}
	{$lang('picture')}
{/if}

<style>
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		padding: var(--theme-sidebar-item-padding);
	}
</style>
