<script lang="ts">
	import { get } from 'svelte/store';
	import { moveItem, type HearthDevice } from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import IconField from './IconField.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';

	let { roomId, index }: { roomId: string; index: number | null } = $props();

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial =
		index !== null
			? get(hearthConfig).rooms.find((room) => room.id === roomId)?.devices[index]
			: undefined;

	let type = $state<HearthDevice['type']>(initial?.type ?? 'switch');
	let name = $state(initial?.name ?? '');
	let entity = $state(initial?.entity ?? '');
	let icon = $state(initial?.icon ?? 'toggle_on');
	let unit = $state(initial?.type === 'sensor' ? (initial.unit ?? '') : '%');
	let readonly = $state(initial?.type === 'switch' ? !!initial.readonly : false);

	let entityDomains = $derived(type === 'fan' ? ['fan'] : type === 'sensor' ? ['sensor'] : []);

	function close() {
		editor.set(null);
	}

	function buildDevice(): HearthDevice {
		const base = { entity: entity.trim(), name: name.trim(), icon: icon.trim() || 'toggle_on' };
		if (type === 'fan') return { type, ...base };
		if (type === 'sensor') return { type, ...base, unit: unit.trim() || undefined };
		if (type === 'entity') return { type, ...base, icon: icon.trim() || undefined };
		return { type: 'switch', ...base, readonly: readonly || undefined };
	}

	function done() {
		updateConfig((config) => {
			const room = config.rooms.find((entry) => entry.id === roomId);
			if (!room) return;
			if (index !== null) room.devices[index] = buildDevice();
			else room.devices.push(buildDevice());
		});
		close();
	}

	function remove() {
		updateConfig((config) => {
			const room = config.rooms.find((entry) => entry.id === roomId);
			if (room && index !== null) room.devices.splice(index, 1);
		});
		close();
	}

	function move(delta: number) {
		if (index === null) return;
		updateConfig((config) => {
			const room = config.rooms.find((entry) => entry.id === roomId);
			if (room) moveItem(room.devices, index, delta);
		});
		editor.set({ kind: 'device', roomId, index: index + delta });
	}
</script>

<EditSheet
	title={index !== null ? 'Edit device' : 'Add device'}
	onclose={close}
	ondone={done}
	doneDisabled={!name.trim() || !entity.trim()}
	onremove={index !== null ? remove : undefined}
	onmoveup={index !== null ? () => move(-1) : undefined}
	onmovedown={index !== null ? () => move(1) : undefined}
>
	<SelectField
		label="Type"
		bind:value={type}
		options={[
			{ value: 'switch', label: 'Switch (toggle on tap)' },
			{ value: 'fan', label: 'Fan (speed popup)' },
			{ value: 'sensor', label: 'Sensor (display only)' },
			{ value: 'entity', label: 'Any entity (toggle or open details)' }
		]}
	/>
	<TextField label="Name" bind:value={name} placeholder="Television" />
	<EntityField label="Entity" bind:value={entity} domains={entityDomains} />
	<IconField label="Icon" bind:value={icon} placeholder="tv" />
	{#if type === 'sensor'}
		<TextField label="Unit" bind:value={unit} placeholder="%" />
	{/if}
	{#if type === 'switch'}
		<label class="check">
			<input type="checkbox" bind:checked={readonly} />
			<span>Read-only (show state, no toggling)</span>
		</label>
	{/if}
</EditSheet>

<style>
	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--h-text-3);
		margin-bottom: 14px;
		cursor: pointer;
	}

	.check input {
		accent-color: var(--h-accent-deep);
		width: 16px;
		height: 16px;
	}
</style>
