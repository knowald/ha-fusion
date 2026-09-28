// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { callService } from 'home-assistant-js-websocket';
import { selectedLanguage, states } from '$lib/Stores';
import CoverModal from './CoverModal.svelte';

// jsdom has no matchMedia; svelte/motion queries it at import time
vi.hoisted(() => {
	window.matchMedia = (query: string) =>
		({
			matches: false,
			media: query,
			addEventListener() {},
			removeEventListener() {}
		}) as unknown as MediaQueryList;
});

vi.mock('home-assistant-js-websocket', () => ({
	callService: vi.fn(() => Promise.resolve())
}));

vi.mock('$lib/Modal/Index.svelte', async () => ({
	default: (await import('./CoverModal.test.stub.svelte')).default
}));

vi.mock('$lib/Modal/ConfigButtons.svelte', async () => ({
	default: (await import('./CoverModal.test.stub.svelte')).default
}));

const entity_id = 'cover.living_room';

function setCover(attributes: Record<string, unknown>) {
	states.set({
		[entity_id]: {
			entity_id,
			state: 'open',
			attributes: { supported_features: 15 | 128, ...attributes },
			context: { id: '', parent_id: null, user_id: null },
			last_changed: '',
			last_updated: ''
		}
	});
}

describe('CoverModal sliders', () => {
	let component: ReturnType<typeof mount>;

	function open(slider_updates?: 'continuous' | 'release') {
		component = mount(CoverModal, {
			target: document.body,
			props: { isOpen: true, selected: { entity_id, slider_updates } }
		});
		flushSync();
		return {
			headings: () => [...document.querySelectorAll('h2 .align-right')].map((el) => el.textContent),
			sliders: () => [...document.querySelectorAll<HTMLInputElement>('input[type=range]')]
		};
	}

	function drag(input: HTMLInputElement, value: number) {
		input.value = String(value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
		flushSync();
	}

	function release(input: HTMLInputElement) {
		input.dispatchEvent(new Event('change', { bubbles: true }));
		flushSync();
	}

	beforeEach(() => {
		selectedLanguage.set('en');
		vi.mocked(callService).mockClear();
	});

	afterEach(() => {
		unmount(component);
		document.body.innerHTML = '';
	});

	it('previews the dragged position before releasing in release mode', () => {
		setCover({ current_position: 100, current_tilt_position: 50 });
		const modal = open('release');
		const [position] = modal.sliders();

		drag(position, 20);

		expect(modal.headings()[0]).toContain('20%');
		expect(callService).not.toHaveBeenCalled();

		release(position);

		expect(callService).toHaveBeenCalledTimes(1);
		expect(callService).toHaveBeenCalledWith(undefined, 'cover', 'set_cover_position', {
			entity_id,
			position: 20
		});
		expect(modal.headings()[0]).toContain('100%');
	});

	it('previews the dragged tilt before releasing in release mode', () => {
		setCover({ current_position: 100, current_tilt_position: 50 });
		const modal = open('release');
		const [, tilt] = modal.sliders();

		drag(tilt, 80);

		expect(modal.headings()[1]).toContain('80%');
		expect(callService).not.toHaveBeenCalled();
	});

	it('sends position updates while dragging in continuous mode', () => {
		setCover({ current_position: 100 });
		const modal = open();
		const [position] = modal.sliders();

		drag(position, 40);

		expect(modal.headings()[0]).toContain('40%');
		expect(callService).toHaveBeenCalledWith(undefined, 'cover', 'set_cover_position', {
			entity_id,
			position: 40
		});
	});

	it('shows sliders for a fully closed cover', () => {
		setCover({ current_position: 0, current_tilt_position: 0 });
		const modal = open();

		expect(modal.sliders()).toHaveLength(2);
	});
});
