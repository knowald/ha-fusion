<script lang="ts">
	import { connection, editMode, itemHeight, lang, ripple, services, states, timer } from '$lib/Stores';
	import Icon from '@iconify/svelte';
	import { openModal } from 'svelte-modals';
	import Ripple from 'svelte-ripple';
	import SpotifyShortcuts from '$lib/Main/SpotifyShortcuts.svelte';
	import { onMount } from 'svelte';

	export let sel: any;
	export let sectionName: string | undefined = undefined;

	$: entity_id = sel?.entity_id;
	$: name = sel?.name;
	$: icon = sel?.icon || 'mdi:spotify';
	$: color = sel?.color || 'rgb(30, 215, 96)'; // Spotify green
	$: show_progress = sel?.show_progress ?? true;
	$: shortcuts = sel?.shortcuts ?? [];

	// Get entity state
	$: entity = entity_id ? $states?.[entity_id] : undefined;
	$: state = entity?.state;
	$: attributes = entity?.attributes;

	// Media info
	$: media_title = attributes?.media_title;
	$: media_artist = attributes?.media_artist;
	$: media_album_name = attributes?.media_album_name;
	$: entity_picture = attributes?.entity_picture;

	// Playback state
	$: is_playing = state === 'playing';
	$: is_paused = state === 'paused';
	$: is_idle = state === 'idle' || !entity;

	// Recent track artwork for rotating background
	let recentArtwork: string[] = [];
	let rotatingIndex = 0;
	let rotatingImageA = '';
	let rotatingImageB = '';
	let showImageA = true;

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
			const response = await $connection.sendMessagePromise({
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

	// Rotate every 8 seconds
	$: if (recentArtwork.length > 1 && !is_playing && $timer) {
		const seconds = $timer.getSeconds();
		if (seconds % 8 === 0) {
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
		}
	}

	// Progress calculation
	$: media_duration = attributes?.media_duration;
	$: media_position = attributes?.media_position;
	$: media_position_updated_at = attributes?.media_position_updated_at;

	// Calculate current position with live updates
	$: current_position = calculatePosition(
		media_position,
		media_position_updated_at,
		is_playing,
		$timer
	);
	$: progress_percent =
		media_duration && current_position ? (current_position / media_duration) * 100 : 0;

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
		return position + elapsedSeconds;
	}

	// Display text
	$: display_title = media_title || name || $lang('spotify_player') || 'Spotify';
	$: display_artist = media_artist || (is_idle ? $lang('nothing_playing') || 'Idle' : state);

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
	tabindex="-1"
	style:cursor={!$editMode ? 'pointer' : ''}
	style:min-height="{$itemHeight}px"
	on:click={handleClick}
	on:keydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}}
	role="button"
	use:Ripple={$ripple}
>
	<!-- Background image (playing) -->
	{#if entity_picture && is_playing}
		<div class="background-image" style:background-image="url({entity_picture})" />
		<div class="background-overlay" />
	{:else if recentArtwork.length > 0 && !is_playing}
		<!-- Rotating background (not playing) -->
		<div
			class="background-image rotating"
			style:background-image="url({rotatingImageA})"
			style:opacity={showImageA ? 1 : 0}
		/>
		{#if recentArtwork.length > 1}
			<div
				class="background-image rotating"
				style:background-image="url({rotatingImageB})"
				style:opacity={showImageA ? 0 : 1}
			/>
		{/if}
		<div class="background-overlay idle" />
	{/if}

	<!-- Content -->
	<div class="content">
		<!-- ICON -->
		<div class="left">
			<div class="icon" style:--icon-color={color} style:background-color={color}>
				<Icon icon={icon} height="none" width="100%" />
				{#if is_playing}
					<div class="playing-indicator">
						<Icon icon="mdi:music-note" height="1rem" />
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
			</div>

			<!-- PROGRESS BAR -->
			{#if show_progress && !is_idle && media_duration && progress_percent > 0}
				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill" style:width="{Math.min(progress_percent, 100)}%" />
					</div>
				</div>
			{/if}

			<!-- SHORTCUTS (not playing) -->
			{#if !is_playing && shortcuts.length > 0}
				<SpotifyShortcuts {shortcuts} {entity_id} default_device={sel?.default_device} layout="compact" />
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

	.background-image.rotating {
		transition: opacity 1.5s ease;
	}

	.background-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
	}

	.background-overlay.idle {
		background: rgba(0, 0, 0, 0.65);
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

	.state {
		font-weight: 400;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--theme-button-state-color-off);
		font-size: 0.925rem;
		margin-top: 1px;
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
	}
</style>
