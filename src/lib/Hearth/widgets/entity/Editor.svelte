<script lang="ts">
	import type { WidgetEditorProps } from '../types';
	import type { EntityWidget } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import IconField from '../../edit/IconField.svelte';
	import SelectField from '../../edit/SelectField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<EntityWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let entity = $state(initial?.entity ?? '');
	let name = $state(initial?.name ?? '');
	let icon = $state(initial?.icon ?? '');
	let verticalPadding = $state(initial?.vertical_padding ?? '');

	$effect(() => {
		onchange({
			fields: {
				entity: entity.trim() || undefined,
				name: name.trim() || undefined,
				icon: icon.trim() || undefined,
				vertical_padding: verticalPadding === 'compact' ? 'compact' : undefined
			}
		});
	});
</script>

<EntityField label="Entity" bind:value={entity} />
<div class="row">
	<div class="grow">
		<TextField label="Name (optional)" bind:value={name} />
	</div>
	<div class="icon-column">
		<IconField label="Icon (optional)" bind:value={icon} />
	</div>
</div>
<SelectField
	label="Vertical padding"
	bind:value={verticalPadding}
	options={[
		{ value: '', label: 'Standard' },
		{ value: 'compact', label: 'Compact' }
	]}
/>
