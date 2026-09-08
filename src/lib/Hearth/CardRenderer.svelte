<script lang="ts">
	import { lang, fill } from '$lib/core/i18n';
	import type { EntityRef, OverviewCard } from './types';
	import { cardConfigurationLabel, cardDescriptor, cardNeedsConfiguration } from './cards';
	import ConfigurationPlaceholder from './ConfigurationPlaceholder.svelte';

	let {
		card,
		onentitiesreorder = undefined,
		showEntityDragHandles = true
	}: {
		card: OverviewCard;
		onentitiesreorder?: (entities: EntityRef[]) => void;
		showEntityDragHandles?: boolean;
	} = $props();

	let descriptor = $derived(cardDescriptor(card.type));
</script>

{#if !descriptor}
	<ConfigurationPlaceholder label={fill($lang('hearth_unknown_card_type'), { type: card.type })} />
{:else if cardNeedsConfiguration(card)}
	<ConfigurationPlaceholder label={cardConfigurationLabel(card)} />
{:else}
	<descriptor.component {card} {onentitiesreorder} {showEntityDragHandles} />
{/if}
