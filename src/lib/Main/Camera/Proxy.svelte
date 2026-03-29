<script lang="ts">
	import { editMode } from '$lib/Stores';
	import { onMount } from 'svelte';
	import Broken from '$lib/Main/Camera/Broken.svelte';

	let { sel, entity, size, stream_url, loaderVisible = $bindable(), responsive = undefined, muted = true }: {
		sel: any;
		entity: any;
		size?: string | undefined;
		stream_url?: string | undefined;
		loaderVisible?: boolean | undefined;
		responsive?: boolean | undefined;
		muted?: boolean | undefined;
	} = $props();

	let img: HTMLImageElement;
	let broken = $state<boolean>();
	let date = $state<number>();
	let interval: ReturnType<typeof setInterval>;

	let entity_picture = $derived(entity?.attributes?.entity_picture || '');
	let proxy_stream = $derived((!muted || sel?.stream) && !stream_url && !$editMode);

	function handleError(error: boolean) {
		loaderVisible = false;
		broken = error;
	}

	const updateInterval = 30_000;

	onMount(() => {
		clearInterval(interval);
		interval = setInterval(() => {
			date = Date.now();
		}, updateInterval);

		// cleanup
		return () => {
			clearInterval(interval);
			if (img) img.src = '';
		};
	});
</script>

<img
	src={proxy_stream
		? entity_picture?.replace('/camera_proxy/', '/camera_proxy_stream/')
		: entity_picture
			? `${entity_picture}${date ? '&date=' + date : ''}`
			: 'about:blank'}
	bind:this={img}
	onerror={() => handleError(true)}
	onload={() => handleError(false)}
	style:display={broken ? 'none' : 'initial'}
	style:width={responsive ? '100%' : 'calc(14.5rem * 2 + 0.4rem)'}
	style:object-fit={size}
	draggable="false"
	style:position={loaderVisible && proxy_stream ? 'absolute' : 'relative'}
	alt=""
/>

{#if broken}
	<Broken />
{/if}

<style>
	img {
		width: 100%;
		height: 100%;
	}
</style>
