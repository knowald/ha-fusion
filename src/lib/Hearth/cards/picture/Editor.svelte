<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import Ripple from '$lib/ui/actions/ripple';
	import { editPictureElements } from '$lib/legacy/bridge/pictureElements';
	import { PRESS_RIPPLE } from '../../config';
	import { activateOnKeyboard } from '../../interaction';
	import type { CardEditorProps } from '../types';
	import type { PictureCard } from './descriptor';
	import Icon from '../../Icon.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<PictureCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let title = $state(initial?.title ?? '');
	let elements = $state<unknown[]>(initial?.elements ?? []);

	async function openElementsEditor() {
		elements = await editPictureElements(
			initial?.id ?? 'hearth-picture',
			$state.snapshot(elements)
		);
	}

	$effect(() => {
		onchange({
			fields: {
				title: title.trim() || undefined,
				elements: $state.snapshot(elements)
			}
		});
	});
</script>

<TextField label={$lang('hearth_title')} bind:value={title} placeholder="Floor plan" />
<div
	class="elements-editor pressable"
	use:Ripple={PRESS_RIPPLE}
	role="button"
	tabindex="0"
	onclick={openElementsEditor}
	onkeydown={(event) => activateOnKeyboard(event, openElementsEditor)}
>
	<Icon name="edit" size={18} />
	<span>{$lang('hearth_open_elements_editor')} ({elements.length})</span>
</div>
<div class="hint">{$lang('hearth_picture_hint')}</div>
