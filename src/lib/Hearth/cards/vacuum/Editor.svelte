<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import type { CardEditorProps } from '../types';
	import type { VacuumCard } from './descriptor';
	import { activateOnKeyboard } from '../../interaction';
	import EntityField from '../../edit/EntityField.svelte';
	import Icon from '../../Icon.svelte';
	import IconField from '../../edit/IconField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<VacuumCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	type EditableMode = {
		entity: string;
		name: string;
		icon: string;
		detail: string;
		duration: string;
		default: boolean;
	};

	let entity = $state(initial?.entity ?? '');
	let batteryEntity = $state(initial?.battery_entity ?? '');
	let binEntity = $state(initial?.bin_entity ?? '');
	let quickAction = $state(initial?.quick_action ?? false);
	let modes = $state<EditableMode[]>(
		(initial?.modes ?? []).map((ref) => ({
			entity: ref.entity ?? '',
			name: ref.name ?? '',
			icon: ref.icon ?? '',
			detail: ref.detail ?? '',
			duration: ref.duration ?? '',
			default: ref.default ?? false
		}))
	);

	// only one mode carries the tag, so checking a row clears the rest
	function setDefaultMode(index: number, checked: boolean) {
		modes = modes.map((mode, position) => ({ ...mode, default: checked && position === index }));
	}

	function addMode() {
		modes.push({ entity: '', name: '', icon: '', detail: '', duration: '', default: false });
	}

	$effect(() => {
		onchange({
			fields: {
				entity: entity.trim() || undefined,
				modes: modes
					.map((ref) => ({
						entity: ref.entity.trim(),
						name: ref.name.trim() || undefined,
						icon: ref.icon.trim() || undefined,
						detail: ref.detail.trim() || undefined,
						duration: ref.duration.trim() || undefined,
						default: ref.default || undefined
					}))
					.filter((ref) => ref.entity),
				battery_entity: batteryEntity.trim() || undefined,
				bin_entity: binEntity.trim() || undefined,
				quick_action: quickAction || undefined
			}
		});
	});
</script>

<EntityField label={$lang('entity')} bind:value={entity} domains={['vacuum']} />
<EntityField
	label={$lang('hearth_battery_entity_optional')}
	bind:value={batteryEntity}
	domains={['sensor']}
/>
<EntityField
	label={$lang('hearth_dustbin_entity_optional')}
	bind:value={binEntity}
	domains={['sensor']}
/>
<label class="check">
	<input type="checkbox" bind:checked={quickAction} />
	<span>{$lang('hearth_one_tap_clean_stop_button_on')}</span>
</label>
<div class="group-label">{$lang('hearth_cleaning_modes')}</div>
<div class="hint">
	{$lang('hearth_button_entities_launched_from_the_vacuum')}
</div>
{#each modes as mode, modeIndex (modeIndex)}
	<div class="filter-row">
		<div class="filter-fields">
			<EntityField
				label={$lang('hearth_button_entity')}
				bind:value={mode.entity}
				domains={['button']}
			/>
			<TextField label={$lang('hearth_name_optional')} bind:value={mode.name} />
			<IconField label={$lang('hearth_icon_optional')} bind:value={mode.icon} />
			<TextField
				label={$lang('hearth_covers_optional')}
				bind:value={mode.detail}
				placeholder="Living + Bedroom"
			/>
			<TextField
				label={$lang('hearth_duration_optional')}
				bind:value={mode.duration}
				placeholder="26 min"
			/>
			<label class="check">
				<input
					type="checkbox"
					checked={mode.default}
					onchange={(event) => setDefaultMode(modeIndex, event.currentTarget.checked)}
				/>
				<span>{$lang('hearth_recommended_mode')}</span>
			</label>
		</div>
		<span
			class="remove"
			role="button"
			tabindex="0"
			onclick={() => modes.splice(modeIndex, 1)}
			onkeydown={(event) => activateOnKeyboard(event, () => modes.splice(modeIndex, 1))}
		>
			<Icon name="delete" size={ICON.control} />
		</span>
	</div>
{/each}
<div
	class="add-filter"
	role="button"
	tabindex="0"
	onclick={addMode}
	onkeydown={(event) => activateOnKeyboard(event, addMode)}
>
	<Icon name="add" size={ICON.control} />
	<span>{$lang('hearth_add_cleaning_mode')}</span>
</div>
