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

export interface PictureViewer {
	update(elements: unknown[]): Promise<void>;
	destroy(): void;
}

/**
 * Mounts the original Konva viewer into `container`, sized to it. Imported on
 * demand because Konva touches the canvas at import time.
 */
export async function mountPictureViewer(
	container: HTMLDivElement,
	id: string,
	elements: unknown[]
): Promise<PictureViewer> {
	const { KonvaViewer } = await import('../Modal/PictureElements/konvaViewer');
	const viewer = new KonvaViewer(container, {
		className: 'Stage',
		attrs: { width: container.offsetWidth, height: container.offsetHeight, id },
		children: [{ className: 'Layer', children: elements as any[] }]
	});
	return {
		update: (next) => viewer.updateLayerChildren(next as any[]),
		destroy: () => viewer.destroyViewer()
	};
}
