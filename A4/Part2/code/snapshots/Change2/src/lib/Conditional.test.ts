import { describe, expect, it } from 'vitest';
import type { HassEntities } from 'home-assistant-js-websocket';
import type { Condition, Section } from '$lib/Types';
import {
	validateCondition,
	handleAllConditions,
	handleState,
	handleNumericState,
	handleAnd,
	handleOr,
	handleNot
} from './Conditional';

const mockStates: HassEntities = {
	'light.living_room': {
		entity_id: 'light.living_room',
		state: 'on',
		attributes: {},
		last_changed: '',
		last_updated: '',
		context: { id: '1', parent_id: null, user_id: null }
	},
	'sensor.temperature': {
		entity_id: 'sensor.temperature',
		state: '21.5',
		attributes: {},
		last_changed: '',
		last_updated: '',
		context: { id: '2', parent_id: null, user_id: null }
	},
	'sensor.invalid_num': {
		entity_id: 'sensor.invalid_num',
		state: 'unknown',
		attributes: {},
		last_changed: '',
		last_updated: '',
		context: { id: '3', parent_id: null, user_id: null }
	}
};

const mockSection: Section = { id: 1 };

describe('Conditional Engine (Composite / Interpreter)', () => {
	describe('Leaf conditions: handleState', () => {
		it('matches positive state', () => {
			const cond: Condition = { condition: 'state', entity: 'light.living_room', state: 'on' };
			expect(handleState(mockStates, cond)).toBe(true);
			expect(validateCondition(false, mockStates, mockSection, cond)).toBe(true);
		});

		it('rejects mismatched state', () => {
			const cond: Condition = { condition: 'state', entity: 'light.living_room', state: 'off' };
			expect(handleState(mockStates, cond)).toBe(false);
			expect(validateCondition(false, mockStates, mockSection, cond)).toBe(false);
		});

		it('matches inverted state_not', () => {
			const cond: Condition = { condition: 'state', entity: 'light.living_room', state_not: 'off' };
			expect(handleState(mockStates, cond)).toBe(true);
		});
	});

	describe('Leaf conditions: handleNumericState', () => {
		it('evaluates above and below ranges', () => {
			const condRange: Condition = {
				condition: 'numeric_state',
				entity: 'sensor.temperature',
				above: 20,
				below: 25
			};
			expect(handleNumericState(mockStates, condRange)).toBe(true);

			const condBelow: Condition = {
				condition: 'numeric_state',
				entity: 'sensor.temperature',
				below: 20
			};
			expect(handleNumericState(mockStates, condBelow)).toBe(false);
		});

		it('handles non-numeric states gracefully', () => {
			const cond: Condition = {
				condition: 'numeric_state',
				entity: 'sensor.invalid_num',
				above: 10
			};
			expect(handleNumericState(mockStates, cond)).toBe(false);
		});
	});

	describe('Composite conditions: handleAnd & handleOr', () => {
		it('evaluates AND composite logic', () => {
			const cond: Condition = {
				condition: 'and',
				conditions: [
					{ condition: 'state', entity: 'light.living_room', state: 'on' },
					{ condition: 'numeric_state', entity: 'sensor.temperature', above: 20 }
				]
			};
			expect(handleAnd(false, mockStates, mockSection, cond)).toBe(true);
			expect(validateCondition(false, mockStates, mockSection, cond)).toBe(true);
		});

		it('evaluates OR composite logic', () => {
			const cond: Condition = {
				condition: 'or',
				conditions: [
					{ condition: 'state', entity: 'light.living_room', state: 'off' },
					{ condition: 'numeric_state', entity: 'sensor.temperature', above: 20 }
				]
			};
			expect(handleOr(false, mockStates, mockSection, cond)).toBe(true);
			expect(validateCondition(false, mockStates, mockSection, cond)).toBe(true);
		});
	});

	describe('CH01 Extension: handleNot composite condition', () => {
		it('inverts a true child condition to false', () => {
			const cond: Condition = {
				condition: 'not',
				conditions: [{ condition: 'state', entity: 'light.living_room', state: 'on' }]
			};
			expect(handleNot(false, mockStates, mockSection, cond)).toBe(false);
			expect(validateCondition(false, mockStates, mockSection, cond)).toBe(false);
		});

		it('inverts a false child condition to true', () => {
			const cond: Condition = {
				condition: 'not',
				conditions: [{ condition: 'state', entity: 'light.living_room', state: 'off' }]
			};
			expect(handleNot(false, mockStates, mockSection, cond)).toBe(true);
			expect(validateCondition(false, mockStates, mockSection, cond)).toBe(true);
		});

		it('inverts multiple subconditions (returns true only when NONE are true)', () => {
			const condAllFalse: Condition = {
				condition: 'not',
				conditions: [
					{ condition: 'state', entity: 'light.living_room', state: 'off' },
					{ condition: 'numeric_state', entity: 'sensor.temperature', below: 15 }
				]
			};
			expect(handleNot(false, mockStates, mockSection, condAllFalse)).toBe(true);

			const condOneTrue: Condition = {
				condition: 'not',
				conditions: [
					{ condition: 'state', entity: 'light.living_room', state: 'off' },
					{ condition: 'numeric_state', entity: 'sensor.temperature', above: 20 }
				]
			};
			expect(handleNot(false, mockStates, mockSection, condOneTrue)).toBe(false);
		});

		it('handles nested composite: NOT wrapping an OR group', () => {
			const nestedCond: Condition = {
				condition: 'not',
				conditions: [
					{
						condition: 'or',
						conditions: [
							{ condition: 'state', entity: 'light.living_room', state: 'off' },
							{ condition: 'numeric_state', entity: 'sensor.temperature', below: 10 }
						]
					}
				]
			};
			// Neither child of OR is true -> OR is false -> NOT(false) is true
			expect(validateCondition(false, mockStates, mockSection, nestedCond)).toBe(true);
		});

		it('returns false for empty conditions list', () => {
			const emptyCond: Condition = { condition: 'not', conditions: [] };
			expect(handleNot(false, mockStates, mockSection, emptyCond)).toBe(false);
		});
	});

	describe('handleAllConditions integration', () => {
		it('returns true when all visibility rules pass', () => {
			const sectionWithVis: Section = {
				id: 2,
				visibility: [
					{
						condition: 'and',
						conditions: [
							{ condition: 'state', entity: 'light.living_room', state: 'on' },
							{
								condition: 'not',
								conditions: [{ condition: 'state', entity: 'light.living_room', state: 'off' }]
							}
						]
					}
				]
			};
			expect(handleAllConditions(false, mockStates, sectionWithVis)).toBe(true);
		});
	});
});
