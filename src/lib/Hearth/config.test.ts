import { describe, expect, it } from 'vitest';
import {
	DEFAULT_HEARTH_CONFIG,
	hearthConfigIssues,
	isStack,
	normalizeHearthConfig
} from './config';

describe('normalizeHearthConfig', () => {
	it('uses a generic, entity-free first-run fallback', () => {
		expect(DEFAULT_HEARTH_CONFIG).toMatchObject({
			rail: [
				{ id: 'clock', type: 'clock' },
				{ id: 'nav', type: 'nav' },
				{ id: 'spacer', type: 'spacer' }
			],
			rooms: [{ id: 'home', cards: [[]] }]
		});
		expect(JSON.stringify(DEFAULT_HEARTH_CONFIG)).not.toMatch(/(?:light|sensor|weather|vacuum)\./);
	});

	it('repairs globally duplicated IDs without dropping valid items', () => {
		const config = normalizeHearthConfig({
			rail: [
				{ id: 'status', type: 'status' },
				{ id: 'status', type: 'label' },
				{ id: 'status', type: 'nav' }
			],
			rooms: [
				{
					id: 'room',
					name: 'Room',
					icon: 'home',
					cards: [[{ id: 'shared', type: 'entities', entities: [] }]]
				},
				{
					id: 'room',
					name: 'Other',
					icon: 'home',
					cards: [
						[
							{
								id: 'shared',
								kind: 'stack',
								cards: [{ id: 'shared', type: 'media' }]
							}
						]
					]
				}
			]
		});

		expect(config.rail.map(({ id }) => id)).toEqual(['status', 'status-2', 'status-3']);
		expect(config.rooms.map(({ id }) => id)).toEqual(['room', 'room-2']);
		const stack = config.rooms[1].cards[0][0];
		expect(isStack(stack) && [stack.id, stack.cards[0].id]).toEqual(['shared-2', 'shared-3']);
	});

	it('drops unknown types and malformed nested entity references', () => {
		const config = normalizeHearthConfig({
			rail: [{ id: 'bad', type: 'not-a-widget' }],
			rooms: [
				{
					id: 'home',
					cards: [
						[
							{ id: 'bad', type: 'not-a-card' },
							{
								id: 'entities',
								type: 'entities',
								entities: [null, {}, { entity: ' light.desk ', name: 'Desk' }]
							}
						]
					]
				}
			]
		});

		expect(config.rail).toEqual([]);
		expect(config.rooms[0].cards[0]).toHaveLength(1);
		expect(config.rooms[0].cards[0][0]).toMatchObject({
			id: 'entities',
			entities: [{ entity: 'light.desk', name: 'Desk' }]
		});
	});
});

describe('hearthConfigIssues', () => {
	it('gives actionable paths for editor mistakes', () => {
		const issues = hearthConfigIssues({
			rail: [
				{ id: 'same', type: 'nav' },
				{ id: 'same', type: 'typo' }
			],
			rooms: [
				{
					id: 'home',
					cards: [
						[
							{ id: 'card', type: 'entities', entities: [{ name: 'Missing entity' }] },
							{ id: 'card', type: 'unknown' }
						]
					]
				}
			]
		});

		expect(issues).toContain('rail[1].id duplicates rail[0].id');
		expect(issues).toContain('rail[1].type is not a supported widget type');
		expect(issues).toContain('rooms[0].cards[0][0].entities[0].entity must be a non-empty string');
		expect(issues).toContain('rooms[0].cards[0][1].id duplicates rooms[0].cards[0][0].id');
	});
});
