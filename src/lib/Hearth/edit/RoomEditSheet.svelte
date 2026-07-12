<script lang="ts">
	import { get } from 'svelte/store';
	import { moveItem, slugify, uniqueId } from '../config';
	import { currentRoom, editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import IconField from './IconField.svelte';
	import TextField from './TextField.svelte';

	let { id }: { id: string | null } = $props();

	const config = get(hearthConfig);
	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = id ? config.rooms.find((entry) => entry.id === id) : undefined;
	const allLights = config.lights;
	const allBlinds = config.blinds;

	let name = $state(initial?.name ?? '');
	let icon = $state(initial?.icon ?? 'weekend');
	let summary = $state(initial?.summary ?? '');
	let tempEntity = $state(initial?.temp_entity ?? '');
	let humidityEntity = $state(initial?.humidity_entity ?? '');
	let selectedLights = $state<string[]>([...(initial?.lights ?? [])]);
	let selectedBlinds = $state<string[]>([...(initial?.blinds ?? [])]);

	function toggleSelection(list: string[], itemId: string) {
		const position = list.indexOf(itemId);
		if (position >= 0) list.splice(position, 1);
		else list.push(itemId);
	}

	function close() {
		editor.set(null);
	}

	function done() {
		updateConfig((next) => {
			const lights = next.lights
				.map((entry) => entry.id)
				.filter((entryId) => selectedLights.includes(entryId));
			const blinds = next.blinds
				.map((entry) => entry.id)
				.filter((entryId) => selectedBlinds.includes(entryId));
			if (id) {
				const room = next.rooms.find((entry) => entry.id === id);
				if (!room) return;
				room.name = name.trim();
				room.icon = icon.trim() || 'weekend';
				room.summary = summary.trim() || undefined;
				room.temp_entity = tempEntity.trim() || undefined;
				room.humidity_entity = humidityEntity.trim() || undefined;
				room.lights = lights;
				room.blinds = blinds;
			} else {
				next.rooms.push({
					id: uniqueId(
						slugify(name),
						next.rooms.map((entry) => entry.id)
					),
					name: name.trim(),
					icon: icon.trim() || 'weekend',
					summary: summary.trim() || undefined,
					temp_entity: tempEntity.trim() || undefined,
					humidity_entity: humidityEntity.trim() || undefined,
					lights,
					blinds,
					devices: []
				});
			}
		});
		close();
	}

	function remove() {
		updateConfig((next) => {
			next.rooms = next.rooms.filter((entry) => entry.id !== id);
		});
		if (get(currentRoom) === id) currentRoom.set('home');
		close();
	}

	function move(delta: number) {
		updateConfig((next) =>
			moveItem(
				next.rooms,
				next.rooms.findIndex((entry) => entry.id === id),
				delta
			)
		);
	}
</script>

<EditSheet
	title={id ? 'Edit room' : 'Add room'}
	onclose={close}
	ondone={done}
	doneDisabled={!name.trim()}
	onremove={id ? remove : undefined}
	onmoveup={id ? () => move(-1) : undefined}
	onmovedown={id ? () => move(1) : undefined}
>
	<TextField label="Name" bind:value={name} placeholder="Living Room" />
	<IconField label="Icon" bind:value={icon} placeholder="weekend" />
	<TextField label="Summary" bind:value={summary} placeholder="Cozy · curtains open" />
	<EntityField label="Temperature sensor" bind:value={tempEntity} domains={['sensor']} />
	<EntityField label="Humidity sensor" bind:value={humidityEntity} domains={['sensor']} />

	{#if allLights.length}
		<div class="group-label">LIGHTS IN THIS ROOM</div>
		{#each allLights as light (light.id)}
			<label class="check">
				<input
					type="checkbox"
					checked={selectedLights.includes(light.id)}
					onchange={() => toggleSelection(selectedLights, light.id)}
				/>
				<span>{light.name}</span>
			</label>
		{/each}
	{/if}

	{#if allBlinds.length}
		<div class="group-label">BLINDS IN THIS ROOM</div>
		{#each allBlinds as blind (blind.id)}
			<label class="check">
				<input
					type="checkbox"
					checked={selectedBlinds.includes(blind.id)}
					onchange={() => toggleSelection(selectedBlinds, blind.id)}
				/>
				<span>{blind.name}</span>
			</label>
		{/each}
	{/if}
</EditSheet>

<style>
	.group-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 18px 0 8px;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--h-text-3);
		padding: 6px 0;
		cursor: pointer;
	}

	.check input {
		accent-color: var(--h-accent-deep);
		width: 16px;
		height: 16px;
	}
</style>
