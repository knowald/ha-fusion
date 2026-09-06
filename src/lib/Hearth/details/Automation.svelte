<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';
	import { relativeTime } from '$lib/core/i18n/time';
	import { selectedLanguage } from '$lib/core/i18n';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let on = $derived(stateObj?.state === 'on');
	let lastTriggered = $derived(stateObj?.attributes?.last_triggered as string | undefined);
</script>

<div class="readout">
	<span>{$lang('hearth_last_triggered')}</span>
	<strong
		>{lastTriggered
			? relativeTime(lastTriggered, $selectedLanguage)
			: $lang('hearth_never')}</strong
	>
</div>
<div class="label">{$lang('state')}</div>
<div class="segments">
	<button
		type="button"
		class="segment"
		class:active={on}
		onclick={() => callEntityService('automation', 'turn_on', entity)}
	>
		{$lang('hearth_turn_on')}
	</button>
	<button
		type="button"
		class="segment"
		class:active={!on}
		onclick={() => callEntityService('automation', 'turn_off', entity)}
	>
		{$lang('hearth_turn_off')}
	</button>
	<button
		type="button"
		class="segment"
		onclick={() => callEntityService('automation', 'trigger', entity)}
	>
		{$lang('hearth_run_actions')}
	</button>
</div>
