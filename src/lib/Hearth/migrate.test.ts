import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { CONFIG_VERSION, ConfigTooNewError, migrateHearthConfig } from './migrate';
import { normalizeHearthConfig } from './normalize';

// a string path: under jsdom, new URL() is the browser class, which fs rejects
const fixture = yaml.load(
	readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/hearth-v2.yaml'), 'utf8')
);

describe('migrateHearthConfig', () => {
	it('lifts a 2026.7 preview file to the current format', () => {
		expect(normalizeHearthConfig(fixture)).toMatchSnapshot();
	});

	it('stamps the current version and consumes the legacy keys', () => {
		const migrated = migrateHearthConfig(fixture) as Record<string, unknown>;
		expect(migrated.version).toBe(CONFIG_VERSION);
		for (const key of ['lights', 'blinds', 'overview', 'city', 'weather_entity']) {
			expect(migrated).not.toHaveProperty(key);
		}
	});

	it('passes a current file through unchanged', () => {
		const current = { version: CONFIG_VERSION, rail: [], rooms: [{ id: 'home', cards: [[]] }] };
		expect(migrateHearthConfig(current)).toEqual(current);
	});

	it('turns a fusion picture elements embed into a picture card', () => {
		const migrated = migrateHearthConfig({
			version: 1,
			rail: [],
			rooms: [
				{
					id: 'home',
					cards: [
						[
							{
								id: 'plan',
								type: 'fusion',
								config: {
									type: 'picture_elements',
									name: 'Plan',
									elements: [{ className: 'Image' }]
								}
							}
						]
					]
				}
			]
		}) as any;
		expect(migrated.rooms[0].cards[0][0]).toEqual({
			id: 'plan',
			type: 'picture',
			title: 'Plan',
			elements: [{ className: 'Image' }]
		});
	});

	it('turns a spotify player embed into a media card with shortcuts', () => {
		const migrated = migrateHearthConfig({
			version: 2,
			rail: [],
			rooms: [
				{
					id: 'home',
					cards: [
						[
							{
								id: 'spotify',
								type: 'fusion',
								config: {
									type: 'spotify_player_large',
									entity_id: 'media_player.spotify_me',
									shortcuts: [{ name: 'Focus', uri: 'spotify:playlist:1' }],
									default_device: 'Kitchen'
								}
							}
						]
					]
				}
			]
		}) as any;
		expect(migrated.rooms[0].cards[0][0]).toEqual({
			id: 'spotify',
			type: 'media',
			entity: 'media_player.spotify_me',
			shortcuts: [{ name: 'Focus', uri: 'spotify:playlist:1' }],
			default_device: 'Kitchen'
		});
	});

	it('refuses a file written by a newer build', () => {
		expect(() => migrateHearthConfig({ version: CONFIG_VERSION + 1, rail: [], rooms: [] })).toThrow(
			ConfigTooNewError
		);
	});
});
