import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { states } from '$lib/core/ha/entities';
import { hassEntity } from './testing';
import CardRenderer from './CardRenderer.svelte';
import RailWidgetRenderer from './RailWidgetRenderer.svelte';

describe('CardRenderer', () => {
	it('renders a configured header card', () => {
		render(CardRenderer, {
			card: { id: 'h', type: 'header', title: 'Living room', subtitle: 'Ground floor' }
		});
		expect(screen.getByText('Living room')).toBeTruthy();
		expect(screen.getByText('Ground floor')).toBeTruthy();
	});

	it('shows the setup placeholder for a card with nothing to render yet', () => {
		render(CardRenderer, { card: { id: 'e', type: 'entities', entities: [] } });
		expect(screen.getByText('Configure Entities')).toBeTruthy();
	});

	it('renders an entities card as one tile per entity', () => {
		states.set({
			'switch.a': hassEntity('switch.a', 'on', { friendly_name: 'Lamp A' }),
			'switch.b': hassEntity('switch.b', 'off', { friendly_name: 'Lamp B' })
		});
		render(CardRenderer, {
			card: {
				id: 'e',
				type: 'entities',
				title: 'Lamps',
				entities: [{ entity: 'switch.a' }, { entity: 'switch.b' }]
			}
		});
		expect(screen.getByText('Lamp A')).toBeTruthy();
		expect(screen.getByText('Lamp B')).toBeTruthy();
		expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
	});
});

describe('RailWidgetRenderer', () => {
	it('renders a section label', () => {
		render(RailWidgetRenderer, { widget: { id: 'l', type: 'label', text: 'Today' } });
		expect(screen.getByText('Today')).toBeTruthy();
	});

	it('shows the setup placeholder for a widget missing its entity', () => {
		render(RailWidgetRenderer, { widget: { id: 'n', type: 'energy' } });
		expect(screen.getByText('Configure Energy today')).toBeTruthy();
	});
});
