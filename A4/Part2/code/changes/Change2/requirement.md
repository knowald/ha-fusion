# Change 2 (CH02): Encapsulate Hearth History into Dedicated HistoryManager Caretaker

## Background & Motivation
In `src/lib/Hearth/store.ts`, Hearth UI configuration history is managed through raw module-scoped arrays `undoStack: HearthConfig[] = []` and `redoStack: HearthConfig[] = []`. Across functions `updateConfig`, `undoConfig`, `redoConfig`, `enterEditMode`, and `cancelEdit`, array operations (`push`, `pop`, `shift`, `length = 0`) are duplicated with an embedded magic number `50` for history capacity. Furthermore, client code has no way to query the stack size or clear history without re-entering edit mode.

## Functional Requirement
1. Extract and encapsulate the undo/redo stack mechanics into a generic `HistoryManager<T>` class (`src/lib/Hearth/historyManager.ts`).
2. Provide a parameterized maximum stack depth (defaulting to 50).
3. Implement core Caretaker methods:
   - `push(state: T)`: records a new snapshot, enforces max depth, clears redo stack.
   - `undo(current: T): T | undefined`: returns previous snapshot while staging `current` on redo stack.
   - `redo(current: T): T | undefined`: returns next snapshot while staging `current` on undo stack.
   - `clear()`: resets both stacks.
   - `canUndo()`: boolean check for available undo history.
   - `canRedo()`: boolean check for available redo history.
   - `depth()`: returns tuple `[undoDepth, redoDepth]`.
4. Refactor `src/lib/Hearth/store.ts` to delegate undo/redo operations to an instance of `HistoryManager<HearthConfig>`.
5. Export `clearHistory()` and `getHistoryDepth()` from `store.ts` for UI integration and testing.

## Code Smell & Refactoring
- **Code Smell**: Primitive Obsession & Data Clumps / Scattered Mutation Smell. State manipulation logic for undo/redo was tightly coupled to store definitions and duplicated across multiple functions.
- **Refactoring Strategy**: Extract Class / Encapsulate Collection. Encapsulate undo and redo stacks within an explicit, generic `HistoryManager<T>` Caretaker class. Decouple storage mechanics from Svelte store subscriptions, ensuring testability and separation of concerns.
