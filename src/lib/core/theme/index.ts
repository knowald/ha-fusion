/*
 * Theme tokens, derivation and presets. A theme is a flat map of knob name to
 * value that `themeStyle()` turns into the `--h-*` custom properties every
 * surface reads.
 */

export type HearthTheme = Record<string, string>;

/** Selects the night theme from a Home Assistant entity state. */
export interface DayNightSwitch {
	entity: string;
	night_state?: string;
}

/**
 * Theme knobs exposed in hearth.yaml's `theme:` block, mapped to the CSS
 * custom properties whose defaults live on `.frame` in HearthDashboard.
 * `rgb` knobs accept a hex color and are stored as an R G B triplet so
 * alpha tints can be derived from a single hue.
 */
export const THEME_VARS: Record<string, { cssVar: string; rgb?: boolean; raw?: boolean }> = {
	background_inner: { cssVar: '--h-bg-0' },
	background_outer: { cssVar: '--h-bg-1' },
	// CSS image value ('none' or 'url(...)') layered over the background gradient
	background_image: { cssVar: '--h-bg-image' },
	sheet_top: { cssVar: '--h-sheet-0' },
	sheet_bottom: { cssVar: '--h-sheet-1' },
	overlay: { cssVar: '--h-overlay' },
	surface: { cssVar: '--h-surface-rgb', rgb: true },
	line: { cssVar: '--h-line-rgb', rgb: true },
	fill_scale: { cssVar: '--h-fill-scale', raw: true },
	line_scale: { cssVar: '--h-line-scale', raw: true },
	accent_scale: { cssVar: '--h-accent-scale', raw: true },
	card_shadow: { cssVar: '--h-card-shadow' },
	inset: { cssVar: '--h-inset' },
	track: { cssVar: '--h-track' },
	accent: { cssVar: '--h-accent-rgb', rgb: true },
	accent_deep: { cssVar: '--h-accent-deep' },
	accent_bright: { cssVar: '--h-accent-bright' },
	accent_icon: { cssVar: '--h-accent-icon' },
	accent_text: { cssVar: '--h-accent-text' },
	accent_dim_text: { cssVar: '--h-accent-dim-text' },
	on_accent: { cssVar: '--h-on-accent' },
	label: { cssVar: '--h-label' },
	cool: { cssVar: '--h-cool-rgb', rgb: true },
	cool_light: { cssVar: '--h-cool-light' },
	cool_icon: { cssVar: '--h-cool-icon' },
	cool_text: { cssVar: '--h-cool-text' },
	on_cool: { cssVar: '--h-on-cool' },
	good: { cssVar: '--h-good' },
	good_text: { cssVar: '--h-good-text' },
	bad: { cssVar: '--h-bad-rgb', rgb: true },
	bad_text: { cssVar: '--h-bad-text' },
	media: { cssVar: '--h-media' },
	media_art_top: { cssVar: '--h-media-art-1' },
	media_art_bottom: { cssVar: '--h-media-art-2' },
	text_1: { cssVar: '--h-text-1' },
	text_2: { cssVar: '--h-text-2' },
	text_3: { cssVar: '--h-text-3' },
	text_4: { cssVar: '--h-text-4' },
	text_5: { cssVar: '--h-text-5' },
	text_6: { cssVar: '--h-text-6' },
	icon: { cssVar: '--h-icon' },
	icon_dim: { cssVar: '--h-icon-dim' },
	font_ui: { cssVar: '--h-font-ui' },
	font_mono: { cssVar: '--h-font-mono' },
	radius_xl: { cssVar: '--h-radius-xl' },
	radius_lg: { cssVar: '--h-radius-lg' },
	radius_card: { cssVar: '--h-radius-card' },
	radius_md: { cssVar: '--h-radius-md' },
	radius_sm: { cssVar: '--h-radius-sm' },
	radius_xs: { cssVar: '--h-radius-xs' }
};

/**
 * Default value for every theme knob - the Calm Hearth look. Serves both as
 * the base `:root` stylesheet (via themeStyle) and as picker defaults when a
 * knob is not set in the user theme.
 */
