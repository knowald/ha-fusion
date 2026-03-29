<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { states } from '$lib/Stores';
	import { computeIcon } from '$lib/Modal/PictureElements/computeIcon';
	import { getDomain } from '$lib/Utils';
	let { entity_id, getIconString = undefined, skipEntityPicture = undefined, size = undefined, oniconString = undefined }: {
		entity_id: string;
		getIconString?: boolean | undefined;
		skipEntityPicture?: boolean | undefined;
		size?: string | undefined;
		oniconString?: ((value: string | undefined) => void) | undefined;
	} = $props();

	let stateObj = $state<any>();
	let currentIcon = $state<string | undefined>();
	let src = $state<string | undefined>();

	$effect(() => {
		if (entity_id) stateObj = $states?.[entity_id];
	});

	$effect(() => {
		if ($states && entity_id) {
			currentIcon = getCurrentIcon();
		}
	});
	function dispatchIconString() {
		if (!getIconString) return;
		const icon = currentIcon
			? currentIcon === 'entity_picture'
				? $states?.[entity_id]?.attributes?.entity_picture
				: currentIcon
			: undefined;
		oniconString?.(icon);
	}
	function loadEntityPicture(entity_picture: string) {
		const img = new Image();
		img.onload = () => (src = entity_picture);
		img.onerror = () => (src = undefined);
		img.src = entity_picture;
	}
	onMount(() => {
		dispatchIconString();
		if (currentIcon === 'entity_picture') {
			loadEntityPicture(stateObj?.attributes?.entity_picture);
		}
	});
	function getCurrentIcon() {
		const entity = $states[entity_id];
		const domain = getDomain(entity?.entity_id || entity_id);
		if (stateObj?.attributes?.entity_picture && !skipEntityPicture && domain !== 'update') {
			return 'entity_picture';
		}
		const computedIcon = computeIcon(entity_id, $states);
		dispatchIconString();
		return entity && computedIcon ? computedIcon : 'mdi:room-service';
	}
</script>
{#if currentIcon === 'entity_picture'}
	<!--  entity_picture  -->
	{#if src}
		<img {src} alt="" />
	{:else}
		<Icon icon="ph:image-broken-duotone" height="auto" width="100%" />
	{/if}
{:else if currentIcon}
	<!--  icon  -->
	<Icon icon={currentIcon} style="font-size: {size || '2rem'}" />
{:else if entity_id && stateObj}
	<!-- {(console.warn('icon missing ', entity_id, stateObj), '')} -->
{/if}
<style>
	img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		object-position: center;
	}
</style>
