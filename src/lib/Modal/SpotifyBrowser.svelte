<script lang="ts">
	import { connection, states, lang, ripple, services } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Modal from '$lib/Modal/Index.svelte';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let isOpen: boolean;
	export let sel: any;
	export let entity_id: string;

	$: entity = entity_id ? $states?.[entity_id] : undefined;
	$: attributes = entity?.attributes;

	type Tab = 'playlists' | 'albums' | 'tracks' | 'artists';
	let activeTab: Tab = 'playlists';

	interface SpotifyItem {
		id: string;
		name: string;
		uri: string;
		image_url?: string;
		type: string;
		artists?: string[];
		album?: string;
		total_tracks?: number;
	}

	let playlists: SpotifyItem[] = [];
	let albums: SpotifyItem[] = [];
	let tracks: SpotifyItem[] = [];
	let artists: SpotifyItem[] = [];

	let loading = false;
	let error = '';
	let searchQuery = '';

	onMount(() => {
		console.log('=== SpotifyBrowser mounted ===');
		console.log('Available service domains:', Object.keys($services || {}).sort());
		console.log('SpotifyPlus domain:', $services?.spotifyplus);
		console.log('Spotify domain:', $services?.spotify);

		// Check for media_player related services
		const mediaPlayerServices = Object.keys($services || {}).filter(d =>
			d.includes('media') || d.includes('spotify') || d.includes('music')
		);
		console.log('Media/Spotify related domains:', mediaPlayerServices);

		if (!$services?.spotifyplus) {
			error = 'SpotifyPlus integration not installed. Please install SpotifyPlus from HACS: https://github.com/thlucas1/homeassistantcomponent_spotifyplus';
			return;
		}

		const spotifyServices = Object.keys($services.spotifyplus);
		console.log('SpotifyPlus services:', spotifyServices);

		// Find services with "favorite" or "follow" in the name
		const favoriteServices = spotifyServices.filter(s =>
			s.includes('favorite') || s.includes('follow') || s.includes('get')
		);
		console.log('Get/Favorite/Follow services:', favoriteServices);

		// Find play-related services
		const playServices = spotifyServices.filter(s => s.includes('play'));
		console.log('Play services:', playServices);

		loadPlaylists();
	});

	async function loadPlaylists() {
		if (!entity_id || !$connection) return;

		loading = true;
		error = '';

		try {
			const response = await $connection.sendMessagePromise({
				type: 'call_service',
				domain: 'spotifyplus',
				service: 'get_playlist_favorites',
				service_data: {
					entity_id,
					limit_total: 50,
					sort_result: true
				},
				return_response: true
			});

			console.log('Playlists response:', response);

			if (response?.response) {
				console.log('Response structure:', response.response);
				console.log('Result object:', response.response.result);

				// The result structure is different - items is directly in result
				const result = response.response.result;
				const items = result?.items || [];

				console.log('Playlist items:', items);
				console.log('Items type:', Array.isArray(items) ? 'array' : typeof items);

				if (Array.isArray(items)) {
					playlists = items.map((item: any) => ({
						id: item.id || item.uri,
						name: item.name,
						uri: item.uri,
						image_url: item.images?.[0]?.url || item.image_url,
						type: 'playlist',
						total_tracks: item.tracks?.total
					}));
				} else if (typeof items === 'object') {
					playlists = Object.values(items).map((item: any) => ({
						id: item.id || item.uri,
						name: item.name,
						uri: item.uri,
						image_url: item.images?.[0]?.url || item.image_url,
						type: 'playlist',
						total_tracks: item.tracks?.total
					}));
				}

				console.log('Parsed playlists:', playlists);
			}
		} catch (err: any) {
			console.error('Failed to load playlists:', err);
			error = err.message || 'Failed to load playlists';
		} finally {
			loading = false;
		}
	}

	async function loadAlbums() {
		if (!entity_id || !$connection) return;

		loading = true;
		error = '';

		try {
			const response = await $connection.sendMessagePromise({
				type: 'call_service',
				domain: 'spotifyplus',
				service: 'get_album_favorites',
				service_data: {
					entity_id,
					limit_total: 50,
					sort_result: true
				},
				return_response: true
			});

			if (response?.response) {
				const result = response.response.result;
				const items = result?.items || [];

				if (Array.isArray(items)) {
					albums = items.map((item: any, index: number) => {
						// Album favorites returns { added_at, album } structure
						const albumData = item.album || item;
						const uniqueId = albumData.id || albumData.uri || `album_${index}`;

						return {
							id: uniqueId,
							name: albumData.name,
							uri: albumData.uri,
							image_url: albumData.images?.[0]?.url || albumData.image_url,
							type: 'album',
							artists: albumData.artists?.map((a: any) => a.name),
							total_tracks: albumData.total_tracks
						};
					});
				} else if (typeof items === 'object') {
					albums = Object.values(items).map((item: any, index: number) => {
						const albumData = item.album || item;
						const uniqueId = albumData.id || albumData.uri || `album_${index}`;

						return {
							id: uniqueId,
							name: albumData.name,
							uri: albumData.uri,
							image_url: albumData.images?.[0]?.url || albumData.image_url,
							type: 'album',
							artists: albumData.artists?.map((a: any) => a.name),
							total_tracks: albumData.total_tracks
						};
					});
				}
			}
		} catch (err: any) {
			console.error('Failed to load albums:', err);
			error = err.message || 'Failed to load albums';
		} finally {
			loading = false;
		}
	}

	async function loadTracks() {
		if (!entity_id || !$connection) return;

		loading = true;
		error = '';

		try {
			const response = await $connection.sendMessagePromise({
				type: 'call_service',
				domain: 'spotifyplus',
				service: 'get_track_favorites',
				service_data: {
					entity_id,
					limit_total: 50,
					sort_result: true
				},
				return_response: true
			});

			if (response?.response) {
				const result = response.response.result;
				const items = result?.items || [];

				if (Array.isArray(items)) {
					tracks = items.map((item: any, index: number) => {
						// Track favorites returns { added_at, track } structure
						const trackData = item.track || item;
						const uniqueId = trackData.id || trackData.uri || `track_${index}`;

						return {
							id: uniqueId,
							name: trackData.name,
							uri: trackData.uri,
							image_url: trackData.album?.images?.[0]?.url,
							type: 'track',
							artists: trackData.artists?.map((a: any) => a.name),
							album: trackData.album?.name
						};
					});
				} else if (typeof items === 'object') {
					tracks = Object.values(items).map((item: any, index: number) => {
						const trackData = item.track || item;
						const uniqueId = trackData.id || trackData.uri || `track_${index}`;

						return {
							id: uniqueId,
							name: trackData.name,
							uri: trackData.uri,
							image_url: trackData.album?.images?.[0]?.url,
							type: 'track',
							artists: trackData.artists?.map((a: any) => a.name),
							album: trackData.album?.name
						};
					});
				}
			}
		} catch (err: any) {
			console.error('Failed to load tracks:', err);
			error = err.message || 'Failed to load tracks';
		} finally {
			loading = false;
		}
	}

	async function loadArtists() {
		if (!entity_id || !$connection) return;

		loading = true;
		error = '';

		try {
			const response = await $connection.sendMessagePromise({
				type: 'call_service',
				domain: 'spotifyplus',
				service: 'get_artists_followed',
				service_data: {
					entity_id,
					limit_total: 50,
					sort_result: true
				},
				return_response: true
			});

			if (response?.response) {
				const result = response.response.result;
				const items = result?.items || [];

				if (Array.isArray(items)) {
					artists = items.map((item: any) => ({
						id: item.id || item.uri,
						name: item.name,
						uri: item.uri,
						image_url: item.images?.[0]?.url || item.image_url,
						type: 'artist'
					}));
				} else if (typeof items === 'object') {
					artists = Object.values(items).map((item: any) => ({
						id: item.id || item.uri,
						name: item.name,
						uri: item.uri,
						image_url: item.images?.[0]?.url || item.image_url,
						type: 'artist'
					}));
				}
			}
		} catch (err: any) {
			console.error('Failed to load artists:', err);
			error = err.message || 'Failed to load artists';
		} finally {
			loading = false;
		}
	}

	function switchTab(tab: Tab) {
		activeTab = tab;
		searchQuery = '';

		switch (tab) {
			case 'playlists':
				if (playlists.length === 0) loadPlaylists();
				break;
			case 'albums':
				if (albums.length === 0) loadAlbums();
				break;
			case 'tracks':
				if (tracks.length === 0) loadTracks();
				break;
			case 'artists':
				if (artists.length === 0) loadArtists();
				break;
		}
	}

	async function playItem(item: SpotifyItem) {
		if (!entity_id || !$connection) return;

		console.log('Playing item:', item);

		try {
			// Use different services for tracks vs playlists/albums/artists
			if (item.type === 'track') {
				// For individual tracks, use player_media_play_tracks
				await $connection.sendMessagePromise({
					type: 'call_service',
					domain: 'spotifyplus',
					service: 'player_media_play_tracks',
					service_data: {
						entity_id,
						uris: item.uri,
						delay: 0.5
					}
				});
			} else {
				// For playlists/albums/artists, use player_media_play_context
				await $connection.sendMessagePromise({
					type: 'call_service',
					domain: 'spotifyplus',
					service: 'player_media_play_context',
					service_data: {
						entity_id,
						context_uri: item.uri,
						delay: 0.5
					}
				});
			}
		} catch (err: any) {
			console.error('Failed to play item:', err);
			error = err.message || 'Failed to play';
		}
	}

	// Reactive filtering - depends on activeTab, searchQuery, and all item arrays
	$: filteredItems = (() => {
		let items: SpotifyItem[] = [];

		switch (activeTab) {
			case 'playlists':
				items = playlists;
				break;
			case 'albums':
				items = albums;
				break;
			case 'tracks':
				items = tracks;
				break;
			case 'artists':
				items = artists;
				break;
		}

		console.log(`Filtering ${activeTab}:`, items.length, 'items');

		if (!searchQuery) return items;

		const query = searchQuery.toLowerCase();
		return items.filter(item => {
			const nameMatch = item.name.toLowerCase().includes(query);
			const artistMatch = item.artists?.some(a => a.toLowerCase().includes(query));
			const albumMatch = item.album?.toLowerCase().includes(query);
			return nameMatch || artistMatch || albumMatch;
		});
	})();
