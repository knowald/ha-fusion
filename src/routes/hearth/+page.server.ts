import { readFile } from 'fs/promises';
import { dev } from '$app/environment';
import * as yaml from 'js-yaml';
import type { Configuration, Translations } from '$lib/Types';
import dotenv from 'dotenv';

dotenv.config();

async function loadYaml(file: string) {
	try {
		const data = await readFile(file, 'utf8');
		return data.trim() ? yaml.load(data) : undefined;
	} catch {
		// missing file is fine
		return undefined;
	}
}

async function loadJson(file: string) {
	try {
		return JSON.parse(await readFile(file, 'utf8'));
	} catch {
		return {};
	}
}

export async function load({ request }): Promise<{
	configuration: Configuration;
	hearth: unknown;
	hearthRevision: number;
	translations: Translations;
}> {
	const [configuration = {}, hearth] = await Promise.all([
		loadYaml('./data/configuration.yaml') as Promise<Configuration | undefined>,
		loadYaml('./data/hearth.yaml')
	]);

	const rawRevision = (hearth as Record<string, unknown> | undefined)?.revision;
	const hearthRevision = typeof rawRevision === 'number' ? rawRevision : 0;

	configuration.hassUrl =
		process.env.HASS_URL || request.headers.get('X-Proxy-Target') || undefined;

	// translations for reused fusion components (domain modals, widgets)
	const dir = dev ? './static' : './build/client';
	const [en, locale] = await Promise.all([
		loadJson(`${dir}/translations/en.json`),
		configuration?.locale && configuration.locale !== 'en'
			? loadJson(`${dir}/translations/${configuration.locale}.json`)
			: undefined
	]);

	return {
		configuration,
		hearth,
		hearthRevision,
		translations: locale ? { ...locale, _default: en } : en
	};
}
