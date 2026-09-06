# ha-fusion

A modern, fast, custom dashboard for [Home Assistant](https://www.home-assistant.io/).

[![preview](/static/preview.png)](https://www.youtube.com/watch?v=D8mWruSuPOM)

Built with SvelteKit and Svelte 5. Connects to Home Assistant over WebSocket for real-time state, with a drag-and-drop editor for building views without writing YAML by hand.

ha-fusion was created by [matt8707](https://github.com/matt8707). This repository is the maintained continuation of the [original project](https://github.com/matt8707/ha-fusion); see [Credits](#credits).

## Features

- Hearth, a wall-panel dashboard built from pages, cards and a rail of widgets, edited in place and saved to `data/hearth.yaml`
- Cards for entity grids, sensors with history, media players with Spotify quick play, climate, cameras, images, picture elements, scenes, vacuums, days-since counters and whichever player is active
- Rail widgets for the clock, weather, navigation, search, energy, running activities, calendar, status, charts, templates, timers, notifications and web pages
- A detail sheet for every entity domain: switches, locks, numbers, selects, timers, alarms, thermostats, water heaters, humidifiers, valves, mowers, updates and more
- Optimistic updates, drag-to-dim lights and covers, long-press for controls, a screensaver and wake lock for wall tablets
- Availability shown honestly: an unreachable or missing entity never renders as "off", and failed commands are reported
- Themes with a day and night switch, custom CSS, translations for over 60 languages
- Runs as a Home Assistant add-on (with Ingress) or as a standalone Docker container

The original ha-fusion dashboard (`data/dashboard.yaml`) is still included at `/classic` for one release cycle; see [Dashboards](#dashboards).

## Requirements

- A running Home Assistant instance reachable over the network
- One of: the Home Assistant add-on (OS / Supervised), Docker (Container / Core), or a local Node.js setup for development

## Installation

### Add-on

For the "Operating System" or "Supervised" install methods:

1. Add the add-on repository. Use the button below, or add this URL manually: <https://github.com/knowald/addon-ha-fusion>.

   [![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fknowald%2Faddon-ha-fusion)

2. Refresh the add-on store, find ha-fusion, and install it.

### Docker

For the "Container" or "Core" install methods, run ha-fusion with Docker.

Place an edited copy of [docker-compose.yml](https://github.com/knowald/ha-fusion/blob/main/docker-compose.yml) in a directory of your choice, then:

```bash
cd path/to/docker-compose.yml
docker compose up -d ha-fusion
```

Update to the latest image:

```bash
docker compose pull ha-fusion
docker compose up -d ha-fusion
```

<details>
<summary><b>Without docker compose</b></summary>

Each update means stopping and removing the current container, pulling the new image, and running it again:

```bash
docker run -d \
  --name ha-fusion \
  --network bridge \
  -p 5050:5050 \
  -v /path/to/ha-fusion:/app/data \
  -e TZ=Europe/Stockholm \
  -e HASS_URL=http://192.168.1.241:8123 \
  --restart always \
  ghcr.io/knowald/ha-fusion
```

</details>

## Dashboards

Hearth is served at `/`. On first load with no `data/hearth.yaml`, a setup wizard proposes pages from your Home Assistant areas and entities; everything is then editable in place with the pencil in the corner, or as YAML from the settings sheet.

The original dashboard is served at `/classic` while `classic: true` is set in `data/configuration.yaml`. It reads `data/dashboard.yaml` as before and will be removed in a later release; rebuild its views as Hearth pages before then. `/hearth` redirects to `/` for old bookmarks.

## Migrating from the original project

Data directories are compatible: `configuration.yaml`, `dashboard.yaml` (for `/classic`) and custom CSS carry over unchanged. Keep your existing data directory or add-on configuration and switch the source:

- **Add-on**: add the repository <https://github.com/knowald/addon-ha-fusion> (see [Add-on](#add-on)) and install ha-fusion from it. Home Assistant treats it as a separate add-on with its own data directory, so files do not move over automatically: copy `dashboard.yaml`, `configuration.yaml` and any custom CSS from the old add-on's data directory into the new one (`/mnt/data/supervisor/addons/data/<id>_ha_fusion/`, reachable with the Advanced SSH & Web Terminal add-on with protection mode disabled), then remove the old add-on.
- **Docker**: change the image from `ghcr.io/matt8707/ha-fusion` to `ghcr.io/knowald/ha-fusion` and keep the same `/app/data` volume mount. Images are published for amd64 and arm64.

## Configuration

Set these environment variables (in the add-on config, the compose file, or `.env` for local development):

| Variable   | Required | Description                                               |
| ---------- | -------- | --------------------------------------------------------- |
| `HASS_URL` | yes      | Home Assistant base URL, e.g. `http://192.168.1.241:8123` |
| `TZ`       | no       | Timezone, e.g. `Europe/Stockholm`                         |

### Query strings

These work when a port is exposed via the add-on config or Docker. They are unavailable behind Ingress, which cannot read query strings.

- `?room=<id>` - open a specific page by id on load.
- `?theme=<preset id>` - preview a built-in theme preset without touching the config.
- `?menu=false` - hide the edit pencil. Useful for wall-mounted tablets where you want to prevent edits.

The classic dashboard keeps `?view=Name` and `?menu=false`.

### Keyboard shortcuts

| Key                 | Action                                  |
| ------------------- | --------------------------------------- |
| **f**               | search (when a search widget is placed) |
| **esc**             | close                                   |
| **cmd + s**         | save (edit mode)                        |
| **cmd + z**         | undo (edit mode)                        |
| **cmd + shift + z** | redo (edit mode)                        |

## Development

Install [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io). If you are new to Svelte, start with the tutorial at <https://learn.svelte.dev>.

```bash
# install
git clone https://github.com/knowald/ha-fusion.git
cd ha-fusion
pnpm install

# environment
cp .env.example .env   # then set HASS_URL

# run the dev server
pnpm dev -- --open

# checks
pnpm check              # type checking
pnpm lint               # prettier + eslint, including the bare-text rule
pnpm test               # unit and component tests with a coverage floor
pnpm build && pnpm test:e2e   # browser smoke test against a scripted Home Assistant
pnpm check:boundaries   # import layering
pnpm check:bundle       # per-route bundle budget (after a build)
pnpm format             # apply prettier
```

The layout of the code, the card and widget registries and the migration
rules are described in `src/lib/Hearth/README.md`.

### Logs

Add-on: the "Log" tab. Docker: `docker logs ha-fusion`. Frontend issues show in the browser console.

## Credits

ha-fusion was created by [matt8707](https://github.com/matt8707), who wrote the initial implementation and core architecture and maintains the original repository at [matt8707/ha-fusion](https://github.com/matt8707/ha-fusion). If the project is useful to you, consider supporting him: <https://www.paypal.com/paypalme/matt8707>.
