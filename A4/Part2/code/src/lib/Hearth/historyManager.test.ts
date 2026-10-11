import { describe, expect, it } from 'vitest';
import { HistoryManager } from './historyManager';

describe('HistoryManager (Memento Caretaker)', () => {
	it('initializes with empty stacks and default capacity', () => {
		const manager = new HistoryManager<string>();
		expect(manager.canUndo()).toBe(false);
		expect(manager.canRedo()).toBe(false);
		expect(manager.depth()).toEqual([0, 0]);
		expect(manager.capacity()).toBe(50);
	});

	it('pushes snapshots and updates canUndo', () => {
		const manager = new HistoryManager<string>();
		manager.push('state-1');
		expect(manager.canUndo()).toBe(true);
		expect(manager.canRedo()).toBe(false);
		expect(manager.depth()).toEqual([1, 0]);

		manager.push('state-2');
		expect(manager.depth()).toEqual([2, 0]);
	});

	it('undo restores previous state and stages current onto redoStack', () => {
		const manager = new HistoryManager<string>();
		manager.push('state-1');
		manager.push('state-2');

		const restored = manager.undo('state-3');
		expect(restored).toBe('state-2');
		expect(manager.canUndo()).toBe(true);
		expect(manager.canRedo()).toBe(true);
		expect(manager.depth()).toEqual([1, 1]);
	});

	it('redo restores next state and stages current onto undoStack', () => {
		const manager = new HistoryManager<string>();
		manager.push('state-1');
		manager.push('state-2');

		manager.undo('state-3');
		const redone = manager.redo('state-2');
		expect(redone).toBe('state-3');
		expect(manager.canUndo()).toBe(true);
		expect(manager.canRedo()).toBe(false);
		expect(manager.depth()).toEqual([2, 0]);
	});

	it('push clears redoStack', () => {
		const manager = new HistoryManager<string>();
		manager.push('state-1');
		manager.push('state-2');
		manager.undo('state-3');
		expect(manager.canRedo()).toBe(true);

		// New branch mutation invalidates redo history
		manager.push('state-branch');
		expect(manager.canRedo()).toBe(false);
		expect(manager.depth()).toEqual([2, 0]);
	});

	it('enforces maximum capacity by evicting oldest snapshots', () => {
		const manager = new HistoryManager<number>(3);
		manager.push(1);
		manager.push(2);
		manager.push(3);
		manager.push(4); // evicts 1

		expect(manager.depth()).toEqual([3, 0]);
		expect(manager.undo(5)).toBe(4);
		expect(manager.undo(4)).toBe(3);
		expect(manager.undo(3)).toBe(2);
		expect(manager.undo(2)).toBeUndefined(); // 1 was evicted
	});

	it('clear resets all stacks', () => {
		const manager = new HistoryManager<string>();
		manager.push('a');
		manager.push('b');
		manager.undo('c');
		expect(manager.depth()).toEqual([1, 1]);

		manager.clear();
		expect(manager.canUndo()).toBe(false);
		expect(manager.canRedo()).toBe(false);
		expect(manager.depth()).toEqual([0, 0]);
	});

	it('returns undefined when undoing or redoing an empty stack', () => {
		const manager = new HistoryManager<string>();
		expect(manager.undo('current')).toBeUndefined();
		expect(manager.redo('current')).toBeUndefined();
	});
});
