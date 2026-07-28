<script lang="ts">
	import { states } from '$lib/Stores';
	import { hearthEditMode, sensorNumber } from './store';
	import Icon from './Icon.svelte';

	let {
		icon = 'home',
		title = '',
		subtitle = undefined,
		tempEntity = undefined,
		humidityEntity = undefined,
		onedit = undefined
	}: {
		icon?: string;
		title?: string;
		subtitle?: string;
		tempEntity?: string;
		humidityEntity?: string;
		onedit?: () => void;
	} = $props();

	let climate = $derived.by(() => {
		const temp = sensorNumber(tempEntity ? $states?.[tempEntity]?.state : undefined);
		const humidity = sensorNumber(humidityEntity ? $states?.[humidityEntity]?.state : undefined);
		return {
			temp: temp === null ? '-' : `${temp.toFixed(1)}°`,
			humidity: humidity === null ? '-' : `${Math.round(humidity)}%`
		};
	});
</script>

<div
	class="header"
	class:editable={$hearthEditMode && onedit}
	onclick={() => $hearthEditMode && onedit?.()}
>
	<div class="icon-tile">
		<Icon name={icon || 'home'} size={32} color="var(--h-accent-text)" />
	</div>
	<div class="titles">
		<div class="name">{title}</div>
		<div class="summary">{subtitle ?? ''}</div>
	</div>
	{#if $hearthEditMode && onedit}
		<div class="edit-hint">
			<Icon name="edit" size={20} />
		</div>
	{/if}
	<div class="chips">
		{#if tempEntity}
			<div class="chip">
				<div class="chip-value">{climate.temp}</div>
				<div class="chip-label">Temp</div>
			</div>
		{/if}
		{#if humidityEntity}
			<div class="chip">
				<div class="chip-value">{climate.humidity}</div>
				<div class="chip-label">Humidity</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.header {
		display: flex;
		align-items: center;
		gap: 18px;
	}

	.header.editable {
		cursor: pointer;
	}

	.edit-hint {
		color: var(--h-icon);
	}

	.icon-tile {
		width: 64px;
		height: 64px;
		border-radius: var(--h-radius-md);
		background: rgb(var(--h-accent-rgb) / 0.14);
		border: 1px solid rgb(var(--h-accent-rgb) / 0.22);
		display: flex;
		align-items: center;
		justify-content: center;
		flex: none;
	}

	.titles {
		flex: 1;
		min-width: 0;
	}

	.name {
		font-size: 30px;
		font-weight: 600;
		color: var(--h-text-1);
		letter-spacing: -0.5px;
	}

	.summary {
		font-size: 14px;
		color: var(--h-text-5);
	}

	.chips {
		display: flex;
		gap: 12px;
	}

	.chip {
		height: 64px;
		padding: 0 18px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / 0.05);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.07);
		display: flex;
		flex-direction: column;
		justify-content: center;
		text-align: center;
	}

	.chip-value {
		font-size: 22px;
		font-weight: 600;
		color: var(--h-text-1);
	}

	.chip-label {
		font-size: 12px;
		color: var(--h-text-5);
	}
</style>
