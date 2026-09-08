<script lang="ts">
	import type { CardEditorProps } from '../types';
	import type { HeaderCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import IconField from '../../edit/IconField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<HeaderCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let title = $state(initial?.title ?? '');
	let subtitle = $state(initial?.subtitle ?? '');
	let icon = $state(initial?.icon ?? 'home');
	let tempEntity = $state(initial?.temp_entity ?? '');
	let humidityEntity = $state(initial?.humidity_entity ?? '');

	$effect(() => {
		onchange({
			fields: {
				title: title.trim() || undefined,
				subtitle: subtitle.trim() || undefined,
				icon: icon.trim() || undefined,
				temp_entity: tempEntity.trim() || undefined,
				humidity_entity: humidityEntity.trim() || undefined
			}
		});
	});
</script>

<TextField label="Title" bind:value={title} placeholder="Home" />
<TextField label="Subtitle" bind:value={subtitle} placeholder="Cozy · curtains open" />
<IconField label="Icon" bind:value={icon} placeholder="home" />
<EntityField label="Temperature sensor (optional)" bind:value={tempEntity} domains={['sensor']} />
<EntityField label="Humidity sensor (optional)" bind:value={humidityEntity} domains={['sensor']} />
