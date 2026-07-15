<script lang="ts">
	import { get } from 'svelte/store';
	import {
		deriveAccent,
		deriveBackground,
		deriveBad,
		deriveCool,
		deriveRadii,
		deriveText,
		RADIUS_SCALES,
		THEME_DEFAULTS,
		THEME_PRESETS,
		type HearthTheme
	} from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import ColorField from './ColorField.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';
	import Icon from '../Icon.svelte';

	interface SavedTheme {
		id: string;
		name: string;
		theme: HearthTheme;
	}

	let theme = $derived($hearthConfig.theme ?? {});

	function unwrapUrl(value?: string): string {
		if (!value || value === 'none') return '';
		const match = value.match(/^url\((.*)\)$/);
		return match ? match[1].replace(/^['"]|['"]$/g, '') : value;
	}

	let backgroundImageUrl = $state(unwrapUrl(get(hearthConfig).theme?.background_image));

	// applied on Done rather than per keystroke to keep the undo stack sane
	function applyBackgroundImage() {
		const url = backgroundImageUrl.trim();
		if (url === unwrapUrl(theme.background_image)) return;
		updateConfig((config) => {
			if (url) {
				config.theme = { ...config.theme, background_image: `url(${url})` };
			} else if (config.theme) {
				delete config.theme.background_image;
			}
		});
	}

	function knob(key: string): string {
		return theme[key] ?? THEME_DEFAULTS[key] ?? '#000000';
	}

	function patchTheme(patch: HearthTheme) {
		updateConfig((config) => {
			config.theme = { ...config.theme, ...patch };
		});
	}

	function applyPreset(preset: HearthTheme | null) {
		updateConfig((config) => {
			config.theme = preset ? { ...preset } : undefined;
		});
		backgroundImageUrl = '';
	}

	let savedThemes = $state<SavedTheme[]>([]);
	let themesLoading = $state(false);
	let themesError = $state('');
	let newThemeName = $state('');
	let saving = $state(false);

	async function loadThemes() {
		themesLoading = true;
		themesError = '';
		try {
			const response = await fetch('/_api/hearth_themes');
			if (!response.ok) throw new Error(`load failed: ${response.status}`);
			savedThemes = await response.json();
		} catch (err: any) {
			themesError = err.message ?? 'failed to load saved themes';
		} finally {
			themesLoading = false;
		}
	}

	$effect(() => {
		loadThemes();
	});

	async function saveCurrentTheme() {
		const name = newThemeName.trim();
		if (!name || saving) return;
		saving = true;
		themesError = '';
		try {
			const response = await fetch('/_api/hearth_themes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, theme })
			});
			if (!response.ok) throw new Error(`save failed: ${response.status}`);
			newThemeName = '';
			await loadThemes();
		} catch (err: any) {
			themesError = err.message ?? 'failed to save theme';
		} finally {
			saving = false;
		}
	}

	function applySavedTheme(saved: SavedTheme) {
		updateConfig((config) => {
			config.theme = { ...saved.theme };
		});
		backgroundImageUrl = unwrapUrl(saved.theme.background_image);
	}

	async function deleteSavedTheme(saved: SavedTheme) {
		if (!confirm(`Delete theme "${saved.name}"?`)) return;
		themesError = '';
		try {
			const response = await fetch('/_api/hearth_themes', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: saved.id })
			});
			if (!response.ok) throw new Error(`delete failed: ${response.status}`);
			savedThemes = savedThemes.filter((entry) => entry.id !== saved.id);
		} catch (err: any) {
			themesError = err.message ?? 'failed to delete theme';
		}
	}

	function swatch(saved: SavedTheme, key: string): string {
		return saved.theme[key] ?? THEME_DEFAULTS[key] ?? '#000000';
	}

	let radiusScale = $derived.by(() => {
		const current = parseInt(theme.radius_md ?? '18');
		return RADIUS_SCALES.reduce((nearest, scale) =>
			Math.abs(scale.factor * 18 - current) < Math.abs(nearest.factor * 18 - current)
				? scale
				: nearest
		).value;
	});

	function close() {
		editor.set(null);
	}

	function done() {
		applyBackgroundImage();
		close();
	}
</script>

