<script lang="ts">
	import Button from '$lib/Main/Button.svelte';
	import ConditionalMedia from '$lib/Main/ConditionalMedia.svelte';
	import PictureElements from '$lib/Main/PictureElements.svelte';
	import Camera from '$lib/Main/Camera.svelte';
	import Configure from '$lib/Main/Configure.svelte';
	import Empty from '$lib/Main/Empty.svelte';
	import DaysSince from '$lib/Main/DaysSince.svelte';
	import SpotifyPlayer from '$lib/Main/SpotifyPlayer.svelte';
	import SpotifyPlayerLarge from '$lib/Main/SpotifyPlayerLarge.svelte';

	let { item, sectionName = undefined }: { item: any; sectionName?: string } = $props();

	const large = ['conditional_media', 'picture_elements', 'camera', 'spotify_player_large'];
</script>

{#if item?.type === 'configure'}
	<Configure sel={item} />
{:else if item?.type === 'button'}
	<Button sel={item} {sectionName} />
{:else if item?.type === 'days_since'}
	<DaysSince sel={item} {sectionName} />
{:else if item?.type === 'spotify_player'}
	<SpotifyPlayer sel={item} {sectionName} />
{:else if item?.type === 'spotify_player_large'}
	<SpotifyPlayerLarge sel={item} {sectionName} />
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

