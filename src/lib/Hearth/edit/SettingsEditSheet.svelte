<script lang="ts">
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import SelectField from './SelectField.svelte';

	let screensaver = $derived(String($hearthConfig.screensaver_minutes ?? 0));
	let keepScreenOn = $derived($hearthConfig.keep_screen_on ?? true);
	let columns = $derived(String($hearthConfig.overview.length));

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

	.hint {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 4px 0 12px;
	}
</style>
