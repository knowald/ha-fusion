import { get } from 'svelte/store';
import { callService } from 'home-assistant-js-websocket';
import { connection } from '$lib/Stores';

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

async function spotifyPlusCall(name: string, data: Record<string, unknown>): Promise<any> {
	const conn = get(connection);
	if (!conn) return null;
	const response = (await callService(conn, 'spotifyplus', name, data, undefined, true)) as {
		response?: { result?: unknown };
	};
	return response?.response?.result ?? null;
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
