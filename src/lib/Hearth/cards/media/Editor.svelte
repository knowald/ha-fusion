<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { activateOnKeyboard } from '../../interaction';
	import type { CardEditorProps } from '../types';
	import type { MediaCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import Icon from '../../Icon.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<MediaCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let entity = $state(initial?.entity ?? '');
	let defaultDevice = $state(initial?.default_device ?? '');
	let shortcuts = $state(
		(initial?.shortcuts ?? []).map((shortcut) => ({
			name: shortcut.name,
			uri: shortcut.uri,
			image_url: shortcut.image_url ?? ''
		}))
	);

	function addShortcut() {
		shortcuts.push({ name: '', uri: '', image_url: '' });
	}

	$effect(() => {
		const list = shortcuts
			.map((shortcut) => ({
				name: shortcut.name.trim(),
				uri: shortcut.uri.trim(),
				image_url: shortcut.image_url.trim() || undefined
			}))
			.filter((shortcut) => shortcut.name && shortcut.uri);
		onchange({
			fields: {
				entity: entity.trim() || undefined,
				shortcuts: list.length ? list : undefined,
				default_device: defaultDevice.trim() || undefined
			}
		});
	});
</script>

<EntityField label={$lang('entity')} bind:value={entity} domains={['media_player']} />
<TextField
	label={$lang('hearth_default_device')}
	bind:value={defaultDevice}
	placeholder="Living room speaker"
/>
<div class="group-label">{$lang('hearth_quick_play')}</div>
<div class="hint">{$lang('hearth_shortcuts_hint')}</div>
{#each shortcuts as shortcut, index (index)}
	<div class="filter-row">
		<div class="filter-fields">
			<TextField label={$lang('name')} bind:value={shortcut.name} placeholder="Focus" />
			<TextField
				label={$lang('hearth_shortcut_uri')}
				bind:value={shortcut.uri}
				placeholder="spotify:playlist:..."
			/>
			<TextField
				label={$lang('hearth_shortcut_image')}
				bind:value={shortcut.image_url}
				placeholder="https://"
			/>
		</div>
		<span
			class="remove"
			role="button"
			tabindex="0"
			onclick={() => shortcuts.splice(index, 1)}
			onkeydown={(event) => activateOnKeyboard(event, () => shortcuts.splice(index, 1))}
		>
			<Icon name="delete" size={ICON.control} />
		</span>
	</div>
{/each}
<div
	class="add-filter"
	role="button"
	tabindex="0"
	onclick={addShortcut}
	onkeydown={(event) => activateOnKeyboard(event, addShortcut)}
>
	<Icon name="add" size={ICON.control} />
	<span>{$lang('hearth_add_shortcut')}</span>
</div>
