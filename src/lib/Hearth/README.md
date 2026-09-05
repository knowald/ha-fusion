# Hearth

Hearth is a second dashboard implementation living alongside the original one. It
is in preview: the route works and is usable day to day, but the configuration
format and the internal APIs in this directory are not stable yet.

The end goal is that Hearth fully replaces the original dashboard, with total
feature coverage and no UX regressions. Gaps between the two are debt to close,
not acceptable divergence. When adding or changing a dashboard feature, treat
Hearth as the primary target.

## Preview status

What this means in practice:

- `data/hearth.yaml` carries a `version`. Older files are lifted by the
  migrations in `migrate.ts` before normalization; a file written by a newer
  build refuses to load instead of being normalized into loss.
- Anything exported from this directory can change without notice. Nothing here
  is a public API.
- The original dashboard remains the default. Hearth is opt-in.

## Enabling it

Set `hearth: true` in `data/configuration.yaml`. That adds a Hearth button to
the original dashboard's drawer (`src/lib/legacy/Drawer/Index.svelte`). The route is
served at `/hearth` regardless of the flag.

On first load with no `data/hearth.yaml`, the setup wizard opens automatically
and proposes a starting layout built from the Home Assistant area, device and
entity registries (`registry.ts`).

### Query parameters

| Parameter            | Effect                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `?room=<id>`         | Open a specific page by id. The original dashboard's `?view=` does not apply here.                                 |
| `?theme=<preset id>` | Preview a built-in theme preset without touching the config.                                                       |
| `?menu=false`        | Hide the edit pencil. Edit mode stays reachable if already active, and the keyboard shortcuts are not gated on it. |

### Keyboard shortcuts

When a search widget is configured, `f` opens search. In edit mode,
`cmd/ctrl + s` saves and `cmd/ctrl + z` undoes (`shift` to redo). An open edit
sheet takes priority over save and undo.

## Layout

State enters through the Home Assistant websocket in `src/lib/core/ha` and is
read from `$states`. Commands leave through `service()` in
`src/lib/core/ha/commands.ts`, the single exit point for every device call;
per-domain wrappers (toggle a light, set a cover position) live in
`src/lib/core/domains`. Hearth itself owns only what is dashboard-specific:
the config, the editor and the navigation state in `store.ts`.

```
data/hearth.yaml
  -> normalizeHearthConfig()   normalize.ts, per-type rules from the registries
  -> $hearthConfig             store.ts
  -> HearthDashboard.svelte    rail + main
       -> Rail -> RailWidgetRenderer -> widgets/<type>/Widget.svelte
       -> RoomDetail -> CardColumns -> CardRenderer -> cards/<type>/Card.svelte

src/lib/core
  ha/connection.ts   the one connection, health, startConnection()
  ha/entities.ts     $states, availability, active state, group summaries
  ha/commands.ts     service(), optimistic overrides, pending, failures
  ha/history.ts      recorder cache and shared polling
  ha/registry.ts     area, device and entity registries
  domains/*.ts       command wrappers and views per HA domain
  theme/index.ts     tokens, derivation, presets, themeStyle()
  i18n/index.ts      $lang and the translation stores
```

Naming follows a fixed taxonomy: `cards/<type>/Card.svelte` renders an
`OverviewCard`, `widgets/<type>/Widget.svelte` renders a `RailWidget`, `*Tile`
is an entity-level leaf, `*Popup` is a centred sheet, `*Popover` is anchored to
a row. The edit sheets and shared form fields live in `edit/`; each type's own
editor sits next to its card or widget.

### Config shape

The shared reference shapes (entity, scene and vacuum mode references,
visibility conditions) are valibot schemas in `schema.ts`; their TypeScript
types derive from them. Card and widget descriptors attach a schema for their
own fields, and the YAML editor reports every schema issue with its path
before applying an edit. Saves go through `src/lib/server/persistence.ts`,
which serializes writes per file, replaces atomically, keeps ten backups and
manages the `revision` counter used for conflict detection.

`HearthConfig` holds `rail` (a list of rail widgets), `rooms` (pages, each with
`cards` as an array of columns), the `theme` and `theme_night` token maps, the
`day_night` switch, and wall-tablet options (`screensaver_minutes`,
`screensaver_drift`, `screensaver_brightness`, `keep_screen_on`, `padding_x`,
`padding_y`).

A page is called a room in the type and YAML key, and a page in the UI. These
mean the same thing; Home Assistant calls it an area.

### Card types

