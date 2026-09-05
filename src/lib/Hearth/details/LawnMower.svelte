<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	// LawnMowerEntityFeature: 1 start mowing, 2 pause, 4 dock
	let features = $derived<number>(stateObj?.attributes?.supported_features ?? 0);
</script>

<div class="segments">
	{#if (features & 1) === 1}
		<button
			type="button"
			class="segment"
			class:active={stateObj?.state === 'mowing'}
			onclick={() => callEntityService('lawn_mower', 'start_mowing', entity)}
			>{$lang('hearth_start_mowing')}</button
		>
	{/if}
	{#if (features & 2) === 2}
		<button
			type="button"
			class="segment"
			class:active={stateObj?.state === 'paused'}
			onclick={() => callEntityService('lawn_mower', 'pause', entity)}
			>{$lang('hearth_pause')}</button
		>
	{/if}
	{#if (features & 4) === 4}
		<button
			type="button"
			class="segment"
			class:active={stateObj?.state === 'docked'}
			onclick={() => callEntityService('lawn_mower', 'dock', entity)}>{$lang('hearth_dock')}</button
		>
	{/if}
</div>
