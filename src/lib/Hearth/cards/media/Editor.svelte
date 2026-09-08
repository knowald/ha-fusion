<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { CardEditorProps } from '../types';
	import type { MediaCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<MediaCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let entity = $state(initial?.entity ?? '');

	$effect(() => {
		onchange({
			fields: {
				entity: entity.trim() || undefined,
				height: initial?.height
			}
		});
	});
</script>

<EntityField label={$lang('entity')} bind:value={entity} domains={['media_player']} />
