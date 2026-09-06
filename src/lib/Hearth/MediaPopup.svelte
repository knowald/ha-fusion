<script lang="ts">
	import LoadingState from './LoadingState.svelte';
	import EmptyState from './EmptyState.svelte';
	import { ICON } from './iconSizes';
	import { lang } from '$lib/core/i18n';
	import { activateOnKeyboard } from './interaction';
	import { states } from '$lib/core/ha/entities';
	import { timer } from '$lib/core/app/clock';
	import { horizontalDrag } from './drag';
	import {
		fetchMediaPlaylists,
		fetchSpotifyLibrary,
		playSpotifyUri,
		type LibraryItem,
		type LibraryKind,
		fetchMediaQueue,
		hasSpotifyPlus,
		type MediaPlaylist,
		type QueueTrack
	} from './media';
	import { closePopup } from './store';
	import {
		callEntityService,
		controlOverrides,
		controlValueFor,
		pendingEntities,
		setControlOverride
	} from '$lib/core/ha/commands';
	import {
		cycleMediaRepeat,
		mediaVolumeFor,
		seekMedia,
		setMediaShuffle,
		setMediaVolume,
		skipMediaTrack,
		toggleMediaPlayback
	} from '$lib/core/domains/mediaPlayer';
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

	let player = $derived($states?.[entity]);
	let attributes = $derived(player?.attributes ?? {});
	let pending = $derived($pendingEntities[entity] !== undefined);
	let features = $derived(Number(attributes.supported_features ?? 0));
	let playing = $derived(player?.state === 'playing');
	let duration = $derived(attributes.media_duration ?? 0);
	// the shared second clock drives the position readout while playing
	let now = $derived(playing ? $timer.getTime() : 0);

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

	let progressFraction = $derived(
		controlValueFor(`seek:${entity}`, duration ? position / duration : 0, $controlOverrides)
	);
	let progressPercent = $derived(Math.round(progressFraction * 100));

	function formatTime(seconds: number) {
		const whole = Math.max(0, Math.round(seconds));
		const minutes = Math.floor(whole / 60);
		const rest = whole % 60;
		return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
	}

	function endScrub(value: number) {
		seekMedia(entity, value / 100);
	}

	/* right panel */

	let pane = $state<'queue' | 'playlists' | 'speakers' | 'library'>('queue');
	let libraryKind = $state<LibraryKind>('albums');
	let library = $state<Record<LibraryKind, LibraryItem[] | null>>({
		albums: null,
		tracks: null,
		artists: null
	});
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

	function openLibrary() {
		if (pane === 'library') {
			pane = 'queue';
			return;
		}
		pane = 'library';
		loadLibrary(libraryKind);
	}

	function loadLibrary(kind: LibraryKind) {
		libraryKind = kind;
		if (library[kind] === null) {
			fetchSpotifyLibrary(entity, kind).then((items) => (library[kind] = items));
		}
	}

	function playLibraryItem(item: LibraryItem) {
		void playSpotifyUri(entity, item.uri);
		pane = 'queue';
	}

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

