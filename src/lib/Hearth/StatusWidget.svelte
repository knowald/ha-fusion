<script lang="ts">
	import { states } from '$lib/Stores';
	import { attentionItems, hearthConfig } from './store';
	import Icon from './Icon.svelte';

	let { icon = 'eco', text, entity }: { icon?: string; text?: string; entity?: string } = $props();

	let entityState = $derived(entity ? $states?.[entity]?.state : undefined);
	let label = $derived(
		entityState !== undefined
			? `${text ? `${text} ` : ''}${entityState.charAt(0).toUpperCase()}${entityState.slice(1)}`
			: (text ?? '')
	);

	// without configured content the widget reports actual unresolved conditions;
	// nothing unresolved renders as nothing, not as a nominal platitude
	let autoMode = $derived(!text && !entity);
	let attention = $derived(autoMode ? attentionItems($hearthConfig, $states) : []);
</script>

{#if autoMode}
	{#each attention as item (item.entity)}
		<div class="attention-row">
			<Icon name="cloud_off" size={20} color="var(--h-accent-dim-text)" />
			<div class="attention-copy">
				<div class="attention-title">{item.name} offline</div>
				<div class="attention-detail">{item.detail}</div>
			</div>
		</div>
	{/each}
{:else}
	<div class="status-pill">
		<Icon name={icon} size={20} color="var(--h-good)" />
		<span class="pill-text">{label}</span>
	</div>
{/if}

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

	.attention-row {
		display: flex;
		align-items: center;
		gap: 13px;
		padding: 14px 16px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-accent-rgb) / calc(0.08 * var(--h-accent-scale)));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.2 * var(--h-accent-scale)));
		margin-bottom: 8px;
	}

	.attention-copy {
		flex: 1;
		min-width: 0;
	}

	.attention-title {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--h-accent-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.attention-detail {
		font-size: 12px;
		color: var(--h-accent-dim-text);
		margin-top: 2px;
	}
</style>
