<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';
	import { requestConfirmation } from '../store';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let locked = $derived(stateObj?.state === 'locked');
	// supported_features bit 1: the lock can also open (a latch)
	let canOpen = $derived(((stateObj?.attributes?.supported_features ?? 0) & 1) === 1);

	function guarded(service: 'unlock' | 'open', label: string) {
		requestConfirmation({
			title: label,
			message: `${label} ${stateObj?.attributes?.friendly_name ?? entity}?`,
			confirmLabel: label,
			action: () => callEntityService('lock', service, entity)
		});
	}
</script>

<div class="segments">
	<button
		type="button"
		class="segment"
		class:active={locked}
		onclick={() => callEntityService('lock', 'lock', entity)}
	>
		{$lang('hearth_lock')}
	</button>
	<button
		type="button"
		class="segment"
		class:active={!locked}
		onclick={() => guarded('unlock', $lang('hearth_unlock'))}
	>
		{$lang('hearth_unlock')}
	</button>
	{#if canOpen}
		<button
			type="button"
			class="segment"
			onclick={() => guarded('open', $lang('hearth_open_door'))}
		>
			{$lang('hearth_open_door')}
		</button>
	{/if}
</div>
