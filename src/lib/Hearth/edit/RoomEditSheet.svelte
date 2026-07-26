<script lang="ts">
	import { get } from 'svelte/store';
	import { moveItem, resizeCardColumns, slugify, uniqueId } from '../config';
	import { currentRoom, editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import IconField from './IconField.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';

	let { id }: { id: string | null } = $props();

	const config = get(hearthConfig);
	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = id ? config.rooms.find((entry) => entry.id === id) : undefined;

	let name = $state(initial?.name ?? '');
	let icon = $state(initial?.icon ?? 'weekend');
	let summary = $state(initial?.summary ?? '');
	let tempEntity = $state(initial?.temp_entity ?? '');
	let humidityEntity = $state(initial?.humidity_entity ?? '');
	let hideHeader = $state(initial?.hide_header ?? false);
	let columns = $state(initial?.columns ? String(initial.columns) : '');

	function close() {
		editor.set(null);
	}

	function done() {
		const columnCount = parseInt(columns, 10);
		const roomColumns =
			Number.isFinite(columnCount) && columnCount >= 1 && columnCount <= 3
				? columnCount
				: undefined;
		updateConfig((next) => {
			if (id) {
				const room = next.rooms.find((entry) => entry.id === id);
				if (!room) return;
				room.name = name.trim();
				room.icon = icon.trim() || 'weekend';
				room.summary = summary.trim() || undefined;
				room.temp_entity = tempEntity.trim() || undefined;
				room.humidity_entity = humidityEntity.trim() || undefined;
				room.hide_header = hideHeader || undefined;
				room.columns = roomColumns;
				if (roomColumns !== undefined && room.cards?.length && room.cards.length !== roomColumns) {
					room.cards = resizeCardColumns(room.cards, roomColumns);
				}
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
					hide_header: hideHeader || undefined,
					columns: roomColumns,
					cards: Array.from({ length: roomColumns ?? 1 }, () => [])
				});
			}
		});
		close();
	}

	function remove() {
		let fallback = '';
		updateConfig((next) => {
			next.rooms = next.rooms.filter((entry) => entry.id !== id);
			fallback = next.rooms[0]?.id ?? '';
		});
		if (get(currentRoom) === id) currentRoom.set(fallback);
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
	title={id ? 'Edit page' : 'Add page'}
	onclose={close}
	ondone={done}
	doneDisabled={!name.trim()}
	onremove={id && $hearthConfig.rooms.length > 1 ? remove : undefined}
	onmoveup={id ? () => move(-1) : undefined}
	onmovedown={id ? () => move(1) : undefined}
>
	<TextField label="Name" bind:value={name} placeholder="Living Room" />
	<IconField label="Icon" bind:value={icon} placeholder="weekend" />
	<TextField label="Summary" bind:value={summary} placeholder="Cozy · curtains open" />
	<EntityField label="Temperature sensor" bind:value={tempEntity} domains={['sensor']} />
	<EntityField label="Humidity sensor" bind:value={humidityEntity} domains={['sensor']} />
	<SelectField
		label="Page columns"
		bind:value={columns}
		options={[
			{ value: '', label: 'Auto' },
			{ value: '1', label: '1 column' },
			{ value: '2', label: '2 columns' },
			{ value: '3', label: '3 columns' }
		]}
	/>

	<label class="check">
		<input type="checkbox" bind:checked={hideHeader} />
		<span>Hide page header</span>
	</label>
	<div class="hint">
		Everything on the page is a card: add, move and edit its groups from the page itself.
		{#if id && $hearthConfig.rooms.length === 1}
			This is the last page, so it cannot be removed.
		{/if}
	</div>
</EditSheet>

<style>
	.hint {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 6px 0 2px;
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
