<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { timer } from '$lib/core/app/clock';
	import { states } from '$lib/core/ha/entities';
	import MediaCard from '../media/Card.svelte';
	import type { ConditionalMediaCard } from './descriptor';

	let { card }: { card: ConditionalMediaCard } = $props();

	// the player that changed most recently wins while it plays; a paused one
	// keeps the card for `timeout` seconds so a short pause does not flip it
	let current = $derived.by(() => {
		const timeout = (card.timeout ?? 300) * 1000;
		const players = card.media_players
			.map((entityId) => $states?.[entityId])
			.filter((entity) => entity !== undefined)
			.sort((a, b) => Date.parse(b.last_changed) - Date.parse(a.last_changed));
		const playing = players.find((entity) => entity.state === 'playing');
		if (playing) return playing.entity_id;
		const paused = players.find(
			(entity) =>
				entity.state === 'paused' && $timer.getTime() - Date.parse(entity.last_changed) < timeout
		);
		return paused?.entity_id ?? null;
	});
</script>

{#if current}
	<MediaCard card={{ id: card.id, type: 'media', entity: current, height: card.height }} />
{:else}
	<div class="idle" style:height={card.height ? `${card.height}px` : undefined}>
		{$lang('hearth_nothing_playing')}
	</div>
{/if}

<style>
	.idle {
		display: grid;
		place-items: center;
		min-height: 120px;
		border-radius: var(--h-radius-lg);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: 14px;
	}
</style>
