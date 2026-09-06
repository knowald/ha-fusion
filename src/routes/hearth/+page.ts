import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';

// Hearth is the dashboard at / now; old bookmarks and the manifest land here
export function load() {
	redirect(307, `${base}/`);
}
