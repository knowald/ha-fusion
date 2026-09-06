# Hearth agent standards

These standards govern new and changed code under `src/lib/Hearth`. They are
not a claim that every existing component already complies; a gap found in
passing is a backlog item (tracked in Plane project HAF), not permission to
refactor it during unrelated work.

## Scope and sources of truth

- Hearth is the default dashboard. Its actual entry is `src/routes/+page.svelte`
  with `+page.server.ts`; `/hearth` is a compatibility redirect. Do not mistake
  the redirect for the implementation or change `/classic` incidentally.
- Preserve the root scope restrictions. Shared changes must be required by
  Hearth. Use `scripts/check-boundaries.mjs` as the executable import policy:
  Hearth can consume core, UI, server-side helpers in server contexts, and legacy
  bridges; never import legacy implementations or old unlayered stores directly.
- Read `README.md` for component anatomy. Where prose conflicts with executable
  contracts, inspect code and tests and document the discrepancy rather than
  copying stale examples from `CLAUDE.md`.
- Use the repository's Svelte 5 runes and TypeScript conventions, not a framework
  migration. Use `$props`, `$state`, `$derived`, `$effect` and callback props in new
  components; retain Svelte stores for cross-component application state.

## Components and types

- Cards live in `cards/<type>/{descriptor.ts,Card.svelte,Editor.svelte}`; rail
  widgets use `widgets/<type>/{descriptor.ts,Widget.svelte,Editor.svelte}`.
  Register only in the corresponding `index.ts` and update the union in `types.ts`.
- Keep persisted type names and YAML keys stable, including snake_case names.
  A UI page is a `HearthRoom`/`rooms` entry; an HA area is discovery input, not
  another name for every configured page.
- Descriptors own type metadata, defaults/coercion, setup detection and layout
  capabilities. Prefer flags over renderer switches. Editors load dynamically.
- Editor drafts contain only their owned fields; shells own IDs, type, layout
  and visibility. Respect `CardDraft`/`WidgetDraft` and invalid-draft blocking.
- New configurable types need a structural schema and field-level normalization.
  Layout-only/option-free widget omissions are intentional, not templates for
  skipping validation in configurable widgets. Update registry and config tests.
- Use `unknown` at external boundaries and narrow it. Do not add `any`, unsafe
  casts or suppressions merely because the current warning budget permits them.
- Use PascalCase component names and existing lower-camel TypeScript module
  conventions. Prefer relative imports within a feature and `$lib` for other
  layers; do not bulk-rewrite existing imports or re-exports for style alone.

## Configuration and persistence

- Keep migration, structural validation and normalization distinct. Migrate old
  shapes before normalizing; reject future versions. Never silently rewrite an
  unreadable source using fallback configuration.
- Preserve supported extension keys and explicit false/zero values. Validate
  finite numbers, bounds, enum values, trimmed identifiers and ID uniqueness.
  Keep schema, normalizer, editor and TypeScript shape aligned.
- Use `updateConfig()` for undoable mutations. Do not mutate store objects or
  editor `initial` props in place. Preserve Done, Cancel, undo and redo semantics.
- Save through the revisioned store flow and server persistence helper. Keep
  stale revisions on conflict; force-overwrite requires an explicit user action.
  Do not add a revisionless client or a direct filesystem write.
- Treat `version` and `revision` as server-owned metadata; the save helper
  overwrites them whatever the client sends.
- Do not read, rewrite or use the developer's `data/` files as test fixtures.

## Home Assistant and interaction

- Read entity state/availability from `core/ha/entities`; use domain descriptors
  and wrappers in `core/domains` for device behavior. Missing, unknown,
  unavailable, inactive and pending are different states.
- Device mutations go through `core/ha/commands`. Entity-targeted discrete
  commands use `callEntityService` or the appropriate domain wrapper. Do not
  bypass connection checks, the edit-mode gate, pending state or failure reporting.
- Response-returning reads are distinct from device commands. Prefer typed core
  data helpers with connection guards, cleanup and explicit errors; the direct
  SpotifyPlus read path in `media.ts` is existing debt, not a precedent.
