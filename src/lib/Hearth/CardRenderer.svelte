<script lang="ts">
	import type { OverviewCard } from './config';
	import CameraCard from './CameraCard.svelte';
	import ClimateCard from './ClimateCard.svelte';
	import EntitiesCard from './EntitiesCard.svelte';
	import FusionCard from './FusionCard.svelte';
	import HeaderCard from './HeaderCard.svelte';
	import ImageCard from './ImageCard.svelte';
	import MediaCard from './MediaCard.svelte';
	import ScenesCard from './ScenesCard.svelte';
	import TemperatureCard from './TemperatureCard.svelte';
	import VacuumRow from './VacuumRow.svelte';

	let {
		card,
		onentitiesreorder = undefined,
		showEntityDragHandles = true
	}: {
		card: OverviewCard;
		onentitiesreorder?: (entities: Extract<OverviewCard, { type: 'entities' }>['entities']) => void;
		showEntityDragHandles?: boolean;
	} = $props();
</script>

{#if card.type === 'header'}
	<HeaderCard
		icon={card.icon}
		title={card.title ?? ''}
		subtitle={card.subtitle}
		tempEntity={card.temp_entity}
		humidityEntity={card.humidity_entity}
	/>
{:else if card.type === 'temperature'}
	<TemperatureCard {card} />
{:else if card.type === 'media'}
	<MediaCard {card} />
{:else if card.type === 'vacuum'}
	<VacuumRow {card} />
{:else if card.type === 'entities'}
	<EntitiesCard {card} {onentitiesreorder} {showEntityDragHandles} />
{:else if card.type === 'camera'}
	<CameraCard {card} />
{:else if card.type === 'image'}
	<ImageCard {card} />
{:else if card.type === 'climate'}
	<ClimateCard {card} />
{:else if card.type === 'scenes'}
	<ScenesCard {card} />
{:else if card.type === 'fusion'}
	<FusionCard {card} />
{:else}
	{@const _exhaustive: never = card}
	{_exhaustive}
{/if}
