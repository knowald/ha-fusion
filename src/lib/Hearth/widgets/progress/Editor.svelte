<script lang="ts">
	import { lang, fill } from '$lib/core/i18n';
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
		<TextField label={$lang('name')} bind:value={name} placeholder="Washer" />
	</div>
	<div class="icon-column">
		<IconField label={$lang('icon')} bind:value={icon} placeholder="local_laundry_service" />
	</div>
</div>
<EntityField label={$lang('hearth_status_entity')} bind:value={statusEntity} />
<EntityField label={$lang('hearth_progress_entity_0_100_optional')} bind:value={progressEntity} />
<TextField
	label={$lang('hearth_progress_unit_optional_shows_the_value')}
	bind:value={unit}
	placeholder="%"
/>
<EntityField
	label={$lang('hearth_remaining_time_entity_minutes_or_timestamp')}
	bind:value={remainingEntity}
/>
<TextField
	label={$lang('hearth_active_states_comma_separated_optional')}
	bind:value={activeStates}
	placeholder="running, rinse, spin"
/>
<TextField
	label={$lang('hearth_completed_states_comma_separated')}
	bind:value={completedStates}
	placeholder="complete, completed, finished, done"
/>
<SelectField
	label={$lang('hearth_after_completion')}
	bind:value={completionDelay}
	options={[
		{ value: '0', label: $lang('hearth_hide_immediately') },
		{ value: '5', label: fill($lang('hearth_hide_after_minutes'), { minutes: '5' }) },
		{ value: '15', label: fill($lang('hearth_hide_after_minutes'), { minutes: '15' }) },
		{ value: '30', label: fill($lang('hearth_hide_after_minutes'), { minutes: '30' }) },
		{ value: '60', label: $lang('hearth_hide_after_1_hour') },
		{ value: '-1', label: $lang('hearth_keep_until_tapped') }
	]}
/>
<div class="hint">
	{$lang('hearth_completed_rows_can_be_tapped_to')}
</div>
