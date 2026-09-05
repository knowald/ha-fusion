<script lang="ts">
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

<TextField label="Title" bind:value={title} placeholder="Scenes" />
<SelectField
	label="Style"
	bind:value={style}
	options={[
		{ value: 'chips', label: 'Chips' },
		{ value: 'bar', label: 'Scene bar' }
	]}
/>
{#if style === 'bar'}
	<div class="hint">
		Equal-width tiles on one row, the active scene lit. Keep it to four scenes so the row never
		scrolls.
	</div>
{/if}

<div class="group-label">SCENES</div>
{#each scenes as ref, refIndex (refIndex)}
	<div class="filter-row">
		<div class="filter-fields">
			<EntityField label="Entity" bind:value={ref.entity} domains={['scene', 'script']} />
			<TextField label="Name (optional)" bind:value={ref.name} />
			<IconField label="Icon (optional)" bind:value={ref.icon} />
			{#if style === 'bar'}
				<TextField
					label="Caption (optional)"
					bind:value={ref.caption}
					placeholder="23:00, all off, ..."
				/>
			{/if}
			<EntityField label="Active while entity (optional)" bind:value={ref.active_entity} />
			<TextField label="...is in state (optional)" bind:value={ref.active_state} placeholder="on" />
		</div>
		<span
			class="remove"
			role="button"
			tabindex="0"
			onclick={() => scenes.splice(refIndex, 1)}
			onkeydown={(event) => activateOnKeyboard(event, () => scenes.splice(refIndex, 1))}
		>
			<Icon name="delete" size={20} />
		</span>
	</div>
{/each}
<div class="hint">
	Without an indicator entity, the most recently applied scene entity counts as active. Scripts
	always need one, since a script has no activation timestamp.
</div>
<div
	class="add-filter"
	role="button"
	tabindex="0"
	onclick={addScene}
	onkeydown={(event) => activateOnKeyboard(event, addScene)}
>
	<Icon name="add" size={18} />
	<span>Add scene</span>
</div>
