interface RippleOptions {
	color?: string;
	opacity?: number;
	spreadingDuration?: string;
	spreadingTimingFunction?: string;
	clearingDuration?: string;
	clearingTimingFunction?: string;
}

const defaults: RippleOptions = {
	color: 'rgba(255, 255, 255, 0.15)',
	opacity: 0.5,
	spreadingDuration: '300ms',
	spreadingTimingFunction: 'ease-in-out',
	clearingDuration: '350ms',
	clearingTimingFunction: 'ease-in-out'
};

export default function Ripple(node: HTMLElement, options: RippleOptions = {}) {
	let opts = { ...defaults, ...options };

	function handlePointerDown(event: PointerEvent) {
		const rect = node.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const size = Math.max(rect.width, rect.height) * 2;

		const ripple = document.createElement('span');
		ripple.style.cssText = `
			position: absolute;
			border-radius: 50%;
			pointer-events: none;
			width: ${size}px;
			height: ${size}px;
			left: ${x - size / 2}px;
			top: ${y - size / 2}px;
			background: ${opts.color};
			opacity: 0;
			transform: scale(0);
			transition: transform ${opts.spreadingDuration} ${opts.spreadingTimingFunction},
			            opacity ${opts.spreadingDuration} ${opts.spreadingTimingFunction};
		`;

		const computedPosition = getComputedStyle(node).position;
		if (computedPosition === 'static') {
			node.style.position = 'relative';
		}
		node.style.overflow = 'hidden';

		node.appendChild(ripple);

		requestAnimationFrame(() => {
			ripple.style.transform = 'scale(1)';
			ripple.style.opacity = String(opts.opacity);
		});

		function clear() {
			ripple.style.transition = `opacity ${opts.clearingDuration} ${opts.clearingTimingFunction}`;
			ripple.style.opacity = '0';
			ripple.addEventListener('transitionend', () => ripple.remove(), { once: true });
			// Fallback removal
			setTimeout(() => ripple.remove(), 1000);
			window.removeEventListener('pointerup', clear);
			window.removeEventListener('pointercancel', clear);
		}

		window.addEventListener('pointerup', clear, { once: true });
		window.addEventListener('pointercancel', clear, { once: true });
	}

	node.addEventListener('pointerdown', handlePointerDown);

	return {
		update(newOptions: RippleOptions) {
			opts = { ...defaults, ...newOptions };
		},
		destroy() {
			node.removeEventListener('pointerdown', handlePointerDown);
		}
	};
}
