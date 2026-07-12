<script lang="ts">
	import type { OverviewCard } from './config';
	import AirCard from './AirCard.svelte';
	import BlindsSection from './BlindsSection.svelte';
	import CameraCard from './CameraCard.svelte';
	import ClimateCard from './ClimateCard.svelte';
	import EntitiesCard from './EntitiesCard.svelte';
	import FusionCard from './FusionCard.svelte';
	import LightsSection from './LightsSection.svelte';
	import MediaCard from './MediaCard.svelte';
	import ScenesCard from './ScenesCard.svelte';
	import TemperatureCard from './TemperatureCard.svelte';
	import VacuumRow from './VacuumRow.svelte';

	let { card }: { card: OverviewCard } = $props();
</script>

{#if card.type === 'lights'}
	<LightsSection {card} />
{:else if card.type === 'blinds'}
	<BlindsSection {card} />
{:else if card.type === 'temperature'}
	<TemperatureCard {card} />
{:else if card.type === 'air'}
	<AirCard {card} />
{:else if card.type === 'media'}
	<MediaCard {card} />
{:else if card.type === 'vacuum'}
	<VacuumRow {card} />
{:else if card.type === 'entities'}
	<EntitiesCard {card} />
{:else if card.type === 'camera'}
	<CameraCard {card} />
{:else if card.type === 'climate'}
	<ClimateCard {card} />
{:else if card.type === 'scenes'}
	<ScenesCard {card} />
{:else if card.type === 'fusion'}
	<FusionCard {card} />
{/if}
