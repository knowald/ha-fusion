<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import type { SortableEvent } from 'sortablejs';
	import type { Shape, ShapeConfig } from 'konva/lib/Shape';
	import type { KonvaEditor } from '$lib/Modal/PictureElements/konvaEditor';
	import { konvaStore } from '$lib/Stores';
	import Icon, { getIcon, loadIcon } from '@iconify/svelte';
	import { tick } from 'svelte';
	import { dragging } from '$lib/Stores';
	import { icons } from '$lib/Modal/PictureElements/icons';
	import { derived } from 'svelte/store';

	let { konva, selectedShape, selectedShapes }: {
		konva: KonvaEditor;
		selectedShape: ShapeConfig;
		selectedShapes: ShapeConfig[];
	} = $props();

	let editingId: string | undefined = $state(undefined);
	let dragStartOrder: string[] | undefined = $state(undefined);

	let layers: any[] = $state([]);

	$effect(() => {
		layers = $uiLayers?.children
			? [...$uiLayers.children].reverse().map((shape: any, index: number) => ({
					...shape,
					id: shape?.attrs?.id || `layer-${index}`
				}))
			: [];
	});

	// derived store that only updates when not dragging
	const uiLayers: any = derived([konvaStore, dragging], ([$konvaStore, $dragging], set) => {
		if (!$dragging) set($konvaStore);
	});

	function handleDragStart(evt: SortableEvent) {
		$dragging = true;
		dragStartOrder = [...$konvaStore.children].reverse().map((item) => item?.attrs?.id);

		const id = evt.item?.getAttribute('data-id');
		if (id && !selectedShapes.some((shape) => shape.attrs.id === id)) {
			konva.selectShapesById([id]);
		}
	}

	async function handleDragFinalize(items: any[], evt: SortableEvent) {
		const id = evt.item?.getAttribute('data-id');
		const selectedIds = selectedShapes.map((shape) => shape?.attrs?.id);
		const isDraggedItemSelected = id ? selectedIds.includes(id) : false;

		if (isDraggedItemSelected && dragStartOrder) {
			// move all selected items
			const selected = dragStartOrder
				.filter((sid) => selectedIds.includes(sid))
				.map((sid) => items.find((item) => item.id === sid))
				.filter((item) => item !== undefined);

			const notSelected = items.filter((item) => !selectedIds.includes(item.id));
			const draggedIndex = items.findIndex((item) => item.id === id);

			let newArrangement;
			if (draggedIndex < notSelected.length) {
				newArrangement = [
					...notSelected.slice(0, draggedIndex),
					...selected,
					...notSelected.slice(draggedIndex)
				];
			} else {
				newArrangement = [...notSelected, ...selected];
			}

			layers = newArrangement;

			await tick();
			konva.selectShapesById(selectedIds);
		} else {
			layers = items;

			await tick();
			if (id) konva.selectShapesById([id]);
		}

		konva.reorderElements(layers.map((layer) => layer?.id));

		// reset
		$dragging = false;
		dragStartOrder = undefined;
	}

	function handlePointerdown(event: MouseEvent) {
		if (!editingId) return;

		const currentInput = document.getElementById(editingId) as HTMLInputElement;
		if (currentInput && currentInput.contains(event.target as Node)) return;

		if (currentInput) {
			konva.updateAttr(editingId, 'name', currentInput.value);
		}

		editingId = undefined;
	}

	function handleKeydown(event: KeyboardEvent, shape: Shape) {
		const target = event.target as HTMLInputElement;

		if (event.key === 'Enter' || event.key === 'Tab') {
			konva.updateAttr(shape.attrs.id, 'name', target.value);
			editingId = undefined;
		}

		// escape undo
		else if (event.key === 'Escape') {
			target.value = shape?.attrs?.name;
			editingId = undefined;
		}
	}

	function handleImage(event: Event) {
		const image = event?.currentTarget as HTMLImageElement;
		const icon = image?.nextElementSibling as HTMLElement;
		const error = event?.type === 'error';

		image.style.display = error ? 'none' : 'block';
		icon.style.display = error ? 'block' : 'none';
	}

</script>

<svelte:document onpointerdown={handlePointerdown} />

<div class="konva-header">
	<div class="title">
		<Icon icon={icons['elements']} width="20" height="20" />

		<h3>Elements</h3>
	</div>

	<div class="right">
		<button
			title={selectedShape?.attrs?.draggable !== false ? 'Lock' : 'Unlock'}
			onclick={() => konva.toggleDraggable()}
			disabled={!selectedShape}
		>
			<Icon
				icon={icons?.[!selectedShape?.attrs?.draggable ? 'locked' : 'unlocked']}
				width="20"
				height="20"
			/>
		</button>

		<button title="Delete" onclick={() => konva.deleteSelected()} disabled={!selectedShape}>
			<Icon icon={icons?.['delete']} width="20" height="20" />
		</button>
	</div>
</div>

<div
	class="items"
	use:sortable={{
		animation: 0,
		group: { name: 'elements', pull: false, put: false },
		items: layers,
		onStart: handleDragStart,
		onFinalize: handleDragFinalize
	}}