`entities`, `header`, `temperature`, `media`, `vacuum`, `camera`, `image`,
`climate`, `scenes`, `fusion`.

### Rail widget types

`clock`, `weather`, `search`, `nav`, `spacer`, `label`, `energy`, `progress`,
`calendar`, `status`, `entity`, `fusion`.

`fusion` embeds a component from the original dashboard, which is how features
that have not been ported natively stay reachable.

## Boundaries

The original dashboard lives under `src/lib/legacy`. Hearth may import from it
only through `src/lib/legacy/bridge`, one module per legacy capability still in
use (embeds, entity modals, the picture elements editor, the camera player, the
token prompt). `scripts/check-boundaries.mjs` enforces this in CI, along with
the layer order `routes -> hearth -> ui -> core`. Retiring a legacy feature
means deleting its bridge module.

## Adding a card type

Every card type is one folder under `cards/` with three parts, registered by
one line in `cards/index.ts`:

- `descriptor.ts` - the `CardDescriptor`: gallery label and icon, the
  type-specific `normalize` rule for raw YAML, optional `issues` for the YAML
  editor, `needsConfiguration` for the setup placeholder, `entityIds` for
  attention and search, and layout flags (`fillByDefault`, `sizable`,
  `previewReorder`).
- `Card.svelte` - renders `{ card }`.
- `Editor.svelte` - the type-specific form. It receives `initial` (the card of
  this type being edited, or undefined) and calls `onchange({ fields, valid })`
  whenever a field changes; the shell adds id, type, fill, height and
  visibility. An editor may export `applyPreviewReorder` for the live preview.

The card's type shape lives in the `OverviewCardVariant` union in `types.ts`.
`typeRegistry.test.ts` fails when a registered descriptor is missing a part.

Rail widgets follow the same shape under `widgets/`, registered in
`widgets/index.ts`, with `Widget.svelte` rendering `{ widget }`. Layout-only
widgets (the spacer) have no component; option-free widgets (nav, search) have
no editor.

Entity domains are described in `src/lib/core/domains/index.ts`: icon, tap
behaviour, tile treatment, active predicate, group summary words and toggle
service. `EntityTile` and the group summaries read those descriptors instead of
switching on the domain string.

## Behaviour worth knowing

- **Availability.** `entityAvailability()` in `core/ha/entities.ts` distinguishes
  `available`, `unavailable`, `unknown` and `missing`. Tiles must not collapse a
  missing or unreachable entity into "off".
- **Optimistic updates.** `controlOverrides` in `core/ha/commands.ts` holds a commanded
  value until the websocket confirms it. Route new optimistic behaviour through
  it rather than adding a local timer.
- **Command failures.** `service()` guards on `connected`, not on the connection
  object, which survives reconnects. Failures are reported, not swallowed.
- **Fetched data.** Most state is push. The few surfaces that fetch go through
  `core/ha/history.ts`, which supplies the shared interval and a short-lived cache so
  page switches do not re-query the recorder.
- **Edit mode.** `hearthEditMode` suppresses device commands. Embedded fusion
  objects consult the original dashboard's `editMode` store instead, so
  `HearthDashboard.svelte` mirrors Hearth's mode into it while the route is
  mounted, and `FusionCard.svelte` sets `pointer-events: none` on the embed so it
  cannot open its own editor. Both halves are needed; either alone leaves a gap.

## Copy and translation

Every user-facing string in Hearth goes through `$lang()` with a key in
`static/translations/en.json`; other locales fall back to English per key.
Card, widget and domain descriptors carry keys, not display strings. The
`hearth/no-bare-text` ESLint rule (`eslint/no-bare-text.js`) fails on literal
text nodes and copy attributes under `Hearth/` and `ui/`, so a new string
cannot ship untranslated. Placeholders show example values and are exempt.

## Tests

`npm run test` (vitest, jsdom, with coverage). Pure modules (`config`,
`store`, `drag`, `refresh`, `registry`, `visibility`, `clock`,
`configurationState`, `fusionFields`, the type registries) and the core
modules have unit tests. Components have render tests through `@testing-library/svelte`, named
`*.svelte.test.ts` next to the component; `testing.ts` holds the entity
fixture helper. `vitest.config.ts` carries a coverage floor for `Hearth`, `ui`
and `core` that only moves up.

`npm run test:e2e` (Playwright, Chromium) boots the production build from
`e2e/fixture` against the scripted Home Assistant in `e2e/fake-hass.mjs` and
drives the touch surfaces: tap, brightness drag, cancelled drag, long press.
Run `npm run build` first.
