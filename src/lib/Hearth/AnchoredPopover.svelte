<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import { motion } from '$lib/Stores';
	import { getHearthInteractionMode } from './interaction';
	import { openPopovers } from './store';

	let {
		anchor,
		onclose,
		children
	}: { anchor: HTMLElement; onclose: () => void; children: Snippet } = $props();

	const elevated = getHearthInteractionMode() === 'preview';

	// distance kept from the viewport edges, and between anchor and card
	const MARGIN = 14;
	const GAP = 10;

	let card = $state<HTMLElement | undefined>();
	let placement = $state<{
		left: number;
		top: number;
		tail: number;
		above: boolean;
		tailed: boolean;
	} | null>(null);

	function clamp(value: number, min: number, max: number) {
		return Math.max(min, Math.min(max, value));
	}

	/**
	 * Pins the card to the anchor, on whichever side has room, clamped into the
	 * viewport so a card taller than either gap still shows its content and its
	 * scrollbar. Fixed positioning is what lets it escape the dashboard's scroll
	 * containers. The tail is dropped when clamping moved the card off the
	 * anchor's edge, since it would then point at nothing.
	 */
	function position() {
		if (!card) return;
		const rect = anchor.getBoundingClientRect();
		// the anchor left the viewport on either axis - nothing left to point at
		if (
			rect.bottom < 0 ||
			rect.top > window.innerHeight ||
			rect.right < 0 ||
			rect.left > window.innerWidth
		) {
			onclose();
			return;
		}
		const { offsetWidth: width, offsetHeight: height } = card;
		const left = clamp(rect.left, MARGIN, Math.max(MARGIN, window.innerWidth - width - MARGIN));
		const spaceBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
		const spaceAbove = rect.top - GAP - MARGIN;
		// below unless it does not fit there and above is roomier
		const above = height > spaceBelow && spaceAbove > spaceBelow;
		const top = clamp(
			above ? rect.top - GAP - height : rect.bottom + GAP,
			MARGIN,
			Math.max(MARGIN, window.innerHeight - height - MARGIN)
		);
		placement = {
			left,
			top,
			above,
			tail: clamp(rect.left + 30 - left, 16, Math.max(16, width - 30)),
			tailed: above
				? Math.abs(top + height + GAP - rect.top) < 2
				: Math.abs(top - GAP - rect.bottom) < 2
		};
	}

	/**
	 * The card is measured before it is placed, so it stays hidden for the first
	 * frame rather than flashing at the top-left corner. Both boxes are observed:
	 * the card's height settles only once the icon font resolves, and the anchor
	 * moves whenever a card above it grows.
	 */
	$effect(() => {
		if (!card) return;
		position();
		const observer = new ResizeObserver(position);
		observer.observe(card);
		observer.observe(anchor);
		openPopovers.update((count) => count + 1);
		return () => {
			observer.disconnect();
			openPopovers.update((count) => Math.max(0, count - 1));
			// the row that opened this is where the user was
			anchor.focus?.();
		};
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onresize={position} onscrollcapture={position} />

<div
	class="scrim"
	class:elevated
	role="presentation"
	onclick={onclose}
	transition:fade={{ duration: $motion ? 120 : 0 }}
></div>

<div
	class="card"
	class:elevated
	class:above={placement?.above}
	class:tailed={placement?.tailed}
	bind:this={card}
	style:left="{placement?.left ?? 0}px"
	style:top="{placement?.top ?? 0}px"
	style:visibility={placement ? 'visible' : 'hidden'}
	style:--tail-left="{placement?.tail ?? 16}px"
	transition:fade={{ duration: $motion ? 120 : 0 }}
>
	<div class="scroll">{@render children()}</div>
</div>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 45;
		background: rgb(0 0 0 / 0.42);
	}

	.card {
		position: fixed;
		z-index: 46;
		width: min(420px, calc(100vw - 28px));
		padding: 16px;
		border-radius: var(--h-radius-card);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.13 * var(--h-line-scale)));
		box-shadow: 0 26px 60px rgb(0 0 0 / 0.6);
	}

	/* the tail sits on .card, so scrolling belongs to an inner element */
	.scroll {
		/* vh first: a kiosk webview without dynamic viewport units would drop the
		   whole declaration and let the card outgrow the screen */
		max-height: min(72vh, 620px);
		max-height: min(72dvh, 620px);
		overflow: auto;
		scrollbar-width: none;
		/* tiles set touch-action: none for their drag gestures, which would
		   otherwise swallow a vertical swipe started on one */
		touch-action: pan-y;
	}

	.scroll::-webkit-scrollbar {
		display: none;
	}

	.card.tailed::before {
		content: '';
		position: absolute;
		left: var(--tail-left);
		top: -7px;
		width: 14px;
		height: 14px;
		background: var(--h-sheet-0);
		border-left: 1px solid rgb(var(--h-line-rgb) / calc(0.13 * var(--h-line-scale)));
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.13 * var(--h-line-scale)));
		transform: rotate(45deg);
	}

	.card.above.tailed::before {
		top: auto;
		bottom: -7px;
		background: var(--h-sheet-1);
		border-left: none;
		border-top: none;
		border-right: 1px solid rgb(var(--h-line-rgb) / calc(0.13 * var(--h-line-scale)));
		border-bottom: 1px solid rgb(var(--h-line-rgb) / calc(0.13 * var(--h-line-scale)));
	}

	/* Interactive card previews live inside the editor's z-index layer. */
	.scrim.elevated {
		z-index: 70;
	}

	.card.elevated {
		z-index: 71;
	}
</style>
