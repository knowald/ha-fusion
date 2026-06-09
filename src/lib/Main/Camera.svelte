<script lang="ts">
	import { editMode, itemHeight, states } from '$lib/Stores';
	import { openModal } from '$lib/Modals';
	import Loader from '$lib/Components/Loader.svelte';
	import { writable } from 'svelte/store';
	import type { CameraItem } from '$lib/Types';

	let { sel, demo = undefined, responsive, muted, controls }: {
		sel: CameraItem;
		demo?: string | undefined;
		responsive: boolean;
		muted: boolean;
		controls: boolean;
	} = $props();

	const debug = false;

	let loaderVisible = $state(true);
	let stream_url = $state<string | undefined>();
	let attachVideo = $state<boolean>(false);

	let entity = $derived((demo && $states?.[demo]) || (sel?.entity_id ? $states?.[sel?.entity_id] : undefined));
	let frontend_stream_type = $derived(entity?.attributes?.frontend_stream_type);
	let size = $derived(sel?.size === 'contain' ? 'contain' : 'cover');

	let cameraProps = $derived({
		entity,
		sel,
		size,
		responsive,
		muted
	});

	/**
	 * tame reactivity
	 */
	const entity_id = writable<string | undefined>(sel?.entity_id);
	const stream = writable<boolean | undefined>(sel?.stream);

	$effect(() => {
		if (sel?.entity_id) $entity_id = sel?.entity_id;
	});
	$effect(() => {
		if (!sel?.stream || sel?.stream) $stream = sel?.stream;
	});

	$effect(() => {
		if ((!muted || $stream === true) && $entity_id && !$editMode) {
			attachVideo = true;
		} else if ($stream === false || $stream === undefined || $entity_id) {
			attachVideo = false;
		}
	});

	entity_id.subscribe((value) => {
		$entity_id = value;
		attachVideo = false;
	});

	/**
	 * Handle camera click
	 */
	function handleClick() {
		if (responsive) return;

		if ($editMode) {
			openModal(() => import('$lib/Modal/CameraConfig.svelte'), { sel });
		} else {
			openModal(() => import('$lib/Modal/CameraModal.svelte'), { sel });
		}
	}
</script>

<button
	style:background-size={size}
	style:cursor={$editMode || responsive ? 'unset' : 'pointer'}
	style:height={responsive ? '100%' : `calc(${$itemHeight}px * 4 + 0.4rem * 3)`}
	style:width={responsive ? '100%' : 'calc(14.5rem * 2 + 0.4rem)'}
	onclick={handleClick}
>
	{#if loaderVisible && !$editMode}
		<!-- loader -->
		<div class="loader">
			<div>
				<Loader />
			</div>
		</div>
	{/if}

	{#if frontend_stream_type === 'hls'}
		<!-- hls -->
		{#await import('$lib/Main/Camera/HLS.svelte') then HLS}
			<svelte:component
				this={HLS.default}
				bind:stream_url
				bind:loaderVisible
				{...cameraProps}
				{attachVideo}
				{controls}
				{debug}
			/>
		{/await}
	{:else if frontend_stream_type === 'web_rtc'}
		<!-- web_rtc -->
		{#await import('$lib/Main/Camera/WebRTC.svelte') then WebRTC}
			<svelte:component
				this={WebRTC.default}
				bind:stream_url
				bind:loaderVisible
				{...cameraProps}
				{attachVideo}
				{controls}
				{debug}
			/>
		{/await}
	{/if}

	<!-- camera_proxy -->
	{#await import('$lib/Main/Camera/Proxy.svelte') then Proxy}
		<svelte:component this={Proxy.default} bind:loaderVisible {...cameraProps} {stream_url} />
	{/await}

	<!-- info -->
	{#if muted && !responsive}
		{#await import('$lib/Main/Camera/Info.svelte') then Info}
			<svelte:component this={Info.default} {sel} {entity} />
		{/await}
	{/if}
</button>

<style>
	.loader {
		aspect-ratio: 16/9;
	}

	.loader > div {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: scale(0.5);
		z-index: 1;
		pointer-events: none;
	}

	button {
		all: unset;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.6rem;
		height: 100%;
		position: relative;
		color: white;
		overflow: hidden;
		display: grid;
		box-sizing: border-box;
		--container-padding: 0.8rem;
	}
</style>
