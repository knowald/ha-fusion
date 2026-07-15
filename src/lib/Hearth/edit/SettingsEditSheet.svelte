<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { configuration, motion, selectedLanguage, translation } from '$lib/Stores';
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

	// app-level settings live in data/configuration.yaml, not hearth.yaml - they
	// save immediately through /_api/save_config on change, independent of
	// Hearth's edit/save/undo cycle
	let languages = $state<{ value: string; label: string }[]>([]);
	let locale = $state($selectedLanguage || 'en');
	let reduceMotion = $state($motion === 0);
	let youtube = $state($configuration?.addons?.youtube ?? false);
	let maptilerKey = $state($configuration?.addons?.maptiler?.apikey ?? '');
	let installedVersion = $state<string>();
	let saveError = $state<string | null>(null);

	onMount(async () => {
		try {
			const response = await fetch(`${base}/_api/list_languages`);
			const codes: string[] = await response.json();
			if (response.ok) {
				const getIntlName = (code: string) => {
					const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
					return (name || code).charAt(0).toUpperCase() + (name || code).slice(1);
				};
				languages = codes.map((code) => ({ value: code, label: getIntlName(code) }));
			}
		} catch (error) {
			console.error(error);
		}

		try {
			const response = await fetch(`${base}/_api/version`);
			const data = await response.json();
			if (response.ok) installedVersion = data?.installed;
		} catch (error) {
			console.error(error);
		}
	});

	/**
	 * Writes the current $configuration (minus the server-injected hassUrl) to
	 * data/configuration.yaml. Full-file overwrite, matching the original
	 * settings dialog's save behavior, so fields not touched here (token,
	 * custom_js) are carried through from the already-loaded store.
	 */
	async function persistConfiguration() {
		saveError = null;
		try {
			const json: Record<string, unknown> = { ...($configuration ?? {}) };
			delete json.hassUrl;
			const response = await fetch(`${base}/_api/save_config`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(json)
			});
			if (!response.ok) saveError = `Save failed [${response.status}]`;
		} catch (error) {
			console.error(error);
			saveError = 'Save failed';
		}
	}

	async function setLocale(value: string) {
		locale = value;
		$selectedLanguage = value;
		configuration.update((config) => ({ ...config, locale: value }));

		try {
			const response = await fetch(`${base}/_api/get_translation`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ locale: value })
			});
			const data = await response.json();
			document.documentElement.lang = value || 'en';
			if (response.ok) $translation = data;
		} catch (error) {
			console.error(error);
		}

		await persistConfiguration();
	}

	async function setReduceMotion(checked: boolean) {
		reduceMotion = checked;
		$motion = checked ? 0 : 190;
		configuration.update((config) => {
			const next = { ...config };
			if (checked) next.motion = false;
			else delete next.motion;
			return next;
		});
		await persistConfiguration();
	}

	async function setYoutube(checked: boolean) {
		youtube = checked;
		configuration.update((config) => ({
			...config,
			addons: { ...config.addons, youtube: checked }
		}));
		await persistConfiguration();
	}

	async function setMaptilerKey(value: string) {
		maptilerKey = value;
		configuration.update((config) => ({
			...config,
			addons: { ...config.addons, maptiler: { apikey: value } }
		}));
		await persistConfiguration();
	}

	function handleKeyFocus(event: FocusEvent) {
		const target = event.target as HTMLInputElement;
		target.type = event.type === 'focus' ? 'text' : 'password';
	}

	function handleLogout() {
		if (!confirm('Log out and clear the Home Assistant session?')) return;
		localStorage.removeItem('hassTokens');
		location.reload();
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

	<div class="group-label">APP</div>
	<div class="hint">
		These settings save immediately and apply to the whole app, separate from the dashboard edits
		above.
	</div>

	{#if languages.length !== 0}
		<SelectField label="Language" value={locale} options={languages} onchange={setLocale} />
	{/if}

	<label class="check">
		<input
			type="checkbox"
			checked={reduceMotion}
			onchange={(event) => setReduceMotion(event.currentTarget.checked)}
		/>
		<span>Reduce motion</span>
	</label>

	<label class="check">
		<input
			type="checkbox"
			checked={youtube}
			onchange={(event) => setYoutube(event.currentTarget.checked)}
		/>
		<span>Enable YouTube add-on</span>
	</label>

	<label class="field">
		<span class="field-label">MapTiler API key</span>
		<input
			type="password"
			value={maptilerKey}
			placeholder="API key"
			autocomplete="new-password"
			spellcheck="false"
			onfocus={handleKeyFocus}
			onblur={handleKeyFocus}
			onchange={(event) => setMaptilerKey(event.currentTarget.value)}
		/>
	</label>

	<div class="version-row">
		<span class="field-label">Version</span>
		<span class="version-value">{installedVersion ?? 'Loading...'}</span>
	</div>

	<div class="danger-inline pressable" use:Ripple={PRESS_RIPPLE} onclick={handleLogout}>
		Log out
	</div>

	{#if saveError}
		<div class="error">{saveError}</div>
	{/if}

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

	.version-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 11px 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: var(--h-track);
		margin-bottom: 14px;
	}

	.version-value {
		font-size: 14px;
		color: var(--h-text-2);
	}

	.danger-inline {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 11px 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-bad-rgb) / 0.3);
		background: rgb(var(--h-bad-rgb) / 0.12);
		color: var(--h-bad-text);
		font-size: 14px;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		margin-bottom: 4px;
	}

	.danger-inline:hover {
		background: rgb(var(--h-bad-rgb) / 0.2);
	}

	.error {
		font-size: 12px;
		color: var(--h-bad-text);
		margin: 4px 0 12px;
	}
</style>
