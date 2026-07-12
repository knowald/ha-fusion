<script lang="ts">
	import { get } from 'svelte/store';
	import { moveItem, slugify, uniqueId } from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import TextField from './TextField.svelte';

	let { id }: { id: string | null } = $props();

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = id ? get(hearthConfig).lights.find((entry) => entry.id === id) : undefined;
	let name = $state(initial?.name ?? '');
	let entity = $state(initial?.entity ?? '');

	function close() {
		editor.set(null);
	}

	function done() {
		updateConfig((config) => {
			if (id) {
				const light = config.lights.find((entry) => entry.id === id);
				if (light) {
					light.name = name.trim();
					light.entity = entity.trim();
				}
			} else {
				const newId = uniqueId(
					slugify(name),
					config.lights.map((entry) => entry.id)
				);
				config.lights.push({ id: newId, name: name.trim(), entity: entity.trim() });
			}
		});
		close();
	}

	function remove() {
		updateConfig((config) => {
			config.lights = config.lights.filter((entry) => entry.id !== id);
			for (const room of config.rooms) {
				room.lights = room.lights.filter((entry) => entry !== id);
			}
		});
		close();
	}

	function move(delta: number) {
		updateConfig((config) =>
			moveItem(
				config.lights,
				config.lights.findIndex((entry) => entry.id === id),
				delta
			)
		);
	}
</script>

<EditSheet
	title={id ? 'Edit light' : 'Add light'}
	onclose={close}
	ondone={done}
	doneDisabled={!name.trim() || !entity.trim()}
	onremove={id ? remove : undefined}
	onmoveup={id ? () => move(-1) : undefined}
	onmovedown={id ? () => move(1) : undefined}
>
	<TextField label="Name" bind:value={name} placeholder="Living Room" />
	<EntityField label="Entity" bind:value={entity} domains={['light']} />
</EditSheet>
