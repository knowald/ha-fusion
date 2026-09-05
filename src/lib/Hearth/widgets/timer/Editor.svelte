<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { WidgetEditorProps } from '../types';
	import type { TimerWidget } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<TimerWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let entity = $state(initial?.entity ?? '');
	let name = $state(initial?.name ?? '');

	$effect(() => {
		onchange({ fields: { entity: entity.trim() || undefined, name: name.trim() || undefined } });
	});
</script>

<EntityField label={$lang('entity')} bind:value={entity} domains={['timer']} />
<TextField label={$lang('hearth_name_optional')} bind:value={name} />
