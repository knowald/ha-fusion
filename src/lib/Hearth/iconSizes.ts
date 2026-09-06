/** The four icon sizes Hearth draws; pick by role, not by eye. */
export const ICON = {
	/** beside text, in captions and chips */
	inline: 16,
	/** buttons, sheet headers, tile glyphs */
	control: 20,
	/** icon tiles and popup headers */
	tile: 24,
	/** page headers and hero art */
	hero: 32,
	/** the screensaver and setup wizard */
	display: 48
} as const;
