<script lang="ts">
	import { connection, states } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE, type HearthRoom } from './config';
	import Icon from './Icon.svelte';
	import { buildProposal, fetchRegistry, type HearthProposal } from './registry';
	import { updateConfig } from './store';

	let { onclose }: { onclose: () => void } = $props();

	let status = $state<'disconnected' | 'loading' | 'error' | 'ready'>('loading');
	let errorMessage = $state('');
	let proposal = $state<HearthProposal | null>(null);
	let included = $state<Record<string, boolean>>({});

	let includedCount = $derived(proposal?.rooms.filter((room) => included[room.id]).length ?? 0);

	async function load() {
		if (!$connection) {
			status = 'disconnected';
			return;
		}
		status = 'loading';
		try {
			const snapshot = await fetchRegistry();
			proposal = buildProposal(snapshot, $states ?? {});
			included = Object.fromEntries(proposal.rooms.map((room) => [room.id, true]));
			status = 'ready';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error);
			status = 'error';
		}
	}

	load();

	function count(value: number, noun: string) {
		return `${value} ${noun}${value === 1 ? '' : 's'}`;
	}

	function summarize(room: HearthRoom) {
		const parts: string[] = [];
		if (room.lights.length) parts.push(count(room.lights.length, 'light'));
		if (room.blinds.length) parts.push(count(room.blinds.length, 'blind'));
		if (room.devices.length) parts.push(count(room.devices.length, 'device'));
		return parts.join(', ');
	}

	function apply() {
		if (!proposal) return;
		// unwrap the $state proxies - the config store gets structuredCloned on
		// every later mutation and proxies cannot be structured-cloned
		const plain = $state.snapshot(proposal) as HearthProposal;
		const rooms = plain.rooms.filter((room) => included[room.id]);
		const keptLights = new Set(rooms.flatMap((room) => room.lights));
		const keptBlinds = new Set(rooms.flatMap((room) => room.blinds));
		updateConfig((config) => {
			config.rooms = rooms;
			config.lights = plain.lights.filter((light) => keptLights.has(light.id));
			config.blinds = plain.blinds.filter((blind) => keptBlinds.has(blind.id));
		});
		onclose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="overlay" onclick={onclose}>
	<div class="panel" onclick={(event) => event.stopPropagation()}>
		<div class="header">
			<span class="title">Import from Home Assistant</span>
			<span class="icon-button" onclick={onclose}><Icon name="close" size={22} /></span>
		</div>
		<p class="intro">
			Builds rooms from your Home Assistant areas. Existing rooms, lights and blinds are replaced;
			overview cards, rail and theme are kept.
		</p>
		{#if status === 'disconnected'}
			<div class="hint">Not connected to Home Assistant</div>
		{:else if status === 'loading'}
			<div class="hint">Loading registries...</div>
		{:else if status === 'error'}
			<div class="hint">
				<span class="error">{errorMessage}</span>
				<div class="bar-button pressable" use:Ripple={PRESS_RIPPLE} onclick={load}>Retry</div>
			</div>
		{:else if proposal}
			<div class="list">
				{#each proposal.rooms as room (room.id)}
					<label class="row">
						<input type="checkbox" bind:checked={included[room.id]} />
						<span class="row-icon"><Icon name={room.icon} size={20} /></span>
						<span class="row-text">
							<span class="row-name">{room.name}</span>
							<span class="row-summary">{summarize(room)}</span>
						</span>
					</label>
				{:else}
					<div class="hint">No areas with lights, covers or devices found</div>
				{/each}
			</div>
		{/if}
		<div class="footer">
			<div class="bar-button pressable" use:Ripple={PRESS_RIPPLE} onclick={onclose}>Cancel</div>
			{#if status === 'ready'}
				<div
					class="bar-button primary pressable"
					class:disabled={!includedCount}
					use:Ripple={PRESS_RIPPLE}
					onclick={apply}
				>
					Apply
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 90;
		background: var(--h-overlay);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.panel {
		width: 480px;
		max-width: calc(100vw - 40px);
		max-height: calc(100vh - 80px);
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / 0.18);
		border-radius: var(--h-radius-xl);
		padding: 20px 22px;
		box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.title {
		font-size: 16px;
		font-weight: 600;
		color: var(--h-text-1);
	}

	.icon-button {
		display: flex;
		color: var(--h-icon);
		cursor: pointer;
	}

	.icon-button:hover {
		color: var(--h-text-3);
	}

	.intro {
		margin: 10px 0 14px;
		font-size: 13px;
		line-height: 1.5;
		color: var(--h-text-4);
	}

	.list {
		flex: 1;
		min-height: 80px;
		overflow-y: auto;
		margin: 0 -6px;
		padding: 0 6px;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 9px 10px;
		border-radius: var(--h-radius-xs);
		cursor: pointer;
	}

	.row:hover {
		background: rgb(var(--h-surface-rgb) / 0.06);
	}

	.row input {
		accent-color: var(--h-accent-deep);
		width: 16px;
		height: 16px;
	}

	.row-icon {
		display: flex;
		color: var(--h-icon);
	}

	.row-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.row-name {
		font-size: 14px;
		color: var(--h-text-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row-summary {
		font-size: 12px;
		color: var(--h-text-5);
	}

	.hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 24px 10px;
		font-size: 13px;
		color: var(--h-text-6);
		text-align: center;
	}

	.error {
		color: var(--h-bad-text);
	}

	.footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 14px;
	}

	.bar-button {
		padding: 10px 20px;
		border-radius: var(--h-radius-xs);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		color: var(--h-text-3);
		background: rgb(var(--h-surface-rgb) / 0.06);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		user-select: none;
		-webkit-user-select: none;
	}

	.bar-button.primary {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
		border: none;
		color: var(--h-on-accent);
	}

	.bar-button.disabled {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
