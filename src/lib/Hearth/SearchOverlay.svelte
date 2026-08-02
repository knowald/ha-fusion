<script lang="ts">
	import { lang, states } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import { domainIcon, PRESS_RIPPLE } from './config';
	import { currentRoom, hearthConfig } from './store';
	import { openEntityModal } from './modals';
	import Icon from './Icon.svelte';

	let { onclose }: { onclose: () => void } = $props();

	const MAX_ENTITY_RESULTS = 50;

	let query = $state('');
	let activeIndex = $state(0);
	let rowEls: (HTMLButtonElement | undefined)[] = [];

	type Result =
		| { kind: 'room'; id: string; name: string; icon: string }
		| { kind: 'entity'; entityId: string; name: string; state: string };

	// prefix matches outrank matches that only occur mid-string
	function matchRank(needle: string, ...candidates: string[]) {
		return candidates.some((candidate) => candidate.toLowerCase().startsWith(needle)) ? 0 : 1;
	}

	let results = $derived.by<Result[]>(() => {
		const needle = query.trim().toLowerCase();
		if (!needle) return [];

		const rooms = $hearthConfig.rooms
			.filter((room) => room.name.toLowerCase().includes(needle))
			.map((room) => ({
				result: { kind: 'room', id: room.id, name: room.name, icon: room.icon } as Result,
				rank: matchRank(needle, room.name)
			}));

		const entities = Object.entries($states ?? {})
			.map(([entityId, entity]) => ({
				entityId,
				name: String(entity.attributes?.friendly_name ?? entityId),
				state: entity.state
			}))
			.filter(
				(entry) =>
					entry.name.toLowerCase().includes(needle) || entry.entityId.toLowerCase().includes(needle)
			)
			.map((entry) => ({
				result: {
					kind: 'entity',
					entityId: entry.entityId,
					name: entry.name,
					state: entry.state
				} as Result,
				rank: matchRank(needle, entry.name, entry.entityId)
			}));

		const sort = (a: { rank: number; result: Result }, b: { rank: number; result: Result }) =>
			a.rank - b.rank || a.result.name.localeCompare(b.result.name);

		return [
			...rooms.sort(sort).map((entry) => entry.result),
			...entities
				.sort(sort)
				.slice(0, MAX_ENTITY_RESULTS)
				.map((entry) => entry.result)
		];
	});

	// query changes invalidate the previous selection position
	$effect(() => {
		void results;
		activeIndex = 0;
	});

	$effect(() => {
		rowEls[activeIndex]?.scrollIntoView({ block: 'nearest' });
	});

	function selectResult(result: Result) {
		if (result.kind === 'room') {
			currentRoom.set(result.id);
			onclose();
		} else {
			// close first: the entity modal portals outside .frame
			onclose();
			openEntityModal(result.entityId, result.name);
		}
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onclose();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (results.length) activeIndex = (activeIndex + 1) % results.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (results.length) activeIndex = (activeIndex - 1 + results.length) % results.length;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const result = results[activeIndex];
			if (result) selectResult(result);
		}
	}
</script>

<!-- capture phase: mirrors edit/EntityPicker.svelte so Escape reliably closes
	this overlay first regardless of what else is listening on the window -->
<svelte:window onkeydowncapture={handleKeydown} />

<div
	class="overlay"
	role="presentation"
	onpointerdown={(event) => event.target === event.currentTarget && onclose()}
>
	<div class="panel" role="dialog" aria-modal="true" aria-label={$lang('search')}>
		<div class="search">
			<Icon name="search" size={20} />
			<input
				type="text"
				bind:value={query}
				placeholder={$lang('hearth_search_placeholder')}
				aria-label={$lang('hearth_search_placeholder')}
				spellcheck="false"
				use:focusOnMount
			/>
			<button
				type="button"
				class="icon-button"
				aria-label={$lang('hearth_close')}
				onclick={onclose}
			>
				<Icon name="close" size={22} />
			</button>
		</div>
		<div class="list">
			{#each results as result, index (result.kind === 'room' ? `room:${result.id}` : `entity:${result.entityId}`)}
				<button
					type="button"
					class="row pressable"
					class:active={index === activeIndex}
					aria-current={index === activeIndex ? 'true' : undefined}
					use:Ripple={PRESS_RIPPLE}
					bind:this={rowEls[index]}
					onmouseenter={() => (activeIndex = index)}
					onclick={() => selectResult(result)}
				>
					<span class="row-icon">
						<Icon
							name={result.kind === 'room' ? result.icon : domainIcon(result.entityId)}
							size={20}
						/>
					</span>
					<span class="row-text">
						<span class="row-name">{result.name}</span>
						<span class="row-id">{result.kind === 'room' ? 'Page' : result.entityId}</span>
					</span>
					{#if result.kind === 'entity'}
						<span class="row-state">{result.state}</span>
					{/if}
				</button>
			{:else}
				<div class="hint">
					{query.trim() ? $lang('hearth_no_matches') : $lang('hearth_search_hint')}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 55;
		background: var(--h-overlay);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 12vh;
	}

	.panel {
		width: 480px;
		max-width: calc(100vw - 40px);
		max-height: calc(100vh - 80px);
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		border-radius: var(--h-radius-xl);
		padding: 20px 22px;
		box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
	}

	.search {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		background: var(--h-track);
		color: var(--h-icon);
		margin-bottom: 12px;
		flex: none;
	}

	.search:focus-within {
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
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
		border: 0;
		background: none;
		padding: 0;
	}

	.icon-button:hover {
		color: var(--h-text-3);
	}

	.list {
		flex: 1;
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
		width: 100%;
		border: 0;
		background: none;
		font: inherit;
		text-align: left;
	}

	.row:hover,
	.row.active {
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
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
</style>
