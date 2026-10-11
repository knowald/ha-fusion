# 3. Part 2 — Evolution and refactoring

The changes evolve the existing ha-fusion application from baseline commit `65cc1957c39c6005609102c33650c32abc8d12f0`. CH01 is commit `b2731a34870bcb79090327234341e431b3c24b28`; CH02 is commit `3eb21fc061b3aefa339ae9b9f92cd51f68c4b567`. CH03 is commit `632f01bd326e09841d0279fbf5f3ca33c1e4940f` on `ch03-hearth-widget-extension`, based on CH02. Its source files are also pinned by the SHA-256 manifest at `Part2/code/snapshots/Change3_snapshot.sha256` and listed in `Part2/code/snapshots/Change3_SHA256SUMS`.

## CH01 — Negation and condition evaluator dispatch

**Requirement and acceptance.** Add a recursive `not` condition that evaluates false for an empty or absent child list and otherwise negates whether any child evaluates true. Preserve existing state, numeric, screen, and `and`/`or` behavior. Requirements and observable acceptance criteria are in `Part2/code/changes/Change1/requirement.md` and `acceptance_criteria.md`.

**Implementation and refactoring.** `Condition` gained the `not` discriminant; `handleNot()` implements negation; and `validateCondition()` now selects evaluator functions from `CONDITION_EVALUATORS`. This replaces the condition-type switch with a function-based Strategy dispatch table. Changed paths are `src/lib/Conditional.ts`, `src/lib/Types.ts`, and new `src/lib/Conditional.test.ts`. The commit diff and verification logs are in `Part2/code/changes/Change1/`.

**Pattern effect.** The Visibility Condition Tree Composite is extended with `not`. The evaluator dispatch is recorded as a newly introduced, function-based Strategy instance. Other tracked collaborations are preserved.

**Verification.** CH01's saved run reports 14 files and 59 tests passing. After cumulative type-check corrections, the final saved run reports 15 files and 68 tests passing, with `pnpm check` reporting 0 errors and 0 warnings. See `Part2/code/changes/Change1/test_result.log`, `data/test_result/evolved_test.log`, and `data/test_result/evolved_check.log`.

**Metrics.** The same two files were measured before and after: `Conditional.ts` plus `Types.ts`. `cloc` source LOC changed from 468 to 484 (+16). Lizard CCN for `validateCondition()` changed from 6 to 3; new `handleNot()` has CCN 4. Raw outputs are `data/test_result/ch01_cloc_{before,after}.log` and `ch01_lizard_{before,after}.csv`.

## CH02 — Hearth history caretaker extraction

**Requirement and acceptance.** Encapsulate Hearth configuration history in a generic `HistoryManager<T>`, preserve the store's observable undo/redo behavior, enforce a configurable history bound, and expose clear/depth operations. Requirements and criteria are in `Part2/code/changes/Change2/`.

**Implementation and refactoring.** `src/lib/Hearth/historyManager.ts` now owns bounded undo/redo stacks, push, undo, redo, clear, availability, and depth operations. `store.ts` delegates to it. This applies Extract Class and Encapsulate Collection to scattered stack mutation. Changed paths are new `src/lib/Hearth/historyManager.ts` and `historyManager.test.ts`, plus `src/lib/Hearth/store.ts`. The CH02 commit diff is `Part2/code/changes/Change2/change.diff`.

**Pattern effect.** The Hearth Config History & Edit Transaction remains a Memento collaboration, with the new `HistoryManager<HearthConfig>` as its caretaker. The visibility Strategy from CH01 is preserved.

**Verification.** The saved CH02 run reports 15 test files and 67 tests passing. The final cumulative run after stabilization reports 68 passing tests and a clean type check. Logs are `Part2/code/changes/Change2/test_result.log` and the cumulative logs under `data/test_result/`.

**Metrics.** The same `src/lib/Hearth/` directory was measured in the CH01 and CH02 snapshots. `cloc` source LOC changed from 17,063 to 17,186 (+123). Lizard's maximum CCN across the before/after history operations remained 2; the refactor's benefit is encapsulation and testability, not a measured CCN decrease. Raw outputs are `data/test_result/ch02_cloc_{before,after}.log` and `ch02_lizard_{before,after}.csv`.

