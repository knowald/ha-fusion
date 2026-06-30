<script lang="ts">
	import { timer, selectedLanguage } from '$lib/Stores';

	let {
		short_day = undefined,
		short_month = undefined,
		hide = undefined,
		layout = undefined
	}: {
		short_day?: boolean;
		short_month?: boolean;
		hide?: string;
		layout?: string;
	} = $props();

	let weekDay = $derived(
		$timer.toLocaleDateString($selectedLanguage, {
			weekday: short_day ? 'short' : 'long'
		})
	);

	let shortDate = $derived(
		$timer.toLocaleDateString($selectedLanguage, {
			day: 'numeric',
			month: short_month ? 'short' : 'long'
		})
	);

	let orientation = $derived(layout || 'vertical');
</script>

<div>
	{#if orientation === 'vertical'}
		{#if hide !== 'day'}
			{weekDay}<br />
		{/if}

		{#if hide !== 'month'}
			{shortDate}<br />
		{/if}
	{/if}
	{#if orientation === 'horizontal'}
		{weekDay},&nbsp;{shortDate}
	{/if}
</div>

<style>
	div {
		padding: var(--theme-sidebar-item-padding);
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	div::first-letter {
		text-transform: capitalize;
	}
</style>