- Respect runtime, layout-edit and preview interaction modes. Interactive
  previews must not send real device commands. Preserve the legacy edit-mode
  bridge and command gate while embeds remain.
- Reuse `interaction.ts`, `drag.ts`, `PopupSlider`, `TuneButton` and domain
  routing. Support keyboard activation, scroll cancellation, long press,
  readonly state and confirmation for sensitive actions.
- Register overlays with `ui/layers` and release them on teardown. The top layer
  owns Escape; retain focus restoration and verify modal focus behavior separately.

## Async work and trust boundaries

- Reuse shared history/polling helpers for fetched HA data and the shared clock
  where its cadence fits. Presentation ticks are not network polling.
- Clean up timers, event listeners and subscriptions. Cancel or ignore stale
  asynchronous results after entity/config changes or unmount, including results
  arriving after dynamic imports. Handle late subscription setup by unsubscribing.
- Distinguish loading, empty, unavailable and failed requests; do not silently
  present a fetch failure as an empty success. Use existing loading/empty components.
- Prefix local API URLs with `$app/paths`'s `base`. Keep browser-only access in
  lifecycle-safe contexts; guard storage failures where storage is optional.
- HTML from HA or user content goes through `markdown.ts`, which sanitizes it;
  never pass it to `{@html}` directly. Embed URLs go through `normalizeEmbedUrl`
  and the iframe stays sandboxed. Do not broaden either as incidental cleanup.

## Visuals, accessibility and copy

- Use theme tokens, `ICON` sizes and shared editor CSS/component recipes.
  Follow the spacing scale and motion/layer tokens; do not weaken style guards.
- Breakpoints: 900px rail/phone navigation; 820px edit sheets and fields; 700px
  popup bottom sheets/edit bar; 560px `hearth-page` container collapse with the
  existing 1200px viewport fallback.
- Keep control hit areas at least 44px, even when glyphs are smaller. Give controls
  accessible names, keyboard access and visible focus. Compiler checks alone
  do not establish accessibility, contrast, focus trapping or touch dimensions.
- Translate product copy using `$lang` and `static/translations/en.json`, including
  computed copy and helper output. Preserve user-authored names and technical
  diagnostics as data; use a translated surrounding message for errors.
- Format dates/numbers with the selected locale and an explicit timezone policy.
  Reuse time helpers; distinguish calendar dates from elapsed durations.

## Validation and handoff

- CI uses Node 24 and pnpm 11. Use pnpm and the committed lockfile; do not create
  npm/yarn lockfiles. Do not upgrade dependencies just to match a local runtime.
- Follow `.editorconfig` and Prettier: tabs, single quotes, no trailing commas,
  100-column target. Format only changed files, not the whole repository.
- Start with adjacent Vitest tests (`pnpm exec vitest run <test paths>`).
  Pure tests are `*.test.ts`, component tests `*.svelte.test.ts`; reuse `testing.ts`.
- Relevant full checks are `pnpm check`, `pnpm check:boundaries`,
  `pnpm check:style`, `pnpm check:hearth-a11y`, `pnpm test`, `pnpm lint`,
  `pnpm build`, then `pnpm check:bundle` and `pnpm test:e2e`.
  Browser tests require the production build and Playwright Chromium.
- Use `pnpm matrix` for visual review when relevant; it is a separate screenshot
  workflow, not proof of pixel-regression coverage. Review resulting images.
- Never raise warning caps, lower coverage floors or enlarge bundle budgets to
  hide a regression. Report baseline failures separately from introduced failures.
- New behavior needs regression tests for its boundary cases, not only a registry
  entry or screenshot. Keep tests isolated from real devices and personal data.
- Update relevant docs and fixtures with feature changes. Do not leave `.tmp`
  components or generated artifacts in source. Report exactly what ran, failed
  or was skipped. Do not claim a full audit or full test pass from selective checks.
- Do not commit unless asked. If asked to commit Hearth work, use a conventional
  title with the `hearth` scope, consistent with existing repository guidance.
