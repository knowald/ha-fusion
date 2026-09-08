<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';
	import { relativeTime } from '$lib/core/i18n/time';
	import { selectedLanguage } from '$lib/core/i18n';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let running = $derived(stateObj?.state === 'on');
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
<div class="segments">
	{#if running}
		<button
			type="button"
			class="segment danger"
			onclick={() => callEntityService('script', 'turn_off', entity)}
		>
			{$lang('hearth_stop')}
		</button>
	{:else}
		<button
			type="button"
			class="segment active"
			onclick={() => callEntityService('script', 'turn_on', entity)}
		>
			{$lang('hearth_run')}
		</button>
	{/if}
</div>
