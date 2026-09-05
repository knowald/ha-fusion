<script lang="ts">
	import type { OverviewCard } from '../../types';
	import HeaderCard from '../../HeaderCard.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'header' }> } = $props();
</script>

<HeaderCard
	icon={card.icon}
	title={card.title ?? ''}
	subtitle={card.subtitle}
	tempEntity={card.temp_entity}
	humidityEntity={card.humidity_entity}
/>
