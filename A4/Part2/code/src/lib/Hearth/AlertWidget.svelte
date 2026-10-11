<script lang="ts">
	import { states } from '$lib/Stores';
	import Icon from './Icon.svelte';

	let {
		icon,
		text,
		entity,
		severity = 'info'
	}: {
		icon?: string;
		text?: string;
		entity?: string;
		severity?: 'info' | 'warning' | 'error';
	} = $props();

	let entityState = $derived(entity ? $states?.[entity]?.state : undefined);
	let message = $derived(
		[text?.trim(), entity ? (entityState ?? entity) : undefined].filter(Boolean).join(' · ')
	);
	let iconName = $derived(
		icon ?? (severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info')
	);
</script>

<div
	class="alert"
	class:warning={severity === 'warning'}
	class:error={severity === 'error'}
	role={severity === 'error' ? 'alert' : 'status'}
>
	<Icon name={iconName} size={20} />
	<span>{message}</span>
</div>

<style>
	.alert {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		padding: 12px 14px;
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.2 * var(--h-accent-scale)));
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-accent-rgb) / calc(0.08 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}

	.alert.warning {
		border-color: rgb(224 160 40 / 35%);
		background: rgb(224 160 40 / 10%);
		color: #e0a028;
	}

	.alert.error {
		border-color: rgb(220 75 75 / 35%);
		background: rgb(220 75 75 / 10%);
		color: #dc4b4b;
	}

	.alert span {
		min-width: 0;
		overflow: hidden;
		font-size: 13px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
