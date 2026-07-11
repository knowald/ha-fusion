<script lang="ts">
	import {
		connection,
		editMode,
		itemHeight,
		lang,
		ripple,
		services,
		states,
		timer
	} from '$lib/Stores';
	import Icon from '@iconify/svelte';
	import { openModal } from '$lib/Modals';
	import Ripple from '$lib/Actions/ripple';
	import SpotifyShortcuts from '$lib/Main/SpotifyShortcuts.svelte';
	import { onMount, untrack } from 'svelte';

	let {
		sel,
		sectionName = undefined,
		large = false
	}: { sel: any; sectionName?: string; large?: boolean } = $props();

	let entity_id = $derived(sel?.entity_id);
	let name = $derived(sel?.name);
	let icon = $derived(sel?.icon || 'mdi:spotify');
	let color = $derived(sel?.color || 'rgb(30, 215, 96)');
	let show_progress = $derived(sel?.show_progress ?? true);
	let shortcuts = $derived(sel?.shortcuts ?? []);

	// Get entity state
	let entity = $derived(entity_id ? $states?.[entity_id] : undefined);
	let entityState = $derived(entity?.state);
	let attributes = $derived(entity?.attributes);

	// Media info
	let media_title = $derived(attributes?.media_title);
	let media_artist = $derived(attributes?.media_artist);
	let media_album_name = $derived(attributes?.media_album_name);
	let entity_picture = $derived(attributes?.entity_picture);

	// Playback state
	let is_playing = $derived(entityState === 'playing');
	let is_idle = $derived(entityState === 'idle' || !entity);

	// Recent track artwork for rotating background
	let recentArtwork: string[] = $state([]);
	let rotatingIndex = $state(0);
	let rotatingImageA = $state('');
	let rotatingImageB = $state('');
	let showImageA = $state(true);

	function findSpotifyPlusEntity(): string | undefined {
		if (!entity_id) return undefined;
		// If already a spotifyplus entity, use it directly
		if (entity_id.startsWith('media_player.spotifyplus_')) return entity_id;
		// Try to find matching spotifyplus entity (spotify_foo -> spotifyplus_foo)
		const suffix = entity_id.replace('media_player.spotify_', '');
		const candidate = `media_player.spotifyplus_${suffix}`;
		if ($states?.[candidate]) return candidate;
		// Fall back to any spotifyplus entity
		return Object.keys($states || {}).find((k) => k.startsWith('media_player.spotifyplus_'));
	}

	async function fetchRecentArtwork() {
		if (!entity_id || !$connection || !$services?.spotifyplus) return;
		const spotifyPlusEntity = findSpotifyPlusEntity();
		if (!spotifyPlusEntity) return;
		try {
			const response: any = await $connection.sendMessagePromise({
				type: 'call_service',
				domain: 'spotifyplus',
				service: 'get_player_recent_tracks',
				service_data: { entity_id: spotifyPlusEntity, limit_total: 10 },
				return_response: true
			});
			const items = response?.response?.result?.items || [];
			const urls = items
				.map((item: any) => (item.track || item)?.album?.images?.[0]?.url)
				.filter((url: string | undefined): url is string => !!url);
			// Deduplicate
			recentArtwork = [...new Set(urls)] as string[];
			if (recentArtwork.length > 0) {
				rotatingImageA = recentArtwork[0];
			}
		} catch (err) {
			console.error('Failed to fetch recent tracks:', err);
		}
	}

	onMount(fetchRecentArtwork);

	// Rotate every 8 seconds. The rotation state is read and written inside untrack so the
	// effect does not re-enter on its own writes; the timer tick remains the reactive trigger.
	$effect(() => {
		if (recentArtwork.length > 1 && !is_playing && $timer) {
			const seconds = $timer.getSeconds();
			if (seconds % 8 === 0) {
				untrack(() => {
					const nextIndex = (rotatingIndex + 1) % recentArtwork.length;
					if (nextIndex !== rotatingIndex) {
						rotatingIndex = nextIndex;
						if (showImageA) {
							rotatingImageB = recentArtwork[rotatingIndex];
						} else {
							rotatingImageA = recentArtwork[rotatingIndex];
						}
						showImageA = !showImageA;
					}
				});
			}
		}
	});

	// Progress calculation
	let media_duration = $derived(attributes?.media_duration);
	let media_position = $derived(attributes?.media_position);
	let media_position_updated_at = $derived(attributes?.media_position_updated_at);

	// Calculate current position with live updates
	let current_position = $derived(
		calculatePosition(media_position, media_position_updated_at, is_playing, $timer)
	);
	let progress_percent = $derived(
		media_duration && current_position ? (current_position / media_duration) * 100 : 0
	);

	function calculatePosition(
		position: number | undefined,
		updated_at: string | undefined,
		playing: boolean,
		currentTime: Date
	): number {
		if (!position || !updated_at) return 0;

		if (!playing) return position;

		const updatedDate = new Date(updated_at);
		const elapsedSeconds = (currentTime.getTime() - updatedDate.getTime()) / 1000;
		const elapsed = position + elapsedSeconds;
		return media_duration ? Math.min(elapsed, media_duration) : elapsed;
	}

	// Display text
	let display_title = $derived(media_title || name || $lang('spotify_player') || 'Spotify');
	let display_artist = $derived(
		media_artist || (is_idle ? $lang('nothing_playing') || 'Idle' : entityState)
	);

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/SpotifyPlayerConfig.svelte'), {
				sel,
				sectionName
			});
		} else {
			openModal(() => import('$lib/Modal/SpotifyPlayerModal.svelte'), {
				sel
			});
		}
	}
