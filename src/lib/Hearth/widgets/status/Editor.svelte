<script lang="ts">
	import { lang } from '$lib/core/i18n';
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
		<TextField label={$lang('text')} bind:value={text} placeholder="All systems nominal" />
	</div>
	<div class="icon-column">
		<IconField label={$lang('icon')} bind:value={icon} placeholder="eco" />
	</div>
</div>
<EntityField label={$lang('hearth_entity_optional_appends_its_state')} bind:value={entity} />
<div class="hint">
	{$lang('hearth_leave_text_and_entity_empty_to')}
</div>
