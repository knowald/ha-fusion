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

function reorderItems(
	items: any[],
	itemKey: string,
	container: Element,
	idAttr: string
): any[] {
	const domIds = Array.from(container.children)
		.map((el) => getItemId(el, idAttr))
		.filter((id) => id !== '');
	const itemMap = new Map(items.map((item) => [String(item[itemKey]), item]));
	return domIds.map((id) => itemMap.get(id)).filter((item): item is any => item != null);
}

export function sortable(node: HTMLElement, options: DndOptions): ActionReturn<DndOptions> {
	const idAttr = options.idAttr ?? 'data-id';
	const itemKey = options.itemKey ?? 'id';

	function buildSortableOptions(opts: DndOptions): SortableOptions {
		return {
			group: opts.group,
			animation: opts.animation ?? 150,
			disabled: opts.disabled ?? false,
			ghostClass: opts.ghostClass ?? 'sortable-ghost',
			chosenClass: opts.chosenClass ?? 'sortable-chosen',
			dragClass: opts.dragClass ?? 'sortable-drag',
			handle: opts.handle,
			filter: opts.filter,
			fallbackOnBody: opts.fallbackOnBody ?? true,
			swapThreshold: opts.swapThreshold ?? 0.65,
			direction: opts.direction,

			onStart(evt: SortableEvent) {
				opts.onStart?.(evt);
			},

			onEnd(evt: SortableEvent) {
				const { from, to, item: draggedEl, oldIndex, newIndex } = evt;

				if (oldIndex == null || newIndex == null) return;

				// Revert DOM to pre-drag state so Svelte owns rendering.
				// SortableJS has already moved the DOM element - put it back.
				if (from === to) {
					// Same container: revert the move
					to.removeChild(draggedEl);
					to.insertBefore(draggedEl, to.children[oldIndex] ?? null);
				} else {
					// Cross-container: put element back in source
					to.removeChild(draggedEl);
					from.insertBefore(draggedEl, from.children[oldIndex] ?? null);
				}

				// Compute new item orders from the intended move
				if (from === to) {
					// Same-container reorder
					const items = [...opts.items];
					const [moved] = items.splice(oldIndex, 1);
					items.splice(newIndex, 0, moved);
					opts.onFinalize(items, evt);
				} else {
					// Cross-container move: notify target via onFinalize with new item added
					// The source will be notified via onRemove
					const movedId = getItemId(draggedEl, idAttr);
					const sourceItems = opts.items;
					const movedItem = sourceItems.find(
						(item) => String(item[itemKey]) === movedId
					);

					if (movedItem) {
						opts.onRemove?.(movedId, evt);
					}

					// Target zone's onFinalize is called by the target's Sortable instance,
					// not this one. We only handle source-side here.
					// For the target side, see the onAdd handler below.
				}
			},

			onAdd(evt: SortableEvent) {
				// An item was added from another container
				const { item: draggedEl, newIndex, from, to } = evt;

				if (newIndex == null) return;

				// Revert DOM - put element back to source so Svelte manages rendering
				to.removeChild(draggedEl);
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

	let instance = Sortable.create(node, buildSortableOptions(options));

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
