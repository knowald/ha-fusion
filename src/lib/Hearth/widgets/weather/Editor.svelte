<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { WidgetEditorProps } from '../types';
	import type { WeatherWidget } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<WeatherWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let entity = $state(initial?.entity ?? '');

	$effect(() => {
		onchange({ fields: { entity: entity.trim() || undefined } });
	});
</script>

<EntityField label={$lang('hearth_weather_entity')} bind:value={entity} domains={['weather']} />
