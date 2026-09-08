import { describe, expect, it } from 'vitest';
import { selectedLanguage } from '$lib/core/i18n';
import { attentionItems, configEntityIds } from './attention';
import type { HearthConfig } from './config';
import type { HassEntities } from 'home-assistant-js-websocket';

const config = {
	rail: [],
	rooms: [
		{
			id: 'living',
			name: 'Living',
			cards: [
				[
					{
						id: 'c1',
						type: 'entities',
						entities: [{ entity: 'sensor.hall' }, { entity: 'light.desk' }]
					}
				]
			]
		}
	]
} as unknown as HearthConfig;

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

describe('attention', () => {
	it('lists the entities the cards reference', () => {
		expect(configEntityIds(config)).toEqual(['sensor.hall', 'light.desk']);
	});

	it('says how long an entity has been offline in the selected language', () => {
		const states = {
			'sensor.hall': { entity_id: 'sensor.hall', state: 'unavailable', last_changed: hoursAgo(3) },
			'light.desk': { entity_id: 'light.desk', state: 'on', last_changed: hoursAgo(3) }
		} as unknown as HassEntities;
		selectedLanguage.set('en');
		expect(attentionItems(config, states).map((item) => item.detail)).toEqual([
			expect.stringMatching(/3 hours ago$/)
		]);
		selectedLanguage.set('pl');
		expect(attentionItems(config, states)[0].detail).toMatch(/3 godziny temu$/);
	});
});
