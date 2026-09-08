<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';

	let { entity }: { entity: string } = $props();

	let picture = $derived($states?.[entity]?.attributes?.entity_picture as string | undefined);
	// the state is the last-changed timestamp; appending it busts the cache
	let src = $derived(
		picture
			? `${picture}${picture.includes('?') ? '&' : '?'}t=${$states?.[entity]?.state}`
			: undefined
	);
</script>

{#if src}
	<img {src} alt="" />
{:else}
	<div class="note">{$lang('hearth_image_not_available')}</div>
{/if}

<style>
	img {
		display: block;
		width: 100%;
		margin-top: 12px;
		border-radius: var(--h-radius-sm);
	}
</style>
