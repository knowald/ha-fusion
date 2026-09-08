<script lang="ts">
	import type { WidgetEditorProps } from '../types';
	import type { LabelWidget } from './descriptor';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<LabelWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let text = $state(initial?.text ?? '');

	$effect(() => {
		onchange({ fields: { text: text.trim() || undefined } });
	});
</script>

<TextField label="Text" bind:value={text} placeholder="TODAY" />
