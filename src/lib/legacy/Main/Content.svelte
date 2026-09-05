<script lang="ts">
	import Button from '$lib/legacy/Main/Button.svelte';
	import ConditionalMedia from '$lib/legacy/Main/ConditionalMedia.svelte';
	import PictureElements from '$lib/legacy/Main/PictureElements.svelte';
	import Camera from '$lib/legacy/Main/Camera.svelte';
	import Configure from '$lib/legacy/Main/Configure.svelte';
	import Empty from '$lib/legacy/Main/Empty.svelte';
	import DaysSince from '$lib/legacy/Main/DaysSince.svelte';
	import Entities from '$lib/legacy/Main/Entities.svelte';
	import SpotifyPlayer from '$lib/legacy/Main/SpotifyPlayer.svelte';

	let { item, sectionName = undefined }: { item: any; sectionName?: string } = $props();
</script>

{#if item?.type === 'configure'}
	<Configure sel={item} />
{:else if item?.type === 'button'}
	<Button sel={item} {sectionName} />
{:else if item?.type === 'days_since'}
	<DaysSince sel={item} {sectionName} />
{:else if item?.type === 'entities'}
	<Entities sel={item} {sectionName} />
{:else if item?.type === 'spotify_player'}
	<SpotifyPlayer sel={item} {sectionName} />
{:else if item?.type === 'spotify_player_large'}
	<SpotifyPlayer sel={item} {sectionName} large />
{:else if item?.type === 'conditional_media'}
	<ConditionalMedia sel={item} />
{:else if item?.type === 'picture_elements'}
	<PictureElements sel={item} />
{:else if item?.type === 'camera'}
	<Camera sel={item} responsive={false} muted={true} controls={false} />
{:else if item?.type === 'empty'}
	<Empty sel={item} />
{:else}
	<!-- if types are changed internally, don't break ui -->
	<Configure sel={{ id: item?.id }} />
{/if}
