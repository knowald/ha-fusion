<script lang="ts">
	import type { WidgetEditorProps } from '../types';
	import type { CalendarWidget } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<CalendarWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let entities = $state((initial?.entities ?? []).join(', '));
	let travelEntity = $state(initial?.travel_entity ?? '');
	let lookaheadHours = $state(
		typeof initial?.lookahead_hours === 'number' ? String(initial.lookahead_hours) : ''
	);

	$effect(() => {
		const parsedHours = parseFloat(lookaheadHours);
		onchange({
			fields: {
				entities: entities
					.split(',')
					.map((entry) => entry.trim())
					.filter(Boolean),
				travel_entity: travelEntity.trim() || undefined,
				lookahead_hours: Number.isFinite(parsedHours) && parsedHours > 0 ? parsedHours : undefined
			}
		});
	});
</script>

<TextField
	label="Calendar entities (comma separated)"
	bind:value={entities}
	placeholder="calendar.family, calendar.work"
/>
<EntityField
	label="Travel time entity (minutes, optional)"
	bind:value={travelEntity}
	domains={['sensor']}
/>
<TextField label="Look-ahead hours (default 24)" bind:value={lookaheadHours} placeholder="24" />
