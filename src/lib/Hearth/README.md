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

- `data/hearth.yaml` may need manual edits after an update. The normalizer
  (`normalizeHearthConfig` in `config.ts`) accepts older shapes where it can, but
  there is no migration tooling and no format version.
- Anything exported from this directory can change without notice. Nothing here
  is a public API.
- The original dashboard remains the default. Hearth is opt-in.

## Enabling it

Set `hearth: true` in `data/configuration.yaml`. That adds a Hearth button to
the original dashboard's drawer (`src/lib/Drawer/Index.svelte`). The route is
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

State enters through the Home Assistant websocket and is read from `$states`.
Commands leave through `service()` in `store.ts`, which is the single exit point
for every device call.

```
data/hearth.yaml
  -> normalizeHearthConfig()   config.ts
  -> $hearthConfig             store.ts
  -> HearthDashboard.svelte    rail + main
       -> Rail -> RailWidgetRenderer -> *Widget
       -> RoomDetail -> CardColumns -> CardRenderer -> *Card
```

Naming follows a fixed taxonomy: `*Card` renders an `OverviewCard`, `*Widget`
renders a `RailWidget`, `*Tile` is an entity-level leaf, `*Popup` is a centred
sheet, `*Popover` is anchored to a row. Editor components live in `edit/`.

### Config shape

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

## Adding a card type

There is no single registration point yet. `OVERVIEW_CARD_TYPES` in `config.ts`
drives the picker gallery and type validation, but the renderer and the edit form
are still hand-written per type. Touch all of these:

1. `config.ts` - the `OverviewCardVariant` union.
2. `config.ts` - `OVERVIEW_CARD_TYPES`, which supplies the gallery entry.
3. `config.ts` - a branch in `normalizeCard()` if the type has fields to validate.
4. `config.ts` - `FILL_BY_DEFAULT` if the card should stretch to fill its column.
5. `CardRenderer.svelte` - a branch in the type chain. It has no fallback, so a
   missing branch renders nothing.
6. `edit/CardEditSheet.svelte` - field state, a `buildCard()` branch, and the form
   markup. A missing `buildCard()` branch silently drops every field except `id`,
   `type` and `entity`.
7. `configurationState.ts` - if the card should show the not-configured-yet
   placeholder before it has an entity.

Rail widgets follow a parallel but not identical path through
`RAIL_WIDGET_TYPES`, `RailWidgetRenderer.svelte` and
`edit/RailWidgetEditSheet.svelte`.

## Behaviour worth knowing

- **Availability.** `entityAvailability()` in `store.ts` distinguishes
  `available`, `unavailable`, `unknown` and `missing`. Tiles must not collapse a
  missing or unreachable entity into "off".
- **Optimistic updates.** `controlOverrides` in `store.ts` holds a commanded
  value until the websocket confirms it. Route new optimistic behaviour through
  it rather than adding a local timer.
- **Command failures.** `service()` guards on `connected`, not on the connection
  object, which survives reconnects. Failures are reported, not swallowed.
- **Fetched data.** Most state is push. The few surfaces that fetch go through
  `refresh.ts`, which supplies the shared interval and a short-lived cache so
  page switches do not re-query the recorder.
- **Edit mode.** `hearthEditMode` suppresses device commands. Embedded fusion
  objects consult the original dashboard's `editMode` store instead, so
  `HearthDashboard.svelte` mirrors Hearth's mode into it while the route is
  mounted, and `FusionCard.svelte` sets `pointer-events: none` on the embed so it
  cannot open its own editor. Both halves are needed; either alone leaves a gap.

## Tests

`npm run test` (vitest). The covered modules are the pure ones: `config`,
`store`, `drag`, `refresh`, `registry`, `visibility`, `clock`,
`configurationState`, `fusionFields`, `socket` and the type registries.
Components are not covered.
