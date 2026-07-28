<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from '../config';
	import Icon from '../Icon.svelte';

	let {
		label,
		value = $bindable(''),
		placeholder = 'Material Symbols name'
	}: { label: string; value?: string; placeholder?: string } = $props();

	// shown when no filter is typed - the full set is thousands of icons, so
	// browsing starts from ones relevant to home automation, grouped: lights,
	// climate, media, security, covers, rooms, appliances, outdoor, energy, misc
	const SUGGESTED = [
		'lightbulb',
		'light_group',
		'floor_lamp',
		'table_lamp',
		'wall_lamp',
		'emoji_objects',
		'thermostat',
		'mode_fan',
		'air',
		'ac_unit',
		'heat_pump',
		'humidity_mid',
		'water_drop',
		'thermometer',
		'tv',
		'speaker',
		'play_circle',
		'music_note',
		'cast',
		'videogame_asset',
		'sports_esports',
		'headphones',
		'radio',
		'camera',
		'videocam',
		'doorbell',
		'lock',
		'key',
		'shield',
		'security',
		'sensor_door',
		'sensor_window',
		'sensors',
		'window',
		'blinds',
		'curtains',
		'roller_shades',
		'garage',
		'door_front',
		'door_sliding',
		'weekend',
		'chair',
		'bed',
		'bathtub',
		'shower',
		'kitchen',
		'countertops',
		'microwave',
		'oven',
		'dishwasher',
		'coffee_maker',
		'blender',
		'local_laundry_service',
		'dry_cleaning',
		'iron',
		'robot_2',
		'mop',
		'yard',
		'grass',
		'deck',
		'balcony',
		'pool',
		'hot_tub',
		'fireplace',
		'outlet',
		'power',
		'bolt',
		'battery_full',
		'solar_power',
		'wind_power',
		'energy_savings_leaf',
		'eco',
		'schedule',
		'timer',
		'alarm',
		'notifications',
		'wifi',
		'router',
		'bluetooth',
		'smartphone',
		'tablet',
		'computer',
		'desk',
		'meeting_room',
		'stairs',
		'elevator',
		'pets',
		'cruelty_free',
		'restaurant',
		'local_florist',
		'wb_sunny',
		'partly_cloudy_day',
		'nightlight',
		'dark_mode',
		'star',
		'favorite',
		'home',
		'cottage',
		'apartment'
	];

	const PAGE_SIZE = 240;

	let expanded = $state(false);
	let filter = $state('');
	let limit = $state(PAGE_SIZE);
	let allNames = $state<string[]>([]);

	async function loadAllNames() {
		if (allNames.length) return;
		const versions = (await import('@material-symbols/metadata/versions.json')).default;
		allNames = Object.keys(versions);
	}

	// name matches sorted by how the query lines up: whole name, then start of a
	// word, then anywhere - so "lock" ranks lock above deadlock_off
	function search(query: string, names: string[]) {
		const exact: string[] = [];
		const prefix: string[] = [];
		const word: string[] = [];
		const rest: string[] = [];

		for (const name of names) {
			const index = name.indexOf(query);
			if (index === -1) continue;
			if (name === query) exact.push(name);
			else if (index === 0) prefix.push(name);
			else if (name[index - 1] === '_') word.push(name);
			else rest.push(name);
		}

		return [...exact, ...prefix, ...word, ...rest];
	}

	let query = $derived(
		filter
			.trim()
			.toLowerCase()
			.replace(/[\s-]+/g, '_')
	);
	let matches = $derived(query ? search(query, allNames.length ? allNames : SUGGESTED) : SUGGESTED);
	let shown = $derived(matches.slice(0, limit));

	function toggle() {
		expanded = !expanded;
		if (expanded) loadAllNames();
	}

	function pick(name: string) {
		value = name;
		expanded = false;
	}
</script>

<div class="field">
	<span class="field-label">{label}</span>
	<div class="input-row">
		<span class="preview" class:empty={!value.trim()}>
			<Icon name={value.trim() || 'category'} size={20} />
		</span>
		<input type="text" bind:value {placeholder} spellcheck="false" />
		<span class="expand pressable" use:Ripple={PRESS_RIPPLE} onclick={toggle}>
			<Icon name={expanded ? 'expand_less' : 'apps'} size={20} />
		</span>
	</div>
	{#if expanded}
		<div class="picker">
			<input
				class="filter"
				type="text"
				bind:value={filter}
				oninput={() => (limit = PAGE_SIZE)}
				placeholder="Search all icons"
				spellcheck="false"
			/>
			<div class="grid">
				{#each shown as name (name)}
					<span
						class="cell pressable"
						class:selected={name === value.trim()}
						title={name}
						use:Ripple={PRESS_RIPPLE}
						onclick={() => pick(name)}
					>
						<Icon {name} size={22} />
					</span>
				{:else}
					<div class="hint">No matching icons</div>
				{/each}
			</div>
			{#if matches.length > shown.length}
				<button
					class="more pressable"
					use:Ripple={PRESS_RIPPLE}
					onclick={() => (limit += PAGE_SIZE)}
				>
					Show more ({matches.length - shown.length})
				</button>
			{:else if !query}
				<div class="hint">
					{allNames.length ? `Type to search all ${allNames.length} icons` : 'Loading icon list'}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.field {
		display: block;
		margin-bottom: 14px;
	}

	.field-label {
		display: block;
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-label);
		margin-bottom: 6px;
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 6px 0 12px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: var(--h-track);
	}

	.input-row:focus-within {
		border-color: rgb(var(--h-accent-rgb) / 0.4);
	}

	.preview {
		display: flex;
		max-width: 20px;
		overflow: hidden;
		color: var(--h-text-2);
	}

	.preview.empty {
		color: var(--h-icon-dim);
	}

	.input-row input {
		flex: 1;
		min-width: 0;
		padding: 11px 0;
		border: none;
		background: none;
		color: var(--h-text-2);
		font-family: var(--h-font-mono);
		font-size: 13px;
		outline: none;
	}

	input::placeholder {
		color: var(--h-text-6);
	}

	.expand {
		display: flex;
		padding: 6px;
		border-radius: var(--h-radius-xs);
		color: var(--h-icon);
		cursor: pointer;
	}

	.expand:hover {
		color: var(--h-text-3);
	}

	.picker {
		margin-top: 8px;
		padding: 10px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		background: rgb(var(--h-surface-rgb) / 0.04);
	}

	.filter {
		width: 100%;
		padding: 8px 11px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: var(--h-track);
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 13px;
		outline: none;
	}

	.filter:focus {
		border-color: rgb(var(--h-accent-rgb) / 0.4);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
		gap: 4px;
		max-height: 200px;
		overflow-y: auto;
		margin-top: 8px;
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		border-radius: var(--h-radius-xs);
		color: var(--h-icon);
		cursor: pointer;
		/* a name the loaded font lacks renders as its literal text */
		overflow: hidden;
	}

	.cell:hover {
		background: rgb(var(--h-surface-rgb) / 0.08);
		color: var(--h-text-2);
	}

	.cell.selected {
		background: rgb(var(--h-accent-rgb) / 0.2);
		color: var(--h-accent-text);
	}

	.hint {
		grid-column: 1 / -1;
		padding: 10px;
		font-size: 12px;
		color: var(--h-text-6);
		text-align: center;
	}

	.more {
		display: block;
		width: 100%;
		margin-top: 6px;
		padding: 8px;
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.04);
		color: var(--h-text-3);
		font-family: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.more:hover {
		background: rgb(var(--h-surface-rgb) / 0.08);
		color: var(--h-text-2);
	}
</style>
