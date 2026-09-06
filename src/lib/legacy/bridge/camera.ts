/**
 * The original camera player, used by the Hearth camera card and detail sheet
 * until a native one exists. Loaded on demand: it pulls hls.js and the
 * original stores, which must not ship in the Hearth entry.
 */
export const loadLegacyCamera = () => import('../Main/Camera.svelte');
