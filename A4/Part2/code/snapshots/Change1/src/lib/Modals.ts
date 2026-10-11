import {
	openModal as openModalStrict,
	closeModal,
	closeAllModals,
	modals,
	Modals,
	onBeforeClose
} from 'svelte-modals/legacy';

/**
 * svelte-modals types require modal components to declare the full ModalProps
 * interface (id, index, close, isOpen). Our modal components only declare the
 * props they use, which makes every `openModal(() => import(...))` call fail
 * type inference. Loosen the signature here instead of widening 100+ call
 * sites; runtime behavior is unchanged.
 */
const openModal = openModalStrict as (
	component: (() => Promise<{ default: any }>) | any,
	props?: Record<string, any>,
	options?: { id?: string; replace?: boolean }
) => Promise<any>;

export { openModal, closeModal, closeAllModals, modals, Modals, onBeforeClose };
