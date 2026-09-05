<script lang="ts">
	import type { WidgetEditorProps } from '../types';
	import type { StatusWidget } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import IconField from '../../edit/IconField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<StatusWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let text = $state(initial?.text ?? '');
	let icon = $state(initial?.icon ?? '');
	let entity = $state(initial?.entity ?? '');

	$effect(() => {
		onchange({
			fields: {
				icon: icon.trim() || undefined,
				text: text.trim() || undefined,
				entity: entity.trim() || undefined
			}
		});
	});
</script>

<div class="row">
	<div class="grow">
		<TextField label="Text" bind:value={text} placeholder="All systems nominal" />
	</div>
	<div class="icon-column">
		<IconField label="Icon" bind:value={icon} placeholder="eco" />
	</div>
</div>
<EntityField label="Entity (optional, appends its state)" bind:value={entity} />
<div class="hint">
	Leave text and entity empty to report actual conditions instead: one row per offline dashboard
	entity, nothing when all is well.
</div>
