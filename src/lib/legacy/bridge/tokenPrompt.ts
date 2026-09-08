import { openModal } from '$lib/Modals';

/** The companion-app long-lived token prompt from the original dashboard. */
export function openTokenPrompt() {
	openModal(() => import('../Modal/TokenModal.svelte'));
}
