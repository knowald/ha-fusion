# Change 3 (CH03): Extend Hearth Rail Widget Factory with Alert Widget Variant

## Background & Motivation
In Hearth modern dashboards, the left Rail displays compact glanceable status items (clock, weather, search, energy, progress, calendar, entity tiles). However, users need a way to display prominent system alerts or status notices (e.g., severe weather warnings, water leak alerts, battery warnings, or custom messages) directly on the rail without requiring a dedicated room card.

## Functional Requirement
1. Extend `RailWidgetVariant` union in `src/lib/Hearth/config.ts` with an `'alert'` variant:
   ```ts
   | {
       id: string;
       type: 'alert';
       text?: string;
       icon?: string;
       severity?: 'info' | 'warning' | 'error';
       entity?: string;
     }
   ```
2. Register the descriptor in `RAIL_WIDGET_TYPES` in `src/lib/Hearth/config.ts`:
   ```ts
   { value: 'alert', label: 'Alert', name: 'Alert', sub: 'system notifications', icon: 'warning' }
   ```
3. Update `src/lib/Hearth/configurationState.ts` so an alert widget requires configuration if neither `text` nor `entity` is defined.
4. Render the alert widget appropriately in `src/lib/Hearth/RailWidgetRenderer.svelte`.

## Code Smell & Refactoring
- **Code Smell**: Long Conditional / Divergent Change smell in `railWidgetNeedsConfiguration` (`src/lib/Hearth/configurationState.ts`). Each new widget previously added another `else if` branch in configuration validators, mixing disparate widget rules.
- **Refactoring Strategy**: Replace Conditional with Strategy / Validator Map. Structure widget configuration predicates into a decoupled `WIDGET_CONFIG_VALIDATORS` lookup map, making widget addition open for extension and closed for modification.
