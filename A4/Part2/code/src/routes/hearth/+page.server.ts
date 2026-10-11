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
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return undefined;
		throw error;
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
	hearthError: string | null;
	hearthNeedsSetup: boolean;
	hearthRevision: number;
	translations: Translations;
}> {
	const configuration =
		((await loadYaml('./data/configuration.yaml')) as Configuration | undefined) ?? {};
	let hearth: unknown;
	let hearthError: string | null = null;
	try {
		hearth = await loadYaml('./data/hearth.yaml');
		if (hearth !== undefined && (!hearth || typeof hearth !== 'object' || Array.isArray(hearth))) {
			hearthError = 'Hearth configuration must contain a YAML mapping';
		}
	} catch (error) {
		hearthError =
			error instanceof Error
				? `Hearth configuration could not be loaded: ${error.message}`
				: 'Hearth configuration could not be loaded';
	}

	const rawRevision = (hearth as Record<string, unknown> | undefined)?.revision;
	const hearthRevision = typeof rawRevision === 'number' ? rawRevision : 0;
	const hearthKeys = hearthError
		? []
		: Object.keys((hearth as Record<string, unknown> | undefined) ?? {}).filter(
				(key) => key !== 'revision'
			);
	const hearthNeedsSetup = !hearthError && (hearth === undefined || hearthKeys.length === 0);

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
		hearthError,
		hearthNeedsSetup,
		hearthRevision,
		translations: locale ? { ...locale, _default: en } : en
	};
}
