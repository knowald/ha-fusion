<script lang="ts">
	import { integerFromInput } from '../../edit/numbers';
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { activateOnKeyboard } from '../../interaction';
	import type { CardEditorProps } from '../types';
	import type { ConditionalMediaCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import Icon from '../../Icon.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<ConditionalMediaCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let players = $state<{ entity: string }[]>(
		(initial?.media_players ?? []).map((entity) => ({ entity }))
	);
	let timeout = $state(initial?.timeout !== undefined ? String(initial.timeout) : '');

	$effect(() => {
		const timeoutValue = integerFromInput(timeout);
		onchange({
			fields: {
				media_players: players.map((row) => row.entity.trim()).filter(Boolean),
				timeout: Number.isFinite(timeoutValue) && timeoutValue >= 0 ? timeoutValue : undefined
			}
		});
	});
</script>

<div class="group-label">{$lang('hearth_media_players')}</div>
{#each players as row, index (index)}
	<div class="filter-row">
		<div class="filter-fields">
			<EntityField label={$lang('entity')} bind:value={row.entity} domains={['media_player']} />
		</div>
		<span
			class="remove"
			role="button"
			tabindex="0"
			onclick={() => players.splice(index, 1)}
			onkeydown={(event) => activateOnKeyboard(event, () => players.splice(index, 1))}
		>
			<Icon name="delete" size={ICON.control} />
		</span>
	</div>
{/each}
<div
	class="add-filter"
	role="button"
	tabindex="0"
	onclick={() => players.push({ entity: '' })}
	onkeydown={(event) => activateOnKeyboard(event, () => players.push({ entity: '' }))}
>
	<Icon name="add" size={ICON.control} />
	<span>{$lang('hearth_add_player')}</span>
</div>
<TextField label={$lang('hearth_pause_timeout')} bind:value={timeout} placeholder="300" />
