import { render } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import type { HassEntities } from 'home-assistant-js-websocket';
import { getDomain, states } from '$lib/core/ha/entities';
import { displayedEntityIds } from './attention';
import { hearthConfig } from './store';
import { isStack, type OverviewCard } from './config';
import { normalizeHearthConfig } from './normalize';
import { cardNeedsConfiguration } from './cards';
import { railWidgetNeedsConfiguration } from './widgets';
import { hassEntity } from './testing';
import CardRenderer from './CardRenderer.svelte';
import RailWidgetRenderer from './RailWidgetRenderer.svelte';

/*
 * Every card and widget type in the matrix fixture mounts against plausible
 * entity states without throwing and without falling back to the setup
 * placeholder. Data fetches stay off because the connection is down in tests.
 */

const STATE_BY_DOMAIN: Record<string, [string, Record<string, unknown>]> = {
	light: ['on', { brightness: 180, supported_color_modes: ['brightness'] }],
	switch: ['on', {}],
	fan: ['on', { percentage: 40 }],
	cover: ['open', { current_position: 70 }],
	sensor: ['21.5', { unit_of_measurement: 'C', device_class: 'temperature' }],
	binary_sensor: ['off', {}],
	climate: ['heat', { temperature: 21, current_temperature: 20.5, hvac_modes: ['heat', 'off'] }],
	media_player: ['playing', { media_title: 'Song', media_duration: 200, media_position: 10 }],
	vacuum: ['docked', { battery_level: 80 }],
	weather: ['sunny', { temperature: 22, forecast: [] }],
	calendar: ['off', {}],
	timer: ['idle', {}],
	input_datetime: ['2026-01-01 08:00:00', { has_date: true, has_time: true }],
	camera: ['idle', {}],
	image: ['2026-01-01T00:00:00+00:00', {}],
	scene: ['unknown', {}],
	input_boolean: ['off', {}]
};

const config = normalizeHearthConfig(
	load(readFileSync('e2e/fixture-matrix/data/hearth.yaml', 'utf8'))
);

const entities: HassEntities = {};
for (const id of displayedEntityIds(config)) {
	const [state, attributes] = STATE_BY_DOMAIN[getDomain(id) ?? ''] ?? ['on', {}];
	entities[id] = hassEntity(id, state, { friendly_name: id, ...attributes });
}

// fusion embeds and the camera player pull the original dashboard in lazily,
// which outlives a unit test; the e2e suite covers them
const BRIDGE_BACKED = new Set(['fusion', 'camera']);
const cards: OverviewCard[] = config.rooms
	.flatMap((room) => room.cards.flat().flatMap((item) => (isStack(item) ? item.cards : [item])))
	.filter((card) => !BRIDGE_BACKED.has(card.type));
const widgets = config.rail.filter((widget) => !BRIDGE_BACKED.has(widget.type));

describe('every configured type renders', () => {
	states.set(entities);
	hearthConfig.set(config);

	it('covers each card type once at least', () => {
		expect(new Set(cards.map((card) => card.type)).size).toBeGreaterThanOrEqual(11);
	});

	for (const card of cards) {
		it(`card ${card.type} (${card.id})`, () => {
			expect(cardNeedsConfiguration(card), 'fixture card lacks its setup').toBe(false);
			const { container } = render(CardRenderer, { card });
			expect(container.textContent).not.toContain('Configure');
			expect(container.firstElementChild).not.toBeNull();
		});
	}

	for (const widget of widgets) {
		it(`widget ${widget.type} (${widget.id})`, () => {
			expect(railWidgetNeedsConfiguration(widget), 'fixture widget lacks its setup').toBe(false);
			const { container } = render(RailWidgetRenderer, { widget });
			expect(container.textContent).not.toContain('Configure');
		});
	}
});
