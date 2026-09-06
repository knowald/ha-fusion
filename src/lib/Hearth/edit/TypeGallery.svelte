<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import Ripple from '$lib/ui/actions/ripple';
	import { layer } from '$lib/ui/layers';
	import { PRESS_RIPPLE } from '../config';
	import { ICON } from '../iconSizes';
	import { activateOnKeyboard } from '../interaction';
	import Icon from '../Icon.svelte';

	/**
	 * The one type picker for cards and rail widgets. Open, it is a searchable
	 * gallery that fills the sheet while there is nothing else to look at;
	 * picking a kind collapses it to a single row that reopens on tap, so the
	 * fields and preview keep the whole workspace.
	 */
	interface Kind {
		type: string;
		name: string;
		sub: string;
		icon: string;
	}

	let {
		kinds,
		selected,
		label,
		searchPlaceholder,
		noMatch,
		open = $bindable(false),
		onselect
	}: {
		kinds: readonly Kind[];
		selected: string;
		/** Translation key for the collapsed row's caption, e.g. "Card type". */
		label: string;
		searchPlaceholder: string;
		noMatch: string;
		open?: boolean;
		onselect: (type: string) => void;
	} = $props();

	let search = $state('');

	let current = $derived(kinds.find((kind) => kind.type === selected));

	let matches = $derived.by(() => {
		const query = search.trim().toLowerCase();
		if (!query) return kinds;
		return kinds.filter(
			(kind) =>
				$lang(kind.name).toLowerCase().includes(query) ||
				$lang(kind.sub).toLowerCase().includes(query)
		);
	});

	function pick(type: string) {
		onselect(type);
		open = false;
		search = '';
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}
</script>

<div class="type-gallery" class:open>
	{#if open}
		<div class="panel" use:layer={() => (open = false)}>
			<label class="search">
				<Icon name="search" size={ICON.inline} />
				<input
					type="text"
					bind:value={search}
					placeholder={searchPlaceholder}
					spellcheck="false"
					use:focusOnMount
				/>
				{#if current}
					<button
						type="button"
						class="collapse"
						aria-label={$lang('hearth_close')}
						onclick={() => (open = false)}
					>
						<Icon name="close" size={ICON.control} />
					</button>
				{/if}
			</label>
			<div class="kinds" role="listbox" aria-label={$lang(label)}>
				{#each matches as kind (kind.type)}
					<div
						class="kind pressable"
						class:selected={kind.type === selected}
						role="option"
						aria-selected={kind.type === selected}
						tabindex="0"
						use:Ripple={PRESS_RIPPLE}
						onclick={() => pick(kind.type)}
						onkeydown={(event) => activateOnKeyboard(event, () => pick(kind.type))}
					>
						<span class="kind-icon"><Icon name={kind.icon} size={ICON.control} /></span>
						<span class="kind-copy">
							<span class="kind-name">{$lang(kind.name)}</span>
							<span class="kind-sub">{$lang(kind.sub)}</span>
						</span>
						{#if kind.type === selected}<Icon name="check" size={ICON.control} />{/if}
					</div>
				{:else}
					<div class="no-match">{noMatch}</div>
				{/each}
			</div>
		</div>
	{:else if current}
		<button
			type="button"
			class="row pressable"
			use:Ripple={PRESS_RIPPLE}
			onclick={() => (open = true)}
		>
			<span class="kind-icon"><Icon name={current.icon} size={ICON.control} /></span>
			<span class="row-copy">
				<small>{$lang(label)}</small>
				<strong>{$lang(current.name)}</strong>
			</span>
			<Icon name="expand_more" size={ICON.control} />
		</button>
	{/if}
</div>

<style>
	.type-gallery {
		margin-bottom: 18px;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 14px;
		border-radius: var(--h-radius-sm);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		background: rgb(var(--h-surface-rgb) / calc(0.04 * var(--h-fill-scale)));
		color: var(--h-text-2);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.row:hover {
		border-color: rgb(var(--h-accent-rgb) / calc(0.35 * var(--h-accent-scale)));
	}

	.kind-icon {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		flex: none;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		color: var(--h-icon);
	}

	.row-copy {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.row-copy small {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-caption);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--h-label);
	}

	.row-copy strong {
		font-size: var(--h-type-emphasis);
		font-weight: 600;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		color: var(--h-text-6);
	}

	.search input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		font-family: inherit;
		font-size: var(--h-type-body);
		color: var(--h-text-2);
	}

	.search input::placeholder {
		color: var(--h-text-6);
	}

	.collapse {
		display: grid;
		place-items: center;
		border: 0;
		background: none;
		color: var(--h-icon);
		cursor: pointer;
		padding: 0;
	}

	.kinds {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 8px;
	}

	.kind {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		border-radius: var(--h-radius-xs);
		border: 1px solid transparent;
		color: var(--h-text-3);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.kind-copy {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.kind-name {
		font-size: var(--h-type-body);
		font-weight: 500;
	}

	.kind-sub {
		font-size: var(--h-type-label);
		color: var(--h-text-6);
	}

	.kind.selected {
		background: rgb(var(--h-accent-rgb) / calc(0.14 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.3 * var(--h-accent-scale)));
	}

	.kind.selected .kind-icon,
	.kind.selected .kind-name {
		color: var(--h-accent-icon);
	}

	.no-match {
		grid-column: 1 / -1;
		padding: 12px;
		font-size: var(--h-type-secondary);
		color: var(--h-text-6);
		text-align: center;
	}

	@media (max-width: 820px) {
		.kinds {
			grid-template-columns: 1fr;
		}
	}
</style>
