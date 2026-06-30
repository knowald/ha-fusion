# ha-fusion

A modern, fast, custom dashboard for [Home Assistant](https://www.home-assistant.io/).

[![preview](/static/preview.png)](https://www.youtube.com/watch?v=D8mWruSuPOM)

Built with SvelteKit and Svelte 5. Connects to Home Assistant over WebSocket for real-time state, with a drag-and-drop editor for building views without writing YAML by hand.

## Fork notice

This is a fork of the original [ha-fusion](https://github.com/matt8707/ha-fusion) by [matt8707](https://github.com/matt8707), who wrote the initial implementation and core architecture. If the project is useful to you, consider supporting the original author: <https://www.paypal.com/paypalme/matt8707>.

The sections below cover what this fork adds on top of upstream.

## Features

### Vertical stacks

Arrange sections in a column, including vertical stacks nested inside horizontal stacks for two-dimensional layouts.

```yaml
- type: vertical-stack
  id: 1234567890
  sections:
    - name: Top Section
      items: [...]
    - name: Bottom Section
      items: [...]
```

### Spotify widgets

Media player widgets in compact and large layouts, with a progress bar, playback controls, album art, quick-play shortcuts when idle, and a built-in browser for playlists, albums, and artists.

```yaml
- type: spotify_player # or spotify_player_large
  id: 1234567890
  entity_id: media_player.spotify_username
  show_progress: true
```

### Days since

Counts the days elapsed since a timestamp stored in a Home Assistant entity. Useful for maintenance reminders.

```yaml
- type: days_since
  id: 1234567890
  entity_id: input_datetime.last_filter_change
  name: Filter Changed
  icon: mdi:air-filter
```

### Display-only buttons

Render a button as a non-interactive status readout. The `sensor`, `binary_sensor`, `weather`, `sun`, `zone`, and `person` domains default to display-only; override with `displayOnly`.

```yaml
- type: button
  id: 1234567890
  entity_id: sensor.indoor_temperature
  name: Temperature
  displayOnly: true
```

### Slide brightness

Drag horizontally across a light button to set brightness. On by default for lights that support it; disable per button with `slide_brightness: false`.

### Optimistic updates

Interactive buttons reflect the new state immediately on tap, before the Home Assistant round-trip completes.

### Custom CSS

Add styles under Settings > Custom CSS. Saved to `/data/custom_css.css`.

### Serene theme

A built-in blue-gray theme, selectable from the theme picker.

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

## Configuration

Set these environment variables (in the add-on config, the compose file, or `.env` for local development):

| Variable   | Required | Description                                               |
| ---------- | -------- | -------------------------------------------------------- |
| `HASS_URL` | yes      | Home Assistant base URL, e.g. `http://192.168.1.241:8123` |
| `TZ`       | no       | Timezone, e.g. `Europe/Stockholm`                        |

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
