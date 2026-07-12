<script lang="ts">
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

	let theme = $derived($hearthConfig.theme ?? {});

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
</script>

<EditSheet title="Theme" onclose={close} ondone={close}>
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
</style>
