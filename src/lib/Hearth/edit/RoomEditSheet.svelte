<script lang="ts">
	import { integerFromInput } from './numbers';
	import { lang } from '$lib/core/i18n';
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
	let icon = $state(initial?.icon ?? 'meeting_room');
	let summary = $state(initial?.summary ?? '');
	let tempEntity = $state(initial?.temp_entity ?? '');
	let humidityEntity = $state(initial?.humidity_entity ?? '');
	let hideHeader = $state(initial?.hide_header ?? false);
	let fillScreen = $state(initial?.fill_screen ? 'fill' : 'scroll');
	let columns = $state(initial?.columns ? String(initial.columns) : '');

	function close() {
		editor.set(null);
	}

	function done() {
		const columnCount = integerFromInput(columns);
		const roomColumns =
			Number.isFinite(columnCount) && columnCount >= 1 && columnCount <= 3
				? columnCount
				: undefined;
		updateConfig((next) => {
			if (id) {
				const room = next.rooms.find((entry) => entry.id === id);
				if (!room) return;
				room.name = name.trim();
				room.icon = icon.trim() || 'meeting_room';
				room.summary = summary.trim() || undefined;
				room.temp_entity = tempEntity.trim() || undefined;
				room.humidity_entity = humidityEntity.trim() || undefined;
				room.hide_header = hideHeader || undefined;
				room.fill_screen = fillScreen === 'fill' || undefined;
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
					icon: icon.trim() || 'meeting_room',
					summary: summary.trim() || undefined,
					temp_entity: tempEntity.trim() || undefined,
					humidity_entity: humidityEntity.trim() || undefined,
					hide_header: hideHeader || undefined,
					fill_screen: fillScreen === 'fill' || undefined,
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
	title={$lang(id ? 'hearth_edit_page' : 'hearth_add_page')}
	onclose={close}
	ondone={done}
	doneDisabled={!name.trim()}
	onremove={id && $hearthConfig.rooms.length > 1 ? remove : undefined}
	onmoveup={id ? () => move(-1) : undefined}
	onmovedown={id ? () => move(1) : undefined}
>
	<TextField label={$lang('name')} bind:value={name} placeholder="Living Room" />
	<IconField label={$lang('icon')} bind:value={icon} placeholder="meeting_room" />
	<TextField label={$lang('summary')} bind:value={summary} placeholder="Cozy · curtains open" />
	<EntityField
		label={$lang('hearth_temperature_sensor')}
		bind:value={tempEntity}
		domains={['sensor']}
	/>
	<EntityField
		label={$lang('hearth_humidity_sensor')}
		bind:value={humidityEntity}
		domains={['sensor']}
	/>
	<SelectField
		label={$lang('hearth_screen_height')}
		bind:value={fillScreen}
		options={[
			{ value: 'scroll', label: $lang('hearth_scrollable_default') },
			{ value: 'fill', label: $lang('hearth_fill_the_screen') }
		]}
	/>
	{#if fillScreen === 'fill'}
		<div class="hint">
			{$lang('hearth_media_and_sensor_cards_without_a')}
		</div>
	{/if}
	<SelectField
		label={$lang('hearth_page_columns')}
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
		<span>{$lang('hearth_hide_page_header')}</span>
	</label>
	<div class="hint">
		{$lang('hearth_everything_on_the_page_is_a')}
		{#if id && $hearthConfig.rooms.length === 1}
			{$lang('hearth_this_is_the_last_page_so')}
		{/if}
	</div>
</EditSheet>

<style>
	.hint {
		font-size: var(--h-type-small);
		color: var(--h-text-6);
		margin: 6px 0 2px;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: var(--h-type-body);
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
