<script lang="ts">
	import { editMode, motion, record, dragging, itemHeight, states, dashboard } from '$lib/Stores';
	import { onMount, tick } from 'svelte';
	import { sortable } from '$lib/Actions/sortable';
	import Content from '$lib/Main/Content.svelte';
	import SectionHeader from '$lib/Main/SectionHeader.svelte';
	import HorizontalStackHeader from '$lib/Main/HorizontalStackHeader.svelte';
	import VerticalStackHeader from '$lib/Main/VerticalStackHeader.svelte';
	import Scenes from '$lib/Main/Scenes.svelte';
	import { handleVisibility, mediaQueries } from '$lib/Conditional';
	import { generateId } from '$lib/Utils';

	let { view, altKeyPressed }: { view: any; altKeyPressed: boolean } = $props();

	const stackHeight = $itemHeight * 1.65;

	let mounted = $state(false);
	onMount(() => (mounted = true));

	function handleDragStart() {
		$dragging = true;
		document.body.style.height = `${parseFloat(getComputedStyle(document.body).height) + 1}px`;
	}

	async function handleDragEnd() {
		$record();
		$dragging = false;
		await tick();
		document.body.style.height = 'auto';
	}

	function maybeCloneItem(items: any[], oldIndex: number, newIndex: number): any[] {
		if (altKeyPressed) {
			const cloned = { ...items[oldIndex], id: generateId($dashboard) };
			const result = [...items];
			result.splice(newIndex, 0, cloned);
			return result;
		}
		return items;
	}

	function sectionGroupPut(_to: any, _from: any, dragEl: HTMLElement): boolean {
		const dragType = dragEl.dataset.sectionType;
		if (dragType === 'horizontal-stack' || dragType === 'vertical-stack' || dragType === 'scenes') {
			return false;
		}
		return true;
	}

	function sectionStyles(sectionType: string, editMode: boolean, motion: number, empty: boolean) {
		return `
			min-height: ${sectionType === 'scenes' ? '4.8rem' : `${$itemHeight}px`};
			background-color: ${empty ? 'rgba(255, 190, 10, 0.25)' : sectionType === 'scenes' ? 'rgba(0, 0, 0, 0.125)' : 'transparent'};
			outline: ${empty ? '2px dashed #ffc107' : 'none'};
			transition: ${
				editMode ? `background-color ${motion / 2}ms ease, min-height ${motion}ms ease` : 'none'
			};
    `;
	}

	function itemStyles(type: string) {
		const large = ['conditional_media', 'picture_elements', 'camera', 'spotify_player_large'];
		return `
			grid-column: ${large.includes(type) ? 'span 2' : 'span 1'};
			grid-row: ${large.includes(type) ? 'span 4' : 'span 1'};
			display: ${type ? '' : 'none'};
    `;
	}

	let viewSections = $derived(
		$editMode
			? view?.sections
			: typeof mounted === 'boolean' &&
				typeof $mediaQueries === 'object' &&
				handleVisibility($editMode, view?.sections, $states)
	);
</script>

<main
	style:transition="opacity {$motion}ms ease, outline-color {$motion}ms ease"
	style:opacity={$editMode && view?.sections.length === 0 ? '0' : '1'}
	use:sortable={{
		group: { name: 'section', put: sectionGroupPut },
		animation: $motion,
		disabled: !$editMode,
		ghostClass: 'sortable-ghost',
		items: view.sections,
		onStart: handleDragStart,
		onFinalize: async (newItems) => {
			view.sections = newItems;
			await handleDragEnd();
		},
	}}
