import Sortable from 'sortablejs';
import type { Options as SortableOptions, SortableEvent, GroupOptions } from 'sortablejs';
import type { ActionReturn } from 'svelte/action';

// Alt-drag clone: SortableJS's onEnd/onAdd events don't reliably expose which
// modifier keys were held at drop time, so track Alt via window listeners
// into a module-level flag instead.
let altPressed = false;
if (typeof window !== 'undefined') {
	window.addEventListener('keydown', (event) => {
		if (event.key === 'Alt') altPressed = true;
	});
	window.addEventListener('keyup', (event) => {
		if (event.key === 'Alt') altPressed = false;
	});
	// alt-tabbing away mid-drag would otherwise leave the flag stuck on
	window.addEventListener('blur', () => {
		altPressed = false;
	});
}

export interface DndOptions {
	group: string | GroupOptions;
	animation?: number;
	disabled?: boolean;
	ghostClass?: string;
	chosenClass?: string;
	dragClass?: string;
	handle?: string;
	filter?: string;
	fallbackOnBody?: boolean;
	swapThreshold?: number;
	direction?: 'vertical' | 'horizontal';
	/** Called when drag starts */
	onStart?: (evt: SortableEvent) => void;
	/**
	 * Called when drag ends with the reordered items array.
	 * For cross-zone moves, called on the target zone with items including the new element.
	 */
	onFinalize: (newItems: any[], evt: SortableEvent) => void;
	/** Called on the source zone when an item is moved to another zone */
	onRemove?: (removedId: string, evt: SortableEvent) => void;
	/** Attribute on child elements that holds the item ID. Defaults to 'data-id'. */
	idAttr?: string;
	/** The current items array - needed to map DOM order back to data */
	items: any[];
	/** Key on each item that holds its unique ID. Defaults to 'id'. */
	itemKey?: string;
	/** When true, dropping while Alt is held duplicates the item instead of moving it. */
	clone?: boolean;
	/** Transform run on the duplicate produced by an Alt-drop, e.g. to assign it a fresh id. */
	cloneItem?: (item: any) => any;
}

function getItemId(el: Element, idAttr: string): string {
	return el.getAttribute(idAttr) ?? '';
}

/**
 * Where a dragged element must be restored to. Svelte 5 tracks each-item
 * fragments including their comment anchors, so the revert has to put the
 * element back at its exact original node position (comments included) -
 * restoring by element index can land it on the wrong side of an anchor,
 * which corrupts the each block's fragment ranges and makes every later
 * keyed reorder silently skip the DOM move.
 */
const dragOrigin = new WeakMap<Element, { parent: Node; next: Node | null }>();

function revertToOrigin(draggedEl: Element) {
	const origin = dragOrigin.get(draggedEl);
	if (!origin) return;
	origin.parent.insertBefore(
		draggedEl,
		origin.next && origin.next.parentNode === origin.parent ? origin.next : null
	);
}

export function sortable(node: HTMLElement, options: DndOptions): ActionReturn<DndOptions> {
	const idAttr = options.idAttr ?? 'data-id';
	const itemKey = options.itemKey ?? 'id';

	// Reads the outer `options` variable (not a captured param) so callbacks
	// always see the latest items/handlers after update() reassigns it. The
	// dashboard deep-clones item arrays on every drag end, so a stale closure
	// here would splice against outdated data and reorder incorrectly.
	function buildSortableOptions(): SortableOptions {
		return {
			group: options.group,
			animation: options.animation ?? 150,
			disabled: options.disabled ?? false,
			ghostClass: options.ghostClass ?? 'sortable-ghost',
			chosenClass: options.chosenClass ?? 'sortable-chosen',
			dragClass: options.dragClass ?? 'sortable-drag',
			handle: options.handle,
			filter: options.filter,
			fallbackOnBody: options.fallbackOnBody ?? true,
			swapThreshold: options.swapThreshold ?? 0.65,
			direction: options.direction,

			onStart(evt: SortableEvent) {
				dragOrigin.set(evt.item, {
					parent: evt.item.parentNode as Node,
					next: evt.item.nextSibling
				});
				options.onStart?.(evt);
			},

			onEnd(evt: SortableEvent) {
				const { from, to, item: draggedEl, oldIndex, newIndex } = evt;

				if (oldIndex == null || newIndex == null) return;

				const cloning = Boolean(options.clone && altPressed);

				if (from === to) {
					// Same container: revert SortableJS' DOM move so Svelte owns
					// rendering, then notify with the reordered items.
					revertToOrigin(draggedEl);

					const items = [...options.items];
					if (cloning) {
						// keep the source item at oldIndex and insert a duplicate at
						// the drop position; SortableJS computes newIndex after the
						// dragged element left its slot, so a forward drag needs +1
						// to land after the retained original
						const duplicate = options.cloneItem
							? options.cloneItem(items[oldIndex])
							: structuredClone(items[oldIndex]);
						items.splice(newIndex > oldIndex ? newIndex + 1 : newIndex, 0, duplicate);
					} else {
						const [moved] = items.splice(oldIndex, 1);
						items.splice(newIndex, 0, moved);
					}
					options.onFinalize(items, evt);
				} else {
					// Cross-container: the target zone's onAdd has already reverted
					// the DOM (moved draggedEl back to `from`), so it is no longer a
					// child of `to`. Touching the DOM here throws. Only notify the
					// source side; the target is handled via onAdd's dndreceive.
					const movedId = getItemId(draggedEl, idAttr);
					const movedItem = options.items.find((item) => String(item[itemKey]) === movedId);

					// when cloning, the source keeps its item - only the target
					// side (onAdd) inserts a duplicate
					if (movedItem && !cloning) {
						options.onRemove?.(movedId, evt);
					}
				}
			},

			onAdd(evt: SortableEvent) {
				// An item was added from another container
				const { item: draggedEl, newIndex } = evt;

				if (newIndex == null) return;

				// Revert DOM - put element back to its exact source position so
				// Svelte manages rendering
				revertToOrigin(draggedEl);

				// Read the item ID and find it in the source's data
				const movedId = getItemId(draggedEl, idAttr);

				// We need to insert this item into our items array at newIndex.
				// The actual item data must come from the source - we dispatch a
				// custom event so the consumer can coordinate.
				node.dispatchEvent(
					new CustomEvent('dndreceive', {
						detail: { id: movedId, newIndex, alt: Boolean(options.clone && altPressed) },
						bubbles: true
					})
				);
			}
		};
	}

	const instance = Sortable.create(node, buildSortableOptions());

	return {
		update(newOptions: DndOptions) {
			// Update mutable options without recreating instance
			if (newOptions.disabled !== options.disabled) {
				instance.option('disabled', newOptions.disabled ?? false);
			}
			if (newOptions.animation !== options.animation) {
				instance.option('animation', newOptions.animation ?? 150);
			}
			if (JSON.stringify(newOptions.group) !== JSON.stringify(options.group)) {
				instance.option('group', newOptions.group);
			}
			// Update the options reference so callbacks use fresh data
			options = newOptions;
		},
		destroy() {
			instance.destroy();
		}
	};
}
