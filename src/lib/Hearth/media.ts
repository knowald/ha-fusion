import { get } from 'svelte/store';
import { services } from '$lib/core/ha/connection';
import { states } from '$lib/core/ha/entities';
import { callEntityService } from '$lib/core/ha/commands';
import { callServiceForResult } from '$lib/core/ha/history';

export interface QueueTrack {
	name: string;
	artist: string;
	duration: number;
	uri: string;
}

export interface MediaPlaylist {
	name: string;
	uri: string;
	image: string | null;
	trackCount: number | null;
}

/** Whether the entity is backed by the SpotifyPlus integration, which exposes
 * queue and playlist data through response-returning services. */
export function hasSpotifyPlus(attributes: Record<string, unknown>): boolean {
	return typeof attributes.sp_user_id === 'string';
}

/** A SpotifyPlus lookup; the integration answers with a loosely shaped mapping. */
function spotifyPlusCall(name: string, data: Record<string, unknown>): Promise<any> {
	return callServiceForResult('spotifyplus', name, data);
}

export async function fetchMediaQueue(entityId: string): Promise<QueueTrack[] | null> {
	try {
		const result = await spotifyPlusCall('get_player_queue_info', { entity_id: entityId });
		if (!Array.isArray(result?.queue)) return null;

		return result.queue.map((track: any) => ({
			name: String(track?.name ?? ''),
			artist: Array.isArray(track?.artists)
				? track.artists

						.map((artist: any) => artist?.name)
						.filter(Boolean)
						.join(', ')
				: '',
			duration: Math.round((track?.duration_ms ?? 0) / 1000),
			uri: String(track?.uri ?? '')
		}));
	} catch (error) {
		console.error(error);
		return null;
	}
}

export async function fetchMediaPlaylists(entityId: string): Promise<MediaPlaylist[] | null> {
	try {
		const result = await spotifyPlusCall('get_playlist_favorites', {
			entity_id: entityId,
			limit_total: 50
		});
		if (!Array.isArray(result?.items)) return null;

		return result.items.map((playlist: any) => ({
			name: String(playlist?.name ?? ''),
			uri: String(playlist?.uri ?? ''),
			image: playlist?.image_url ?? null,
			trackCount: playlist?.tracks?.total ?? null
		}));
	} catch (error) {
		console.error(error);
		return null;
	}
}

export interface MediaShortcut {
	name: string;
	uri: string;
	image_url?: string;
}

export interface LibraryItem {
	name: string;
	sub: string;
	uri: string;
	image: string | null;
}

export type LibraryKind = 'albums' | 'tracks' | 'artists';

/**
 * The SpotifyPlus entity that pairs with a Spotify media player: itself when
 * it already is one, the same account's twin otherwise, any SpotifyPlus
 * entity as a last resort.
 */
export function spotifyPlusEntityFor(entityId: string): string | undefined {
	const $states = get(states) ?? {};
	if (entityId.startsWith('media_player.spotifyplus_')) return entityId;
	const candidate = `media_player.spotifyplus_${entityId.replace('media_player.spotify_', '')}`;
	if ($states[candidate]) return candidate;
	return Object.keys($states).find((id) => id.startsWith('media_player.spotifyplus_'));
}

/** The Spotify Connect device to play on: the active one, the preferred name, or the first usable. */
async function resolveSpotifyDevice(
	spEntity: string,
	defaultDevice?: string
): Promise<string | undefined> {
	const active = get(states)?.[spEntity]?.attributes?.sp_device_id;
	if (typeof active === 'string' && active) return active;
	const result = await spotifyPlusCall('get_spotify_connect_devices', { entity_id: spEntity });
	const items: any[] = Array.isArray(result?.Items) ? result.Items : [];
	if (!items.length) return undefined;
	const usable = items.filter(
		(device) => device.DeviceInfo?.IsAvailable !== false && device.IsInDeviceList
	);
	if (defaultDevice) {
		const match =
			usable.find((d) => d.Name === defaultDevice) ?? items.find((d) => d.Name === defaultDevice);
		if (match) return match.Id;
	}
	return usable[0]?.Id ?? items[0]?.Id;
}

/**
 * Starts a Spotify URI on a player: through SpotifyPlus with device
 * resolution when the integration is present, else media_player.play_media.
 */
export async function playSpotifyUri(entityId: string, uri: string, defaultDevice?: string) {
	const spEntity = spotifyPlusEntityFor(entityId);
	const isTrack = uri.startsWith('spotify:track:');
	if (spEntity && get(services)?.spotifyplus) {
		const deviceId = await resolveSpotifyDevice(spEntity, defaultDevice).catch(() => undefined);
		callEntityService(
			'spotifyplus',
			isTrack ? 'player_media_play_tracks' : 'player_media_play_context',
			spEntity,
			{
				...(isTrack ? { uris: uri } : { context_uri: uri }),
				delay: 0.5,
				...(deviceId ? { device_id: deviceId } : {})
			}
		);
		return;
	}
	callEntityService('media_player', 'play_media', entityId, {
		media_content_id: uri,
		media_content_type: 'spotify'
	});
}

/** The user's saved albums, tracks or followed artists from SpotifyPlus. */
export async function fetchSpotifyLibrary(
	entityId: string,
	kind: LibraryKind
): Promise<LibraryItem[] | null> {
	const service =
		kind === 'albums'
			? 'get_album_favorites'
			: kind === 'tracks'
				? 'get_track_favorites'
				: 'get_artists_followed';
	try {
		const result = await spotifyPlusCall(service, { entity_id: entityId, limit_total: 50 });
		const raw = result?.items;
		const items: any[] = Array.isArray(raw)
			? raw
			: raw && typeof raw === 'object'
				? Object.values(raw)
				: [];
		return items.map((entry) => {
			const item = entry?.album ?? entry?.track ?? entry;
			const artists = Array.isArray(item?.artists)
				? item.artists
						.map((artist: any) => artist?.name)
						.filter(Boolean)
						.join(', ')
				: '';
			return {
				name: String(item?.name ?? ''),
				sub:
					artists || (typeof item?.followers?.total === 'number' ? `${item.followers.total}` : ''),
				uri: String(item?.uri ?? ''),
				image: item?.image_url ?? item?.images?.[0]?.url ?? item?.album?.images?.[0]?.url ?? null
			};
		});
	} catch (error) {
		console.error(error);
		return null;
	}
}
