<script lang="ts">
	import { connection, lang, states } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import { isStack, PRESS_RIPPLE, uniqueId, type HearthRoom } from './config';
	import Icon from './Icon.svelte';
	import { buildProposal, fetchRegistry, type HearthProposal } from './registry';
	import { hearthNeedsSetup, updateConfig } from './store';

	let { onclose }: { onclose: () => void } = $props();

	let status = $state<'disconnected' | 'loading' | 'error' | 'ready'>('loading');
	let errorMessage = $state('');
	let proposal = $state<HearthProposal | null>(null);
	let included = $state<Record<string, boolean>>({});
	let includeGlanceables = $state(true);

	let includedCount = $derived(proposal?.rooms.filter((room) => included[room.id]).length ?? 0);
	let glanceableCount = $derived(
		proposal?.glanceables.filter((widget) => widget.type !== 'label').length ?? 0
	);

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
			includeGlanceables = proposal.glanceables.length > 0;
			status = 'ready';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error);
			status = 'error';
		}
	}

	load();

	// First-run discovery can mount before the Home Assistant socket connects.
	// Resume automatically once it becomes available instead of leaving the
	// user on a dead-end disconnected message.
	$effect(() => {
		if ($connection && status === 'disconnected') load();
	});

	function count(value: number, noun: string) {
		return `${value} ${noun}${value === 1 ? '' : 's'}`;
	}

	/** Entity refs across a proposed page's cards, by card title. */
	function cardEntities(room: HearthRoom, title: string) {
		return room.cards
			.flat()
			.filter((item) => !isStack(item) && item.type === 'entities' && item.title === title)
			.flatMap((item) => (!isStack(item) && item.type === 'entities' ? item.entities : []));
	}

	function summarize(room: HearthRoom) {
		const lighting = cardEntities(room, 'Lighting').length;
		const devices = cardEntities(room, 'Devices').length;
		return [
			...(lighting ? [count(lighting, 'light')] : []),
			...(devices ? [count(devices, 'device')] : [])
		].join(', ');
	}

	function apply() {
		if (!proposal) return;
		// unwrap the $state proxies - the config store gets structuredCloned on
		// every later mutation and proxies cannot be structured-cloned
		const plain = $state.snapshot(proposal) as HearthProposal;
		const rooms = plain.rooms.filter((room) => included[room.id]);
		updateConfig((config) => {
			if (includeGlanceables) {
				const takenWidgetIds = config.rail.map((widget) => widget.id);
				for (const widget of plain.glanceables) {
					const id = uniqueId(widget.id, takenWidgetIds);
					takenWidgetIds.push(id);
					config.rail.push({ ...widget, id });
				}
			}
			// the first page (Home) is kept as it is; imported areas replace the rest
			const kept = config.rooms.slice(0, 1);
			// an area named like the kept page would otherwise duplicate its id, and
			// with it the ids of the cards inside
			const taken = kept.map((room) => room.id);
			config.rooms = [
				...kept,
				...rooms.map((room) => {
					const id = uniqueId(room.id, taken);
					taken.push(id);
					if (id === room.id) return room;
					return {
						...room,
						id,
						cards: room.cards.map((column) =>
							column.map((item) => ({ ...item, id: item.id.replace(room.id, id) }))
						)
					};
				})
			];
		});
		hearthNeedsSetup.set(false);
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

<div
	class="overlay"
	role="presentation"
	onpointerdown={(event) => event.target === event.currentTarget && onclose()}
>
	<div class="panel" role="dialog" aria-modal="true" aria-label={$lang('hearth_import')}>
		<div class="header">
			<span class="title">{$lang('hearth_import')}</span>
			<button
				type="button"
				class="icon-button"
				aria-label={$lang('hearth_close')}
				onclick={onclose}
			>
				<Icon name="close" size={22} />
			</button>
		</div>
		<p class="intro">
			{$lang('hearth_import_intro')}
		</p>
		{#if status === 'disconnected'}
			<div class="hint">{$lang('hearth_not_connected')}</div>
		{:else if status === 'loading'}
			<div class="hint">{$lang('hearth_loading_registries')}</div>
		{:else if status === 'error'}
			<div class="hint">
				<span class="error">{errorMessage}</span>
				<button type="button" class="bar-button pressable" use:Ripple={PRESS_RIPPLE} onclick={load}
					>{$lang('hearth_retry')}</button
				>
			</div>
		{:else if proposal}
			{#if proposal.glanceables.length}
				<label class="row glanceables">
					<input type="checkbox" bind:checked={includeGlanceables} />
					<span class="row-icon"><Icon name="today" size={20} /></span>
					<span class="row-text">
						<span class="row-name">Today glanceables</span>
						<span class="row-summary">{count(glanceableCount, 'suggestion')}</span>
					</span>
				</label>
			{/if}
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
					<div class="hint">{$lang('hearth_no_areas')}</div>
				{/each}
			</div>
		{/if}
		<div class="footer">
			<button type="button" class="bar-button pressable" use:Ripple={PRESS_RIPPLE} onclick={onclose}
				>{$lang('cancel')}</button
			>
			{#if status === 'ready'}
				<button
					type="button"
					class="bar-button primary pressable"
					disabled={!includedCount && !(includeGlanceables && glanceableCount)}
					use:Ripple={PRESS_RIPPLE}
					onclick={apply}
				>
					{$lang('hearth_apply')}
				</button>
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
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
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
		border: 0;
		background: none;
		padding: 0;
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
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
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
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		user-select: none;
		-webkit-user-select: none;
		font-family: inherit;
	}

	.bar-button.primary {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
		border: none;
		color: var(--h-on-accent);
	}

	.bar-button:disabled {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
