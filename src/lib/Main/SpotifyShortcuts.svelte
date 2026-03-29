<script lang="ts">
	import { connection, editMode, services, states } from '$lib/Stores';
	import Icon from '@iconify/svelte';
	import type { SpotifyShortcut } from '$lib/Types';

	export let shortcuts: SpotifyShortcut[] = [];
	export let entity_id: string | undefined;
	export let default_device: string | undefined = undefined;
	export let layout: 'compact' | 'large' = 'compact';

	function getSpotifyPlusEntity(): string | undefined {
		if (!entity_id) return undefined;
		if (entity_id.startsWith('media_player.spotifyplus_')) return entity_id;
		const suffix = entity_id.replace('media_player.spotify_', '');
		const candidate = `media_player.spotifyplus_${suffix}`;
		if ($states?.[candidate]) return candidate;
		return Object.keys($states || {}).find((k) => k.startsWith('media_player.spotifyplus_'));
	}

	async function resolveDeviceId(spEntity: string): Promise<string | undefined> {
		const attrs = $states?.[spEntity]?.attributes;
		// Already have an active device
		if (attrs?.sp_device_id) return attrs.sp_device_id;

		// Fetch device list and pick first available
		try {
			const response = await $connection!.sendMessagePromise({
				type: 'call_service',
				domain: 'spotifyplus',
				service: 'get_spotify_connect_devices',
				service_data: { entity_id: spEntity },
				return_response: true
			});
			const items = response?.response?.result?.Items || [];
			if (items.length === 0) return undefined;

			const usable = items.filter((d: any) =>
				d.DeviceInfo?.IsAvailable !== false && d.IsInDeviceList
			);

			// If a default device is configured, find it by name
			if (default_device) {
				const match = usable.find((d: any) => d.Name === default_device)
					|| items.find((d: any) => d.Name === default_device);
				if (match) return match.Id;
			}

			// Pick first usable device, fall back to any
			return usable[0]?.Id || items[0]?.Id;
		} catch (err) {
			console.error('Failed to get device list:', err);
			return undefined;
		}
	}

	async function playShortcut(event: MouseEvent, shortcut: SpotifyShortcut) {
		event.stopPropagation();
		if ($editMode || !entity_id || !$connection) return;

		const spEntity = getSpotifyPlusEntity();
		const isTrack = shortcut.uri.startsWith('spotify:track:');

		try {
			if ($services?.spotifyplus && spEntity) {
				const deviceId = await resolveDeviceId(spEntity);
				const serviceData: any = {
					entity_id: spEntity,
					...(isTrack ? { uris: shortcut.uri } : { context_uri: shortcut.uri }),
					delay: 0.5
				};
				if (deviceId) serviceData.device_id = deviceId;
				await $connection.sendMessagePromise({
					type: 'call_service',
					domain: 'spotifyplus',
					service: isTrack ? 'player_media_play_tracks' : 'player_media_play_context',
					service_data: serviceData
				});
			} else {
				await $connection.sendMessagePromise({
					type: 'call_service',
					domain: 'media_player',
					service: 'play_media',
					service_data: {
						entity_id,
						media_content_id: shortcut.uri,
						media_content_type: 'spotify'
					}
				});
			}
		} catch (err) {
			console.error('Failed to play shortcut:', err);
		}
	}
</script>

{#if shortcuts.length > 0}
	<div class="shortcuts" class:large={layout === 'large'}>
		{#each shortcuts as shortcut}
			<button
				class="shortcut"
				title={shortcut.name}
				on:click={(e) => playShortcut(e, shortcut)}
			>
				{#if shortcut.image_url}
					<img src={shortcut.image_url} alt={shortcut.name} class="shortcut-image" />
				{:else}
					<div class="shortcut-placeholder">
						<Icon icon="mdi:play-circle-outline" height="1.2rem" />
					</div>
				{/if}
				<span class="shortcut-name">{shortcut.name}</span>
			</button>
		{/each}
	</div>
{/if}

<style>
	.shortcuts {
		display: flex;
		gap: 0.4rem;
		overflow: hidden;
		padding-top: 0.25rem;
	}

	.shortcuts.large {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		max-width: 90%;
	}

	.shortcut {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.4rem 0.2rem 0.2rem;
		background-color: rgba(255, 255, 255, 0.08);
		border: none;
		border-radius: 0.35rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
		min-width: 0;
		max-width: 100%;
		font-family: inherit;
	}

	.shortcuts.large .shortcut {
		padding: 0.3rem 0.5rem 0.3rem 0.3rem;
		gap: 0.4rem;
		border-radius: 0.4rem;
		background-color: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.shortcut:hover {
		background-color: rgba(255, 255, 255, 0.15);
	}

	.shortcuts.large .shortcut:hover {
		background-color: rgba(255, 255, 255, 0.12);
	}

	.shortcut-image {
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 0.2rem;
		object-fit: cover;
		flex-shrink: 0;
	}

	.shortcuts.large .shortcut-image {
		width: 1.8rem;
		height: 1.8rem;
	}

	.shortcut-placeholder {
		width: 1.4rem;
		height: 1.4rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.4);
		flex-shrink: 0;
	}

	.shortcuts.large .shortcut-placeholder {
		width: 1.8rem;
		height: 1.8rem;
	}

	.shortcut-name {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.7);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.shortcuts.large .shortcut-name {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.85);
	}
</style>
