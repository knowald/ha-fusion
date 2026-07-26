<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { configuration, motion, selectedLanguage, translation } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import { ensureRoomCardColumns, PRESS_RIPPLE, resizeCardColumns } from '../config';
	import { currentRoom, editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import Icon from '../Icon.svelte';

	let screensaver = $derived(String($hearthConfig.screensaver_minutes ?? 0));
	let keepScreenOn = $derived($hearthConfig.keep_screen_on ?? true);
	// column count is a per-page setting; this row edits the page being viewed
	let activeRoom = $derived(
		$hearthConfig.rooms.find((room) => room.id === $currentRoom) ?? $hearthConfig.rooms[0]
	);
	let columns = $derived(String(activeRoom?.columns ?? activeRoom?.cards?.length ?? 1));
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
		const roomId = activeRoom?.id;
		updateConfig((config) => {
			const room = config.rooms.find((entry) => entry.id === roomId);
			if (!room) return;
			room.columns = count;
			// shrinking merges the removed column's cards into the last kept one
			room.cards = resizeCardColumns(ensureRoomCardColumns(room), count);
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
	// saves are serialized: each queued save snapshots $configuration when it
	// actually runs, so a slow earlier request can never overwrite a newer one
	let saveChain: Promise<void> = Promise.resolve();

	function persistConfiguration() {
		const run = saveChain.then(async () => {
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
		});
		saveChain = run;
		return run;
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

	function openClassicDashboard() {
		// full page load; with relative paths (ingress) `base` resolves against
		// the current URL, keeping the per-installation ingress prefix
		location.assign(`${base}/`);
	}

	function handleLogout() {
		if (!confirm('Log out and clear the Home Assistant session?')) return;
		localStorage.removeItem('hassTokens');
		location.reload();
	}
</script>

<EditSheet title="Settings" onclose={close} ondone={close}>
	<div class="settings">
		<section>
			<div class="section-title">DISPLAY</div>
			<div class="rows">
				<div class="row">
					<div class="row-main">
						<div class="row-label">Screensaver</div>
					</div>
					<span class="select-wrap">
						<select value={screensaver} onchange={(e) => setScreensaver(e.currentTarget.value)}>
							{#each SCREENSAVER_OPTIONS as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<Icon name="expand_more" size={18} />
					</span>
				</div>
				<div class="row">
					<div class="row-main">
						<div class="row-label">Keep screen awake</div>
						<div class="row-sub">While the dashboard is open</div>
					</div>
					<div
						class="switch pressable"
						class:on={keepScreenOn}
						use:Ripple={PRESS_RIPPLE}
						onclick={() => setKeepScreenOn(!keepScreenOn)}
					>
						<div class="knob"></div>
					</div>
				</div>
				<div class="row">
					<div class="row-main">
						<div class="row-label">Side padding</div>
						<div class="row-sub">For screens whose frame covers the edges</div>
					</div>
					<span class="unit-input">
						<input
							type="number"
							min="0"
							max="300"
							value={paddingX}
							onchange={(event) => setPadding('padding_x', event.currentTarget.value)}
						/>
						<span class="unit">px</span>
					</span>
				</div>
				<div class="row">
					<div class="row-main">
						<div class="row-label">Top/bottom padding</div>
					</div>
					<span class="unit-input">
						<input
							type="number"
							min="0"
							max="300"
							value={paddingY}
							onchange={(event) => setPadding('padding_y', event.currentTarget.value)}
						/>
						<span class="unit">px</span>
					</span>
				</div>
			</div>
		</section>

		<section>
			<div class="section-title">LAYOUT</div>
			<div class="rows">
				<div class="row">
					<div class="row-main">
						<div class="row-label">Columns on {activeRoom?.name ?? 'this page'}</div>
						<div class="row-sub">Removing a column moves its cards into the previous one</div>
					</div>
					<span class="select-wrap">
						<select value={columns} onchange={(e) => setColumns(e.currentTarget.value)}>
							{#each COLUMN_OPTIONS as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<Icon name="expand_more" size={18} />
					</span>
				</div>
			</div>
			<div class="section-note">Changes apply with Save, like all edits.</div>
		</section>

		<section>
			<div class="section-title">APP</div>
			<div class="rows">
				{#if languages.length !== 0}
					<div class="row">
						<div class="row-main">
							<div class="row-label">Language</div>
						</div>
						<span class="select-wrap">
							<select value={locale} onchange={(e) => setLocale(e.currentTarget.value)}>
								{#each languages as option (option.value)}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
							<Icon name="expand_more" size={18} />
						</span>
					</div>
				{/if}
				<div class="row">
					<div class="row-main">
						<div class="row-label">Reduce motion</div>
					</div>
					<div
						class="switch pressable"
						class:on={reduceMotion}
						use:Ripple={PRESS_RIPPLE}
						onclick={() => setReduceMotion(!reduceMotion)}
					>
						<div class="knob"></div>
					</div>
				</div>
				<div class="row">
					<div class="row-main">
						<div class="row-label">YouTube add-on</div>
					</div>
					<div
						class="switch pressable"
						class:on={youtube}
						use:Ripple={PRESS_RIPPLE}
						onclick={() => setYoutube(!youtube)}
					>
						<div class="knob"></div>
					</div>
				</div>
				<div class="row">
					<div class="row-main">
						<div class="row-label">MapTiler API key</div>
					</div>
					<input
						class="inline-text"
						type="password"
						value={maptilerKey}
						placeholder="API key"
						autocomplete="new-password"
						spellcheck="false"
						onfocus={handleKeyFocus}
						onblur={handleKeyFocus}
						onchange={(event) => setMaptilerKey(event.currentTarget.value)}
					/>
				</div>
				<div class="row">
					<div class="row-main">
						<div class="row-label">Version</div>
					</div>
					<span class="row-value">{installedVersion ?? 'Loading...'}</span>
				</div>
			</div>
			<div class="section-note">
				These settings save immediately and apply to the whole app, separate from the dashboard
				edits above.
			</div>
			{#if saveError}
				<div class="error">{saveError}</div>
			{/if}
		</section>

		<section>
			<div class="section-title">ADVANCED</div>
			<div class="rows">
				<div
					class="row action pressable"
					use:Ripple={PRESS_RIPPLE}
					onclick={() => editor.set({ kind: 'code' })}
				>
					<Icon name="code" size={18} />
					<div class="row-main">
						<div class="row-label">Edit configuration YAML</div>
						<div class="row-sub">Edits the whole configuration as YAML in one place</div>
					</div>
					<Icon name="chevron_right" size={20} />
				</div>
				<div class="row action pressable" use:Ripple={PRESS_RIPPLE} onclick={openClassicDashboard}>
					<Icon name="grid_view" size={18} />
					<div class="row-main">
						<div class="row-label">Classic dashboard</div>
						<div class="row-sub">Back to the original ha-fusion dashboard</div>
					</div>
					<Icon name="chevron_right" size={20} />
				</div>
				<div class="row action danger pressable" use:Ripple={PRESS_RIPPLE} onclick={handleLogout}>
					<Icon name="logout" size={18} />
					<div class="row-main">
						<div class="row-label">Log out</div>
						<div class="row-sub">Clears the Home Assistant session</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</EditSheet>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-width: 560px;
		margin: 0 auto;
		width: 100%;
	}

	.section-title {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 0 0 8px;
	}

	.section-note {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 8px 2px 0;
	}

	.rows {
		border-radius: var(--h-radius-sm);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		background: var(--h-track);
		overflow: hidden;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 16px;
		min-height: 56px;
	}

	.row + .row {
		border-top: 1px solid rgb(var(--h-surface-rgb) / 0.06);
	}

	.row-main {
		flex: 1;
		min-width: 0;
	}

	.row-label {
		font-size: 14px;
		color: var(--h-text-2);
	}

	.row-sub {
		font-size: 12px;
		color: var(--h-text-6);
		margin-top: 2px;
	}

	.row-value {
		font-size: 14px;
		color: var(--h-text-3);
	}

	.row.action {
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		color: var(--h-icon);
	}

	.row.action:hover {
		background: rgb(var(--h-surface-rgb) / 0.04);
	}

	.row.action.danger .row-label {
		color: var(--h-bad-text);
	}

	.row.action.danger:hover {
		background: rgb(var(--h-bad-rgb) / 0.08);
	}

	.select-wrap {
		position: relative;
		display: flex;
		align-items: center;
		flex: none;
		color: var(--h-icon);
	}

	.select-wrap :global(.mi) {
		position: absolute;
		right: 8px;
		pointer-events: none;
	}

	select {
		appearance: none;
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.06);
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 14px;
		padding: 8px 32px 8px 12px;
		outline: none;
		cursor: pointer;
	}

	select:focus {
		border-color: rgb(var(--h-accent-rgb) / 0.4);
	}

	option {
		background: var(--h-sheet-0);
	}

	.unit-input {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: none;
	}

	.unit {
		font-size: 13px;
		color: var(--h-text-6);
	}

	.unit-input input {
		width: 72px;
		text-align: right;
		padding: 8px 10px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: rgb(var(--h-surface-rgb) / 0.06);
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 14px;
		outline: none;
	}

	.inline-text {
		width: min(240px, 45%);
		padding: 8px 12px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: rgb(var(--h-surface-rgb) / 0.06);
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 14px;
		outline: none;
	}

	.unit-input input:focus,
	.inline-text:focus {
		border-color: rgb(var(--h-accent-rgb) / 0.4);
	}

	.switch {
		width: 52px;
		height: 30px;
		border-radius: 15px;
		cursor: pointer;
		position: relative;
		transition: background 0.2s;
		flex: none;
		background: rgb(var(--h-surface-rgb) / 0.12);
	}

	.switch.on {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
	}

	.knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--h-icon);
		transition: left 0.2s;
	}

	.switch.on .knob {
		left: 25px;
		background: var(--h-on-accent);
	}

	.error {
		font-size: 12px;
		color: var(--h-bad-text);
		margin: 8px 2px 0;
	}
</style>
