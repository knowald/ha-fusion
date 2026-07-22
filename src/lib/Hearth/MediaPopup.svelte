<script lang="ts">
	import { onMount } from 'svelte';
	import { states } from '$lib/Stores';
	import { horizontalDrag } from './drag';
	import {
		fetchMediaPlaylists,
		fetchMediaQueue,
		hasSpotifyPlus,
		type MediaPlaylist,
		type QueueTrack
	} from './media';
	import {
		callEntityService,
		closePopup,
		controlOverrides,
		cycleMediaRepeat,
		mediaVolumeFor,
		pendingEntities,
		seekMedia,
		setMediaShuffle,
		setMediaVolume,
		skipMediaTrack,
		toggleMediaPlayback
	} from './store';
	import Icon from './Icon.svelte';

	let { entity }: { entity: string } = $props();

	const FEATURE = {
		pause: 1,
		volumeSet: 4,
		previousTrack: 16,
		nextTrack: 32,
		selectSource: 2048,
		play: 16384,
		shuffleSet: 32768,
		repeatSet: 262144
	};

	let now = $state(Date.now());
	let scrub = $state<number | null>(null);
	let scrubTimer: ReturnType<typeof setTimeout>;

	onMount(() => {
		const timer = setInterval(() => (now = Date.now()), 1000);
		return () => {
			clearInterval(timer);
			clearTimeout(scrubTimer);
		};
	});

	let player = $derived($states?.[entity]);
	let attributes = $derived(player?.attributes ?? {});
	let pending = $derived($pendingEntities[entity] !== undefined);
	let features = $derived(Number(attributes.supported_features ?? 0));
	let playing = $derived(player?.state === 'playing');
	let duration = $derived(attributes.media_duration ?? 0);
	let spotify = $derived(hasSpotifyPlus(attributes));

	let appLabel = $derived(
		attributes.app_name ??
			(String(attributes.media_content_id ?? '').startsWith('spotify') ? 'Spotify' : null)
	);
	let sourceLine = $derived(
		[appLabel ?? attributes.friendly_name, attributes.source].filter(Boolean).join(' · ')
	);

	function supports(bit: number) {
		return (features & bit) !== 0;
	}

	// interpolate between websocket updates while playing
	let position = $derived.by(() => {
		const base = attributes.media_position ?? 0;
		if (!playing || !attributes.media_position_updated_at) return base;
		return Math.min(
			duration,
			base + (now - Date.parse(attributes.media_position_updated_at)) / 1000
		);
	});

	let progressFraction = $derived(scrub ?? (duration ? position / duration : 0));
	let progressPercent = $derived(Math.round(progressFraction * 100));

	function formatTime(seconds: number) {
		const whole = Math.max(0, Math.round(seconds));
		const minutes = Math.floor(whole / 60);
		const rest = whole % 60;
		return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
	}

	function endScrub(value: number) {
		seekMedia(entity, value / 100);
		// hold the scrub position until the seek is reflected in the entity
		clearTimeout(scrubTimer);
		scrubTimer = setTimeout(() => (scrub = null), 1500);
	}

	/* right panel */

	let pane = $state<'queue' | 'playlists' | 'speakers'>('queue');
	let queue = $state<QueueTrack[] | null>(null);
	let playlists = $state<MediaPlaylist[] | null>(null);
	let queueRequest = 0;

	// refetch the queue whenever the playing item changes
	$effect(() => {
		if (!spotify) return;
		void attributes.media_content_id;
		const request = ++queueRequest;
		fetchMediaQueue(entity).then((tracks) => {
			if (request === queueRequest) queue = tracks;
		});
	});

	function openPlaylists() {
		if (pane === 'playlists') {
			pane = 'queue';
			return;
		}
		pane = 'playlists';
		if (playlists === null) {
			fetchMediaPlaylists(entity).then((items) => (playlists = items));
		}
	}

	let sources = $derived(
		Array.isArray(attributes.source_list)
			? attributes.source_list.filter((source: unknown) => typeof source === 'string' && source)
			: []
	);
	let currentContext = $derived(attributes.sp_context_uri ?? attributes.media_context_content_id);

	function playPlaylist(playlist: MediaPlaylist) {
		callEntityService('spotifyplus', 'player_media_play_context', entity, {
			context_uri: playlist.uri
		});
		pane = 'queue';
	}

	function selectSource(source: string) {
		callEntityService('media_player', 'select_source', entity, { source });
		pane = 'queue';
	}

	let volume = $derived(mediaVolumeFor(entity, $states, $controlOverrides));
