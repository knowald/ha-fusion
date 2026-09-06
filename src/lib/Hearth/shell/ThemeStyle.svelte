<script lang="ts">
	import { motion } from '$lib/core/app/motion';
	import { states } from '$lib/core/ha/entities';
	import { isNightState, THEME_DEFAULTS, themeStyle, type HearthTheme } from '$lib/core/theme';
	import { THEME_BRIDGE_CSS } from '$lib/legacy/bridge/themeBridge';
	import { editedThemeSlot, editor, hearthConfig, hearthEditMode } from '../store';

	/** A display-only preset from ?theme=, replacing the stored theme without touching the config. */
	let { presetOverride = undefined }: { presetOverride?: { theme: HearthTheme | null } } = $props();

	// While editing, preview the selected slot. At runtime the configured HA
	// entity decides whether the full day or night theme is active.
	let night = $derived(
		$hearthEditMode && $editor?.kind === 'theme'
			? $editedThemeSlot === 'night'
			: isNightState(
					$states?.[$hearthConfig.day_night?.entity ?? '']?.state,
					$hearthConfig.day_night
				)
	);

	let storedTheme = $derived(
		night ? ($hearthConfig.theme_night ?? $hearthConfig.theme) : $hearthConfig.theme
	);

	let activeTheme = $derived(presetOverride ? (presetOverride.theme ?? undefined) : storedTheme);

	// CSS custom properties do not transition by themselves. Briefly blanket
	// the rendered tree when the switch changes, then release component styles.
	let lastNight: boolean | undefined;

	$effect(() => {
		const switched = lastNight !== undefined && lastNight !== night;
		lastNight = night;
		if (!switched || !$motion) return;
		const root = document.documentElement;
		root.classList.add('theme-fade');
		const timer = setTimeout(() => root.classList.remove('theme-fade'), 700);
		return () => {
			clearTimeout(timer);
			root.classList.remove('theme-fade');
		};
	});

	// tokens live on :root (not .frame) so modals portaled outside the frame
	// resolve them too; base first, user theme overrides second
	let rootCss = $derived(
		`:root { ${themeStyle(THEME_DEFAULTS)} ${themeStyle(activeTheme)} ${THEME_BRIDGE_CSS} ` +
			`--h-pad-x: ${Math.max(0, $hearthConfig.padding_x ?? 0)}px; ` +
			`--h-pad-y: ${Math.max(0, $hearthConfig.padding_y ?? 0)}px; }`
	);
</script>

<svelte:head>
	{@html `<style>${rootCss}</style>`}
</svelte:head>