export const THEME_DEFAULTS: Record<string, string> = {
	background_inner: '#2a2017',
	background_outer: '#16110c',
	background_image: 'none',
	sheet_top: '#2c2118',
	sheet_bottom: '#1d160f',
	overlay: 'rgba(10, 7, 4, 0.62)',
	inset: 'rgba(0, 0, 0, 0.18)',
	track: 'rgba(0, 0, 0, 0.3)',
	font_ui: "'Hanken Grotesk Variable', sans-serif",
	font_mono: "'Geist Mono Variable', monospace",
	radius_xl: '28px',
	radius_lg: '22px',
	radius_card: '20px',
	radius_md: '18px',
	radius_sm: '14px',
	radius_xs: '12px',
	surface: '#ffeedc',
	line: '#ffeedc',
	fill_scale: '1',
	line_scale: '1',
	accent_scale: '1',
	card_shadow: 'none',
	accent: '#f0b860',
	accent_deep: '#e8a04a',
	accent_bright: '#f4c879',
	accent_icon: '#f4c879',
	accent_text: '#f3d9a8',
	accent_dim_text: '#d3b889',
	on_accent: '#1a0f05',
	label: '#a08c6e',
	cool: '#5f9cc0',
	cool_light: '#9fc7d8',
	cool_icon: '#7fb6d9',
	cool_text: '#90a9b4',
	on_cool: '#0c1a22',
	good: '#7fd99a',
	good_text: '#9bc7a8',
	bad: '#e0786e',
	bad_text: '#f0b0a8',
	media: '#1ed760',
	media_art_top: '#5a2230',
	media_art_bottom: '#4a1d28',
	text_1: '#f7efe4',
	text_2: '#f1e6d6',
	text_3: '#cdbfae',
	text_4: '#a99a89',
	text_5: '#8c8073',
	text_6: '#7d7265',
	icon: '#9a8d7d',
	icon_dim: '#7a7064'
};

