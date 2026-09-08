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

	it('keeps the v1 root entities as a weather widget and home cards, in one column', () => {
		const migrated = migrateHearthConfig({
			city: 'Wroclaw',
			weather_entity: 'weather.home',
			average_temperature_entity: 'sensor.average',
			pm25_entity: 'sensor.pm25',
			humidity_entity: 'sensor.humidity',
			filters: [{ entity: 'fan.purifier', label: 'Purifier' }],
			media_entity: 'media_player.living',
			vacuum_entity: 'vacuum.robot',
			overview: [
				{ id: 'a', type: 'entities', entities: [] },
				{ id: 'b', type: 'entities', entities: [] }
			]
		}) as {
			rail: { type: string; entity?: string }[];
			rooms: { columns?: number; cards: { id: string; type: string }[][] }[];
		};
		expect(migrated.rail.find((widget) => widget.type === 'weather')?.entity).toBe('weather.home');
		const home = migrated.rooms[0];
		expect(home.columns).toBeUndefined();
		expect(home.cards).toHaveLength(1);
		expect(home.cards[0].map((card) => `${card.type}:${card.id}`)).toEqual([
			'entities:a',
			'entities:b',
			'temperature:temperature',
			'entities:air',
			'media:media',
			'vacuum:vacuum'
		]);
	});

	it('refuses a version that is not a whole number', () => {
		expect(() => migrateHearthConfig({ version: '4', rail: [], rooms: [] })).toThrow(
			/whole number/
		);
		expect(() => migrateHearthConfig({ version: 4.5, rail: [], rooms: [] })).toThrow(
			/whole number/
		);
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

	it('gives the remaining embeds native types', () => {
		const migrated = migrateHearthConfig({
			version: 3,
			rail: [
				{
					id: 'g',
					type: 'fusion',
					config: { type: 'graph', entity_id: 'sensor.t', period: 'week' }
				},
				{ id: 'i', type: 'fusion', config: { type: 'iframe', url: 'https://x', size: '200px' } }
			],
			rooms: [
				{
					id: 'home',
					cards: [
						[
							{
								id: 'd',
								type: 'fusion',
								config: { type: 'days_since', entity_id: 'input_datetime.x', name: 'Filter' }
							}
						]
					]
				}
			]
		}) as any;
		expect(migrated.rail).toEqual([
			{ id: 'g', type: 'chart', style: 'line', entity: 'sensor.t', period: 'week' },
			{ id: 'i', type: 'iframe', url: 'https://x', height: 200 }
		]);
		expect(migrated.rooms[0].cards[0][0]).toEqual({
			id: 'd',
			type: 'days_since',
			entity: 'input_datetime.x',
			title: 'Filter'
		});
	});

	it('refuses a file written by a newer build', () => {
		expect(() => migrateHearthConfig({ version: CONFIG_VERSION + 1, rail: [], rooms: [] })).toThrow(
			ConfigTooNewError
		);
	});
});
