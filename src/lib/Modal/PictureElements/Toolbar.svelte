<script lang="ts">
	import type { KonvaEditor } from '$lib/Modal/PictureElements/konvaEditor';
	import { konvaStore } from '$lib/Stores';
	import Icon from '@iconify/svelte';
	import { icons } from '$lib/Modal/PictureElements/icons';

	let { konva }: { konva: KonvaEditor } = $props();
</script>

<button
	title="Select (V), Double-click to Deselect All"
	onclick={() => konva.setMode('default')}
	ondblclick={() => {
		konva.deselectAll();
		if ($konvaStore?.selectedShapes) {
			$konvaStore.selectedShapes = [];
		}
	}}
	class:selected={$konvaStore?.mode === 'default'}
>
	<Icon icon={icons?.['default']} width="15" height="15" />
</button>

<button
	title="Pan (H), Double-click to Fit Canvas"
	onclick={() => konva.setMode('pan')}
	ondblclick={() => konva.fitCanvas()}
	class:selected={$konvaStore?.mode === 'pan'}
>
	<Icon icon={icons?.['pan']} width="15" height="15" />
</button>

<button
	title="Zoom (Z), Double-click to Reset Zoom"
	onclick={() => konva.setMode('zoom')}
	ondblclick={() => {
		konva.setZoom('reset', {
			x: konva.stage.width() / 2,
			y: konva.stage.height() / 2
		});
	}}
	class:selected={$konvaStore?.mode === 'zoom'}
>
	<Icon icon={icons?.['zoom']} width="15" height="15" />
</button>

<span class="divider"></span>

<button title="Add New State Label" onclick={() => konva.addStateLabel()}>
	<Icon icon={icons?.['state-label']} width="18" height="18" />
</button>

<button title="Add New State Icon" onclick={() => konva.addStateIcon()}>
	<Icon icon={icons?.['state-icon']} width="20" height="20" />
</button>

<span class="divider"></span>

<button title="Add New Text" onclick={() => konva.addText()}>
	<Icon icon={icons?.['text']} width="20" height="20" />
</button>

<button title="Add New Icon" onclick={() => konva.addIcon()}>
	<Icon icon={icons?.['icon']} width="18" height="18" />
</button>

<button title="Add New Image" onclick={() => konva.addImage()}>
	<Icon icon={icons?.['image']} width="18" height="18" />
</button>

<button title="Add New Rectangle" onclick={() => konva.addRectangle()}>
	<Icon icon={icons?.['rectangle']} width="18" height="18" />
</button>

<button title="Add New Circle" onclick={() => konva.addCircle()}>
	<Icon icon={icons?.['circle']} width="18" height="18" />
</button>

<span class="divider"></span>

<button title="Add New Vertical Guide" onclick={() => konva.addVerticalGuide()}>
	<Icon icon={icons?.['v-guide']} width="16" height="16" />
</button>

<button title="Add New Horizontal Guide" onclick={() => konva.addHorizontalGuide()}>
	<Icon icon={icons?.['h-guide']} width="16" height="16" />
</button>

<style>
	button {
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
		margin-left: 1px;
	}

	.divider {
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
		border-top: 1px solid rgba(0, 0, 0, 0.15);
		height: 2px;
		width: 1.3rem;
		margin: 0.45rem;
	}

	button:hover:not(.selected) {
		background-color: rgba(255, 255, 255, 0.1);
	}

	button:active {
		background-color: rgba(0, 0, 0, 0.1) !important;
	}

	.selected {
		background-color: rgba(0, 0, 0, 0.35);
	}
</style>
