<script lang="ts">
	import { onMount } from 'svelte';
	import { states } from '$lib/Stores';
	import { horizontalDrag } from './drag';
	import type { OverviewCard } from './config';
	import {
		controlOverrides,
		controlValueFor,
		pendingEntities,
		popup,
		seekMedia,
		setControlOverride,
		toggleMediaPlayback
	} from './store';
	import Icon from './Icon.svelte';
	import TuneButton from './TuneButton.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'media' }> } = $props();

	let now = $state(Date.now());

	onMount(() => {
		const timer = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(timer);
	});

	let entity = $derived(card.entity ? $states?.[card.entity] : undefined);
	let pending = $derived(card.entity !== undefined && $pendingEntities[card.entity] !== undefined);
	let attributes = $derived(entity?.attributes ?? {});
	let playing = $derived(entity?.state === 'playing');
	let hasTrack = $derived(playing || entity?.state === 'paused');
	let duration = $derived(attributes.media_duration ?? 0);

	// interpolate between websocket updates while playing
	let position = $derived.by(() => {
		const base = attributes.media_position ?? 0;
		if (!playing || !attributes.media_position_updated_at) return base;
		return Math.min(
			duration,
			base + (now - Date.parse(attributes.media_position_updated_at)) / 1000
		);
	});

	let progressFraction = $derived(
		card.entity
			? controlValueFor(
					`seek:${card.entity}`,
					duration ? position / duration : 0,
					$controlOverrides
				)
			: 0
	);
	let progressPercent = $derived(Math.round(progressFraction * 100));

	function formatTime(seconds: number) {
		const whole = Math.max(0, Math.round(seconds));
		const minutes = Math.floor(whole / 60);
		const rest = whole % 60;
		return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
	}

	function endScrub(value: number) {
		if (card.entity) seekMedia(card.entity, value / 100);
	}
</script>

<div
	class="card"
	style:height={card.height ? `${card.height}px` : undefined}
	style:min-height={card.height ? `${card.height}px` : undefined}
>
	{#if attributes.entity_picture}
		<img class="art" src={attributes.entity_picture} alt="" />
	{:else}
		<div class="art placeholder"></div>
	{/if}
	<div class="scrim"></div>
	{#if card.entity}
		{@const entity = card.entity}
		<div class="tune-wrap">
			<TuneButton
				onopen={() =>
					popup.set({
						kind: 'media',
						entity,
						name: attributes.friendly_name ?? 'Media'
					})}
			/>
		</div>
	{/if}
	<div class="controls">
		<div class="track-row">
			<Icon name="music_note" size={30} color="var(--h-media)" fill />
			<div class="track">
				<div class="title">{attributes.media_title ?? 'Nothing playing'}</div>
				<div class="artist">{attributes.media_artist ?? ''}</div>
			</div>
			{#if hasTrack}
				<span
					class="play pressable"
					class:pending
					onclick={() => card.entity && toggleMediaPlayback(card.entity)}
				>
					<Icon name={playing ? 'pause_circle' : 'play_circle'} size={38} fill />
				</span>
			{/if}
		</div>
		<div
			class="progress"
			use:horizontalDrag={{
				set: (value) => card.entity && setControlOverride(`seek:${card.entity}`, value / 100, 1500),
				end: endScrub
			}}
		>
			<div class="progress-track"></div>
			<div class="progress-fill" style:width="{progressPercent}%"></div>
			<div class="progress-thumb" style:left="calc({progressPercent}% - 6px)"></div>
		</div>
		<div class="times">
			<span>{formatTime(progressFraction * duration)}</span>
			<span>{formatTime(duration)}</span>
		</div>
	</div>
</div>

<style>
	.card {
		height: 100%;
		min-height: 240px;
		border-radius: var(--h-radius-lg);
		overflow: hidden;
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
		position: relative;
		flex: 1;
	}

	.art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.art.placeholder {
		background: repeating-linear-gradient(
			135deg,
			var(--h-media-art-1),
			var(--h-media-art-1) 10px,
			var(--h-media-art-2) 10px,
			var(--h-media-art-2) 20px
		);
		opacity: 0.9;
	}

	.scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(22, 17, 12, 0) 35%, rgba(22, 17, 12, 0.92));
	}

	.tune-wrap {
		position: absolute;
		top: 14px;
		right: 16px;
		color: #fff;
	}

	.controls {
		position: absolute;
		left: 20px;
		right: 20px;
		bottom: 18px;
	}

	.track-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.track {
		flex: 1;
		min-width: 0;
	}

	.title {
		font-size: 17px;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.72);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.play {
		color: #fff;
		cursor: pointer;
	}

	.progress {
		position: relative;
		height: 18px;
		display: flex;
		align-items: center;
		margin-top: 12px;
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.progress-track {
		position: absolute;
		left: 0;
		right: 0;
		height: 4px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.2);
	}

	.progress-fill {
		position: absolute;
		left: 0;
		height: 4px;
		border-radius: 2px;
		background: var(--h-media);
	}

	.progress-thumb {
		position: absolute;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--h-media);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--h-media) 25%, transparent);
	}

	.times {
		display: flex;
		justify-content: space-between;
		margin-top: 6px;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.72);
		font-family: var(--h-font-mono);
	}
</style>