</script>

<div
	class="container"
	class:large
	tabindex="-1"
	style:cursor={!$editMode ? 'pointer' : ''}
	style:min-height={large ? undefined : `${$itemHeight}px`}
	style:height={large ? `calc(${$itemHeight}px * 4 + 0.4rem * 3)` : undefined}
	style:background-image={large && entity_picture && is_playing ? `url(${entity_picture})` : ''}
	onclick={handleClick}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}}
	role="button"
	use:Ripple={$ripple}
>
	<!-- Background image (playing); large uses the container background instead -->
	{#if entity_picture && is_playing}
		{#if !large}
			<div class="background-image" style:background-image="url({entity_picture})"></div>
		{/if}
		<div class="background-overlay"></div>
	{:else if recentArtwork.length > 0 && !is_playing}
		<!-- Rotating background (not playing) -->
		<div
			class="background-image rotating"
			style:background-image="url({rotatingImageA})"
			style:opacity={showImageA ? 1 : 0}
		></div>
		{#if recentArtwork.length > 1}
			<div
				class="background-image rotating"
				style:background-image="url({rotatingImageB})"
				style:opacity={showImageA ? 0 : 1}
			></div>
		{/if}
		<div class="background-overlay idle"></div>
	{/if}

	<!-- SHORTCUTS, large layout (not playing) -->
	{#if large && !is_playing && shortcuts.length > 0}
		<SpotifyShortcuts {shortcuts} {entity_id} default_device={sel?.default_device} layout="large" />
	{/if}

	<!-- Content -->
	<div class="content">
		<!-- ICON -->
		<div class="left">
			<div class="icon" style:--icon-color={color} style:background-color={color}>
				<Icon {icon} height="none" width="100%" />
				{#if is_playing}
					<div class="playing-indicator">
						<Icon icon="mdi:music-note" height={large ? '1.2rem' : '1rem'} />
					</div>
				{/if}
			</div>
		</div>

		<div class="right">
			<!-- TITLE -->
			<div class="name">
				{display_title}
			</div>

			<!-- ARTIST/STATE -->
			<div class="state">
				{display_artist}
				{#if large && media_album_name}
					• {media_album_name}
				{/if}
			</div>

			<!-- PROGRESS BAR -->
			{#if show_progress && !is_idle && media_duration && progress_percent > 0}
				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill" style:width="{Math.min(progress_percent, 100)}%"></div>
					</div>
				</div>
			{/if}

			<!-- SHORTCUTS, compact layout (not playing) -->
			{#if !large && !is_playing && shortcuts.length > 0}
				<SpotifyShortcuts
					{shortcuts}
					{entity_id}
					default_device={sel?.default_device}
					layout="compact"
				/>
			{/if}
		</div>
	</div>
</div>

<style>
	.container {
		background-color: var(--theme-button-background-color-off);
		font-family: inherit;
		width: 100%;
		height: 100%;
		border-radius: 0.65rem;
		margin: 0;
		position: relative;
		overflow: hidden;

		/* fix ripple */
		transform: translateZ(0);
	}

	.container.large {
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		color: white;
		text-shadow: rgba(0, 0, 0, 0.15) 1px 1px 1px;
	}

	.background-image {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-size: cover;
		background-position: center;
		filter: blur(20px);
		transform: scale(1.1);
	}

	.large .background-image {
		filter: none;
		transform: none;
	}

	.background-image.rotating {
		transition: opacity 1.5s ease;
	}

	.large .background-image.rotating {
		transition: opacity 2s ease;
	}

	.background-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
	}

	.large .background-overlay {
		background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 100%);
	}

	.background-overlay.idle {
		background: rgba(0, 0, 0, 0.65);
	}

	.large .background-overlay.idle {
		background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.4) 100%);
	}

	.content {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: min-content auto;
		grid-auto-flow: row;
		grid-template-areas: 'left right';
		height: 100%;
		--container-padding: 0.72rem;
	}

	/* large: content collapses to a bottom bar over the artwork */
	.large .content {
		height: 65px;
		align-self: end;
		border-radius: 0 0 0.65rem 0.65rem;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		--container-padding: 0.8rem;
	}

	.left {
		display: inherit;
		padding: var(--container-padding);
	}

	.right {
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		padding-right: var(--container-padding);
	}

	.icon {
		--icon-size: 2.4rem;
		height: var(--icon-size);
		width: var(--icon-size);
		color: white;
		background-color: rgba(0, 0, 0, 0.25);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		position: relative;
	}

	.playing-indicator {
		position: absolute;
		bottom: -2px;
		right: -2px;
		background: rgb(30, 215, 96);
		border-radius: 50%;
		padding: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: pulse 2s infinite;
	}

	.large .playing-indicator {
		padding: 3px;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.name {
		font-weight: 500;
		color: var(--theme-button-name-color-off);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.95rem;
		margin-top: -1px;
	}

	.large .name {
		color: white;
	}

	.state {
		font-weight: 400;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--theme-button-state-color-off);
		font-size: 0.925rem;
		margin-top: 1px;
	}

	.large .state {
		color: rgba(255, 255, 255, 0.85);
	}

	.progress-container {
		margin-top: 6px;
		margin-bottom: 2px;
	}

	.progress-bar {
		height: 3px;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background-color: rgb(30, 215, 96);
		transition: width 0.3s ease;
		border-radius: 2px;
	}

	/* Phone and Tablet (portrait) */
	@media all and (max-width: 768px) {
		.container {
			width: calc(50vw - 1.45rem);
		}

		.container.large {
			width: calc(100vw - (1.25rem + 1.25rem));
		}
	}
</style>
