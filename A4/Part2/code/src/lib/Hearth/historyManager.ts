/**
 * Generic Memento Caretaker managing undo and redo history stacks.
 * Encapsulates snapshot storage, capacity bounding, and state transfer.
 */
export class HistoryManager<T> {
	private readonly undoStack: T[] = [];
	private readonly redoStack: T[] = [];
	private readonly maxHistory: number;

	constructor(maxHistory: number = 50) {
		this.maxHistory = Math.max(1, maxHistory);
	}

	/**
	 * Records a state snapshot to the undo stack, evicts the oldest entry if capacity
	 * is exceeded, and invalidates any subsequent redo branch.
	 */
	public push(state: T): void {
		this.undoStack.push(state);
		if (this.undoStack.length > this.maxHistory) {
			this.undoStack.shift();
		}
		this.redoStack.length = 0;
	}

	/**
	 * Navigates backward: pushes the current state onto redoStack and restores
	 * the most recent state from undoStack. Returns undefined if undoStack is empty.
	 */
	public undo(currentState: T): T | undefined {
		const previous = this.undoStack.pop();
		if (previous === undefined) return undefined;
		this.redoStack.push(currentState);
		return previous;
	}

	/**
	 * Navigates forward: pushes the current state onto undoStack and restores
	 * the next state from redoStack. Returns undefined if redoStack is empty.
	 */
	public redo(currentState: T): T | undefined {
		const next = this.redoStack.pop();
		if (next === undefined) return undefined;
		this.undoStack.push(currentState);
		return next;
	}

	/**
	 * Resets both undo and redo history stacks.
	 */
	public clear(): void {
		this.undoStack.length = 0;
		this.redoStack.length = 0;
	}

	/**
	 * Returns true if at least one undoable state snapshot exists.
	 */
	public canUndo(): boolean {
		return this.undoStack.length > 0;
	}

	/**
	 * Returns true if at least one redoable state snapshot exists.
	 */
	public canRedo(): boolean {
		return this.redoStack.length > 0;
	}

	/**
	 * Returns current stack depths as [undoCount, redoCount].
	 */
	public depth(): [number, number] {
		return [this.undoStack.length, this.redoStack.length];
	}

	/**
	 * Returns the maximum history capacity.
	 */
	public capacity(): number {
		return this.maxHistory;
	}
}
