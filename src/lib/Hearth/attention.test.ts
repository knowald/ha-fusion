import { describe, expect, it } from 'vitest';
import { selectedLanguage } from '$lib/core/i18n';
import { attentionItems, configEntityIds, displayedEntityIds } from './attention';
import type { HearthConfig } from './config';
import type { HassEntities } from 'home-assistant-js-websocket';

const config = {
	day_night: { entity: 'sun.sun' },
	rail: [
		{ id: 'w', type: 'weather', entity: 'weather.home' },
		{ id: 'e', type: 'energy', entity: 'sensor.energy', price_entity: 'sensor.price' },
		{ id: 'c', type: 'calendar', entities: ['calendar.a'], travel_entity: 'sensor.travel' },
		{ id: 'n', type: 'nav', visibility: [{ entity: 'input_boolean.guest', state: 'off' }] }
	],
	rooms: [
		{
			id: 'living',
			name: 'Living',
			temp_entity: 'sensor.room_temp',
			cards: [
				[
					{
						id: 'c1',
						type: 'entities',
						entities: [{ entity: 'sensor.hall' }, { entity: 'light.desk' }],
						visibility: [{ or: [{ entity: 'person.a', state: 'home' }, { media: '(x)' }] }]
					},
					{
						id: 'stack',
						kind: 'stack',
						direction: 'horizontal',
						cards: [{ id: 'c2', type: 'climate', entity: 'climate.living' }]
					}
				]
			]
		}
	]
} as unknown as HearthConfig;

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

describe('attention', () => {
	it('lists what the dashboard displays: widgets, page readings, cards and stack children', () => {
		expect(displayedEntityIds(config)).toEqual([
			'weather.home',
			'sensor.energy',
			'sensor.price',
			'calendar.a',
			'sensor.travel',
			'sensor.room_temp',
			'sensor.hall',
			'light.desk',
			'climate.living'
		]);
	});

	it('adds the day/night switch and visibility conditions to the full reference list', () => {
		expect(configEntityIds(config).slice(9)).toEqual([
			'sun.sun',
			'input_boolean.guest',
			'person.a'
		]);
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
		// an offline condition entity steers visibility, it is not shown, so it raises nothing
		states['person.a'] = {
			entity_id: 'person.a',
			state: 'unavailable',
			last_changed: hoursAgo(1)
		} as HassEntities[string];
		expect(attentionItems(config, states)).toHaveLength(1);
		selectedLanguage.set('pl');
		expect(attentionItems(config, states)[0].detail).toMatch(/3 godziny temu$/);
	});
});
