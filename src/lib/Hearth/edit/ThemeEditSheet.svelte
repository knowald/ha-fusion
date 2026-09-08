<script lang="ts">
	import { ICON } from '../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { activateOnKeyboard } from '../interaction';
	import { base } from '$app/paths';
	import { get } from 'svelte/store';
	import {
		deriveAccent,
		deriveBackground,
		deriveBad,
		deriveCool,
		deriveRadii,
		deriveText,
		isLightTheme,
		RADIUS_SCALES,
		THEME_DEFAULTS,
		THEME_PRESETS,
		type HearthTheme
	} from '$lib/core/theme';
	import { editedThemeSlot, editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import ColorField from './ColorField.svelte';
	import EntityField from './EntityField.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';
	import Icon from '../Icon.svelte';

	interface SavedTheme {
		id: string;
		name: string;
		theme: HearthTheme;
	}

	let slot = $derived($editedThemeSlot);

	function slotTheme(
		config: { theme?: HearthTheme; theme_night?: HearthTheme },
		target: 'day' | 'night' = slot
	): HearthTheme {
		return (target === 'night' ? config.theme_night : config.theme) ?? {};
	}

	let theme = $derived(slotTheme($hearthConfig));
	let light = $derived(isLightTheme(theme));
	let nightEnabled = $derived(Boolean($hearthConfig.theme_night));

	function unwrapUrl(value?: string): string {
		if (!value || value === 'none') return '';
		const match = value.match(/^url\((.*)\)$/);
		return match ? match[1].replace(/^['"]|['"]$/g, '') : value;
	}

	let backgroundImageUrl = $state(unwrapUrl(slotTheme(get(hearthConfig)).background_image));

	/** Night is stored as a full theme, so its first edit starts from day. */
	function writeTheme(next: (current: HearthTheme) => HearthTheme | undefined) {
		updateConfig((config) => {
			if (slot === 'night') {
				config.theme_night = next(config.theme_night ?? { ...config.theme });
			} else {
				config.theme = next(config.theme ?? {});
			}
		});
	}

	// applied on Done rather than per keystroke to keep the undo stack sane
	function applyBackgroundImage() {
		const url = backgroundImageUrl.trim();
		if (url === unwrapUrl(theme.background_image)) return;
		writeTheme((current) => {
			if (url) return { ...current, background_image: `url(${url})` };
			const next = { ...current };
			delete next.background_image;
			return next;
		});
	}

	function knob(key: string): string {
		return theme[key] ?? THEME_DEFAULTS[key] ?? '#000000';
	}

	function patchTheme(patch: HearthTheme) {
		writeTheme((current) => ({ ...current, ...patch }));
	}

	function applyPreset(preset: HearthTheme | null) {
		writeTheme(() =>
			preset ? { ...preset } : slot === 'night' ? { ...THEME_DEFAULTS } : undefined
		);
		backgroundImageUrl = preset ? unwrapUrl(preset.background_image) : '';
	}

	function selectSlot(next: 'day' | 'night') {
		if (next === slot) return;
		editedThemeSlot.set(next);
		backgroundImageUrl = unwrapUrl(slotTheme(get(hearthConfig), next).background_image);
	}

	let switchEntity = $state(get(hearthConfig).day_night?.entity ?? '');
	let nightState = $state(get(hearthConfig).day_night?.night_state ?? '');

	function applySwitch() {
		const entity = switchEntity.trim();
		const state = nightState.trim();
		const current = get(hearthConfig).day_night;
		if (entity === (current?.entity ?? '') && state === (current?.night_state ?? '')) return;
		updateConfig((config) => {
			config.day_night = entity ? { entity, ...(state ? { night_state: state } : {}) } : undefined;
		});
	}

	function disableNightTheme() {
		updateConfig((config) => {
			config.theme_night = undefined;
		});
		selectSlot('day');
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
			const response = await fetch(`${base}/_api/hearth_themes`);
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
			const response = await fetch(`${base}/_api/hearth_themes`, {
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
		writeTheme(() => ({ ...saved.theme }));
		backgroundImageUrl = unwrapUrl(saved.theme.background_image);
	}

	async function deleteSavedTheme(saved: SavedTheme) {
		if (!confirm(`Delete theme "${saved.name}"?`)) return;
		themesError = '';
		try {
			const response = await fetch(`${base}/_api/hearth_themes`, {
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
		editedThemeSlot.set('day');
		editor.set(null);
	}

	function done() {
		applyBackgroundImage();
		applySwitch();
		close();
	}
</script>

<EditSheet title={$lang('theme')} onclose={close} ondone={done}>
	<div class="slots">
		<div
			class="slot pressable"
			class:active={slot === 'day'}
			onclick={() => selectSlot('day')}
			role="button"
			tabindex="0"
			onkeydown={(event) => activateOnKeyboard(event, () => selectSlot('day'))}
		>
			<Icon name="light_mode" size={ICON.control} />
			<span>{$lang('day')}</span>
		</div>
		<div
			class="slot pressable"
			class:active={slot === 'night'}
			onclick={() => selectSlot('night')}
			role="button"
			tabindex="0"
			onkeydown={(event) => activateOnKeyboard(event, () => selectSlot('night'))}
		>
			<Icon name="dark_mode" size={ICON.control} />
			<span>{$lang('alarm_modes_armed_night')}</span>
			{#if !nightEnabled}<span class="slot-note">{$lang('hearth_off')}</span>{/if}
		</div>
	</div>

	<div class="hint">
		{#if slot === 'night'}
			{#if nightEnabled}
				{$lang('hearth_shown_while_the_switch_entity_reads')}
			{:else}
				{$lang('hearth_night_theme_is_off_its_first')}
			{/if}
		{:else}
			{$lang('hearth_the_default_theme_also_used_after')}
		{/if}
	</div>

	<div class="group-label">{$lang('hearth_day_night_switch')}</div>
	<EntityField label={$lang('hearth_switch_entity')} bind:value={switchEntity} />
	<TextField
		label={$lang('hearth_night_states')}
		bind:value={nightState}
		placeholder="below_horizon"
	/>
	<div class="hint">
		{$lang('hearth_comma_separated_when_empty_below_horizon')}
	</div>

	{#if nightEnabled}
		<div
			class="reset pressable"
			onclick={disableNightTheme}
			role="button"
			tabindex="0"
			onkeydown={(event) => activateOnKeyboard(event, disableNightTheme)}
		>
			{$lang('hearth_turn_off_the_night_theme')}
		</div>
	{/if}

	<div class="group-label">{$lang('hearth_presets')}</div>
	<div class="presets">
		{#each THEME_PRESETS as preset (preset.id)}
			<div
				class="preset pressable"
				onclick={() => applyPreset(preset.theme)}
				role="button"
				tabindex="0"
				onkeydown={(event) => activateOnKeyboard(event, () => applyPreset(preset.theme))}
			>
				<span
					class="preview"
					style:background="linear-gradient(135deg, {preset.theme?.background_inner ??
						THEME_DEFAULTS.background_inner} 55%, {preset.theme?.accent ?? THEME_DEFAULTS.accent})"
				></span>
				<span>{preset.name}</span>
			</div>
		{/each}
	</div>

	<div class="group-label">{$lang('hearth_saved_themes')}</div>
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
			role="button"
			tabindex="0"
			onkeydown={(event) => activateOnKeyboard(event, saveCurrentTheme)}
		>
			{$lang('save')}
		</div>
	</div>

	{#if themesError}
		<div class="error">{themesError}</div>
	{/if}

	{#if themesLoading}
		<div class="hint">{$lang('hearth_loading_saved_themes')}</div>
	{:else if savedThemes.length}
		<div class="saved-themes">
			{#each savedThemes as saved (saved.id)}
				<div
					class="saved-theme pressable"
					onclick={() => applySavedTheme(saved)}
					role="button"
					tabindex="0"
					onkeydown={(event) => activateOnKeyboard(event, () => applySavedTheme(saved))}
				>
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
						role="button"
						tabindex="0"
						onkeydown={(event) =>
							activateOnKeyboard(event, () =>
								((event) => {
									event.stopPropagation();
									deleteSavedTheme(saved);
								})(event)
							)}
					>
						<Icon name="delete" size={ICON.control} />
					</span>
				</div>
			{/each}
		</div>
	{/if}

	<div class="hint">
		{$lang('hearth_saving_or_deleting_a_theme_writes')}
	</div>

	<div class="group-label">{$lang('hearth_colors')}</div>
	<div class="picker-grid">
		<ColorField
			label={$lang('hearth_accent')}
			value={knob('accent')}
			onchange={(value) => patchTheme(deriveAccent(value, light))}
		/>
		<ColorField
			label={$lang('hearth_cool_accent')}
			value={knob('cool')}
			onchange={(value) => patchTheme(deriveCool(value, light))}
		/>
		<ColorField
			label={$lang('hearth_background_top')}
			value={knob('background_inner')}
			onchange={(value) => patchTheme(deriveBackground(value, knob('background_outer')))}
		/>
		<ColorField
			label={$lang('hearth_background_bottom')}
			value={knob('background_outer')}
			onchange={(value) => patchTheme(deriveBackground(knob('background_inner'), value))}
		/>
		<ColorField
			label={$lang('text')}
			value={knob('text_1')}
			onchange={(value) => patchTheme(deriveText(value, knob('background_outer'), light))}
		/>
		<ColorField
			label={$lang('hearth_good')}
			value={knob('good')}
			onchange={(value) => patchTheme({ good: value, good_text: value })}
		/>
		<ColorField
			label={$lang('hearth_alert')}
			value={knob('bad')}
			onchange={(value) => patchTheme(deriveBad(value, light))}
		/>
		<ColorField
			label={$lang('media')}
			value={knob('media')}
			onchange={(value) => patchTheme({ media: value })}
		/>
	</div>

	<TextField
		label={$lang('hearth_background_image_url')}
		bind:value={backgroundImageUrl}
		placeholder="/local/wallpaper.jpg or https://..."
	/>

	<SelectField
		label={$lang('hearth_corners')}
		value={radiusScale}
		options={RADIUS_SCALES.map(({ value, label }) => ({ value, label }))}
		onchange={(value) => {
			const scale = RADIUS_SCALES.find((entry) => entry.value === value);
			if (scale) patchTheme(deriveRadii(scale.factor));
		}}
	/>

	<div class="hint">
		{$lang('hearth_pickers_set_sensible_derived_shades_automatically')}
	</div>
	<div
		class="reset pressable"
		onclick={() => applyPreset(null)}
		role="button"
		tabindex="0"
		onkeydown={(event) => activateOnKeyboard(event, () => applyPreset(null))}
	>
		{slot === 'night'
			? $lang('hearth_reset_the_night_theme_to_defaults')
			: $lang('hearth_reset_the_day_theme_to_defaults')}
	</div>
</EditSheet>

<style>
	.slots {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 12px;
	}

	.slot {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 12px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		font-size: var(--h-type-body);
		color: var(--h-text-4);
		cursor: pointer;
	}

	.slot.active {
		background: rgb(var(--h-accent-rgb) / calc(0.16 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}

	.slot-note {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 1px;
		color: var(--h-text-6);
	}

	.group-label {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
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
		padding: 10px 12px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		font-size: var(--h-type-body);
		color: var(--h-text-3);
		cursor: pointer;
	}

	.preview {
		width: 22px;
		height: 22px;
		border-radius: var(--h-radius-tight);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.2 * var(--h-line-scale)));
		flex: none;
	}

	.picker-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-bottom: 18px;
	}

	.hint {
		font-size: var(--h-type-small);
		color: var(--h-text-6);
		margin: 4px 0 12px;
	}

	.reset {
		text-align: center;
		padding: 12px;
		border-radius: var(--h-radius-xs);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-5);
		font-size: var(--h-type-body);
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
		padding: 12px 14px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		background: var(--h-track);
		color: var(--h-text-2);
		font-family: inherit;
		font-size: var(--h-type-body);
		outline: none;
		min-width: 0;
	}

	.save-row input:focus {
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
	}

	.save-row input::placeholder {
		color: var(--h-text-6);
	}

	.save-row .button {
		flex: none;
		padding: 0 16px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-accent-rgb) / calc(0.16 * var(--h-accent-scale)));
		color: var(--h-accent-text);
		font-size: var(--h-type-body);
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
		padding: 10px 12px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		font-size: var(--h-type-body);
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
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.25 * var(--h-line-scale)));
		margin-left: -6px;
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
		font-size: var(--h-type-small);
		color: var(--h-bad-text);
		margin-bottom: 10px;
	}
</style>
