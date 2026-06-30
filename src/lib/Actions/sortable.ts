import Sortable from 'sortablejs';
import type { Options as SortableOptions, SortableEvent, GroupOptions } from 'sortablejs';
import type { ActionReturn } from 'svelte/action';

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
}

function getItemId(el: Element, idAttr: string): string {
	return el.getAttribute(idAttr) ?? '';
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
				options.onStart?.(evt);
			},

			onEnd(evt: SortableEvent) {
				const { from, to, item: draggedEl, oldIndex, newIndex } = evt;

				if (oldIndex == null || newIndex == null) return;

				if (from === to) {
					// Same container: revert SortableJS' DOM move so Svelte owns
					// rendering, then notify with the reordered items.
					if (draggedEl.parentNode === to) to.removeChild(draggedEl);
					to.insertBefore(draggedEl, to.children[oldIndex] ?? null);

					const items = [...options.items];
					const [moved] = items.splice(oldIndex, 1);
					items.splice(newIndex, 0, moved);
					options.onFinalize(items, evt);
				} else {
					// Cross-container: the target zone's onAdd has already reverted
					// the DOM (moved draggedEl back to `from`), so it is no longer a
					// child of `to`. Touching the DOM here throws. Only notify the
					// source side; the target is handled via onAdd's dndreceive.
					const movedId = getItemId(draggedEl, idAttr);
					const movedItem = options.items.find((item) => String(item[itemKey]) === movedId);

					if (movedItem) {
						options.onRemove?.(movedId, evt);
					}
				}
			},

			onAdd(evt: SortableEvent) {
				// An item was added from another container
				const { item: draggedEl, newIndex, from, to } = evt;

				if (newIndex == null) return;

				// Revert DOM - put element back to source so Svelte manages rendering
				if (draggedEl.parentNode === to) to.removeChild(draggedEl);
				from.appendChild(draggedEl);

				// Read the item ID and find it in the source's data
				const movedId = getItemId(draggedEl, idAttr);

				// We need to insert this item into our items array at newIndex.
				// The actual item data must come from the source - we dispatch a
				// custom event so the consumer can coordinate.
				node.dispatchEvent(
					new CustomEvent('dndreceive', {
						detail: { id: movedId, newIndex },
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
