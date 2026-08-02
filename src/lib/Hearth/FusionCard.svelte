<script lang="ts">
	import type { OverviewCard } from './config';

	let { card }: { card: Extract<OverviewCard, { type: 'fusion' }> } = $props();

	let item = $derived({ id: card.id, ...card.config } as Record<string, any>);

	// dynamic imports keep heavy embeds (Konva, Spotify) out of the base bundle
	const components: Record<string, () => Promise<{ default: any }>> = {
		button: () => import('$lib/Main/Button.svelte'),
		entities: () => import('$lib/Main/Entities.svelte'),
		camera: () => import('$lib/Main/Camera.svelte'),
		picture_elements: () => import('$lib/Main/PictureElements.svelte'),
		conditional_media: () => import('$lib/Main/ConditionalMedia.svelte'),
		days_since: () => import('$lib/Main/DaysSince.svelte'),
		spotify_player: () => import('$lib/Main/SpotifyPlayer.svelte'),
		spotify_player_large: () => import('$lib/Main/SpotifyPlayer.svelte'),
		empty: () => import('$lib/Main/Empty.svelte')
	};

	let load = $derived(item?.type ? components[item.type] : undefined);
</script>

<div
	class="fusion"
	class:sized={card.height}
	style:height={card.height ? `${card.height}px` : undefined}
>
	{#if !load}
		<div class="placeholder">Fusion object: set a type in the card editor</div>
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
		font-size: 1rem;
		border-radius: var(--h-radius-md);
		overflow: hidden;
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
		font-size: 14px;
		text-align: center;
	}
</style>
