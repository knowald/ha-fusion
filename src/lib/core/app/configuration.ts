import { writable } from 'svelte/store';

/* App-wide settings from data/configuration.yaml, shared by every dashboard. */

export type SliderUpdateMode = 'continuous' | 'release';

export interface Configuration {
	hassUrl?: string;
	locale?: string;
	custom_js?: boolean;
	motion?: boolean;
	addons?: Addons;
	token?: string;
	hearth?: boolean;
	// serves the original dashboard at /classic for one release cycle
	classic?: boolean;
}

export interface Addons {
	youtube?: boolean;
	maptiler?: {
		apikey: string;
	};
}

export interface PersistentNotification {
	created_at: string;
	message: string;
	notification_id: string;
	title: string;
	status: 'read' | 'unread';
}

export const configuration = writable<Configuration>();
