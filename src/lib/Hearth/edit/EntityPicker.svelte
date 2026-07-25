<script lang="ts">
	import { states } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import { domainIcon, PRESS_RIPPLE } from '../config';
	import Icon from '../Icon.svelte';

	let {
		domains = [],
		onselect,
		onclose
	}: {
		domains?: string[];
		onselect: (entityId: string) => void;
		onclose: () => void;
	} = $props();

	const MAX_ROWS = 100;

	let query = $state('');

	let matches = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		return Object.entries($states ?? {})
			.filter(([entityId]) => domains.length === 0 || domains.includes(entityId.split('.')[0]))
			.map(([entityId, entity]) => ({
				entityId,
				name: String(entity.attributes?.friendly_name ?? entityId),
				state: entity.state
			}))
			.filter(
				(entry) =>
					!needle ||
					entry.name.toLowerCase().includes(needle) ||
					entry.entityId.toLowerCase().includes(needle)
			)
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	function pick(entityId: string) {
		onselect(entityId);
		onclose();
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onclose();
		}
	}
</script>

<!-- capture phase: this picker nests inside EditSheet, which also closes on
	Escape. Capture always runs before bubble-phase listeners regardless of
	mount order, so stopping propagation here reliably closes only the picker. -->
<svelte:window onkeydowncapture={handleKeydown} />

<div class="overlay" onclick={onclose}>
	<div class="panel" onclick={(event) => event.stopPropagation()}>
		<div class="search">
			<Icon name="search" size={20} />
			<input
				type="text"
				bind:value={query}
				placeholder="Search entities"
				spellcheck="false"
				use:focusOnMount
			/>
			<span class="icon-button" onclick={onclose}><Icon name="close" size={22} /></span>
		</div>
		<div class="list">
			{#each matches.slice(0, MAX_ROWS) as entry (entry.entityId)}
				<div class="row pressable" use:Ripple={PRESS_RIPPLE} onclick={() => pick(entry.entityId)}>
					<span class="row-icon"><Icon name={domainIcon(entry.entityId)} size={20} /></span>
					<span class="row-text">
						<span class="row-name">{entry.name}</span>
						<span class="row-id">{entry.entityId}</span>
					</span>
					<span class="row-state">{entry.state}</span>
				</div>
			{:else}
				<div class="hint">No matching entities</div>
			{/each}
			{#if matches.length > MAX_ROWS}
				<div class="hint">{matches.length - MAX_ROWS} more matches - refine your search</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 80;
		background: var(--h-overlay);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.panel {
		width: min(720px, calc(100vw - 32px));
		height: min(720px, calc(100dvh - 48px));
		display: flex;
		flex-direction: column;
		background: radial-gradient(620px 420px at 25% -10%, var(--h-sheet-0), var(--h-sheet-1) 60%);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		border-radius: var(--h-radius-xl);
		padding: 22px 26px;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
	}

	.search {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: var(--h-track);
		color: var(--h-icon);
		margin-bottom: 12px;
	}

	.search:focus-within {
		border-color: rgb(var(--h-accent-rgb) / 0.4);
	}

	.search input {
		flex: 1;
		min-width: 0;
		padding: 11px 0;
		border: none;
		background: none;
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 14px;
		outline: none;
	}

	.search input::placeholder {
		color: var(--h-text-6);
	}

	.icon-button {
		display: flex;
		color: var(--h-icon);
		cursor: pointer;
	}

	.icon-button:hover {
		color: var(--h-text-3);
	}

	.list {
		flex: 1;
		overflow-y: auto;
		scrollbar-gutter: stable;
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

	.row-id {
		font-family: var(--h-font-mono);
		font-size: 11px;
		color: var(--h-text-5);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row-state {
		max-width: 90px;
		font-size: 12px;
		color: var(--h-text-5);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hint {
		padding: 12px 10px;
		font-size: 12px;
		color: var(--h-text-6);
		text-align: center;
	}

	@media (max-width: 700px) {
		.overlay {
			align-items: stretch;
			padding: 8px;
		}

		.panel {
			width: 100%;
			height: calc(100dvh - 16px);
			padding: 16px;
			border-radius: var(--h-radius-md);
		}
	}
</style>
