<script lang="ts">
	import { get } from 'svelte/store';
	import { isStack, type OverviewStack } from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';

	let { column, index }: { column: number; index: number } = $props();

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initialItem = get(hearthConfig).overview[column]?.[index];
	const initial = initialItem && isStack(initialItem) ? initialItem : undefined;

	let title = $state(initial?.title ?? '');
	let direction = $state<OverviewStack['direction']>(initial?.direction ?? 'horizontal');

	const DIRECTION_OPTIONS: { value: OverviewStack['direction']; label: string }[] = [
		{ value: 'horizontal', label: 'Horizontal' },
		{ value: 'vertical', label: 'Vertical' }
	];

	function close() {
		editor.set(null);
	}

	function done() {
		updateConfig((config) => {
			const target = config.overview[column]?.[index];
			if (!target || !isStack(target)) return;
			target.title = title.trim() || undefined;
			target.direction = direction;
		});
		close();
	}

	// unwrap: the stack disappears but its children move up into the column
	// at the stack's position - they are never destroyed
	function unwrap() {
		updateConfig((config) => {
			const target = config.overview[column]?.[index];
			if (!target || !isStack(target)) return;
			config.overview[column].splice(index, 1, ...target.cards);
		});
		close();
	}
</script>

<EditSheet title="Edit stack" onclose={close} ondone={done} onremove={unwrap} removeLabel="Unwrap">
	<TextField label="Title (optional)" bind:value={title} placeholder="Living room" />
	<SelectField label="Direction" bind:value={direction} options={DIRECTION_OPTIONS} />
</EditSheet>