>
	{#each layers as shape (shape.id)}
		{@const konvaStoreEquivalent = $konvaStore?.children?.find(
			(item) => item?.attrs?.id === shape?.attrs?.id
		)}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="item"
			data-id={shape.id}
			class:selected={selectedShapes?.some((node) => node?.attrs?.id === shape?.attrs?.id)}
			onclick={async (event) => {
				// blur any active attr input to trigger onchange before switching layer
				if (
					document?.activeElement instanceof HTMLInputElement ||
					document?.activeElement instanceof HTMLTextAreaElement
				) {
					document?.activeElement?.blur?.();
					await tick();
				}
				konva.handleElementClick(event, shape?.attrs?.id);
			}}
		>
			<!-- VISIBILITY -->
			<button
				class="visibility"
				title={shape?.attrs?.visible === false ? 'Show' : 'Hide'}
				onclick={(e) => { e.stopPropagation(); konva.toggleVisibility(shape?.attrs?.id); }}
			>
				<Icon
					icon={icons?.[shape?.attrs?.visible === false ? 'hidden' : 'visible']}
					width="20"
					height="20"
				/>
			</button>

			<!-- ICON -->
			<span class="icon">
				{#if shape?.attrs?.type === 'icon' || shape?.attrs?.type === 'state-icon'}
					{#if shape?.attrs?.type === 'state-icon' && !shape?.attrs?.entity_id}
						<Icon icon="mdi:lightbulb" width="20" height="20" />
					{:else if getIcon(konvaStoreEquivalent?.attrs?.icon) != null}
						<Icon icon={konvaStoreEquivalent?.attrs?.icon} width="20" height="20" />
					{:else}
						{#await loadIcon(konvaStoreEquivalent?.attrs?.icon)}
							<Icon icon={icons['broken']} width="20" height="20" />
						{:then iconName}
							<Icon icon={iconName} width="20" height="20" />
						{:catch}
							<Icon icon={icons['broken']} width="20" height="20" />
						{/await}
					{/if}
				{:else if shape?.attrs?.type === 'image'}
					<div class="thumbnail">
						<img
							src={konvaStoreEquivalent?.attrs?.src}
							alt=""
							width="20"
							height="20"
							onload={handleImage}
							onerror={handleImage}
						/>
						<Icon icon={icons?.['broken']} width="20" height="20" style="display: none;" />
					</div>
				{:else}
					<Icon icon={icons?.[shape?.attrs?.type]} width="20" height="20" />
				{/if}
			</span>

			<!-- NAME -->
			{#if editingId === shape?.id}
				<!-- svelte-ignore a11y-autofocus -->
				<input
					id={shape?.id}
					type="text"
					class="editable"
					value={shape?.attrs?.name}
					onkeydown={(event) => handleKeydown(event, shape)}
					onblur={() => (editingId = undefined)}
					onclick={(e) => e.stopPropagation()}
					autofocus={true}
				/>
			{:else}
				<span class="name editable" ondblclick={() => (editingId = shape?.id)}>
					{shape?.attrs?.name}
				</span>
			{/if}

			<!-- INLINE LOCK -->
			{#if !shape?.attrs?.draggable}
				<button
					class="inline-lock"
					title="Unlock"
					onclick={(e) => { e.stopPropagation(); konva.toggleDraggable(shape?.attrs?.id); }}
				>
					<Icon icon={icons['locked']} width="20" height="20" />
				</button>
			{/if}
		</div>
	{/each}
</div>

<style>
	.konva-header {
		border-bottom: none;
	}

	.items {
		overflow-y: auto;
		overflow-x: hidden;
		height: 100%;
	}

	.item {
		padding: 0 0.46rem;
		display: grid;
		grid-template-columns: min-content min-content 1fr min-content;
		align-items: center;
		border-top: 1px solid rgba(0, 0, 0, 0.25);
		height: 3rem;
	}

	.item.selected {
		background-color: rgba(255, 255, 255, 0.1);
		border-top: 1px solid rgba(0, 0, 0, 0.35);
	}

	.icon {
		display: flex;
		margin-right: 0.4rem;
		margin-left: 0.6rem;
	}

	.thumbnail {
		width: 20px;
		height: 20px;
		overflow: hidden;
		border-radius: 0.15rem;
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.name {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		border: 1px solid transparent;
	}

	input {
		background-color: rgba(0, 0, 0, 0.35);
		border: 1px solid transparent;
		border-radius: 0.25rem;
		color: inherit;
	}

	.editable {
		font-size: inherit;
		font-family: inherit;
		padding: 0.25rem 0.45rem;
		margin: 0;
		width: 100%;
	}

	.visibility,
	.inline-lock {
		all: unset;
		background-color: transparent;
		border: none;
		cursor: pointer;
		display: flex;
		border-radius: 0.4rem;
		width: 2rem;
		aspect-ratio: 1 / 1;
		justify-content: center;
		align-items: center;
	}

	.visibility:hover,
	.inline-lock:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	:global(.sortable-ghost) {
		opacity: 0.4;
	}
</style>
