<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { CardEditorProps } from '../types';
	import type { CameraCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<CameraCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let title = $state(initial?.title ?? '');
	let entity = $state(initial?.entity ?? '');
	let stream = $state(initial?.stream ?? false);

	$effect(() => {
		onchange({
			fields: {
				title: title.trim() || undefined,
				entity: entity.trim() || undefined,
				stream: stream || undefined
			}
		});
	});
</script>

<TextField label={$lang('hearth_title')} bind:value={title} placeholder="Lights" />
<EntityField label={$lang('entity')} bind:value={entity} domains={['camera']} />
<label class="check">
	<input type="checkbox" bind:checked={stream} />
	<span>{$lang('hearth_live_stream')}</span>
</label>