</script>

<div class="sheet" onclick={(event) => event.stopPropagation()}>
	{#if attributes.entity_picture}
		<img class="art" src={attributes.entity_picture} alt="" />
	{:else}
		<div class="art placeholder"></div>
	{/if}
	<div class="scrim"></div>

	<div class="content">
		<div class="stage">
			<div class="source-row">
				<Icon name="graphic_eq" size={18} color="var(--h-media)" />
				<span class="source-label">{sourceLine}</span>
			</div>
			<div class="track">
				<div class="title">{attributes.media_title ?? 'Nothing playing'}</div>
				<div class="artist">
					{[attributes.media_artist, attributes.media_album_name].filter(Boolean).join(' · ')}
				</div>
				<div
					class="progress"
					use:horizontalDrag={{ set: (value) => (scrub = value / 100), end: endScrub }}
				>
					<div class="progress-track"></div>
					<div class="progress-fill" style:width="{progressPercent}%"></div>
					<div class="progress-thumb" style:left="calc({progressPercent}% - 6px)"></div>
				</div>
				<div class="times">
					<span>{formatTime(progressFraction * duration)}</span>
					<span>{formatTime(duration)}</span>
				</div>
				<div class="transport">
					{#if supports(FEATURE.shuffleSet)}
						<span
							class="mode pressable"
							class:active={attributes.shuffle}
							onclick={() => setMediaShuffle(entity, !attributes.shuffle)}
						>
							<Icon name="shuffle" size={20} />
						</span>
					{/if}
					{#if supports(FEATURE.previousTrack)}
						<span class="skip pressable" onclick={() => skipMediaTrack(entity, 'previous')}>
							<Icon name="skip_previous" size={30} />
						</span>
					{/if}
					{#if supports(FEATURE.play) || supports(FEATURE.pause)}
						<span class="play pressable" class:pending onclick={() => toggleMediaPlayback(entity)}>
							<Icon name={playing ? 'pause_circle' : 'play_circle'} size={54} fill />
						</span>
					{/if}
					{#if supports(FEATURE.nextTrack)}
						<span class="skip pressable" onclick={() => skipMediaTrack(entity, 'next')}>
							<Icon name="skip_next" size={30} />
						</span>
					{/if}
					{#if supports(FEATURE.repeatSet)}
						<span
							class="mode pressable"
							class:active={attributes.repeat && attributes.repeat !== 'off'}
							onclick={() => cycleMediaRepeat(entity)}
						>
							<Icon name={attributes.repeat === 'one' ? 'repeat_one' : 'repeat'} size={20} />
						</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="panel-label">
				{pane === 'queue' ? 'UP NEXT' : pane === 'playlists' ? 'PLAYLISTS' : 'PLAY ON'}
			</div>
			<div class="panel-list">
				{#if pane === 'queue'}
					{#if !spotify}
						<div class="panel-empty">Queue not available for this player</div>
					{:else if queue === null}
						<div class="panel-empty">Loading queue...</div>
					{:else if queue.length === 0}
						<div class="panel-empty">Queue is empty</div>
					{:else}
						{#each queue.slice(0, 20) as track, index (track.uri + index)}
							<div class="queue-item" class:next={index === 0}>
								<span class="queue-name">{track.name}</span>
								<span class="queue-time">{formatTime(track.duration)}</span>
							</div>
						{/each}
					{/if}
				{:else if pane === 'playlists'}
					{#if playlists === null}
						<div class="panel-empty">Loading playlists...</div>
					{:else if playlists.length === 0}
						<div class="panel-empty">No playlists found</div>
					{:else}
						{#each playlists as playlist (playlist.uri)}
							<div class="row pressable" onclick={() => playPlaylist(playlist)}>
								{#if playlist.image}
									<img class="row-art" src={playlist.image} alt="" />
								{:else}
									<div class="row-art empty"></div>
								{/if}
								<div class="row-text">
									<div class="row-name">{playlist.name}</div>
									{#if playlist.trackCount !== null}
										<div class="row-sub">{playlist.trackCount} songs</div>
									{/if}
								</div>
								{#if currentContext === playlist.uri}
									<Icon name="equalizer" size={18} color="var(--h-media)" fill />
								{/if}
							</div>
						{/each}
					{/if}
				{:else}
					{#each sources as source (source)}
						<div class="row pressable" onclick={() => selectSource(source)}>
							<Icon
								name="speaker"
								size={20}
								color={source === attributes.source ? 'var(--h-media)' : undefined}
							/>
							<div class="row-text">
								<div class="row-name">{source}</div>
							</div>
							{#if source === attributes.source}
								<Icon name="check_circle" size={19} color="var(--h-media)" fill />
							{/if}
						</div>
					{/each}
				{/if}
			</div>
			<div class="divider"></div>
			{#if supports(FEATURE.volumeSet)}
				<div class="volume">
					<Icon name="volume_up" size={16} />
					<div
						class="volume-bar"
						use:horizontalDrag={{ set: (value) => setMediaVolume(entity, value) }}
					>
						<div class="volume-track"></div>
						<div class="volume-fill" style:width="{volume}%"></div>
						<div class="volume-thumb" style:left="calc({volume}% - 5px)"></div>
					</div>
					<span class="volume-value">{volume}</span>
				</div>
			{/if}
			<div class="panel-actions">
				{#if spotify}
					<div class="chip pressable" class:open={pane === 'playlists'} onclick={openPlaylists}>
						<Icon name="queue_music" size={15} />
						Playlists
					</div>
				{/if}
				{#if supports(FEATURE.selectSource) && sources.length}
					<div
						class="chip speaker pressable"
						class:open={pane === 'speakers'}
						onclick={() => (pane = pane === 'speakers' ? 'queue' : 'speakers')}
					>
						<Icon name="speaker" size={15} />
						<span class="chip-label">{attributes.source ?? 'Speaker'}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<span class="close pressable" onclick={closePopup}>
		<Icon name="close" size={24} />
	</span>
</div>

<style>
	.sheet {
		width: min(880px, calc(100vw - 48px));
		height: 420px;
		border-radius: var(--h-radius-xl);
		position: relative;
		overflow: hidden;
		border: 1px solid rgb(var(--h-accent-rgb) / 0.18);
		box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
		color: #f3ebe1;
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
			var(--h-media-art-1) 20px,
			var(--h-media-art-2) 20px,
			var(--h-media-art-2) 40px
		);
	}

	.scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			rgba(20, 14, 9, 0.88) 0%,
			rgba(20, 14, 9, 0.55) 45%,
			rgba(20, 14, 9, 0.75) 100%
		);
	}

	.content {
		position: absolute;
		inset: 0;
		padding: 28px 30px;
		display: flex;
		gap: 22px;
	}

	.stage {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.source-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.source-label {
		font-size: 13px;
		color: #cdbfae;
	}

	.track {
		margin-top: auto;
	}

	.title {
		font-size: 34px;
		font-weight: 600;
		color: #fff;
		letter-spacing: -0.5px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist {
		font-size: 16px;
		color: #cdbfae;
		margin-top: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
		background: rgba(255, 255, 255, 0.22);
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
		background: #fff;
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--h-media) 25%, transparent);
	}

	.times {
		display: flex;
		justify-content: space-between;
		margin-top: 2px;
		font-family: var(--h-font-mono);
		font-size: 11px;
		color: #a99a89;
	}

	.transport {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 26px;
		margin-top: 8px;
	}

	.mode {
		color: #a99a89;
		cursor: pointer;
	}

	.mode.active {
		color: var(--h-media);
	}

	.skip {
		color: #e6dbcb;
		cursor: pointer;
	}

	.play {
		color: #fff;
		cursor: pointer;
	}

	.panel {
		width: 280px;
		flex: none;
		border-radius: 18px;
		background: rgba(20, 14, 9, 0.55);
		border: 1px solid rgba(255, 238, 220, 0.1);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		padding: 16px 14px;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.panel-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: #a08c6e;
		padding: 0 8px 8px;
	}

	.panel-list {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.panel-empty {
		font-size: 13px;
		color: #8c8073;
		padding: 7px 8px;
	}

	.queue-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 8px;
		border-radius: 9px;
	}

	.queue-item.next {
		background: rgba(255, 238, 220, 0.05);
	}

	.queue-name {
		flex: 1;
		font-size: 13px;
		color: #b6a795;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.queue-item.next .queue-name {
		color: #e6dbcb;
	}

	.queue-time {
		font-family: var(--h-font-mono);
		font-size: 11px;
		color: #7d7264;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 8px;
		border-radius: 10px;
		cursor: pointer;
		color: #9a8d7d;
	}

	.row:hover {
		background: rgba(255, 238, 220, 0.05);
	}

	.row-art {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		flex: none;
		object-fit: cover;
	}

	.row-art.empty {
		background: rgba(255, 238, 220, 0.08);
	}

	.row-text {
		flex: 1;
		min-width: 0;
	}

	.row-name {
		font-size: 13px;
		font-weight: 500;
		color: #cdbfae;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row-sub {
		font-size: 11px;
		color: #8c8073;
	}

	.divider {
		height: 1px;
		background: rgba(255, 238, 220, 0.09);
		margin: 12px 2px 0;
	}

	.volume {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 4px 8px;
		color: #8c8073;
	}

	.volume-bar {
		position: relative;
		flex: 1;
		height: 18px;
		display: flex;
		align-items: center;
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.volume-track {
		position: absolute;
		left: 0;
		right: 0;
		height: 4px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.16);
	}

	.volume-fill {
		position: absolute;
		left: 0;
		height: 4px;
		border-radius: 2px;
		background: rgb(var(--h-accent-rgb) / 0.75);
	}

	.volume-thumb {
		position: absolute;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #e6dbcb;
	}

	.volume-value {
		font-family: var(--h-font-mono);
		font-size: 10px;
		width: 18px;
		text-align: right;
	}

	.panel-actions {
		display: flex;
		gap: 8px;
		margin-top: 6px;
	}

	.chip {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 9px;
		border-radius: 11px;
		border: 1px solid rgba(255, 238, 220, 0.14);
		font-size: 12px;
		color: #cdbfae;
		cursor: pointer;
	}

	.chip.open {
		background: rgba(255, 238, 220, 0.08);
	}

	.chip.speaker {
		background: color-mix(in srgb, var(--h-media) 10%, transparent);
		border-color: color-mix(in srgb, var(--h-media) 25%, transparent);
		color: color-mix(in srgb, var(--h-media) 55%, #cdbfae);
	}

	.chip.speaker.open {
		background: color-mix(in srgb, var(--h-media) 18%, transparent);
	}

	.chip-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.close {
		position: absolute;
		top: 22px;
		right: 24px;
		color: #cdbfae;
		cursor: pointer;
	}
</style>
