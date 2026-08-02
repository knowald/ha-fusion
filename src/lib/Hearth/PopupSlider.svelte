<script lang="ts">
	import { horizontalDrag } from './drag';
	import type { SliderUpdateMode } from '$lib/Types';
	import Icon from './Icon.svelte';

	let {
		label,
		icon,
		value,
		variant,
		updateMode = 'continuous',
		onchange
	}: {
		label: string;
		icon: string;
		value: number;
		variant: 'amber' | 'blue';
		updateMode?: SliderUpdateMode;
		onchange: (value: number, commit?: boolean) => void;
	} = $props();
</script>

<div class="label">{label}</div>
<div class="bar" use:horizontalDrag={{ set: (next, commit) => onchange(next, commit), updateMode }}>
	<div class="fill {variant}" style:width="{value}%"></div>
	<div class="readout">
		<Icon name={icon} size={24} color="var(--h-text-1)" />
		<span class="value">{value}%</span>
	</div>
</div>

<style>
	.label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 22px 0 10px;
	}

	.bar {
		position: relative;
		height: 74px;
		border-radius: var(--h-radius-card);
		background: var(--h-track);
		overflow: hidden;
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
	}

	.fill.amber {
		background: linear-gradient(90deg, var(--h-accent-deep), var(--h-accent-bright));
	}

	.fill.blue {
		background: linear-gradient(90deg, rgb(var(--h-cool-rgb)), var(--h-cool-light));
	}

	.readout {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 22px;
		pointer-events: none;
	}

	.value {
		font-size: 24px;
		font-weight: 700;
		color: var(--h-text-1);
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
	}
</style>
