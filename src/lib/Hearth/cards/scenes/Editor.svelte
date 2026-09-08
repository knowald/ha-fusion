<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import type { CardEditorProps } from '../types';
	import type { ScenesCard } from './descriptor';
	import { activateOnKeyboard } from '../../interaction';
	import EntityField from '../../edit/EntityField.svelte';
	import Icon from '../../Icon.svelte';
	import IconField from '../../edit/IconField.svelte';
	import SelectField from '../../edit/SelectField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<ScenesCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	type EditableSceneRef = {
		entity: string;
		name: string;
		icon: string;
		caption: string;
		active_entity: string;
		active_state: string;
	};

	let title = $state(initial?.title ?? '');
	let style = $state<string>(initial?.style ?? 'chips');
	let scenes = $state<EditableSceneRef[]>(
		(initial?.scenes ?? []).map((ref) => ({
			entity: ref.entity ?? '',
			name: ref.name ?? '',
			icon: ref.icon ?? '',
			caption: ref.caption ?? '',
			active_entity: ref.active_entity ?? '',
			active_state: ref.active_state ?? ''
		}))
	);

	function addScene() {
		scenes.push({
			entity: '',
			name: '',
			icon: '',
			caption: '',
			active_entity: '',
			active_state: ''
		});
	}

	$effect(() => {
		onchange({
			fields: {
				title: title.trim() || undefined,
				style: style === 'bar' ? 'bar' : undefined,
				scenes: scenes
					.map((ref) => ({
						entity: ref.entity.trim(),
						name: ref.name.trim() || undefined,
						icon: ref.icon.trim() || undefined,
						caption: ref.caption.trim() || undefined,
						active_entity: ref.active_entity.trim() || undefined,
						active_state: ref.active_state.trim() || undefined
					}))
					.filter((ref) => ref.entity)
			}
		});
	});
</script>

<TextField label={$lang('hearth_title')} bind:value={title} placeholder="Scenes" />
<SelectField
	label={$lang('hearth_style')}
	bind:value={style}
	options={[
		{ value: 'chips', label: 'Chips' },
		{ value: 'bar', label: 'Scene bar' }
	]}
/>
{#if style === 'bar'}
	<div class="hint">
		{$lang('hearth_equal_width_tiles_on_one_row')}
	</div>
{/if}

<div class="group-label">{$lang('hearth_scenes')}</div>
{#each scenes as ref, refIndex (refIndex)}
	<div class="filter-row">
		<div class="filter-fields">
			<EntityField label={$lang('entity')} bind:value={ref.entity} domains={['scene', 'script']} />
			<TextField label={$lang('hearth_name_optional')} bind:value={ref.name} />
			<IconField label={$lang('hearth_icon_optional')} bind:value={ref.icon} />
			{#if style === 'bar'}
				<TextField
					label={$lang('hearth_caption_optional')}
					bind:value={ref.caption}
					placeholder="23:00, all off, ..."
				/>
			{/if}
			<EntityField
				label={$lang('hearth_active_while_entity_optional')}
				bind:value={ref.active_entity}
			/>
			<TextField
				label={$lang('hearth_is_in_state_optional')}
				bind:value={ref.active_state}
				placeholder="on"
			/>
		</div>
		<span
			class="remove"
			role="button"
			tabindex="0"
			onclick={() => scenes.splice(refIndex, 1)}
			onkeydown={(event) => activateOnKeyboard(event, () => scenes.splice(refIndex, 1))}
		>
			<Icon name="delete" size={ICON.control} />
		</span>
	</div>
{/each}
<div class="hint">
	{$lang('hearth_without_an_indicator_entity_the_most')}
</div>
<div
	class="add-filter"
	role="button"
	tabindex="0"
	onclick={addScene}
	onkeydown={(event) => activateOnKeyboard(event, addScene)}
>
	<Icon name="add" size={ICON.control} />
	<span>{$lang('hearth_add_scene')}</span>
</div>
