<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';
	import { timer } from '$lib/Stores';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let timerState = $derived(stateObj?.state);
	// svelte-ignore state_referenced_locally
	let duration = $state<string>(stateObj?.attributes?.duration ?? '0:05:00');

	// the server sends finishes_at while active; count down from it locally
	let remaining = $derived.by(() => {
		if (timerState === 'active' && stateObj?.attributes?.finishes_at) {
			const ms = Date.parse(stateObj.attributes.finishes_at) - $timer.getTime();
			const total = Math.max(0, Math.round(ms / 1000));
			const h = Math.floor(total / 3600);
			const m = Math.floor((total % 3600) / 60);
			const s = total % 60;
			return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
		}
		return stateObj?.attributes?.remaining ?? '-';
	});
</script>

<div class="readout"><span>{$lang('hearth_remaining')}</span><strong>{remaining}</strong></div>
<div class="label">{$lang('hearth_duration')}</div>
<div class="field">
	<input type="text" bind:value={duration} placeholder="0:05:00" />
</div>
<div class="label">{$lang('hearth_controls')}</div>
<div class="segments">
	<button
		type="button"
		class="segment"
		class:active={timerState === 'active'}
		onclick={() => callEntityService('timer', 'start', entity, { duration })}
	>
		{$lang('hearth_start')}
	</button>
	<button
		type="button"
		class="segment"
		disabled={timerState !== 'active'}
		onclick={() => callEntityService('timer', 'pause', entity)}
	>
		{$lang('hearth_pause')}
	</button>
	<button
		type="button"
		class="segment"
		disabled={timerState === 'idle'}
		onclick={() => callEntityService('timer', 'cancel', entity)}
	>
		{$lang('hearth_cancel')}
	</button>
	<button
		type="button"
		class="segment"
		disabled={timerState === 'idle'}
		onclick={() => callEntityService('timer', 'finish', entity)}
	>
		{$lang('hearth_finish')}
	</button>
</div>
