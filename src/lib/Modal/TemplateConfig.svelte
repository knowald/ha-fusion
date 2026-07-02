<script lang="ts">
	import { lang, autocompleteList, ripple } from '$lib/Stores';
	import Template from '$lib/Sidebar/Template.svelte';
	import CodeEditor from '$lib/Components/CodeEditor.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import type { TemplateItem } from '$lib/Types';
	import Ripple from '$lib/Actions/ripple';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: TemplateItem } = $props();

	let value = $state(sel?.template);
	let modalTransitionEnd = $state(false);

	function handleEvent() {
		modalTransitionEnd = true;
	}
</script>

<ConfigModal {isOpen} bind:sel title={$lang('template')} ontransitionend={handleEvent}>
	{#snippet children(set)}
		<h2>
			{$lang('preview')}
		</h2>

		<div class="preview">
			<Template {sel} />
		</div>

		<h2>{$lang('docs')}</h2>

		<div style="display: flex; align-items: center; flex-wrap: wrap; font-size: 0.85rem;">
			<a target="_blank" href="https://www.home-assistant.io/docs/configuration/templating/"
				>Templating</a
			>,&nbsp;
			<a target="_blank" href="https://jinja.palletsprojects.com/en/latest/templates/">Jinja2</a
			>,&nbsp;
			<a target="_blank" href="https://commonmark.org/help/">Markdown</a>,&nbsp;
			<a target="_blank" href="https://www.w3schools.com/html/html_intro.asp">HTML</a>,&nbsp;

			<div class="shortcut">
				<span style="font-weight: 500; margin-right: 0.6em;">
					{$lang('shortcuts')}:
				</span>
				<div class="key">ctrl</div>
				<div class="key" style="border: 1px solid transparent; padding: 0 0.4em;">+</div>
				<div class="key">space</div>
			</div>
		</div>

		<h2>{$lang('template_editor')}</h2>

		<CodeEditor
			bind:value
			type="jinja2"
			transitionend={modalTransitionEnd}
			autocompleteList={$autocompleteList}
			onchange={(event) => {
				value = event;
				set('template', value);
			}}
		/>

		<h2>{$lang('mobile')}</h2>

		<div class="button-container">
			<button
				class:selected={sel?.hide_mobile !== true}
				onclick={() => set('hide_mobile')}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>

			<button
				class:selected={sel?.hide_mobile === true}
				onclick={() => set('hide_mobile', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>
	{/snippet}
</ConfigModal>

<style>
	.shortcut {
		display: flex;
		align-items: center;
	}

	.key {
		border: 1px solid white;
		width: fit-content;
		padding: 0.35em 0.5em 0.4em 0.5em;
		border-radius: 0.5em;
		font-size: 0.6rem;
	}

	a {
		color: rgb(36 167 255);
		font-weight: 500;
	}

	.preview {
		overflow-y: scroll;
		max-height: 8rem;
		pointer-events: unset !important;
		background-color: rgb(0, 0, 0, 0.15);
		border-radius: 0.6rem;
		padding: 0rem 1rem;
	}
</style>