## CH03 — Alert rail widget

**Requirement and acceptance.** Add an alert widget variant and registry entry, require text or an entity for configuration, and render alert content with severity. The requirement and criteria are in `Part2/code/changes/Change3/`.

**Implementation and refactoring.** The alert variant is registered and rendered by a new `AlertWidget.svelte`. `configurationState.ts` dispatches per-type configuration predicates through `WIDGET_CONFIG_VALIDATORS`, replacing a growing conditional with a function-based Strategy map. `ConfigurationPlaceholder.svelte` and `RailWidgetRenderer.svelte` were updated for widget-specific labels. Changed paths are `src/lib/Hearth/config.ts`, `configurationState.ts`, `configurationState.test.ts`, `RailWidgetRenderer.svelte`, `ConfigurationPlaceholder.svelte`, new `AlertWidget.svelte`, and the check-driven corrections in `src/lib/Types.ts`, `src/lib/Conditional.ts`, and `src/lib/Hearth/store.ts`. The main CH03 diff is `Part2/code/changes/Change3/change.diff`; final source delta from the CH02 base is `Part2/code/changes/Change3/final_source_delta.diff`.

**Pattern effect.** The rail validator dispatch is a newly introduced function-based Strategy instance with the alert predicate. Existing tracked collaborations are preserved; the Hearth Memento has a final history-clear correction in `saveEdit()`.

**Verification.** The saved final cumulative commands `pnpm test` and `pnpm check` report 15 test files / 68 tests passing and 0 errors / 0 warnings, respectively. The earlier CH03 check errors and their corrections are retained in `Part2/code/changes/Change3/test_result.log` for transparency.

**Metrics.** The same `src/lib/Hearth/` directory was measured in CH02 and the CH03 working-tree snapshot. `cloc` source LOC changed from 17,186 to 17,293 (+107). Lizard CCN for `railWidgetNeedsConfiguration()` changed from 7 to 2; the new alert predicate has CCN 2. Raw outputs are `data/test_result/ch03_cloc_{before,after}.log` and `ch03_lizard_{before,after}.csv`.

## 3.1 Updated pattern counts

Counts below refer to the tracked inventory in `data/patterns_evolution.csv`; they are not a claim that every pattern in the full application has been freshly audited. “Concrete participant classes” counts distinct source class symbols serving concrete roles: `KonvaEditor`, `KonvaViewer`, and, after CH02, `HistoryManager`. Strategy participants are functions, not classes.

| Snapshot | Distinct tracked pattern types | Tracked instances | Concrete participant classes | Rejected observations recorded | Uncertain observations recorded |
|---|---:|---:|---:|---:|---:|
| Original | 5 | 8 | 2 | 0 | 0 |
| After CH01 | 6 | 9 | 2 | 0 | 0 |
| After CH02 | 6 | 9 | 3 | 0 | 0 |
| After CH03 | 6 | 10 | 3 | 1 | 0 |

The CH03 change-scope review rejected one “Hearth Rail Widget Factory Method” candidate: the widget descriptor registry and renderer branches do not form a Factory Method collaboration. The observation is recorded in `data/pattern_candidate_observations.csv`. No uncertain rows are recorded. Baseline zeros mean no observations were retained in the carried-forward inventory; the independent Part 1 candidate audit was skipped, so they do not mean an exhaustive baseline sweep found none.

The change sequence adds recursive negation and lowers evaluator-dispatch CCN, then isolates history management without changing its measured maximum CCN, then adds an alert variant and lowers rail-configuration dispatch CCN. CH02 adds a class and CH03 adds a component and validators, so source LOC increases are expected; LOC alone does not establish design quality. The trade-offs are additional abstractions and tests to maintain, while behavior is protected by the passing cumulative suite. The remaining limitation is that the inherited baseline pattern inventory has not received an independent audit.

## Evidence and reproducibility

The inventory and count dataset are `data/patterns_evolution.csv` and `data/pattern_counts.csv`. Metric summaries and raw logs are linked above. The updated evolution diagram source and rendering are `Part2/diagrams/evolution_patterns.mmd` and `Part2/diagrams/evolution_patterns.svg`. Snapshot provenance is documented in `Part2/code/evolved_source_provenance.md` and `Part2/evolution_evidence_notes.md`.
