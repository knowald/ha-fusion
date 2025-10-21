<script lang="ts">
	import { connection, states, lang, ripple, timer } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';

	export let isOpen: boolean;
	export let sel: any;

	$: name = sel?.name || 'Days Since';
	$: entity_id = sel?.entity_id;

	// Get timestamp from entity state
	$: entityState = entity_id ? $states?.[entity_id] : undefined;
	$: last_reset = entityState?.state;

	$: daysSince = calculateDaysSince(last_reset, $timer);

	function calculateDaysSince(lastReset: string | undefined, currentTime: Date): number {
		if (!lastReset) return 0;
		const resetDate = new Date(lastReset);
		const now = currentTime;
		const diffTime = Math.abs(now.getTime() - resetDate.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return 'Never';
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function resetCounter() {
		if (!entity_id || !$connection) {
			console.error('No entity_id configured or no connection');
			return;
		}

		try {
			const now = new Date();
			await callService($connection, 'input_datetime', 'set_datetime', {
				entity_id: entity_id,
				datetime: now.toISOString().split('.')[0]
			});
			console.debug('Counter reset successfully');
		} catch (error) {
			console.error('Failed to reset counter:', error);
		}
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{name}</h1>

		<div class="counter-display">
			<div class="days-number">{daysSince}</div>
			<div class="days-label">
				{#if daysSince === 0}
					{$lang('today') || 'Today'}
				{:else if daysSince === 1}
					{$lang('day') || 'day'}
				{:else}
					{$lang('days') || 'days'}
				{/if}
			</div>
		</div>

		<h2>{$lang('last_reset') || 'Last Reset'}</h2>

		<div class="last-reset-info">
			<Icon icon="mdi:calendar" height="1.5rem" style="opacity: 0.7;" />
			<span>{formatDate(last_reset)}</span>
		</div>

		<h2>{$lang('reset') || 'Reset'}</h2>

		<button class="reset-button" on:click={resetCounter} use:Ripple={$ripple}>
			<Icon icon="mdi:restart" height="1.3rem" />
			<span>{$lang('reset_counter') || 'Reset Counter'}</span>
		</button>

		<ConfigButtons />
	</Modal>
{/if}

<style>
	.counter-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 0;
		gap: 0.5rem;
	}

	.days-number {
		font-size: 4rem;
		font-weight: 700;
		color: white;
		line-height: 1;
	}

	.days-label {
		font-size: 1.2rem;
		opacity: 0.7;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.last-reset-info {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.8rem 1rem;
		border-radius: 0.5rem;
		font-size: 1rem;
	}

	.reset-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8rem;
		padding: 1rem;
		background-color: rgba(255, 152, 0, 0.2);
		border: 1px solid rgba(255, 152, 0, 0.4);
		border-radius: 0.5rem;
		color: white;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.reset-button:hover {
		background-color: rgba(255, 152, 0, 0.3);
		border-color: rgba(255, 152, 0, 0.6);
	}
</style>