<EditSheet title="Theme" onclose={close} ondone={done}>
	<div class="group-label">PRESETS</div>
	<div class="presets">
		{#each THEME_PRESETS as preset (preset.id)}
			<div class="preset pressable" onclick={() => applyPreset(preset.theme)}>
				<span
					class="preview"
					style:background="linear-gradient(135deg, {preset.theme?.background_inner ??
						THEME_DEFAULTS.background_inner} 55%, {preset.theme?.accent ?? THEME_DEFAULTS.accent})"
				></span>
				<span>{preset.name}</span>
			</div>
		{/each}
	</div>

	<div class="group-label">SAVED THEMES</div>
	<div class="save-row">
		<input
			type="text"
			bind:value={newThemeName}
			placeholder="Save current as..."
			spellcheck="false"
			onkeydown={(event) => event.key === 'Enter' && saveCurrentTheme()}
		/>
		<div
			class="button pressable"
			class:disabled={!newThemeName.trim() || saving}
			onclick={saveCurrentTheme}
		>
			Save
		</div>
	</div>

	{#if themesError}
		<div class="error">{themesError}</div>
	{/if}

	{#if themesLoading}
		<div class="hint">Loading saved themes...</div>
	{:else if savedThemes.length}
		<div class="saved-themes">
			{#each savedThemes as saved (saved.id)}
				<div class="saved-theme pressable" onclick={() => applySavedTheme(saved)}>
					<div class="dots">
						<span class="dot" style:background={swatch(saved, 'background_inner')}></span>
						<span class="dot" style:background={swatch(saved, 'accent')}></span>
						<span class="dot" style:background={swatch(saved, 'cool')}></span>
						<span class="dot" style:background={swatch(saved, 'text_1')}></span>
					</div>
					<span class="saved-theme-name">{saved.name}</span>
					<span
						class="icon-button"
						onclick={(event) => {
							event.stopPropagation();
							deleteSavedTheme(saved);
						}}
					>
						<Icon name="delete" size={18} />
					</span>
				</div>
			{/each}
		</div>
	{/if}

	<div class="hint">
		Saving or deleting a theme writes to disk immediately, independent of the dashboard save/undo
		cycle. Applying a saved theme only changes the edited theme - save the dashboard to keep it.
	</div>

	<div class="group-label">COLORS</div>
	<div class="picker-grid">
		<ColorField
			label="Accent"
			value={knob('accent')}
			onchange={(value) => patchTheme(deriveAccent(value))}
		/>
		<ColorField
			label="Cool accent"
			value={knob('cool')}
			onchange={(value) => patchTheme(deriveCool(value))}
		/>
		<ColorField
			label="Background top"
			value={knob('background_inner')}
			onchange={(value) => patchTheme(deriveBackground(value, knob('background_outer')))}
		/>
		<ColorField
			label="Background bottom"
			value={knob('background_outer')}
			onchange={(value) => patchTheme(deriveBackground(knob('background_inner'), value))}
		/>
		<ColorField
			label="Text"
			value={knob('text_1')}
			onchange={(value) => patchTheme(deriveText(value, knob('background_outer')))}
		/>
		<ColorField
			label="Good"
			value={knob('good')}
			onchange={(value) => patchTheme({ good: value, good_text: value })}
		/>
		<ColorField
			label="Alert"
			value={knob('bad')}
			onchange={(value) => patchTheme(deriveBad(value))}
		/>
		<ColorField
			label="Media"
			value={knob('media')}
			onchange={(value) => patchTheme({ media: value })}
		/>
	</div>

	<TextField
		label="Background image URL"
		bind:value={backgroundImageUrl}
		placeholder="/local/wallpaper.jpg or https://..."
	/>

	<SelectField
		label="Corners"
		value={radiusScale}
		options={RADIUS_SCALES.map(({ value, label }) => ({ value, label }))}
		onchange={(value) => {
			const scale = RADIUS_SCALES.find((entry) => entry.value === value);
			if (scale) patchTheme(deriveRadii(scale.factor));
		}}
	/>

	<div class="hint">
		Pickers set sensible derived shades automatically. All 44 knobs are tunable individually in
		data/hearth.yaml under theme:.
	</div>
	<div class="reset pressable" onclick={() => applyPreset(null)}>Reset to default theme</div>
</EditSheet>

<style>
	.group-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 4px 0 10px;
	}

	.presets {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 18px;
	}

	.preset {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 12px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.06);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		font-size: 14px;
		color: var(--h-text-3);
		cursor: pointer;
	}

	.preview {
		width: 22px;
		height: 22px;
		border-radius: 7px;
		border: 1px solid rgb(var(--h-surface-rgb) / 0.2);
		flex: none;
	}

	.picker-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 18px;
	}

	.hint {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 4px 0 12px;
	}

	.reset {
		text-align: center;
		padding: 12px;
		border-radius: var(--h-radius-xs);
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		color: var(--h-text-5);
		font-size: 14px;
		cursor: pointer;
	}

	.reset:hover {
		color: var(--h-text-3);
	}

	.save-row {
		display: flex;
		gap: 8px;
		margin-bottom: 10px;
	}

	.save-row input {
		flex: 1;
		padding: 11px 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: var(--h-track);
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 14px;
		outline: none;
		min-width: 0;
	}

	.save-row input:focus {
		border-color: rgb(var(--h-accent-rgb) / 0.4);
	}

	.save-row input::placeholder {
		color: var(--h-text-6);
	}

	.save-row .button {
		flex: none;
		padding: 0 16px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-accent-rgb) / 0.16);
		color: var(--h-accent-text);
		font-size: 14px;
		font-weight: 600;
		display: flex;
		align-items: center;
		cursor: pointer;
	}

	.save-row .button.disabled {
		opacity: 0.4;
		cursor: default;
	}

	.saved-themes {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 8px;
	}

	.saved-theme {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 12px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.06);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		font-size: 14px;
		color: var(--h-text-3);
		cursor: pointer;
	}

	.dots {
		display: flex;
		flex: none;
	}

	.dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 1px solid rgb(var(--h-surface-rgb) / 0.25);
		margin-left: -5px;
	}

	.dot:first-child {
		margin-left: 0;
	}

	.saved-theme-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.icon-button {
		flex: none;
		color: var(--h-icon);
		cursor: pointer;
	}

	.icon-button:hover {
		color: var(--h-bad-text);
	}

	.error {
		font-size: 12px;
		color: var(--h-bad-text);
		margin-bottom: 10px;
	}
</style>
