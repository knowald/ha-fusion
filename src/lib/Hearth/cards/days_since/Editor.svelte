<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { CardEditorProps } from '../types';
	import type { DaysSinceCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import IconField from '../../edit/IconField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<DaysSinceCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let title = $state(initial?.title ?? '');
	let entity = $state(initial?.entity ?? '');
	let icon = $state(initial?.icon ?? '');

	$effect(() => {
		onchange({
			fields: {
				title: title.trim() || undefined,
				entity: entity.trim() || undefined,
				icon: icon.trim() || undefined
			}
		});
	});
</script>

<TextField label={$lang('hearth_title')} bind:value={title} placeholder="Filter changed" />
<EntityField label={$lang('entity')} bind:value={entity} domains={['input_datetime']} />
<div class="hint">{$lang('hearth_days_since_entity_hint')}</div>
<IconField label={$lang('hearth_icon_optional')} bind:value={icon} />
