# Part 2 source metrics (2026-10-11)

Tool versions: cloc 2.10; lizard 1.24.1. Raw output is stored beside this summary.

| Change | LOC scope | Before | After | Delta | Target CCN before | Target CCN after |
|---|---|---:|---:|---:|---:|---:|
| CH01 | Same files: `Conditional.ts`, `Types.ts` | 468 | 484 | +16 | `validateCondition`: 6 | 3 |
| CH02 | Same directory: `src/lib/Hearth/` | 17,063 | 17,186 | +123 | Max history-operation CCN: 2 | 2 |
| CH03 | Same directory: `src/lib/Hearth/` | 17,186 | 17,293 | +107 | `railWidgetNeedsConfiguration`: 7 | 2 |

CH01's new `handleNot()` has CCN 4. CH03's new alert predicate has CCN 2. The measurements describe source size and cyclomatic complexity; neither alone establishes improved design quality. See `A4/Part2/evolution_metrics.csv` for paths to all raw logs.