export function mixHex(a: string, b: string, t: number): string {
	const channel = (offset: number) => {
		const from = parseInt(a.slice(offset, offset + 2), 16);
		const to = parseInt(b.slice(offset, offset + 2), 16);
		return Math.round(from * (1 - t) + to * t)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${channel(1)}${channel(3)}${channel(5)}`;
}

/* Single-color pickers derive their sibling knobs for the theme's luminance. */

export function deriveAccent(hex: string, light = false): HearthTheme {
	if (light) {
		return {
			accent: hex,
			accent_deep: mixHex(hex, '#000000', 0.22),
			accent_bright: mixHex(hex, '#ffffff', 0.18),
			accent_icon: mixHex(hex, '#000000', 0.62),
			accent_text: mixHex(hex, '#000000', 0.35),
			accent_dim_text: mixHex(hex, '#000000', 0.5),
			on_accent: mixHex(hex, '#000000', 0.78)
		};
	}
	return {
		accent: hex,
		accent_deep: mixHex(hex, '#000000', 0.12),
		accent_bright: mixHex(hex, '#ffffff', 0.22),
		accent_icon: mixHex(hex, '#ffffff', 0.22),
		accent_text: mixHex(hex, '#ffffff', 0.45),
		accent_dim_text: mixHex(hex, '#ffffff', 0.18),
		on_accent: mixHex(hex, '#000000', 0.88)
	};
}

export function deriveCool(hex: string, light = false): HearthTheme {
	if (light) {
		return {
			cool: hex,
			cool_light: mixHex(hex, '#000000', 0.1),
			cool_icon: mixHex(hex, '#000000', 0.22),
			cool_text: mixHex(hex, '#000000', 0.38),
			on_cool: '#ffffff'
		};
	}
	return {
		cool: hex,
		cool_light: mixHex(hex, '#ffffff', 0.35),
		cool_icon: mixHex(hex, '#ffffff', 0.2),
		cool_text: mixHex(hex, '#aab4ba', 0.4),
		on_cool: mixHex(hex, '#000000', 0.85)
	};
}

export function deriveBad(hex: string, light = false): HearthTheme {
	return { bad: hex, bad_text: mixHex(hex, light ? '#000000' : '#ffffff', 0.35) };
}

export function deriveBackground(inner: string, outer: string): HearthTheme {
	return {
		background_inner: inner,
		background_outer: outer,
		sheet_top: mixHex(inner, '#ffffff', 0.03),
		sheet_bottom: mixHex(outer, '#ffffff', 0.03)
	};
}

/** Perceived brightness of a hex color, from black (0) to white (1). */
export function luminance(hex: string): number {
	if (!/^#[0-9a-fA-F]{6}$/.test(hex.trim())) return 0;
	const value = hex.trim();
	const [r, g, b] = [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
	return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function isLightTheme(theme?: HearthTheme): boolean {
	const background = theme?.background_outer ?? THEME_DEFAULTS.background_outer;
	return luminance(background) > 0.5;
}

export function deriveText(ink: string, background: string, light = false): HearthTheme {
	return {
		...(light ? { surface: '#ffffff', line: ink } : {}),
		text_1: ink,
		text_2: mixHex(ink, background, 0.07),
		text_3: mixHex(ink, background, 0.19),
		text_4: mixHex(ink, background, 0.35),
		text_5: mixHex(ink, background, 0.48),
		text_6: mixHex(ink, background, 0.54),
		label: mixHex(ink, background, 0.42),
		icon: mixHex(ink, background, 0.41),
		icon_dim: mixHex(ink, background, 0.55),
		...(light ? {} : { surface: mixHex(ink, '#ffffff', 0.35), line: mixHex(ink, '#ffffff', 0.35) })
	};
}

export const RADIUS_SCALES: { value: string; label: string; factor: number }[] = [
	{ value: 'sharp', label: 'Sharp', factor: 0.45 },
	{ value: 'soft', label: 'Soft (default)', factor: 1 },
	{ value: 'round', label: 'Round', factor: 1.5 }
];

const RADIUS_BASE: Record<string, number> = {
	radius_xl: 28,
	radius_lg: 22,
	radius_card: 20,
	radius_md: 18,
	radius_sm: 14,
	radius_xs: 12
};

export function deriveRadii(factor: number): HearthTheme {
	return Object.fromEntries(
		Object.entries(RADIUS_BASE).map(([key, base]) => [key, `${Math.round(base * factor)}px`])
	);
}

interface ThemeSeed {
	accent: string;
	cool?: string;
	backgroundInner: string;
	backgroundOuter: string;
	ink: string;
	light?: boolean;
}

export function buildTheme(seed: ThemeSeed): HearthTheme {
	const light = seed.light ?? false;
	const mediaArtTop = mixHex(seed.accent, seed.backgroundOuter, 0.72);
	return {
		...deriveBackground(seed.backgroundInner, seed.backgroundOuter),
		...deriveText(seed.ink, seed.backgroundOuter, light),
		...deriveAccent(seed.accent, light),
		...(seed.cool ? deriveCool(seed.cool, light) : {}),
		...(light
			? {
					fill_scale: '8',
					line_scale: '1.1',
					accent_scale: '2.8',
					card_shadow: `0 1px 2px rgb(${hexToTriplet(seed.ink)} / 0.07)`,
					inset: 'rgba(0, 0, 0, 0.05)',
					track: 'rgba(0, 0, 0, 0.08)',
					overlay: 'rgba(30, 24, 16, 0.4)',
					sheet_top: '#ffffff',
					sheet_bottom: mixHex(seed.backgroundInner, '#ffffff', 0.5)
				}
			: {}),
		// fallback album-art stripes when nothing is playing
		media_art_top: mediaArtTop,
		media_art_bottom: mixHex(mediaArtTop, '#000000', 0.15)
	};
}

export const WARM_PAPER_THEME: HearthTheme = {
	...buildTheme({
		accent: '#e9a13b',
		cool: '#5185a8',
		backgroundInner: '#f8f3ea',
		backgroundOuter: '#ede5d7',
		ink: '#241d14',
		light: true
	}),
	good: '#4d7c48',
	good_text: '#3f6b3b',
	bad: '#c0503f',
	bad_text: '#a03a2c',
	media: '#12a04a',
	media_art_top: '#c9a98f',
	media_art_bottom: '#b08f74'
};

export const THEME_PRESETS: { id: string; name: string; theme: HearthTheme | null }[] = [
	{ id: 'hearth', name: 'Calm Hearth', theme: null },
	{ id: 'paper', name: 'Warm Paper (day)', theme: WARM_PAPER_THEME },
	{
		id: 'slate',
		name: 'Slate',
		theme: buildTheme({
			accent: '#6fc3c9',
			cool: '#7f9cc9',
			backgroundInner: '#1c2430',
			backgroundOuter: '#0d1218',
			ink: '#eef5f9'
		})
	},
	{
		id: 'forest',
		name: 'Forest',
		theme: buildTheme({
			accent: '#a8c98a',
			cool: '#7fb6d9',
			backgroundInner: '#1d2418',
			backgroundOuter: '#0f140b',
			ink: '#f0f5e8'
		})
	},
	{
		id: 'plum',
		name: 'Plum',
		theme: buildTheme({
			accent: '#d9a3c9',
			cool: '#9fa3e0',
			backgroundInner: '#251b28',
			backgroundOuter: '#130e16',
			ink: '#f5eef7'
		})
	},
	{
		// approximates the original ha-fusion "muted" theme: cool grey-blue
		// background, white active buttons, Inter, small radii (no background
		// photo - set the background_image knob for one)
		id: 'muted',
		name: 'Muted (fusion)',
		theme: {
			...buildTheme({
				accent: '#e6e8e9',
				cool: '#8fa3ad',
				backgroundInner: '#20262a',
				backgroundOuter: '#14181b',
				ink: '#e3e5e6'
			}),
			...deriveRadii(0.36),
			font_ui: "'Inter Variable', system-ui"
		}
	}
];

function hexToTriplet(value: string) {
	const hex = value.trim();
	if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return value;
	return `${parseInt(hex.slice(1, 3), 16)} ${parseInt(hex.slice(3, 5), 16)} ${parseInt(hex.slice(5, 7), 16)}`;
}

export function themeStyle(theme?: HearthTheme): string {
	if (!theme) return '';
	return Object.entries(theme)
		.filter(([key]) => key in THEME_VARS)
		.map(([key, value]) => {
			const { cssVar, rgb, raw } = THEME_VARS[key];
			// the result lands in a raw <style> tag, so strip anything that could
			// close the tag or the :root block (no legal CSS value needs these)
			const safe = String(value).replace(/[<>{}]/g, '');
			const resolved = rgb ? hexToTriplet(safe) : !raw && /^\d+$/.test(safe) ? `${safe}px` : safe;
			return `${cssVar}: ${resolved};`;
		})
		.join(' ');
}

/**
 * Defaults cover sun.sun, binary sensors, and common day/night template
 * sensors. A configured night_state may contain a comma-separated list.
 */
const NIGHT_STATES = new Set([
	'below_horizon',
	'night',
	'dark',
	'on',
	'true',
	'asleep',
	'sleeping'
]);

export function isNightState(state: string | undefined, config?: DayNightSwitch): boolean {
	if (!config?.entity || !state) return false;
	const current = state.trim().toLowerCase();
	if (config.night_state) {
		return config.night_state
			.split(',')
			.map((entry) => entry.trim().toLowerCase())
			.filter(Boolean)
			.includes(current);
	}
	return NIGHT_STATES.has(current);
}

/**
 * Maps the original fusion `--theme-*` custom properties onto hearth tokens so
 * reused components (domain modals, sidebar widgets, main objects) pick up the
 * hearth look without their own theme file.
 */
export const THEME_BRIDGE_CSS = `
	--theme-font-family: var(--h-font-ui);
	--theme-background-image: var(--h-bg-image), radial-gradient(1000px 700px at 14% -5%, var(--h-bg-0), var(--h-bg-1) 62%);
	--theme-colors-text: var(--h-text-2);
	--theme-colors-title: var(--h-text-1);
	--theme-colors-icon: var(--h-icon);
	--theme-colors-sidebar-background: transparent;
	--theme-colors-sidebar-border: none;
	--theme-sizes-sidebar-time: 3.4rem;
	--theme-button-background-color-on: rgb(var(--h-accent-rgb));
	--theme-button-background-color-off: rgb(var(--h-surface-rgb) / calc(0.08 * var(--h-fill-scale)));
	--theme-button-name-color-on: var(--h-on-accent);
	--theme-button-name-color-off: var(--h-text-2);
	--theme-button-state-color-on: var(--h-on-accent);
	--theme-button-state-color-off: var(--h-text-5);
	--theme-display-only-background-color: rgb(var(--h-surface-rgb) / calc(0.04 * var(--h-fill-scale)));
	--theme-display-only-name-color: var(--h-text-2);
	--theme-display-only-state-color: var(--h-text-4);
	--theme-modal-background-color-modal: var(--h-sheet-0);
	--theme-navigate-background-color: rgb(var(--h-surface-rgb) / calc(0.08 * var(--h-fill-scale)));
	--theme-sidebar-font-size: 1rem;
	--theme-sidebar-item-padding: 0.6rem 0;
	--theme-sidebar-padding: 0;
	--theme-sidebar-divider: 1px solid rgb(var(--h-line-rgb) / calc(0.12 * var(--h-line-scale)));
	--theme-border-radius: var(--h-radius-xs);
`;

export const SWATCH_COLORS = ['#f4c879', '#f0925f', '#e0788a', '#b39ddb', '#9fc7d8', '#a6cdb2'];
