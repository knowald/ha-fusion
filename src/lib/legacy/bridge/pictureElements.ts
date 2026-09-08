import { tick } from 'svelte';
import { loadIcons } from '@iconify/svelte';
import { openModal } from '$lib/Modals';
import { icons } from '../Modal/PictureElements/icons';

/**
 * Opens the original picture elements editor for a fusion card's element list
 * and resolves with the edited list once the modal has closed.
 */
export async function editPictureElements(id: string, elements: unknown[]): Promise<unknown[]> {
	const sel = { id, elements };
	const [{ default: PictureElementsConfig }] = await Promise.all([
		import('../Modal/PictureElements/PictureElementsConfig.svelte'),
		loadIcons(Object.values(icons))
	]);
	await openModal(PictureElementsConfig, { sel });
	// PictureElementsConfig writes sel.elements from its onDestroy, which runs
	// as part of the reactivity flush triggered by the modal stack closing.
	await tick();
	return sel.elements;
}
