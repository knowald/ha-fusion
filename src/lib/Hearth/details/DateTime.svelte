<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let domain = $derived(entity.split('.')[0]);
	let hasDate = $derived(domain === 'datetime' || stateObj?.attributes?.has_date !== false);
	let hasTime = $derived(domain === 'datetime' || stateObj?.attributes?.has_time !== false);
	// svelte-ignore state_referenced_locally
	let date = $state((stateObj?.state ?? '').slice(0, 10));
	// svelte-ignore state_referenced_locally
	let time = $state((stateObj?.state ?? '').match(/\d{2}:\d{2}(:\d{2})?/)?.[0] ?? '');

	function commit() {
		if (domain === 'datetime') {
			callEntityService('datetime', 'set_value', entity, {
				datetime: `${date} ${time || '00:00'}:00`
			});
			return;
		}
		const data: Record<string, string> = {};
		if (hasDate && date) data.date = date;
		if (hasTime && time) data.time = time.length === 5 ? `${time}:00` : time;
		callEntityService('input_datetime', 'set_datetime', entity, data);
	}
</script>

<form class="field" onsubmit={(event) => (event.preventDefault(), commit())}>
	{#if hasDate}<input type="date" bind:value={date} aria-label={$lang('hearth_date')} />{/if}
	{#if hasTime}<input type="time" bind:value={time} aria-label={$lang('hearth_time')} />{/if}
	<button type="submit" class="segment">{$lang('hearth_set_value')}</button>
</form>
