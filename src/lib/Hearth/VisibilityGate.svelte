<script lang="ts">
	import type { Snippet } from 'svelte';
	import { states } from '$lib/Stores';
	import type { VisibilityCondition } from './config';
	import { evaluateVisibility } from './visibility';

	let {
		conditions,
		children
	}: { conditions?: VisibilityCondition[]; children: Snippet<[boolean]> } = $props();

	let mediaMatches = $state<Record<string, boolean>>({});

	// (re)subscribes to just the media queries this item's conditions use,
	// tearing down the previous set's listeners whenever conditions change
	$effect(() => {
		const queries = (conditions ?? [])
			.filter((condition): condition is { media: string } => 'media' in condition)
			.map((condition) => condition.media);

		if (queries.length === 0) {
			mediaMatches = {};
			return;
		}

		const entries = queries.map((query) => {
			const mql = window.matchMedia(query);
			const listener = () => {
				mediaMatches = { ...mediaMatches, [query]: mql.matches };
			};
			mql.addEventListener('change', listener);
			return { query, mql, listener };
		});

		mediaMatches = Object.fromEntries(entries.map(({ query, mql }) => [query, mql.matches]));

		return () => {
			for (const { mql, listener } of entries) mql.removeEventListener('change', listener);
		};
	});

	let visible = $derived(evaluateVisibility(conditions, $states, mediaMatches));
</script>

{@render children(visible)}
