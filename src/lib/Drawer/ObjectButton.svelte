<script lang="ts">
	import { dashboard, motion, record, lang, ripple } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import Icon from '@iconify/svelte';
	import { generateId } from '$lib/Utils';
	let { onclicked = undefined, view }: { onclicked?: (() => void) | undefined; view: any } = $props();

	let noViewsOrSectionsOrStacks = $derived(
		!view ||
		!view.sections ||
		view.sections.length === 0 ||
		checkForStackOnly(view.sections)
	);

	function checkForStackOnly(sections: any[]): boolean {
		return sections.every((section) => {
			// section is a horizontal-stack or vertical-stack
			if (section.type === 'horizontal-stack' || section.type === 'vertical-stack') {
				// Check if stack is empty or contains only empty stacks
				if (!section.sections || section.sections.length === 0) return true;
				return checkForStackOnly(section.sections);
			}
			// section is not a stack, so we found a valid section
			return false;
		});
	}

	/**
	 * Creates a new button object in
	 * first section of current view
	 */
	function handleClick() {
		if (noViewsOrSectionsOrStacks) return;

		const section = findSection(view.sections);

		if (!section?.items) return;

		section.items = [
			{ type: 'configure', id: generateId($dashboard) },
			...section.items
		];

		// Replace view object in dashboard.views so $derived produces a new reference
		$dashboard.views = $dashboard.views.map((v: any) =>
			v.id === view.id ? { ...v, sections: [...v.sections] } : v
		);
		$dashboard = $dashboard;
		$record();

		onclicked?.();
	}

	/**
	 * Finds the first section that is
	 * not of type 'horizontal-stack' or 'vertical-stack'.
	 */
	function findSection(sections: any[]): any | undefined {
		for (const section of sections) {
			if (section.type !== 'horizontal-stack' && section.type !== 'vertical-stack') return section;
			const found = section.sections && findSection(section.sections);
			if (found) return found;
		}
	}
</script>

<button
	class="button dropdown"
	onclick={handleClick}
	use:Ripple={{
		...$ripple,
		opacity: noViewsOrSectionsOrStacks ? '0' : $ripple.opacity
	}}
	style:cursor={noViewsOrSectionsOrStacks ? 'unset' : 'pointer'}
	style:opacity={noViewsOrSectionsOrStacks ? '0.5' : '1'}
	style:transition="opacity {$motion}ms ease"
>
	<figure>
		<Icon icon="solar:file-bold-duotone" height="none" />
	</figure>

	{$lang('object')}
</button>
