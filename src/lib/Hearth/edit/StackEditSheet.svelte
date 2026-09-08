<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { get } from 'svelte/store';
	import { isStack, type HearthConfig, type OverviewStack } from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';

	let { roomId, column, index }: { roomId: string; column: number; index: number } = $props();

	function columnItems(config: HearthConfig) {
		return config.rooms.find((entry) => entry.id === roomId)?.cards?.[column];
	}

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initialItem = columnItems(get(hearthConfig))?.[index];
	const initial = initialItem && isStack(initialItem) ? initialItem : undefined;

	let title = $state(initial?.title ?? '');
	let direction = $state<OverviewStack['direction']>(initial?.direction ?? 'horizontal');
	let fill = $state<string>(typeof initial?.fill === 'number' ? String(initial.fill) : '');

	let DIRECTION_OPTIONS: { value: OverviewStack['direction']; label: string }[] = $derived([
		{ value: 'horizontal', label: $lang('horizontal') },
		{ value: 'vertical', label: $lang('vertical') }
	]);

	function close() {
		editor.set(null);
	}

	function done() {
		updateConfig((config) => {
			const target = columnItems(config)?.[index];
			if (!target || !isStack(target)) return;
			target.title = title.trim() || undefined;
			target.direction = direction;
			const fillValue = fill === '' ? undefined : Number(fill);
			target.fill = Number.isFinite(fillValue as number) ? fillValue : undefined;
		});
		close();
	}

	// unwrap: the stack disappears but its children move up into the column
	// at the stack's position - they are never destroyed
	function unwrap() {
		updateConfig((config) => {
			const items = columnItems(config);
			const target = items?.[index];
			if (!items || !target || !isStack(target)) return;
			items.splice(index, 1, ...target.cards);
		});
		close();
	}
</script>

<EditSheet
	title={$lang('hearth_edit_stack')}
	onclose={close}
	ondone={done}
	onremove={unwrap}
	removeLabel={$lang('hearth_unwrap')}
>
	<TextField label={$lang('hearth_title_optional')} bind:value={title} placeholder="Living room" />
	<SelectField label={$lang('fan_direction')} bind:value={direction} options={DIRECTION_OPTIONS} />
	<SelectField
		label={$lang('hearth_fill_leftover_height')}
		bind:value={fill}
		options={[
			{ value: '', label: $lang('hearth_fill_none') },
			{ value: '1', label: $lang('hearth_fill_one') },
			{ value: '2', label: $lang('hearth_fill_double') },
			{ value: '3', label: $lang('hearth_fill_triple') }
		]}
	/>
</EditSheet>
