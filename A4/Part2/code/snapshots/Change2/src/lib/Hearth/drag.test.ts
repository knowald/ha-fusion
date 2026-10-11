import { describe, expect, it, vi } from 'vitest';
import { horizontalDrag, onDndReceive } from './drag';

class TestNode extends EventTarget {
	setPointerCapture = vi.fn();
	releasePointerCapture = vi.fn();
	getBoundingClientRect() {
		return { left: 10, width: 200 } as DOMRect;
	}
}

function pointer(type: string, clientX: number) {
	const event = new Event(type) as PointerEvent;
	Object.defineProperties(event, {
		clientX: { value: clientX },
		pointerId: { value: 1 }
	});
	return event;
}

describe('horizontalDrag', () => {
	it('previews continuously, commits the endpoint and removes listeners', () => {
		const node = new TestNode();
		const set = vi.fn();
		const end = vi.fn();
		const action = horizontalDrag(node as unknown as HTMLElement, { set, end });

		node.dispatchEvent(pointer('pointerdown', 20));
		node.dispatchEvent(pointer('pointermove', 110));
		node.dispatchEvent(pointer('pointerup', 210));
		expect(set).toHaveBeenNthCalledWith(1, 50, true);
		expect(set).toHaveBeenNthCalledWith(2, 100, true);
		expect(end).toHaveBeenCalledWith(100);

		action?.destroy?.();
		node.dispatchEvent(pointer('pointerdown', 20));
		node.dispatchEvent(pointer('pointermove', 110));
		expect(set).toHaveBeenCalledTimes(2);
	});

	it('uses a tap below the movement threshold and honors updated options', () => {
		const node = new TestNode();
		const firstTap = vi.fn();
		const secondTap = vi.fn();
		const action = horizontalDrag(node as unknown as HTMLElement, { set: vi.fn(), tap: firstTap });
		action?.update?.({ set: vi.fn(), tap: secondTap });
		node.dispatchEvent(pointer('pointerdown', 20));
		node.dispatchEvent(pointer('pointerup', 24));
		expect(firstTap).not.toHaveBeenCalled();
		expect(secondTap).toHaveBeenCalledOnce();
	});

	it('does not turn ordinary ten-pixel tap drift into a value change', () => {
		const node = new TestNode();
		const set = vi.fn();
		const tap = vi.fn();
		horizontalDrag(node as unknown as HTMLElement, { set, tap });
		node.dispatchEvent(pointer('pointerdown', 20));
		node.dispatchEvent(pointer('pointermove', 30));
		node.dispatchEvent(pointer('pointerup', 30));
		expect(tap).toHaveBeenCalledOnce();
		expect(set).not.toHaveBeenCalled();
	});

	it('cleans up a cancelled gesture without committing or tapping', () => {
		const node = new TestNode();
		const set = vi.fn();
		const tap = vi.fn();
		const action = horizontalDrag(node as unknown as HTMLElement, { set, tap });

		node.dispatchEvent(pointer('pointerdown', 20));
		node.dispatchEvent(pointer('pointercancel', 25));
		node.dispatchEvent(pointer('pointerup', 210));

		expect(set).not.toHaveBeenCalled();
		expect(tap).not.toHaveBeenCalled();
		expect(node.releasePointerCapture).toHaveBeenCalledWith(1);
		action?.destroy?.();
	});
});

describe('onDndReceive', () => {
	it('forwards detail, stops bubbling, and detaches on destroy', () => {
		const node = new TestNode();
		const handler = vi.fn();
		const action = onDndReceive(node as unknown as HTMLElement, handler);
		const event = new Event('dndreceive', { bubbles: true }) as CustomEvent;
		Object.defineProperty(event, 'detail', { value: { id: 'card', newIndex: 2 } });
		const stop = vi.spyOn(event, 'stopPropagation');
		node.dispatchEvent(event);
		expect(handler).toHaveBeenCalledWith({ id: 'card', newIndex: 2 });
		expect(stop).toHaveBeenCalledOnce();
		action?.destroy?.();
		node.dispatchEvent(event);
		expect(handler).toHaveBeenCalledOnce();
	});
});
