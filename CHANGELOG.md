# Changelog

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
