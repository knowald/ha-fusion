# ha-fusion

A modern, easy-to-use and performant custom [Home Assistant](https://www.home-assistant.io/) dashboard

<https://www.youtube.com/watch?v=D8mWruSuPOM>

[![preview](/static/preview.png)](https://www.youtube.com/watch?v=D8mWruSuPOM)

## 🍴 Fork Notice

This is a fork of the original [ha-fusion](https://github.com/matt8707/ha-fusion) project created by [matt8707](https://github.com/matt8707). All credit for the initial development and core architecture goes to the original author.

If you find this project useful, please consider supporting the original creator: ❤️ <https://www.paypal.com/paypalme/matt8707>

---

## Fork Features

This fork adds the following features to the original ha-fusion project:

### Spotify Player Widgets

Full-featured Spotify media player widgets with two layout options.

**Compact Player:**

```yaml
- type: spotify_player
  id: 1234567890
  entity_id: media_player.spotify_username
  name: Spotify
  icon: mdi:spotify
  color: "rgb(30, 215, 96)"
  show_progress: true
```

**Large Player:**

```yaml
- type: spotify_player_large
  id: 1234567890
  entity_id: media_player.spotify_username
  show_progress: true
```

Features include real-time progress bar, playback controls, album artwork, and an integrated browser for playlists, albums, and artists.

### Days Since Widget

A counter widget that tracks days elapsed since a timestamp stored in a Home Assistant entity.

```yaml
- type: days_since
  id: 1234567890
  entity_id: input_datetime.last_filter_change
  name: Filter Changed
  icon: mdi:air-filter
  color: "rgb(75, 166, 237)"
```

### Display-Only Buttons ⚠️ Breaking

Configure buttons as non-interactive for displaying sensor values or status information.

```yaml
- type: button
  id: 1234567890
  entity_id: sensor.indoor_temperature
  name: Temperature
  displayOnly: true
```

> **Breaking Change:** Sensor domains (`sensor`, `binary_sensor`, `weather`, `sun`, `zone`, `person`) are now automatically detected as display-only. If you have sensor buttons that were previously interactive, use `displayOnly: false` to restore the original behavior.

### Slide Brightness Control ⚠️ Breaking

Adjust light brightness by sliding horizontally on button widgets.

```yaml
- type: button
  id: 1234567890
  entity_id: light.living_room
  slide_brightness: false  # disable slide control
```

> **Breaking Change:** Enabled by default for all lights that support brightness. Horizontal swipe/drag gestures now adjust brightness instead of being ignored. Use `slide_brightness: false` to disable.

### Optimistic UI Updates

Buttons now provide instant visual feedback when toggled, without waiting for Home Assistant round-trips. This is enabled automatically for all interactive buttons.

### Custom CSS

Apply custom styles via Settings > Custom CSS. Styles are saved to `/data/custom_css.css`.

### Serene Theme

A new built-in theme with a calm, nature-inspired blue-gray aesthetic. Select it from the theme picker in settings.

---

## Installation

### Add-on

For "Operating System" or "Supervised" installation methods, you can install ha-fusion as an add-on:

1. **Add Repository**: To begin, add the ha-fusion add-on repository to your Home Assistant instance. Click the button below or manually add the repository using this URL: <https://github.com/knowald/addon-ha-fusion>.

   [![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fknowald%2Faddon-ha-fusion)

2. **Install Add-on**: After adding the repository, refresh the add-on store page. Locate ha-fusion in the list and proceed with the installation.

---

### Docker

If you're using the "Container" or "Core" installation methods, ha-fusion can be installed via Docker:

1. **Docker Compose File**: Place your edited copy of the [docker-compose.yml](https://github.com/knowald/ha-fusion/blob/main/docker-compose.yml) file in a suitable directory.

2. **Create Container**:
   Run the following commands in your terminal to start the container:

   ```bash
   cd path/to/docker-compose.yml
   docker-compose up -d ha-fusion
   ```

#### Update

To update to the latest version of ha-fusion, run the following commands:

```bash
docker-compose pull ha-fusion
docker-compose up -d ha-fusion
```

<details>
<summary>
   <b>Other</b>
</summary>

Without docker-compose, updating the container involves additional steps. For each update, it's necessary to first stop the current container, remove it, pull the new image, and then execute the docker run command again.

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

#### Kubernetes

If you prefer to use Kubernetes, see [Chart README.md](https://github.com/knowald/ha-fusion/tree/167c320918544416e2f9272e1edad64b7329269a/charts/ha-fusion)

</details>

---

## Query strings

These will only function if you have exposed a port in the add-on configuration or by using Docker. Note that when using Ingress, query strings cannot be read.

### View

To set a particular view when the page loads, add the "view" parameter. For example, if you have a "Bedroom" view, append the query string `?view=Bedroom` to the URL.

### Menu

To disable the menu button, append the query string `?menu=false` to the URL. This is useful when you want to avoid unwanted changes to your dashboard, such as on wall-mounted tablets.

---

## Keyboard Shortcuts

| Key                 | Description |
| ------------------- | ----------- |
| **f**               | filter      |
| **esc**             | exit        |
| **cmd + s**         | save        |
| **cmd + z**         | undo        |
| **cmd + shift + z** | redo        |

---

## Debug

To debug any errors, check the "Log" tab if you're using the addon, or use `docker logs ha-fusion` for Docker setups. To inspect frontend issues, open the browser's console.

---

## Develop

To begin contributing to the project, you'll first need to install node. It's also recommended to install pnpm. If you're unfamiliar with Svelte, consider doing the tutorial at <https://learn.svelte.dev>

```bash
# prerequisites (macos)
brew install node pnpm

# install
git clone https://github.com/knowald/ha-fusion.git
cd ha-fusion
pnpm install

# environment
cp .env.example .env
code .env

# server
npm run dev -- --open

# dependencies
pnpm outdated
pnpm update

# lint
npm run check
npm run lint
npm run format
```
