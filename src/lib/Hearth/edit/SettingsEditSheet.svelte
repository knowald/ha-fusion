<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import Icon from '../Icon.svelte';
	import SelectField from './SelectField.svelte';

	let screensaver = $derived(String($hearthConfig.screensaver_minutes ?? 0));
	let keepScreenOn = $derived($hearthConfig.keep_screen_on ?? true);
	let columns = $derived(String($hearthConfig.overview.length));
	let paddingX = $derived($hearthConfig.padding_x ?? 0);
	let paddingY = $derived($hearthConfig.padding_y ?? 0);

	const SCREENSAVER_OPTIONS = [
		{ value: '0', label: 'Off' },
		{ value: '1', label: 'After 1 minute' },
		{ value: '5', label: 'After 5 minutes' },
		{ value: '10', label: 'After 10 minutes' },
		{ value: '15', label: 'After 15 minutes' },
		{ value: '30', label: 'After 30 minutes' },
		{ value: '60', label: 'After 1 hour' }
	];

	const COLUMN_OPTIONS = [
		{ value: '1', label: '1 column' },
		{ value: '2', label: '2 columns' },
		{ value: '3', label: '3 columns' }
	];

	function setScreensaver(value: string) {
		const minutes = parseInt(value);
		updateConfig((config) => {
			config.screensaver_minutes = minutes > 0 ? minutes : undefined;
		});
	}

	function setKeepScreenOn(enabled: boolean) {
		updateConfig((config) => {
			config.keep_screen_on = enabled ? undefined : false;
		});
	}

	function setPadding(axis: 'padding_x' | 'padding_y', value: string) {
		const pixels = Math.round(parseFloat(value));
		updateConfig((config) => {
			config[axis] = Number.isFinite(pixels) && pixels > 0 ? Math.min(pixels, 300) : undefined;
		});
	}

	function setColumns(value: string) {
		const count = parseInt(value);
		if (!Number.isInteger(count) || count < 1 || count > 3) return;
		updateConfig((config) => {
			// shrinking merges the removed column's cards into the last kept one
			while (config.overview.length > count) {
				const removed = config.overview.pop() ?? [];
				config.overview[config.overview.length - 1].push(...removed);
			}
			while (config.overview.length < count) config.overview.push([]);
		});
	}

	function close() {
		editor.set(null);
	}
</script>

<EditSheet title="Settings" onclose={close} ondone={close}>
	<div class="group-label">DISPLAY</div>
	<SelectField
		label="Screensaver"
		value={screensaver}
		options={SCREENSAVER_OPTIONS}
		onchange={setScreensaver}
	/>
	<label class="check">
		<input
			type="checkbox"
			checked={keepScreenOn}
			onchange={(event) => setKeepScreenOn(event.currentTarget.checked)}
		/>
		<span>Keep screen awake while the dashboard is open</span>
	</label>
	<div class="pad-row">
		<label class="field">
			<span class="field-label">Side padding (px)</span>
			<input
				type="number"
				min="0"
				max="300"
				value={paddingX}
				onchange={(event) => setPadding('padding_x', event.currentTarget.value)}
			/>
		</label>
		<label class="field">
			<span class="field-label">Top/bottom padding (px)</span>
			<input
				type="number"
				min="0"
				max="300"
				value={paddingY}
				onchange={(event) => setPadding('padding_y', event.currentTarget.value)}
			/>
		</label>
	</div>
	<div class="hint">
		Extra space around the whole app, for screens whose frame covers the edges.
	</div>

	<div class="group-label">LAYOUT</div>
	<SelectField
		label="Overview columns"
		value={columns}
		options={COLUMN_OPTIONS}
		onchange={setColumns}
	/>
	<div class="hint">
		Removing a column moves its cards into the previous one. Changes apply with Save, like all
		edits.
	</div>

	<div class="group-label">ADVANCED</div>
	<div
		class="yaml-button pressable"
		use:Ripple={PRESS_RIPPLE}
		onclick={() => editor.set({ kind: 'code' })}
	>
		<Icon name="code" size={18} />
		<span>Edit configuration YAML</span>
	</div>
	<div class="hint">Edits the whole configuration as YAML in one place.</div>
</EditSheet>

<style>
	.group-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 4px 0 10px;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--h-text-3);
		margin-bottom: 18px;
		cursor: pointer;
	}

	.check input {
		accent-color: var(--h-accent-deep);
		width: 16px;
		height: 16px;
	}

	.pad-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

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

	.field input {
		width: 100%;
		padding: 11px 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: var(--h-track);
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 14px;
		outline: none;
	}

	.field input:focus {
		border-color: rgb(var(--h-accent-rgb) / 0.4);
	}

	.hint {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 4px 0 12px;
	}

	.yaml-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 11px 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: var(--h-track);
		color: var(--h-text-2);
		font-size: 14px;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.yaml-button:hover {
		color: var(--h-text-1);
	}
</style>
