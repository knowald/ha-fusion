<script lang="ts">
	import type { WidgetEditorProps } from '../types';
	import type { ProgressWidget } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import IconField from '../../edit/IconField.svelte';
	import SelectField from '../../edit/SelectField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<ProgressWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	const DEFAULT_COMPLETED = ['complete', 'completed', 'finished', 'done'];

	let name = $state(initial?.name ?? '');
	let icon = $state(initial?.icon ?? '');
	let statusEntity = $state(initial?.status_entity ?? '');
	let progressEntity = $state(initial?.progress_entity ?? '');
	let unit = $state(initial?.unit ?? '');
	let remainingEntity = $state(initial?.remaining_entity ?? '');
	let activeStates = $state((initial?.active_states ?? []).join(', '));
	let completedStates = $state((initial?.completed_states ?? DEFAULT_COMPLETED).join(', '));
	let completionDelay = $state(String(initial?.completion_delay_minutes ?? 15));

	function list(value: string) {
		return value
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean);
	}

	$effect(() => {
		const parsedActive = list(activeStates);
		const parsedCompleted = list(completedStates);
		onchange({
			fields: {
				name: name.trim() || undefined,
				icon: icon.trim() || undefined,
				status_entity: statusEntity.trim() || undefined,
				progress_entity: progressEntity.trim() || undefined,
				unit: unit.trim() || undefined,
				remaining_entity: remainingEntity.trim() || undefined,
				active_states: parsedActive.length ? parsedActive : undefined,
				completed_states: parsedCompleted.length ? parsedCompleted : undefined,
				completion_delay_minutes: Number(completionDelay)
			}
		});
	});
</script>

<div class="row">
	<div class="grow">
		<TextField label="Name" bind:value={name} placeholder="Washer" />
	</div>
	<div class="icon-column">
		<IconField label="Icon" bind:value={icon} placeholder="local_laundry_service" />
	</div>
</div>
<EntityField label="Status entity" bind:value={statusEntity} />
<EntityField label="Progress entity (0-100, optional)" bind:value={progressEntity} />
<TextField
	label="Progress unit (optional, shows the value with this suffix)"
	bind:value={unit}
	placeholder="%"
/>
<EntityField
	label="Remaining time entity (minutes or timestamp, optional)"
	bind:value={remainingEntity}
/>
<TextField
	label="Active states (comma separated, optional)"
	bind:value={activeStates}
	placeholder="running, rinse, spin"
/>
<TextField
	label="Completed states (comma separated)"
	bind:value={completedStates}
	placeholder="complete, completed, finished, done"
/>
<SelectField
	label="After completion"
	bind:value={completionDelay}
	options={[
		{ value: '0', label: 'Hide immediately' },
		{ value: '5', label: 'Hide after 5 minutes' },
		{ value: '15', label: 'Hide after 15 minutes' },
		{ value: '30', label: 'Hide after 30 minutes' },
		{ value: '60', label: 'Hide after 1 hour' },
		{ value: '-1', label: 'Keep until tapped' }
	]}
/>
<div class="hint">
	Completed rows can be tapped to dismiss early. Without an explicit active-state list, common idle
	states (idle, off, standby, docked, ...) hide the row.
</div>
