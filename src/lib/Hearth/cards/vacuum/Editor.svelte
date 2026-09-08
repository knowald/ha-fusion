<script lang="ts">
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

<EntityField label="Entity" bind:value={entity} domains={['vacuum']} />
<EntityField label="Battery entity (optional)" bind:value={batteryEntity} domains={['sensor']} />
<EntityField label="Dustbin entity (optional)" bind:value={binEntity} domains={['sensor']} />
<label class="check">
	<input type="checkbox" bind:checked={quickAction} />
	<span>One-tap Clean/Stop button on the row</span>
</label>
<div class="group-label">CLEANING MODES</div>
<div class="hint">
	Button entities launched from the vacuum popover, in display order. Each runs on a single tap, so
	give every mode the rooms it covers and how long it takes.
</div>
{#each modes as mode, modeIndex (modeIndex)}
	<div class="filter-row">
		<div class="filter-fields">
			<EntityField label="Button entity" bind:value={mode.entity} domains={['button']} />
			<TextField label="Name (optional)" bind:value={mode.name} />
			<IconField label="Icon (optional)" bind:value={mode.icon} />
			<TextField
				label="Covers (optional)"
				bind:value={mode.detail}
				placeholder="Living + Bedroom"
			/>
			<TextField label="Duration (optional)" bind:value={mode.duration} placeholder="26 min" />
			<label class="check">
				<input
					type="checkbox"
					checked={mode.default}
					onchange={(event) => setDefaultMode(modeIndex, event.currentTarget.checked)}
				/>
				<span>Recommended mode</span>
			</label>
		</div>
		<span
			class="remove"
			role="button"
			tabindex="0"
			onclick={() => modes.splice(modeIndex, 1)}
			onkeydown={(event) => activateOnKeyboard(event, () => modes.splice(modeIndex, 1))}
		>
			<Icon name="delete" size={20} />
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
	<Icon name="add" size={18} />
	<span>Add cleaning mode</span>
</div>
