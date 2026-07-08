# Changelog

## [2026.7.1](https://github.com/knowald/ha-fusion/releases/tag/2026.7.1) - 2026-07-09

### Fixed

- Re-render the dashboard on in-place config edits and restrict section drag to the drag handle (e76cb7b)
- Replace the unknown domain error modal with a generic entity modal (910390d)
- Complete the PWA manifest and add an apple touch icon (06be9d1)
- Respect target_temp_step in the thermostat temperature wheel (6ce8c67)
- Only offer alarm arm modes the panel supports (abdd7c9)

## [2026.7.0](https://github.com/knowald/ha-fusion/releases/tag/2026.7.0) - 2026-07-07

### Added

- Add entities list card showing multiple entity states, with wildcard entity selection (1c14220)
- Add white channel sliders to the light modal for RGBW and RGBWW lights (e6d053a)
- Add option to hide the camera name overlay (5c4aded)

### Changed

- Soften the camera name overlay with less dimming and blur (5c4aded)
- Merge the Spotify player large variant into a single component (378fa1a)
- Extract a shared scaffold for config panels (5fef1a6, 69b7388)
- Rewrite the README as a maintained continuation of the original project, with a migration guide (4ee4e36, 3135697)
- Add CI workflow, issue templates, and automated release sync to the addon repo (5a4b539, c08a647, ee746d5, 9703e69)

### Fixed

- Fix toggle recursion when pressing group entity buttons (532a90e)
- Show a placeholder instead of a missing weather icon when the state is unknown or unavailable (3b859ac)
- Hide the alarm keypad and skip the code when the panel does not require one (8d45efb)
- Preserve white channels when picking colors on RGBW and RGBWW lights (e6d053a)
- Repair YouTube account linking in the video addon by updating youtubei.js (cdd9c19)

## [2026.3.3](https://github.com/knowald/ha-fusion/releases/tag/2026.3.3) - 2026-07-02

### Fixed

- Send `color_temp_kelvin` instead of the removed `kelvin` parameter, restoring the color temperature slider (8081243)
- Throttle light color and brightness service calls by time, so slow devices in a group no longer delay updates while dragging (6c5a2a7)

## [2026.3.2](https://github.com/knowald/ha-fusion/releases/tag/2026.3.2) - 2026-06-30

### Changed

- Migrate the app to Svelte 5 runes, converting all components, event handlers, and stores (7014436, 8f4db3b, a300430)
- Replace svelte-dnd-action with SortableJS for drag-and-drop under Svelte 5 (b445f23)
- Exclude legacy Svelte 4 libraries from Vite prebundling so they load in runes mode (f0e341f)
- Rewrite the README and refresh the preview screenshot (a523b94, 45c7e04)

### Fixed

- Resolve runtime `$effect` loops and reactivity bugs from the runes migration (e044194)
- Restore drag-drop UI updates and redo history after the migration (8643b05)
- Render a newly added object immediately in the dashboard editor (5b9f689)
- Correct drag reorder order and fix a crash on cross-zone item drops (174af9f)

## [2026.3.1](https://github.com/knowald/ha-fusion/releases/tag/2026.3.1) - 2026-03-29

### Added

- Add quick play shortcuts to Spotify widgets, shown when not playing (SpotifyShortcuts.svelte, SpotifyShortcutsConfig.svelte)
- Add rotating background from recently played tracks on idle Spotify widgets (SpotifyPlayer.svelte, SpotifyPlayerLarge.svelte)
- Add default device picker to Spotify widget config (SpotifyPlayerConfig.svelte, SpotifyPlayerLargeConfig.svelte)

### Changed

- Redesign Spotify player modal with side-by-side layout for smaller screens (SpotifyPlayerModal.svelte)
- Reduce modal font sizes and padding for higher information density (Modal.css, Index.svelte)

## [2026.3.0](https://github.com/knowald/ha-fusion/releases/tag/2026.3.0) - 2026-03-08

### Added

- Add vertical stack layout for arranging sections in columns (src/lib/Drawer/VerticalStackButton.svelte, src/lib/Main/VerticalStackHeader.svelte)
- Add nested vertical stacks inside horizontal stacks for complex layouts (src/lib/Main/Index.svelte)
- Add Docker environment example file for compose configuration (.env.docker.example)

### Changed

- Update Docker compose files to use environment variables for ports, paths, and settings (docker-compose.yml, docker-compose.dev.yml)
- Update Docker compose to use named networks and health checks (docker-compose.yml)
- Update Dockerfile.dev to call vite directly for correct `--host` binding (Dockerfile.dev)
- Update README to document vertical stacks and clean up formatting (README.md)
- Update visibility, search, drag-and-drop, and deletion logic to support vertical stacks (Conditional.ts, SearchInput.svelte, DeleteButton.svelte, ConfigButtons.svelte, Utils.ts)

## [2025.10.0](https://github.com/knowald/ha-fusion/releases/tag/2025.10.0) - 2025-10-01

_First release of the ha-fusion fork._

### Added

- Add Spotify player widgets (36adbcf)
- Add DaysSince modal for tracking elapsed time (817b223)
- Add custom CSS feature for user-defined styling (a8bb68f)
- Add serene theme (6a3e749)
- Add display-only option to buttons (2185e28)
- Add slide-to-adjust brightness on light buttons (36ef1bd)
- Add optimistic UI updates for instant button feedback (78d22f3)
