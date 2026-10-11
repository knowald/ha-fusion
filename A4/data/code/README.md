# ha-fusion

A modern, fast, custom dashboard for [Home Assistant](https://www.home-assistant.io/).

[![preview](/static/preview.png)](https://www.youtube.com/watch?v=D8mWruSuPOM)

Built with SvelteKit and Svelte 5. Connects to Home Assistant over WebSocket for real-time state, with a drag-and-drop editor for building views without writing YAML by hand.

ha-fusion was created by [matt8707](https://github.com/matt8707). This repository is the maintained continuation of the [original project](https://github.com/matt8707/ha-fusion); see [Credits](#credits).

## Features

- Drag-and-drop editor for views, sections and sidebar, saved to plain YAML
- Buttons and modals for most Home Assistant domains: lights, covers, climate, media players, cameras, vacuums, locks, timers and more
- Optimistic updates: buttons reflect the new state on tap, before the Home Assistant round-trip completes
- Slide horizontally across a light button to set brightness
- Sidebar widgets: weather, forecast, graphs, camera, iframe, date and time, templates, notifications
- Horizontal and vertical stacks, including nested stacks for two-dimensional layouts
- Spotify player widgets with playback controls, quick-play shortcuts and a media browser
- Themes, custom CSS, and translations for over 60 languages
- Runs as a Home Assistant add-on (with Ingress) or as a standalone Docker container

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

## Migrating from the original project

Dashboards are fully compatible: `dashboard.yaml`, `configuration.yaml` and custom CSS carry over unchanged. Keep your existing data directory or add-on configuration and switch the source:

- **Add-on**: add the repository <https://github.com/knowald/addon-ha-fusion> (see [Add-on](#add-on)) and install ha-fusion from it. Home Assistant treats it as a separate add-on with its own data directory, so files do not move over automatically: copy `dashboard.yaml`, `configuration.yaml` and any custom CSS from the old add-on's data directory into the new one (`/mnt/data/supervisor/addons/data/<id>_ha_fusion/`, reachable with the Advanced SSH & Web Terminal add-on with protection mode disabled), then remove the old add-on.
- **Docker**: change the image from `ghcr.io/matt8707/ha-fusion` to `ghcr.io/knowald/ha-fusion` and keep the same `/app/data` volume mount.

## Configuration

Set these environment variables (in the add-on config, the compose file, or `.env` for local development):

| Variable   | Required | Description                                               |
| ---------- | -------- | --------------------------------------------------------- |
| `HASS_URL` | yes      | Home Assistant base URL, e.g. `http://192.168.1.241:8123` |
| `TZ`       | no       | Timezone, e.g. `Europe/Stockholm`                         |

### Query strings

These work when a port is exposed via the add-on config or Docker. They are unavailable behind Ingress, which cannot read query strings.

- `?view=Bedroom` - load a specific view by name on page load.
- `?menu=false` - hide the menu button. Useful for wall-mounted tablets where you want to prevent edits.

### Keyboard shortcuts

| Key                 | Action |
| ------------------- | ------ |
| **f**               | filter |
| **esc**             | exit   |
| **cmd + s**         | save   |
| **cmd + z**         | undo   |
| **cmd + shift + z** | redo   |

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
pnpm check    # type checking
pnpm lint     # prettier + eslint
pnpm format   # apply prettier
```

### Logs

Add-on: the "Log" tab. Docker: `docker logs ha-fusion`. Frontend issues show in the browser console.

## Credits

ha-fusion was created by [matt8707](https://github.com/matt8707), who wrote the initial implementation and core architecture and maintains the original repository at [matt8707/ha-fusion](https://github.com/matt8707/ha-fusion). If the project is useful to you, consider supporting him: <https://www.paypal.com/paypalme/matt8707>.
