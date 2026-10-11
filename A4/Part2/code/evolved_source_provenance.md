# Evolved source snapshot provenance

- Application: ha-fusion
- Baseline source commit: `65cc1957c39c6005609102c33650c32abc8d12f0`
- CH01 commit: `b2731a3` — Add `not` composite condition and evaluator dispatch table.
- CH02 commit: `3eb21fc` — Extract Hearth history into `HistoryManager<T>`.
- CH03 commit: `632f01bd326e09841d0279fbf5f3ca33c1e4940f` on branch `ch03-hearth-widget-extension`, based on CH02 commit `3eb21fc061b3aefa339ae9b9f92cd51f68c4b567`. It includes the CH03 widget work and follow-up corrections to CH01/CH02 discovered during `pnpm check`.
- Snapshot excludes `.git`, `node_modules`, `.svelte-kit`, generated build output, coverage, and local `.env` files.
- Complete test/check and source-metric logs are in `A4/data/test_result/`; each change's diff and criteria are in `A4/Part2/code/changes/ChangeN/`.
- CH03 source snapshot identity: sorted `src/` file manifest SHA-256 `f2d39989a0fa55381b6befc21b795d5fc80a2873b3261333ac65dec5ece1ad1b`; manifest files are in `snapshots/Change3_SHA256SUMS` and the digest is in `snapshots/Change3_snapshot.sha256`.
- The final source delta from CH02 base commit `3eb21fc061b3aefa339ae9b9f92cd51f68c4b567`, including check-driven corrections, is `changes/Change3/final_source_delta.diff`.
