# Evolution evidence notes

## Version map

| Version | Source snapshot | Provenance |
| --- | --- | --- |
| Original | `data/code/` | Baseline commit `65cc1957c39c6005609102c33650c32abc8d12f0` |
| AfterChange1 | `Part2/code/snapshots/Change1/` | Commit `b2731a3` |
| AfterChange2 | `Part2/code/snapshots/Change2/` | Commit `3eb21fc` |
| AfterChange3 | `Part2/code/` | Commit `632f01bd326e09841d0279fbf5f3ca33c1e4940f` on `ch03-hearth-widget-extension`, based on `3eb21fc061b3aefa339ae9b9f92cd51f68c4b567`. Source tree manifest SHA-256: `f2d39989a0fa55381b6befc21b795d5fc80a2873b3261333ac65dec5ece1ad1b`; see `Part2/code/snapshots/Change3_SHA256SUMS`. |

The snapshot source directories exclude build output and local environment files. CH03 changed paths are preserved in `Part2/code/changes/Change3/final_source_delta.diff`; the source manifest digest independently identifies the copied CH03 source tree. The source-version labels in both CSV files identify the corresponding snapshot. All `source_locations` values are relative to the team folder `A4/`.

## Inventory scope and limitation

The eight baseline rows were carried forward from the existing `data/patterns.csv`. At the user's direction, this work skipped the independent Part 1 pattern audit. Therefore, these rows are not presented as newly verified findings. Their later-version rows track source evolution for comparison and retain this limitation in the evidence text. New CH01 and CH03 Strategy rows were checked against the versioned source snapshots. The CH03 “Hearth Rail Widget Factory Method” candidate was rejected in the changed-module scope and is recorded separately in `data/pattern_candidate_observations.csv`.

The Strategy instances use typed function signatures, maps of discriminants to functions, and a dispatcher that selects and invokes each function. They are function-based collaborations; there are no Strategy classes. The pattern counts classify these as Strategy instances and count distinct pattern names as pattern types.

## Counting method

`patterns_evolution.csv` contains one row per tracked pattern instance per source version. `pattern_counts.csv` reports the number of instances grouped by pattern name, then the number of distinct pattern names and total instances for each version. Counts are descriptive of this tracked inventory, not an independently audited complete census of all patterns in the application. The concrete class total counts distinct class symbols serving concrete participant roles (`KonvaEditor`, `KonvaViewer`, plus `HistoryManager` from CH02). The rejected/uncertain columns count observations in `data/pattern_candidate_observations.csv`; zeros mean none were recorded for that snapshot, not that a complete application-wide sweep found none.

| Version | Pattern types | Instances | Concrete participant classes | Rejected recorded | Uncertain recorded |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original | 5 | 8 | 2 | 0 | 0 |
| AfterChange1 | 6 | 9 | 2 | 0 | 0 |
| AfterChange2 | 6 | 9 | 3 | 0 | 0 |
| AfterChange3 | 6 | 10 | 3 | 1 | 0 |

## Metric method

`Part2/evolution_metrics.csv` records before/after source scopes for each change. CH01 uses the same two files on both sides; CH02 and CH03 each measure the full `src/lib/Hearth/` directory in both snapshots. The adjacent `cloc` output files and `lizard --csv` files are the raw measurements. These are source LOC and cyclomatic complexity measures; they do not measure runtime or quality by themselves.

CH01: `validateCondition()` CCN 6 → 3; source LOC 468 → 484 (+16). CH02: maximum CCN among history operations is 2 → 2; Hearth module source LOC 17,063 → 17,186 (+123). CH03: `railWidgetNeedsConfiguration()` CCN 7 → 2; Hearth module source LOC 17,186 → 17,293 (+107). The new `handleNot()` has CCN 4 and the alert predicate has CCN 2.
