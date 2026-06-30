<script lang="ts">
	import { states, editMode, motion, selectedLanguage, lang } from '$lib/Stores';
	import type { HassEntity } from 'home-assistant-js-websocket';
	import { isTimestamp, relativeTime } from '$lib/Utils';

	let {
		entity_id = undefined,
		prefix = undefined,
		suffix = undefined,
		date = undefined
	}: {
		entity_id?: string;
		prefix?: string;
		suffix?: string;
		date?: boolean;
	} = $props();

	let entity: HassEntity = $state(undefined as any);

	$effect(() => {
		if (entity_id && $states?.[entity_id]?.last_updated !== entity?.last_updated) {
			entity = $states?.[entity_id];
		}
	});

	let entityState = $derived(entity?.state);
</script>

<div
	class="container"
	class:visible={!entity || entityState || $editMode}
	style:padding-top={!entity || entityState || $editMode ? '' : '0'}
	style:padding-bottom={!entity || entityState || $editMode ? '' : '0'}
	style:transition="grid-template-rows {$motion}ms ease, padding {$motion}ms ease"
>
	<div class="expandable">
		{#if ['unavailable', 'unknown'].includes(entityState)}
			{prefix || ''}{$lang(entityState)}{suffix || ''}

			<!-- relative time -->
		{:else if entityState && date}
			{#if isTimestamp(entityState)}
				{prefix || ''}{relativeTime(entityState, $selectedLanguage)}{suffix || ''}
			{:else}
				{prefix || ''}{$lang('invalid_timestamp')}{suffix || ''}
			{/if}

			<!-- state -->
		{:else if entityState}
			{prefix || ''}{@html entityState}{suffix || ''}

			<!-- hide -->
		{:else if entity && !entityState}
			<span>{entity_id}</span>

			<!-- !entity_id -->
		{:else if !entity_id && !entityState}
			<span>{$lang('sensor')}</span>
		{:else}
			{$lang('unknown')}
		{/if}
	</div>
</div>

<style>
	.container {
		display: grid;
		grid-template-rows: 0fr;
		overflow: hidden;
		pointer-events: none;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);

		/* need to specify to properly show emoji */
		font-family: 'Inter Variable';
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		padding: var(--theme-sidebar-item-padding);
	}

	.visible {
		grid-template-rows: 1fr;
	}

	.expandable {
		min-height: 0;
		white-space: pre-line;
	}

	span {
		color: rgba(255, 255, 255, 0.25);
	}
</style>
