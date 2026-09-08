import {
	openModal as openModalStrict,
	closeModal,
	closeAllModals,
	modals,
	Modals,
	onBeforeClose
} from 'svelte-modals/legacy';
import { pushLayer } from '$lib/ui/layers';

/**
 * svelte-modals types require modal components to declare the full ModalProps
 * interface (id, index, close, isOpen). Our modal components only declare the
 * props they use, which makes every `openModal(() => import(...))` call fail
 * type inference. Loosen the signature here instead of widening 100+ call
 * sites; runtime behavior is unchanged.
 */
type OpenModal = (
	component: (() => Promise<{ default: any }>) | any,
	props?: Record<string, any>,
	options?: { id?: string; replace?: boolean }
) => Promise<any>;

// every modal is a layer while open, so Escape and window shortcuts treat it
// like Hearth's own sheets; the open promise resolves when the modal closes
const openModal: OpenModal = (component, props, options) => {
	const release = pushLayer(() => closeModal());
	const closed = (openModalStrict as OpenModal)(component, props, options);
	void closed.finally(release);
	return closed;
};

export { openModal, closeModal, closeAllModals, modals, Modals, onBeforeClose };