</script>

{#if isOpen}
	<Modal size="large">
		<h1 slot="title">{$lang('browse_library') || 'Browse Library'}</h1>

		<div class="browser-container">
			<!-- Tabs -->
			<div class="tabs">
				<button
					class="tab"
					class:active={activeTab === 'playlists'}
					on:click={() => switchTab('playlists')}
					use:Ripple={$ripple}
				>
					<Icon icon="mdi:playlist-music" height="1.2rem" />
					<span>{$lang('playlists') || 'Playlists'}</span>
				</button>
				<button
					class="tab"
					class:active={activeTab === 'albums'}
					on:click={() => switchTab('albums')}
					use:Ripple={$ripple}
				>
					<Icon icon="mdi:album" height="1.2rem" />
					<span>{$lang('albums') || 'Albums'}</span>
				</button>
				<button
					class="tab"
					class:active={activeTab === 'tracks'}
					on:click={() => switchTab('tracks')}
					use:Ripple={$ripple}
				>
					<Icon icon="mdi:music-note" height="1.2rem" />
					<span>{$lang('tracks') || 'Tracks'}</span>
				</button>
				<button
					class="tab"
					class:active={activeTab === 'artists'}
					on:click={() => switchTab('artists')}
					use:Ripple={$ripple}
				>
					<Icon icon="mdi:account-music" height="1.2rem" />
					<span>{$lang('artists') || 'Artists'}</span>
				</button>
			</div>

			<!-- Search -->
			<div class="search-container">
				<Icon icon="mdi:magnify" height="1.2rem" />
				<input
					type="text"
					placeholder={$lang('search') || 'Search'}
					bind:value={searchQuery}
					class="search-input"
				/>
			</div>

			<!-- Error -->
			{#if error}
				<div class="error-message">
					<Icon icon="mdi:alert-circle" height="1.2rem" />
					<span>{error}</span>
				</div>
			{/if}

			<!-- Loading -->
			{#if loading}
				<div class="loading">
					<Icon icon="mdi:loading" height="2rem" class="spinning" />
					<span>{$lang('loading') || 'Loading...'}</span>
				</div>
			{/if}

			<!-- Items List -->
			{#if !loading}
				<div class="items-list">
					{#if filteredItems.length === 0}
						<div class="no-results">
							<Icon icon="mdi:spotify" height="3rem" />
							<p>{$lang('no_results') || 'No results found'}</p>
						</div>
					{:else}
						{#each filteredItems as item (item.id)}
							<button class="item" on:click={() => playItem(item)} use:Ripple={$ripple}>
								{#if item.image_url}
									<img src={item.image_url} alt={item.name} class="item-image" />
								{:else}
									<div class="item-image-placeholder">
										<Icon
											icon={activeTab === 'playlists'
												? 'mdi:playlist-music'
												: activeTab === 'albums'
													? 'mdi:album'
													: activeTab === 'tracks'
														? 'mdi:music-note'
														: 'mdi:account-music'}
											height="2rem"
										/>
									</div>
								{/if}
								<div class="item-info">
									<div class="item-name">{item.name}</div>
									{#if item.artists && item.artists.length > 0}
										<div class="item-meta">{item.artists.join(', ')}</div>
									{/if}
									{#if item.album}
										<div class="item-meta">{item.album}</div>
									{/if}
									{#if item.total_tracks}
										<div class="item-meta">{item.total_tracks} tracks</div>
									{/if}
								</div>
								<div class="item-action">
									<Icon icon="mdi:play-circle" height="1.5rem" />
								</div>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</Modal>
{/if}

<style>
	.browser-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-height: 500px;
		padding-top: 1rem;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 0.5rem;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.tab:hover {
		background-color: rgba(0, 0, 0, 0.3);
		color: rgba(255, 255, 255, 0.8);
	}

	.tab.active {
		background-color: rgb(30, 215, 96);
		border-color: rgb(30, 215, 96);
		color: white;
	}

	.search-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
	}

	.search-input {
		flex: 1;
		background: none;
		border: none;
		color: white;
		font-size: 0.9rem;
		outline: none;
		font-family: inherit;
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.3);
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: rgba(244, 67, 54, 0.1);
		border: 1px solid rgba(244, 67, 54, 0.3);
		border-radius: 0.5rem;
		color: rgb(244, 67, 54);
		font-size: 0.9rem;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.loading :global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-y: auto;
		max-height: none;
		flex: 1;
	}

	.no-results {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		text-align: left;
		min-height: fit-content;
		width: 100%;
	}

	.item:hover {
		background-color: rgba(0, 0, 0, 0.3);
		border-color: rgba(30, 215, 96, 0.5);
	}

	.item-image,
	.item-image-placeholder {
		width: 60px;
		height: 60px;
		border-radius: 0.25rem;
		object-fit: cover;
		flex-shrink: 0;
	}

	.item-image-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.3);
		color: rgba(255, 255, 255, 0.3);
	}

	.item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.item-name {
		font-weight: 500;
		font-size: 0.95rem;
		color: white;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-meta {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-action {
		color: rgb(30, 215, 96);
		flex-shrink: 0;
	}
</style>
