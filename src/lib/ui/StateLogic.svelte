<script lang="ts">
	import { lang, selectedLanguage } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { isTimestamp, relativeTime } from '$lib/core/i18n/time';
	import { getDomain } from '$lib/core/ha/entities';
	import type { HassEntity } from 'home-assistant-js-websocket';

	let {
		selected,
		contentWidth = undefined,
		editing = false,
		entity_id
	}: {
		// the original dashboard's item config; only attribute and marquee are read
		selected: ({ attribute?: string; marquee?: boolean } & Record<string, unknown>) | undefined;
		contentWidth?: number;
		/** Marquee pauses while the host dashboard is being edited. */
		editing?: boolean;
		entity_id: string | undefined;
	} = $props();

	let entity = $state<HassEntity | undefined>(undefined);

	$effect(() => {
		if (entity_id && $states?.[entity_id]?.last_updated !== entity?.last_updated)
			entity = $states?.[entity_id];
	});

	let attributes = $derived(entity?.attributes);
	let entityState = $derived(entity?.state);
	let brightness = $derived(attributes?.brightness);
	let percentage = $derived(attributes?.percentage);
	let media_title = $derived(attributes?.media_title);

	// non-breaking spaces keep the marquee's copies apart; text, not markup
	const GAP = '\u00a0'.repeat(4);
	const BLANK = '\u00a0';
</script>

<!-- Light -->
{#if selected?.attribute}
	{entity?.attributes[selected?.attribute]}
{:else if entityState === 'on' && brightness}
	{@const percentage = brightness / 255}
	<!-- should never be 0% if on -->
	{@const floor = percentage < 0.01 && percentage > 0 ? 0.01 : percentage}
	{Intl.NumberFormat($selectedLanguage, { style: 'percent' }).format(floor)}

	<!-- Media -->
{:else if media_title && entityState === 'playing'}
	{#if selected?.marquee === true && contentWidth && contentWidth > 153 && !editing}
		{#await import('$lib/ui/Marquee.svelte')}
			<span title={media_title}>{media_title}</span>
		{:then Marquee}
			<Marquee.default>
				{media_title}
				{GAP}
			</Marquee.default>
		{/await}
	{:else}
		<span title={media_title}>{media_title}</span>
	{/if}

	<!-- Climate -->
{:else if getDomain(entity_id) === 'climate' && attributes?.hvac_action}
	{$lang(attributes?.hvac_action)}

	<!-- Climate -->
{:else if getDomain(entity_id) === 'update'}
	{#if attributes?.in_progress}
		{typeof attributes?.in_progress === 'number'
			? $lang('update_installing_progress').replace('{progress}', String(attributes?.in_progress))
			: $lang('update_installing')}
	{:else if entityState === 'on'}
		{$lang('update_available')}
	{:else if entityState === 'off'}
		{$lang('update_up_to_date')}
	{/if}

	<!-- Automation -->
{:else if getDomain(entity_id) === 'automation' && entity?.attributes?.current > 0}
	{$lang('running')}

	<!-- Script -->
{:else if getDomain(entity_id) === 'script' && entity?.attributes?.current > 0}
	{$lang('running')}

	<!-- Humidifier -->
{:else if getDomain(entity_id) === 'humidifier' && entityState === 'on' && attributes?.action}
	{$lang('humidifier_' + attributes?.action)}

	<!-- Water Heater -->
{:else if getDomain(entity_id) === 'water_heater'}
	{$lang('water_heater_' + entityState)}

	<!-- Input Number / Number -->
{:else if entity_id && (getDomain(entity_id) === 'input_number' || getDomain(entity_id) === 'number')}
	{Number(entityState) || $lang('unknown')}
	{#if attributes?.unit_of_measurement}{attributes.unit_of_measurement}{/if}

	<!-- Weather -->
{:else if getDomain(entity_id) === 'weather'}
	{$lang('weather_' + entityState?.replace('_', '-')) || entityState || $lang('unknown')}

	<!-- Text -->
{:else if getDomain(entity_id) === 'input_text' || getDomain(entity_id) === 'text'}
	{#if entityState === 'unknown'}
		{$lang('unknown')}
	{:else if entityState === ''}
		{BLANK}
	{:else}
		{attributes?.mode === 'password' ? entityState?.replace(/./g, '•') : entityState}
	{/if}

	<!-- Timestamp  -->
{:else if entityState && isTimestamp(entityState)}
	{relativeTime(entityState, $selectedLanguage)}

	<!-- Percentage  -->
{:else if entityState === 'on' && percentage}
	{Intl.NumberFormat($selectedLanguage, { style: 'percent' }).format(percentage * 0.01)}

	<!-- State  -->
{:else if entityState}
	{#if selected?.marquee && contentWidth && contentWidth > 153 && !editing}
		{#await import('$lib/ui/Marquee.svelte') then Marquee}
			<Marquee.default>
				{$lang(entityState)}

				<!-- Unit -->
				{#if attributes?.unit_of_measurement}
					{attributes.unit_of_measurement}
				{/if}
				{GAP}
			</Marquee.default>
		{/await}
	{:else}
		{$lang(entityState)}

		<!-- Unit -->
		{#if attributes?.unit_of_measurement}
			{attributes.unit_of_measurement}
		{/if}
	{/if}
{:else}
	{$lang('unknown')}
{/if}
