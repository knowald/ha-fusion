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

		<div class="player">
			<!-- Main: art left, info+controls right (centered vertically) -->
			<div class="main">
				<div class="art">
					{#if entity_picture}
						<img src={entity_picture} alt="Album Art" class="art-img" />
					{:else}
						<div class="art-placeholder">
							<Icon icon="mdi:spotify" height="3.5rem" />
						</div>
					{/if}
				</div>

				<div class="right">
					<div class="info">
						<div class="title">{media_title || $lang('nothing_playing')}</div>
						{#if media_artist}
							<div class="artist">{media_artist}</div>
						{/if}
						{#if media_album_name}
							<div class="album">{media_album_name}</div>
						{/if}
					</div>

					<div class="controls">
						<button
							class="btn"
							on:click={previousTrack}
							disabled={is_idle}
							use:Ripple={$ripple}
							title={$lang('previous_track') || 'Previous'}
						>
							<Icon icon="mdi:skip-previous" height="1.4rem" />
						</button>

						<button
							class="btn primary"
							on:click={playPause}
							disabled={is_idle}
							use:Ripple={$ripple}
							title={is_playing ? $lang('pause') || 'Pause' : $lang('play') || 'Play'}
						>
							<Icon icon={is_playing ? 'mdi:pause' : 'mdi:play'} height="1.6rem" />
						</button>

						<button
							class="btn"
							on:click={nextTrack}
							disabled={is_idle}
							use:Ripple={$ripple}
							title={$lang('next_track') || 'Next'}
						>
							<Icon icon="mdi:skip-next" height="1.4rem" />
						</button>
					</div>

					{#if !is_idle && media_duration}
						<div class="progress">
							<span class="time">{formatTime(current_position)}</span>
							<input
								type="range"
								min="0"
								max={media_duration}
								value={current_position}
								on:change={seek}
								class="seek"
							/>
							<span class="time right-align">{formatTime(media_duration)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div class="footer">
				<div class="volume">
					<Icon icon="mdi:volume-high" height="0.95rem" style="opacity: 0.35;" />
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={volume_level}
						on:input={setVolume}
						class="vol-slider"
					/>
					<span class="vol-pct">{Math.round(volume_level * 100)}%</span>
				</div>

				{#if source_list.length > 0}
					<div class="device">
						<Icon icon="mdi:speaker" height="0.95rem" style="opacity: 0.35;" />
						<select on:change={(e) => selectDevice(e.target.value)} class="device-sel">
							{#each source_list as device}
								<option value={device} selected={device === current_source}>
									{device}
								</option>
							{/each}
						</select>
					</div>
				{/if}

				<button class="browse" on:click={openBrowser} use:Ripple={$ripple}>
					<Icon icon="mdi:library-music" height="0.95rem" />
					<span>{$lang('browse_library') || 'Browse Library'}</span>
				</button>
			</div>
		</div>
	</Modal>
{/if}

<style>
	.player {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding-top: 0.75rem;
	}

	/* --- Main: side by side --- */

	.main {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 1.75rem;
		align-items: center;
	}

	/* --- Art --- */

	.art {
		width: 100%;
		aspect-ratio: 1;
	}

	.art-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.5rem;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
	}

	.art-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.15);
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.25);
	}

	/* --- Right column: vertically centered --- */

	.right {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1.5rem;
		min-width: 0;
	}

	/* --- Track info --- */

	.info {
		max-width: 100%;
		min-width: 0;
	}

	.title {
		font-size: 1.1rem;
		font-weight: 600;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.35;
	}

	.artist {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.6);
		margin-top: 0.3rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.album {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.3);
		margin-top: 0.15rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* --- Controls --- */

	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.btn {
		background-color: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		width: 2.8rem;
		height: 2.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		cursor: pointer;
		transition: all 0.15s ease;
		font-family: inherit;
	}

	.btn.primary {
		width: 3.4rem;
		height: 3.4rem;
		background-color: rgb(30, 215, 96);
		border-color: rgb(30, 215, 96);
	}

	.btn:hover:not(:disabled) {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.btn.primary:hover:not(:disabled) {
		background-color: rgb(40, 225, 106);
	}

	.btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	/* --- Progress --- */

	.progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.time {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.35);
		min-width: 2rem;
		font-variant-numeric: tabular-nums;
	}

	.time.right-align {
		text-align: right;
	}

	.seek {
		flex: 1;
		height: 3px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.seek::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgb(30, 215, 96);
		cursor: pointer;
	}

	.seek::-moz-range-thumb {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgb(30, 215, 96);
		cursor: pointer;
		border: none;
	}

	/* --- Footer --- */

	.footer {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		padding-top: 1.5rem;
	}

	.volume {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0;
	}

	.vol-slider {
		flex: 1;
		height: 3px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.vol-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
	}

	.vol-slider::-moz-range-thumb {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
	}

	.vol-pct {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.35);
		min-width: 2rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.device {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0;
	}

	.device-sel {
		flex: 1;
		padding: 0.4rem 0.6rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.35rem;
		color: white;
		font-family: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		color-scheme: dark;
	}

	.device-sel:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.browse {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		padding: 0.6rem;
		background-color: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.35rem;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s ease;
		font-family: inherit;
	}

	.browse:hover {
		background-color: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.8);
	}

	/* --- Mobile --- */

	@media all and (max-width: 600px) {
		.main {
			grid-template-columns: 1fr;
			justify-items: center;
		}

		.art {
			width: 160px;
		}

		.right {
			width: 100%;
		}

		.player {
			gap: 1rem;
		}
	}
</style>
