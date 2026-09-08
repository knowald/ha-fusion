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
- Hearth is the dashboard at `/`. The original dashboard is served at
  `/classic` while `classic: true` is set in `data/configuration.yaml`, for
  one release cycle.

## Routes

Hearth is served at `/`; `/hearth` redirects there for old bookmarks. The
original dashboard answers at `/classic` only when `classic: true` is set in
`data/configuration.yaml`, and its drawer keeps a button back to `/`.

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

## Design tokens

Every Hearth style reads from tokens on `:root`, injected by `shell/ThemeStyle.svelte`.
`scripts/check-style-tokens.mjs` (run by `pnpm check:style` and in CI) refuses
literal colours, font sizes, radii, z-index values and transition durations, and
spacing values off the scale. A declaration may opt out with a same-line
`/* literal ok: <reason> */` comment; keep those rare.

| Token family | Values                                                                                                              | Notes                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Colour       | `--h-*` theme knobs from `core/theme` (`THEME_VARS`)                                                                | User-themable. Surfaces over artwork use the fixed `--h-art-scrim-*`, `--h-on-art-*` set; scrims use `--h-scrim`. |
| Type         | `--h-type-{caption,label,small,secondary,body,emphasis,subtitle,title,headline,stat,display-sm,display,hero,clock}` | 10 to 80 px. Mono is for labels, ids and numbers, with tracking.                                                  |
| Spacing      | even pixels: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40                                                 | Written as literals; the guard checks scale membership.                                                           |
| Radius       | `--h-radius-{hair,tight,xs,sm,md,card,lg,xl,pill}` and `50%`                                                        | `xs` to `xl` are theme knobs scaled by the radius factor.                                                         |
| Layers       | `--h-layer-{raised,chip,grid-header,bar,toast,popover,popup,search,sheet,sheet-popover,picker,confirm,screensaver}` | Same order as the stack in `ui/layers.ts`. Offsets: `calc(var(--h-layer-x) + 1)`.                                 |
| Motion       | `--h-motion-{fast,base,slow,theme}` (120, 200, 300, 600 ms), `--h-ease`                                             | `$motion` from settings still zeroes durations.                                                                   |
| Focus        | `--h-focus-ring`                                                                                                    | Applied by `.frame :global(:focus-visible)`.                                                                      |
| Icons        | `ICON.{inline,control,tile,hero,display}` from `iconSizes.ts` (16, 20, 24, 32, 48)                                  | Pass to `Icon.svelte`; the glyph is `aria-hidden`, the control carries the name.                                  |

Shared state pieces: `EmptyState.svelte` for "nothing here" and `LoadingState.svelte`
for "still fetching". `ConfigurationPlaceholder.svelte` stays the setup placeholder.

`pnpm style:inventory` prints the distinct literal values per family; the counts
are the review's progress metric.

## Boundaries

The original dashboard lives under `src/lib/legacy`. Hearth may import from it
only through `src/lib/legacy/bridge`, one module per legacy capability still in
use (embeds, the calendar, todo and GPS map modals, the picture elements
editor, the camera player, the token prompt). `scripts/check-boundaries.mjs` enforces this in CI, along with
the layer order `routes -> hearth -> ui -> core`. Retiring a legacy feature
means deleting its bridge module.

## Adding a card type

Every card type is one folder under `cards/` with three parts, registered by
one line in `cards/index.ts`:

- `descriptor.ts` - the `CardDescriptor`: translation keys for the gallery
  (`label`, `name`, `sub`) and an icon, the mandatory `normalize` rule that
  coerces every typed field of a raw YAML card, an optional valibot `schema`
  for the YAML editor, `needsConfiguration` for the setup placeholder,
  `entityIds` for attention and search, layout flags (`fillByDefault`,
  `sizable`, `stretchMinHeight`, `heightHint`) and preview flags
  (`previewReorder`, `previewInteractive`). `editor` is a loader
  (`() => import('./Editor.svelte')`) so editors stay out of the dashboard bundle.
- `Card.svelte` - renders `{ card }`.
- `Editor.svelte` - the type-specific form. It receives `initial` (the card of
  this type being edited, or undefined) and calls `onchange({ fields, valid })`
  whenever a field changes; the shell adds id, type, fill, height and
  visibility. An editor may export `applyPreviewReorder` for the live preview.

The card's type shape lives in the `OverviewCardVariant` union in `types.ts`;
`cards/index.ts` fails to compile when a union member has no descriptor or a
descriptor has no union member. `typeRegistry.test.ts` fails when a descriptor
is missing a part or its translation keys are absent from `en.json`.

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
- **Entity detail.** A tap that does not toggle opens the detail popup
  (`DetailPopup.svelte`), which mounts the domain's control component from
  `details/` (switches, locks, numbers, selects, timers, alarms, climate,
  updates and so on) above the state, attributes and, for numeric readings,
  the 24 h history. `details/index.ts` names the domains still handed to the
  original modals.
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
