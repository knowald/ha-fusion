<script lang="ts">
	import type { CardEditorProps } from '../types';
	import type { ImageCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<ImageCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let title = $state(initial?.title ?? '');
	let entity = $state(initial?.entity ?? '');

	$effect(() => {
		onchange({
			fields: {
				title: title.trim() || undefined,
				entity: entity.trim() || undefined
			}
		});
	});
</script>

<TextField label="Title" bind:value={title} placeholder="Lights" />
<EntityField label="Entity" bind:value={entity} domains={['image']} />