>
	{#each viewSections as section (section?.id)}
		<section
			id={String(section?.id)}
			data-id={section?.id}
			data-section-type={section?.type}
		>
			<!-- horizontal stack -->
			{#if section?.type === 'horizontal-stack'}
				<HorizontalStackHeader {view} {section} />

				<div
					class="horizontal-stack"
					style:min-height="{stackHeight}px"
					style:outline="2px dashed {$editMode ? '#ffc008' : 'transparent'}"
					style:transition="min-height {$motion}ms ease, outline {$motion / 2}ms ease"
					use:sortable={{
						group: { name: 'section', put: sectionGroupPut },
						animation: $motion,
						disabled: !$editMode,
						ghostClass: 'sortable-ghost',
						items: section.sections ?? [],
						onStart: handleDragStart,
						onFinalize: async (newItems) => {
							const stack = view?.sections.find(
								(s: any) => s.id === section.id && (s.type === 'horizontal-stack' || s.type === 'vertical-stack')
							);
							if (stack) {
								stack.sections = newItems.map((item: any) => ({ ...item, items: item.items ?? [] }));
								view.sections = [...view.sections];
							}
							await handleDragEnd();
						},
					}}
				>
					{#each section?.sections ?? [] as stackSection (stackSection?.id)}
						<section
							id={String(stackSection.id)}
							data-id={stackSection.id}
							data-section-type={stackSection?.type}
							style:overflow="hidden"
						>
							<!-- nested vertical stack inside horizontal stack -->
							{#if stackSection?.type === 'vertical-stack'}
								<VerticalStackHeader {view} section={stackSection} />

								<div
									class="vertical-stack nested"
									style:min-height="{stackHeight}px"
									style:outline="2px dashed {$editMode ? '#08c7ff' : 'transparent'}"
									style:transition="min-height {$motion}ms ease, outline {$motion / 2}ms ease"
									use:sortable={{
										group: { name: 'section', put: sectionGroupPut },
										animation: $motion,
										disabled: !$editMode,
										ghostClass: 'sortable-ghost',
										items: stackSection.sections ?? [],
										onStart: handleDragStart,
										onFinalize: async (newItems) => {
											const parentStack = view?.sections.find(
												(s: any) => s.id === section.id && s.type === 'horizontal-stack'
											);
											if (parentStack) {
												const nestedStack = parentStack.sections?.find(
													(s: any) => s.id === stackSection.id && s.type === 'vertical-stack'
												);
												if (nestedStack) {
													nestedStack.sections = newItems.map((item: any) => ({ ...item, items: item.items ?? [] }));
													view.sections = [...view.sections];
												}
											}
											await handleDragEnd();
										},
									}}
								>
									{#each stackSection?.sections ?? [] as nestedSection (nestedSection?.id)}
										{@const empty = $editMode && !nestedSection?.items?.length}
										<section
											id={String(nestedSection.id)}
											data-id={nestedSection.id}
											data-section-type={nestedSection?.type}
											style:overflow="hidden"
										>
											<SectionHeader {view} section={nestedSection} />
											<div
												class="items"
												style={sectionStyles(stackSection?.type, $editMode, $motion, empty)}
												use:sortable={{
													group: 'item',
													animation: $motion,
													disabled: !$editMode,
													ghostClass: 'sortable-ghost',
													items: nestedSection.items ?? [],
													onStart: handleDragStart,
													onFinalize: async (newItems, evt) => {
														const parentStack = view?.sections.find(
															(s: any) => s.id === section.id && s.type === 'horizontal-stack'
														);
														if (parentStack) {
															const ns = parentStack.sections?.find(
																(s: any) => s.id === stackSection.id && s.type === 'vertical-stack'
															);
															if (ns) {
																const sec = ns.sections?.find((s: any) => s.id === nestedSection.id);
																if (sec) {
																	sec.items = maybeCloneItem(newItems, evt.oldIndex ?? 0, evt.newIndex ?? 0);
																	view.sections = [...view.sections];
																}
															}
														}
														await handleDragEnd();
													},
												}}
											>
												{#each nestedSection?.items ?? [] as item (item.id)}
													<div
														data-id={item?.id}
														class="item"
														tabindex="-1"
														style={itemStyles(item?.type)}
													>
														<Content {item} sectionName={nestedSection?.name} />
													</div>
												{/each}
											</div>
										</section>
									{/each}
								</div>
							{:else}
								<!-- regular section inside horizontal stack -->
								{@const empty = $editMode && !stackSection?.items?.length}
								<SectionHeader {view} section={stackSection} />
								<div
									class="items"
									style={sectionStyles(section?.type, $editMode, $motion, empty)}
									use:sortable={{
										group: 'item',
										animation: $motion,
										disabled: !$editMode,
										ghostClass: 'sortable-ghost',
										items: stackSection.items ?? [],
										onStart: handleDragStart,
										onFinalize: async (newItems, evt) => {
											const sec = view?.sections
												.find((s: any) => s.sections?.some((sub: any) => sub.id === stackSection.id))
												?.sections.find((sub: any) => sub.id === stackSection.id);
											if (sec) {
												sec.items = maybeCloneItem(newItems, evt.oldIndex ?? 0, evt.newIndex ?? 0);
												view.sections = [...view.sections];
											}
											await handleDragEnd();
										},
									}}
								>
									{#each stackSection?.items ?? [] as item (item.id)}
										<div
											data-id={item?.id}
											class="item"
											tabindex="-1"
											style={itemStyles(item?.type)}
										>
											<Content {item} sectionName={stackSection?.name} />
										</div>
									{/each}
								</div>
							{/if}
						</section>
					{/each}
				</div>

				<!-- vertical stack -->
			{:else if section?.type === 'vertical-stack'}
				<VerticalStackHeader {view} {section} />

				<div
					class="vertical-stack"
					style:min-height="{stackHeight}px"
					style:outline="2px dashed {$editMode ? '#08c7ff' : 'transparent'}"
					style:transition="min-height {$motion}ms ease, outline {$motion / 2}ms ease"
					use:sortable={{
						group: { name: 'section', put: sectionGroupPut },
						animation: $motion,
						disabled: !$editMode,
						ghostClass: 'sortable-ghost',
						items: section.sections ?? [],
						onStart: handleDragStart,
						onFinalize: async (newItems) => {
							const stack = view?.sections.find(
								(s: any) => s.id === section.id && (s.type === 'horizontal-stack' || s.type === 'vertical-stack')
							);
							if (stack) {
								stack.sections = newItems.map((item: any) => ({ ...item, items: item.items ?? [] }));
								view.sections = [...view.sections];
							}
							await handleDragEnd();
						},
					}}
				>
					{#each section?.sections ?? [] as stackSection (stackSection?.id)}
						{@const empty = $editMode && !stackSection?.items?.length}
						<section
							id={String(stackSection.id)}
							data-id={stackSection.id}
							data-section-type={stackSection?.type}
							style:overflow="hidden"
						>
							<SectionHeader {view} section={stackSection} />
							<div
								class="items"
								style={sectionStyles(section?.type, $editMode, $motion, empty)}
								use:sortable={{
									group: 'item',
									animation: $motion,
									disabled: !$editMode,
									ghostClass: 'sortable-ghost',
									items: stackSection.items ?? [],
									onStart: handleDragStart,
									onFinalize: async (newItems, evt) => {
										const sec = view?.sections
											.find((s: any) => s.sections?.some((sub: any) => sub.id === stackSection.id))
											?.sections.find((sub: any) => sub.id === stackSection.id);
										if (sec) {
											sec.items = maybeCloneItem(newItems, evt.oldIndex ?? 0, evt.newIndex ?? 0);
											view.sections = [...view.sections];
										}
										await handleDragEnd();
									},
								}}
							>
								{#each stackSection?.items ?? [] as item (item.id)}
									<div
										data-id={item?.id}
										class="item"
										tabindex="-1"
										style={itemStyles(item?.type)}
									>
										<Content {item} sectionName={stackSection?.name} />
									</div>
								{/each}
							</div>
						</section>
					{/each}
				</div>

				<!-- scenes -->
			{:else if section?.type === 'scenes'}
				{@const empty = $editMode && !section?.items?.length}
				<SectionHeader {view} {section} />
				<div
					class="scenes"
					style={sectionStyles(section?.type, $editMode, $motion, empty)}
					use:sortable={{
						group: 'item',
						animation: $motion,
						disabled: !$editMode,
						ghostClass: 'sortable-ghost',
						items: section.items ?? [],
						onStart: handleDragStart,
						onFinalize: async (newItems, evt) => {
							const sec = view?.sections.find((s: any) => s.id === section.id);
							if (sec) {
								sec.items = maybeCloneItem(newItems, evt.oldIndex ?? 0, evt.newIndex ?? 0);
								view.sections = [...view.sections];
							}
							await handleDragEnd();
						},
					}}
				>
					{#each section?.items ?? [] as item, index (item.id)}
						<div
							data-id={item?.id}
							tabindex="-1"
							class:divider={index !== section?.items?.length - 1}
						>
							<Scenes sel={item} />
						</div>
					{/each}
				</div>

				<!-- normal -->
			{:else}
				{@const empty = $editMode && !section?.items?.length}

				<SectionHeader {view} {section} />

				<div
					class="items"
					style={sectionStyles(section?.type, $editMode, $motion, empty)}
					use:sortable={{
						group: 'item',
						animation: $motion,
						disabled: !$editMode,
						ghostClass: 'sortable-ghost',
						items: section.items ?? [],
						onStart: handleDragStart,
						onFinalize: async (newItems, evt) => {
							const sec = view?.sections.find((s: any) => s.id === section.id);
							if (sec) {
								sec.items = maybeCloneItem(newItems, evt.oldIndex ?? 0, evt.newIndex ?? 0);
								view.sections = [...view.sections];
							}
							await handleDragEnd();
						},
					}}
				>
					{#each section?.items ?? [] as item (item.id)}
						<div
							data-id={item?.id}
							class="item"
							tabindex="-1"
							style={itemStyles(item?.type)}
						>
							<Content {item} sectionName={section?.name} />
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</main>

<style>
	main {
		grid-area: main;
		padding: 0 2rem 2rem;
		display: grid;
		gap: 1.5rem;
		outline: transparent;
		align-content: start;
	}

	section {
		display: grid;
		align-content: start;
	}

	.horizontal-stack {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		gap: 2rem;
		border-radius: 0.65rem;
		outline-offset: 3px;
		padding: 0.5rem;
	}

	.vertical-stack {
		display: grid;
		grid-auto-flow: row;
		grid-auto-rows: min-content;
		gap: 1.5rem;
		border-radius: 0.65rem;
		outline-offset: 3px;
		padding: 0.5rem;
	}

	.vertical-stack.nested {
		outline-offset: -3px;
	}

	.items {
		border-radius: 0.6rem;
		outline-offset: -2px;
		display: grid;
		grid-template-columns: repeat(auto-fill, 14.5rem);
		grid-auto-rows: min-content;
		gap: 0.4rem;
		border-radius: 0.6rem;
		height: 100%;
	}

	.item {
		position: relative;
		border-radius: 0.65rem;
	}

	/* Phone and Tablet (portrait) */
	@media all and (max-width: 768px) {
		main {
			padding: 0 1.25rem 1.25rem 1.25rem;
		}

		.horizontal-stack {
			grid-auto-flow: row;
			gap: 1.5rem;
		}

		.items {
			display: flex;
			flex-wrap: wrap;
		}
	}

	.scenes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		border-radius: 0.65rem;
		overflow: hidden;
		min-height: 5rem;
	}

	.scenes > .divider {
		border-right: 1px solid transparent;
	}

	:global(.sortable-ghost) {
		opacity: 0.4;
	}

	:global(.sortable-chosen) {
		outline: 2px dashed rgb(255, 192, 8);
		outline-offset: -2px;
		border-radius: 0.65rem;
	}
</style>
