# Change 3 (CH03): Acceptance Criteria

## AC-01: Type Registry Descriptor Compliance
- `RAIL_WIDGET_TYPES` in `src/lib/Hearth/config.ts` must include an entry with `value: 'alert'`.
- The descriptor must possess complete `value`, `label`, `name`, `sub`, and `icon` string fields, passing the `typeRegistry.test.ts` uniqueness and descriptor completeness tests.

## AC-02: Type Variant Declaration
- `RailWidgetVariant` union in `src/lib/Hearth/config.ts` must declare the `type: 'alert'` variant with optional `text`, `icon`, `severity`, and `entity`.

## AC-03: Configuration Validation
- In `src/lib/Hearth/configurationState.ts`:
  - An alert widget without `text` and without `entity` must return `true` for `railWidgetNeedsConfiguration(widget)`.
  - An alert widget with `text` or `entity` defined must return `false`.
  - `railConfigurationLabel(widget)` must return `'Configure alert'` for unconfigured alert widgets.

## AC-04: Polymorphic Renderer Integration
- `src/lib/Hearth/RailWidgetRenderer.svelte` must handle `widget.type === 'alert'` cleanly without exhaustive type assertion errors.

## AC-05: Unit Testing & Metrics
- `typeRegistry.test.ts` must pass.
- New tests in `configurationState.test.ts` must verify alert widget configuration states.
- 100% of Vitest test suite must pass.
