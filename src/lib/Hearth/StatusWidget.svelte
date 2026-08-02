<script lang="ts">
	import { states } from '$lib/Stores';
	import Icon from './Icon.svelte';

	let { icon = 'eco', text, entity }: { icon?: string; text?: string; entity?: string } = $props();

	let entityState = $derived(entity ? $states?.[entity]?.state : undefined);
	let label = $derived(
		entityState !== undefined
			? `${text ? `${text} ` : ''}${entityState.charAt(0).toUpperCase()}${entityState.slice(1)}`
			: (text ?? '')
	);
</script>

<div class="status-pill">
	<Icon name={icon} size={20} color="var(--h-good)" />
	<span class="pill-text">{label}</span>
</div>

<style>
	.status-pill {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / calc(0.04 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
	}

	.pill-text {
		font-size: 13px;
		color: var(--h-text-4);
	}
</style>