<div class="sheet" onclick={(event) => event.stopPropagation()} role="presentation">
	{#if attributes.entity_picture}
		<img class="art" src={attributes.entity_picture} alt="" />
	{:else}
		<div class="art placeholder"></div>
	{/if}
	<div class="scrim"></div>

	<div class="content">
		<div class="stage">
			<div class="source-row">
				<Icon name="graphic_eq" size={ICON.control} color="var(--h-media)" />
				<span class="source-label">{sourceLine}</span>
			</div>
			<div class="track">
				<div class="title">{attributes.media_title ?? $lang('hearth_nothing_playing')}</div>
				<div class="artist">
					{[attributes.media_artist, attributes.media_album_name].filter(Boolean).join(' · ')}
				</div>
				<div
					class="progress"
					use:horizontalDrag={{
						set: (value) => setControlOverride(`seek:${entity}`, value / 100, 1500),
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
				<div class="transport">
					{#if supports(FEATURE.shuffleSet)}
						<span
							class="mode pressable"
							class:active={attributes.shuffle}
							onclick={() => setMediaShuffle(entity, !attributes.shuffle)}
							role="button"
							tabindex="0"
							onkeydown={(event) =>
								activateOnKeyboard(event, () => setMediaShuffle(entity, !attributes.shuffle))}
						>
							<Icon name="shuffle" size={ICON.control} />
						</span>
					{/if}
					{#if supports(FEATURE.previousTrack)}
						<span
							class="skip pressable"
							onclick={() => skipMediaTrack(entity, 'previous')}
							role="button"
							tabindex="0"
							onkeydown={(event) =>
								activateOnKeyboard(event, () => skipMediaTrack(entity, 'previous'))}
						>
							<Icon name="skip_previous" size={ICON.hero} />
						</span>
					{/if}
					{#if supports(FEATURE.play) || supports(FEATURE.pause)}
						<span
							class="play pressable"
							class:pending
							onclick={() => toggleMediaPlayback(entity)}
							role="button"
							tabindex="0"
							onkeydown={(event) => activateOnKeyboard(event, () => toggleMediaPlayback(entity))}
						>
							<Icon name={playing ? 'pause_circle' : 'play_circle'} size={ICON.display} fill />
						</span>
					{/if}
					{#if supports(FEATURE.nextTrack)}
						<span
							class="skip pressable"
							onclick={() => skipMediaTrack(entity, 'next')}
							role="button"
							tabindex="0"
							onkeydown={(event) => activateOnKeyboard(event, () => skipMediaTrack(entity, 'next'))}
						>
							<Icon name="skip_next" size={ICON.hero} />
						</span>
					{/if}
					{#if supports(FEATURE.repeatSet)}
						<span
							class="mode pressable"
							class:active={attributes.repeat && attributes.repeat !== 'off'}
							onclick={() => cycleMediaRepeat(entity)}
							role="button"
							tabindex="0"
							onkeydown={(event) => activateOnKeyboard(event, () => cycleMediaRepeat(entity))}
						>
							<Icon
								name={attributes.repeat === 'one' ? 'repeat_one' : 'repeat'}
								size={ICON.control}
							/>
						</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="panel-label">
				{$lang(
					pane === 'queue'
						? 'hearth_up_next'
						: pane === 'playlists'
							? 'hearth_playlists'
							: pane === 'library'
								? 'hearth_library'
								: 'hearth_play_on'
				).toUpperCase()}
			</div>
			<div class="panel-list">
				{#if pane === 'queue'}
					{#if !spotify}
						<div class="panel-empty">{$lang('hearth_queue_not_available_for_this_player')}</div>
					{:else if queue === null}
						<LoadingState inline text={$lang('hearth_loading_queue')} />
					{:else if queue.length === 0}
						<div class="panel-empty">{$lang('hearth_queue_is_empty')}</div>
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
						<LoadingState inline text={$lang('hearth_loading_playlists')} />
					{:else if playlists.length === 0}
						<EmptyState inline text={$lang('hearth_no_playlists_found')} />
					{:else}
						{#each playlists as playlist (playlist.uri)}
							<div
								class="row pressable"
								onclick={() => playPlaylist(playlist)}
								role="button"
								tabindex="0"
								onkeydown={(event) => activateOnKeyboard(event, () => playPlaylist(playlist))}
							>
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
									<Icon name="equalizer" size={ICON.control} color="var(--h-media)" fill />
								{/if}
							</div>
						{/each}
					{/if}
				{:else if pane === 'library'}
					<div class="library-kinds">
						{#each ['albums', 'tracks', 'artists'] as kind (kind)}
							<button
								type="button"
								class="kind-chip"
								class:active={libraryKind === kind}
								onclick={() => loadLibrary(kind as LibraryKind)}
							>
								{$lang(`hearth_${kind}`)}
							</button>
						{/each}
					</div>
					{#if library[libraryKind] === null}
						<LoadingState inline text={$lang('hearth_loading_library')} />
					{:else if library[libraryKind]?.length === 0}
						<EmptyState inline text={$lang('hearth_no_library_items')} />
					{:else}
						{#each library[libraryKind] ?? [] as item (item.uri)}
							<div
								class="row pressable"
								onclick={() => playLibraryItem(item)}
								role="button"
								tabindex="0"
								onkeydown={(event) => activateOnKeyboard(event, () => playLibraryItem(item))}
							>
								{#if item.image}
									<img class="row-art" src={item.image} alt="" />
								{:else}
									<div class="row-art empty"></div>
								{/if}
								<div class="row-text">
									<div class="row-name">{item.name}</div>
									{#if item.sub}<div class="row-sub">{item.sub}</div>{/if}
								</div>
							</div>
						{/each}
					{/if}
				{:else}
					{#each sources as source (source)}
						<div
							class="row pressable"
							onclick={() => selectSource(source)}
							role="button"
							tabindex="0"
							onkeydown={(event) => activateOnKeyboard(event, () => selectSource(source))}
						>
							<Icon
								name="speaker"
								size={ICON.control}
								color={source === attributes.source ? 'var(--h-media)' : undefined}
							/>
							<div class="row-text">
								<div class="row-name">{source}</div>
							</div>
							{#if source === attributes.source}
								<Icon name="check_circle" size={ICON.control} color="var(--h-media)" fill />
							{/if}
						</div>
					{/each}
				{/if}
			</div>
			<div class="divider"></div>
			{#if supports(FEATURE.volumeSet)}
				<div class="volume">
					<Icon name="volume_up" size={ICON.inline} />
					<div
						class="volume-bar"
						use:horizontalDrag={{
							set: (value, commit) => setMediaVolume(entity, value, commit)
						}}
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
					<div
						class="chip pressable"
						class:open={pane === 'playlists'}
						onclick={openPlaylists}
						role="button"
						tabindex="0"
						onkeydown={(event) => activateOnKeyboard(event, openPlaylists)}
					>
						<Icon name="queue_music" size={ICON.inline} />
						{$lang('playlists')}
					</div>
					<div
						class="chip pressable"
						class:open={pane === 'library'}
						onclick={openLibrary}
						role="button"
						tabindex="0"
						onkeydown={(event) => activateOnKeyboard(event, openLibrary)}
					>
						<Icon name="library_music" size={ICON.control} />
						{$lang('hearth_library')}
					</div>
				{/if}
				{#if supports(FEATURE.selectSource) && sources.length}
					<div
						class="chip speaker pressable"
						class:open={pane === 'speakers'}
						onclick={() => (pane = pane === 'speakers' ? 'queue' : 'speakers')}
						role="button"
						tabindex="0"
						onkeydown={(event) =>
							activateOnKeyboard(event, () => (pane = pane === 'speakers' ? 'queue' : 'speakers'))}
					>
						<Icon name="speaker" size={ICON.inline} />
						<span class="chip-label">{attributes.source ?? 'Speaker'}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<span
		class="close pressable"
		onclick={closePopup}
		role="button"
		tabindex="0"
		onkeydown={(event) => activateOnKeyboard(event, closePopup)}
	>
		<Icon name="close" size={ICON.tile} />
	</span>
</div>

<style>
	.sheet {
		width: min(880px, calc(100vw - 48px));
		height: 420px;
		border-radius: var(--h-radius-xl);
		position: relative;
		overflow: hidden;
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		box-shadow: 0 40px 100px var(--h-scrim);
		color: var(--h-on-art-1);
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
			var(--h-art-scrim-3) 0%,
			var(--h-art-scrim-1) 45%,
			var(--h-art-scrim-2) 100%
		);
	}

	.content {
		position: absolute;
		inset: 0;
		padding: 28px 32px;
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
		font-size: var(--h-type-secondary);
		color: var(--h-on-art-2);
	}

	.track {
		margin-top: auto;
	}

	.title {
		font-size: var(--h-type-display);
		font-weight: 600;
		color: var(--h-on-art-1);
		letter-spacing: -0.5px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist {
		font-size: var(--h-type-subtitle);
		color: var(--h-on-art-2);
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
		border-radius: var(--h-radius-hair);
		background: var(--h-on-art-line);
	}

	.progress-fill {
		position: absolute;
		left: 0;
		height: 4px;
		border-radius: var(--h-radius-hair);
		background: var(--h-media);
	}

	.progress-thumb {
		position: absolute;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--h-on-art-1);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--h-media) 25%, transparent);
	}

	.times {
		display: flex;
		justify-content: space-between;
		margin-top: 2px;
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		color: var(--h-on-art-3);
	}

	.transport {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 28px;
		margin-top: 8px;
	}

	.mode {
		color: var(--h-on-art-3);
		cursor: pointer;
	}

	.mode.active {
		color: var(--h-media);
	}

	.skip {
		color: var(--h-on-art-1);
		cursor: pointer;
	}

	.play {
		color: var(--h-on-art-1);
		cursor: pointer;
	}

	.panel {
		width: 280px;
		flex: none;
		border-radius: var(--h-radius-md);
		background: var(--h-art-scrim-1);
		border: 1px solid var(--h-on-art-line);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		padding: 16px 14px;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.panel-label {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 2px;
		color: var(--h-on-art-3);
		padding: 0 8px 8px;
	}

	.panel-list {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.queue-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 8px;
		border-radius: var(--h-radius-tight);
	}

	.queue-item.next {
		background: var(--h-on-art-fill);
	}

	.queue-name {
		flex: 1;
		font-size: var(--h-type-secondary);
		color: var(--h-on-art-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.queue-item.next .queue-name {
		color: var(--h-on-art-1);
	}

	.queue-time {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		color: var(--h-on-art-3);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 8px;
		border-radius: var(--h-radius-tight);
		cursor: pointer;
		color: var(--h-on-art-3);
	}

	.row:hover {
		background: var(--h-on-art-fill);
	}

	.row-art {
		width: 34px;
		height: 34px;
		border-radius: var(--h-radius-tight);
		flex: none;
		object-fit: cover;
	}

	.row-art.empty {
		background: var(--h-on-art-fill);
	}

	.row-text {
		flex: 1;
		min-width: 0;
	}

	.row-name {
		font-size: var(--h-type-secondary);
		font-weight: 500;
		color: var(--h-on-art-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row-sub {
		font-size: var(--h-type-label);
		color: var(--h-on-art-3);
	}

	.divider {
		height: 1px;
		background: var(--h-on-art-fill);
		margin: 12px 2px 0;
	}

	.volume {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 4px 8px;
		color: var(--h-on-art-3);
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
		border-radius: var(--h-radius-hair);
		background: var(--h-on-art-line);
	}

	.volume-fill {
		position: absolute;
		left: 0;
		height: 4px;
		border-radius: var(--h-radius-hair);
		background: rgb(var(--h-accent-rgb) / calc(0.75 * var(--h-accent-scale)));
	}

	.volume-thumb {
		position: absolute;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--h-on-art-1);
	}

	.volume-value {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-caption);
		width: 18px;
		text-align: right;
	}

	.panel-actions {
		display: flex;
		gap: 8px;
		margin-top: 6px;
	}

	.library-kinds {
		display: flex;
		gap: 6px;
		margin-bottom: 8px;
	}

	.kind-chip {
		padding: 6px 12px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.12 * var(--h-line-scale)));
		border-radius: var(--h-radius-pill);
		background: none;
		color: var(--h-text-4);
		font: inherit;
		font-size: var(--h-type-small);
		cursor: pointer;
	}

	.kind-chip.active {
		color: var(--h-media);
		border-color: var(--h-media);
	}

	.chip {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px;
		border-radius: var(--h-radius-xs);
		border: 1px solid var(--h-on-art-line);
		font-size: var(--h-type-small);
		color: var(--h-on-art-2);
		cursor: pointer;
	}

	.chip.open {
		background: var(--h-on-art-fill);
	}

	.chip.speaker {
		background: color-mix(in srgb, var(--h-media) 10%, transparent);
		border-color: color-mix(in srgb, var(--h-media) 25%, transparent);
		color: color-mix(in srgb, var(--h-media) 55%, var(--h-on-art-2));
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
		color: var(--h-on-art-2);
		cursor: pointer;
	}
	@media (max-width: 700px) {
		.sheet {
			width: 100%;
			height: min(560px, calc(100dvh - 24px));
			border-radius: var(--h-radius-xl) var(--h-radius-xl) 0 0;
			align-self: flex-end;
		}
	}
</style>
