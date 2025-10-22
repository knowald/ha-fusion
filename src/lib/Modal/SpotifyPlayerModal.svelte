<script lang="ts">
	import { connection, states, lang, ripple, timer } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Modal from '$lib/Modal/Index.svelte';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';
	import { openModal } from 'svelte-modals';

	export let isOpen: boolean;
	export let sel: any;

	$: entity_id = sel?.entity_id;
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

	// Progress
	$: media_duration = attributes?.media_duration;
	$: media_position = attributes?.media_position;
	$: media_position_updated_at = attributes?.media_position_updated_at;

	// Volume
	$: volume_level = attributes?.volume_level ?? 0;

	// Devices
	$: source_list = attributes?.source_list || [];
	$: current_source = attributes?.source;

	// Calculate current position with live updates
	$: current_position = calculatePosition(
		media_position,
		media_position_updated_at,
		is_playing,
		$timer
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
		return Math.min(position + elapsedSeconds, media_duration || position + elapsedSeconds);
	}

	function formatTime(seconds: number): string {
		if (!seconds || isNaN(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	async function playPause() {
		if (!entity_id || !$connection) return;
		try {
			await callService($connection, 'media_player', 'media_play_pause', {
				entity_id
			});
		} catch (error) {
			console.error('Failed to play/pause:', error);
		}
	}

	async function nextTrack() {
		if (!entity_id || !$connection) return;
		try {
			await callService($connection, 'media_player', 'media_next_track', {
				entity_id
			});
		} catch (error) {
			console.error('Failed to skip track:', error);
		}
	}

	async function previousTrack() {
		if (!entity_id || !$connection) return;
		try {
			await callService($connection, 'media_player', 'media_previous_track', {
				entity_id
			});
		} catch (error) {
			console.error('Failed to go to previous track:', error);
		}
	}

	async function setVolume(event: Event) {
		if (!entity_id || !$connection) return;
		const target = event.target as HTMLInputElement;
		const volume = parseFloat(target.value);

		try {
			await callService($connection, 'media_player', 'volume_set', {
				entity_id,
				volume_level: volume
			});
		} catch (error) {
			console.error('Failed to set volume:', error);
		}
	}

	async function seek(event: Event) {
		if (!entity_id || !$connection || !media_duration) return;
		const target = event.target as HTMLInputElement;
		const position = parseFloat(target.value);

		try {
			await callService($connection, 'media_player', 'media_seek', {
				entity_id,
				seek_position: position
			});
		} catch (error) {
			console.error('Failed to seek:', error);
		}
	}

	async function selectDevice(device: string) {
		if (!entity_id || !$connection) return;
		try {
			await callService($connection, 'media_player', 'select_source', {
				entity_id,
				source: device
			});
		} catch (error) {
			console.error('Failed to select device:', error);
		}
	}

	function openBrowser() {
		openModal(() => import('$lib/Modal/SpotifyBrowser.svelte'), {
			sel,
			entity_id
		});
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{sel?.name || $lang('spotify_player') || 'Spotify'}</h1>

		<div class="player-container">
			<!-- Album Art -->
			<div class="album-art-container">
				{#if entity_picture}
					<img src={entity_picture} alt="Album Art" class="album-art" />
				{:else}
					<div class="album-art-placeholder">
						<Icon icon="mdi:spotify" height="8rem" />
					</div>
				{/if}
			</div>

			<!-- Track Info -->
			<div class="track-info">
				<div class="track-title">{media_title || $lang('nothing_playing')}</div>
				{#if media_artist}
					<div class="track-artist">
						{media_artist}{media_album_name ? ` • ${media_album_name}` : ''}
					</div>
				{/if}
			</div>

			<!-- Progress Bar -->
			{#if !is_idle && media_duration}
				<div class="progress-section">
					<span class="time-label">{formatTime(current_position)}</span>
					<input
						type="range"
						min="0"
						max={media_duration}
						value={current_position}
						on:change={seek}
						class="progress-slider"
					/>
					<span class="time-label">{formatTime(media_duration)}</span>
				</div>
			{/if}

			<!-- Playback Controls -->
			<div class="controls">
				<button
					class="control-button"
					on:click={previousTrack}
					disabled={is_idle}
					use:Ripple={$ripple}
					title={$lang('previous_track') || 'Previous'}
				>
					<Icon icon="mdi:skip-previous" height="2rem" />
				</button>

				<button
					class="control-button primary"
					on:click={playPause}
					disabled={is_idle}
					use:Ripple={$ripple}
					title={is_playing ? $lang('pause') || 'Pause' : $lang('play') || 'Play'}
				>
					<Icon icon={is_playing ? 'mdi:pause' : 'mdi:play'} height="3rem" />
				</button>

				<button
					class="control-button"
					on:click={nextTrack}
					disabled={is_idle}
					use:Ripple={$ripple}
					title={$lang('next_track') || 'Next'}
				>
					<Icon icon="mdi:skip-next" height="2rem" />
				</button>
			</div>

			<!-- Volume Control -->
			<div class="volume-section">
				<Icon icon="mdi:volume-high" height="1.5rem" style="opacity: 0.7;" />
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={volume_level}
					on:input={setVolume}
					class="volume-slider"
				/>
				<span class="volume-label">{Math.round(volume_level * 100)}%</span>
			</div>

			<!-- Device Selection -->
			{#if source_list.length > 0}
				<div class="device-section">
					<label for="device-select">
						<Icon icon="mdi:speaker" height="1.3rem" style="opacity: 0.7;" />
						{$lang('device') || 'Device'}:
					</label>
					<select id="device-select" on:change={(e) => selectDevice(e.target.value)} class="device-select">
						{#each source_list as device}
							<option value={device} selected={device === current_source}>
								{device}
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Browse Library Button -->
			<button class="browse-button" on:click={openBrowser} use:Ripple={$ripple}>
				<Icon icon="mdi:library-music" height="1.3rem" />
				<span>{$lang('browse_library') || 'Browse Library'}</span>
			</button>
		</div>
	</Modal>
{/if}

<style>
	.player-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
		padding-top: 1rem;
	}

	.album-art-container {
		width: 100%;
		max-width: 300px;
		aspect-ratio: 1;
	}

	.album-art {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.5rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.album-art-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.track-info {
		text-align: center;
		width: 100%;
	}

	.track-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: white;
		margin-bottom: 0.5rem;
	}

	.track-artist {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.progress-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	.time-label {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.7);
		min-width: 3rem;
	}

	.progress-slider {
		flex: 1;
		height: 6px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.progress-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: rgb(30, 215, 96);
		cursor: pointer;
	}

	.progress-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: rgb(30, 215, 96);
		cursor: pointer;
		border: none;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.control-button {
		background-color: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		width: 3.5rem;
		height: 3.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.control-button.primary {
		width: 4.5rem;
		height: 4.5rem;
		background-color: rgb(30, 215, 96);
		border-color: rgb(30, 215, 96);
	}

	.control-button:hover:not(:disabled) {
		background-color: rgba(255, 255, 255, 0.2);
		transform: scale(1.05);
	}

	.control-button.primary:hover:not(:disabled) {
		background-color: rgb(40, 225, 106);
	}

	.control-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.volume-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	.volume-slider {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.volume-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
	}

	.volume-slider::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
	}

	.volume-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		min-width: 3rem;
		text-align: right;
	}

	.device-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	.device-section label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.device-select {
		flex: 1;
		padding: 0.75rem 1rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: white;
		font-family: inherit;
		font-size: 0.95rem;
		cursor: pointer;
		color-scheme: dark;
	}

	.device-select:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.browse-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem;
		background-color: rgba(30, 215, 96, 0.2);
		border: 1px solid rgba(30, 215, 96, 0.4);
		border-radius: 0.5rem;
		color: white;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.browse-button:hover {
		background-color: rgba(30, 215, 96, 0.3);
		border-color: rgba(30, 215, 96, 0.6);
	}
</style>
