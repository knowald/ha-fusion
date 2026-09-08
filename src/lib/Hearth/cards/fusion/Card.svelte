<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { OverviewCard } from '../../config';
	import { hearthEditMode } from '../../store';
	import { fusionObjectEmbeds } from '$lib/legacy/bridge/embeds';

	let { card }: { card: Extract<OverviewCard, { type: 'fusion' }> } = $props();

	let item = $derived({ id: card.id, ...card.config } as Record<string, any>);

	// dynamic imports keep heavy embeds (Konva, Spotify) out of the base bundle
	const components = fusionObjectEmbeds;

	let load = $derived(item?.type ? components[item.type] : undefined);
</script>

<div
	class="fusion"
	class:editing={$hearthEditMode}
	class:sized={card.height}
	style:height={card.height ? `${card.height}px` : undefined}
>
	{#if !load}
		<div class="placeholder">{$lang('hearth_fusion_object_set_a_type_in')}</div>
	{:else}
		{#key item.type}
			{#await load() then module}
				{@const Embed = module.default}
				{#if item.type === 'camera'}
					<Embed sel={item} responsive={true} muted={true} controls={false} />
				{:else if item.type === 'spotify_player_large'}
					<Embed sel={item} large />
				{:else}
					<Embed sel={item} />
				{/if}
			{/await}
		{/key}
	{/if}
</div>

<style>
	.fusion {
		font-size: var(--h-type-subtitle);
		border-radius: var(--h-radius-md);
		overflow: hidden;
	}

	/* The Hearth edit chip owns interaction while arranging the layout. The
	   legacy store is mirrored too, but this prevents an embed from opening its
	   own incompatible editor when the card surface is tapped. */
	.fusion.editing > :global(*) {
		pointer-events: none;
	}

	/* embeds size themselves (the spotify player from the fusion item height,
	   inline); an explicit card height has to win over that */
	.fusion.sized > :global(*) {
		height: 100% !important;
		min-height: 0 !important;
	}

	.placeholder {
		padding: 22px;
		border-radius: var(--h-radius-md);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: var(--h-type-body);
		text-align: center;
	}
</style>
