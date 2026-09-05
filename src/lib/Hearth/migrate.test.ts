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

	it('refuses a file written by a newer build', () => {
		expect(() => migrateHearthConfig({ version: CONFIG_VERSION + 1, rail: [], rooms: [] })).toThrow(
			ConfigTooNewError
		);
	});
});
