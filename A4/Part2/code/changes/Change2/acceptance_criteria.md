# Change 2 (CH02): Acceptance Criteria

## AC-01: HistoryManager Class Extraction
- A generic class `HistoryManager<T>` must be defined in `src/lib/Hearth/historyManager.ts`.
- It must support custom capacity via constructor (e.g., `new HistoryManager<T>(maxHistory)`), defaulting to 50 when omitted.

## AC-02: Stack Operations & Bounds Checking
- `push(state)` must add `state` to undo history and clear any existing redo history.
- When `undoStack` exceeds `maxHistory`, the oldest entries must be evicted from the head (`shift()`).
- `undo(currentState)` must pop from `undoStack`, push `currentState` to `redoStack`, and return the popped state. If empty, return `undefined`.
- `redo(currentState)` must pop from `redoStack`, push `currentState` to `undoStack`, and return the popped state. If empty, return `undefined`.
- `clear()` must empty both `undoStack` and `redoStack`.

## AC-03: Backward-Compatible Store Integration
- `src/lib/Hearth/store.ts` must instantiate `HistoryManager<HearthConfig>`.
- Existing exports `updateConfig`, `undoConfig`, `redoConfig`, `canUndo`, `canRedo`, `enterEditMode`, `cancelEdit` must preserve identical external observable behavior.
- New helper exports `clearHistory()` and `getHistoryDepth()` must be available.

## AC-04: Testing & Metrics
- Unit test suite `src/lib/Hearth/historyManager.test.ts` must verify all methods, capacity eviction, and edge cases.
- Existing tests in `src/lib/Hearth/store.test.ts` must pass without regressions.
- Actual test logs, diffs, and complexity metrics must be recorded.
