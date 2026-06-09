<script lang="ts">
	import { states, selectedLanguage, motion } from '$lib/Stores';
	import { onMount } from 'svelte';
	import type { HassEntity } from 'home-assistant-js-websocket';
	import { getName } from '$lib/Utils';

	let { entity_id = undefined, name = undefined, strokeWidth = 9 }: {
		entity_id?: string;
		name?: string;
		strokeWidth?: number;
	} = $props();

	let entity: HassEntity = $state(undefined as any);
	$effect(() => {
		if (entity_id) entity = $states?.[entity_id];
	});

	let width = $state(0);
	let mounted = $state(false);

	const color = {
		stroke: 'var(--theme-navigate-background-color)',
		fillColor: 'rgb(255, 255, 255, 0.9)'
	};

	onMount(() => {
		setTimeout(() => {
			mounted = true;
		}, $motion);
	});

	let entityState = $derived(Math.min(Math.max(Number(entity?.state || 0), 0), 100));

	let stroke = $derived(strokeWidth === null || !strokeWidth ? 9 : strokeWidth);

	let attributes = $derived({
		cx: width / 2,
		cy: width / 2,
		r: (width - stroke) / 2,
		fill: 'none',
		'stroke-width': stroke,
		'vector-effect': 'non-scaling-stroke'
	});
	let circumference = $derived(2 * Math.PI * attributes.r);
</script>

<div class="container">
	<div class="bar" bind:clientWidth={width}>
		<svg width="100%" viewBox="0 0 {width} {width}">
			{#if width}
				<circle stroke={color.stroke} {...attributes} />

				<circle
					class="progress"
					{...attributes}
					stroke={color.fillColor}
					stroke-dasharray={circumference}
					style:--dashoffset={circumference * (1 - entityState / 100)}
					style:transition="stroke-dashoffset {mounted ? $motion : 0}ms ease"
				/>
			{/if}
		</svg>
	</div>

	<div class="overflow">
		{getName({ name }, entity)}

		<br />
		{Intl.NumberFormat($selectedLanguage, {
			style: 'percent',
			minimumFractionDigits: 0,
			maximumFractionDigits: 1
		}).format(entityState / 100)}
	</div>
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		padding: var(--theme-sidebar-item-padding);
		overflow: hidden;
		pointer-events: none;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
	}

	.bar {
		width: 2.5rem;
		height: 2.5rem;
		margin-top: 0.1rem;
		transform: rotate(-90deg);
	}

	.progress {
		stroke-dashoffset: var(--dashoffset);
	}

	.overflow {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}
</style>
