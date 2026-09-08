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
