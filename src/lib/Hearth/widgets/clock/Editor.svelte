<script lang="ts">
	import { validTimeZone, type ClockHourFormat } from '../../clock';
	import type { WidgetEditorProps } from '../types';
	import type { ClockWidget } from './descriptor';
	import SelectField from '../../edit/SelectField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<ClockWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let timezone = $state(initial?.timezone ?? validTimeZone(initial?.city) ?? '');
	let hourFormat = $state<ClockHourFormat>(initial?.hour_format ?? 'auto');
	let showSeconds = $state(initial?.show_seconds ?? false);
	let timezoneValid = $derived(!timezone.trim() || !!validTimeZone(timezone));

	$effect(() => {
		onchange({
			fields: {
				timezone: validTimeZone(timezone),
				hour_format: hourFormat === 'auto' ? undefined : hourFormat,
				show_seconds: showSeconds || undefined
			},
			valid: timezoneValid
		});
	});
</script>

<TextField label="Time zone" bind:value={timezone} placeholder="Europe/Warsaw" />
{#if !timezoneValid}<div class="field-error">Use an IANA time zone such as Europe/Warsaw.</div>{/if}
<SelectField
	label="Hour format"
	bind:value={hourFormat}
	options={[
		{ value: 'auto', label: 'Locale default' },
		{ value: '12', label: '12 hour' },
		{ value: '24', label: '24 hour' }
	]}
/>
<label class="check"><input type="checkbox" bind:checked={showSeconds} /> Show seconds</label>
