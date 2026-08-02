import { describe, expect, it } from 'vitest';
import { fusionSpecKeys } from './edit/FusionFields.svelte';

describe('Fusion field coverage', () => {
	it('provides form fields for parity-sensitive embed types', () => {
		expect(fusionSpecKeys('entities')).toContain('wildcard');
		expect(fusionSpecKeys('spotify_player')).toEqual(
			expect.arrayContaining(['entity_id', 'show_progress', 'default_device'])
		);
		expect(fusionSpecKeys('conditional_media')).toContain('timeout');
		expect(fusionSpecKeys('divider')).toContain('size');
		expect(fusionSpecKeys('notifications')).toContain('expand');
	});
});
