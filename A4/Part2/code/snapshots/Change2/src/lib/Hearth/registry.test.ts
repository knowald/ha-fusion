import { describe, expect, it } from 'vitest';
import { buildProposal } from './registry';

describe('buildProposal glanceables', () => {
	it('suggests a skippable Today group only when matching entities exist', () => {
		const proposal = buildProposal({ areas: [], devices: [], entities: [] }, {
			'sensor.house_energy': {
				state: '12',
				attributes: { device_class: 'energy', unit_of_measurement: 'kWh' }
			},
			'sensor.dishwasher_status': {
				state: 'running',
				attributes: { friendly_name: 'Dishwasher' }
			},
			'calendar.family': { state: 'on', attributes: {} }
		} as any);

		expect(proposal.glanceables.map((widget) => widget.type)).toEqual([
			'label',
			'energy',
			'progress',
			'calendar'
		]);
		expect(buildProposal({ areas: [], devices: [], entities: [] }, {} as any).glanceables).toEqual(
			[]
		);
	});
});
