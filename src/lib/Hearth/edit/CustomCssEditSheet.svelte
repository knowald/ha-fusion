<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { lang } from '$lib/core/i18n';
	import { editor } from '../store';
	import EditSheet from './EditSheet.svelte';

	let value = $state('');
	let loaded = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const response = await fetch(`${base}/_api/custom_css`);
			if (response.ok) value = await response.json();
		} catch (failure) {
			console.error(failure);
		} finally {
			loaded = true;
		}
	});

	function back() {
		editor.set({ kind: 'appSettings' });
	}

	async function save() {
		if (saving) return;
		saving = true;
		error = null;
		try {
			const response = await fetch(`${base}/_api/custom_css`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: value })
			});
			if (!response.ok) {
				error = `Save failed [${response.status}]`;
				return;
			}
			// the stylesheet is read once at boot; a reload applies the new file
			location.reload();
		} catch (failure) {
			console.error(failure);
			error = 'Save failed';
		} finally {
			saving = false;
		}
	}
</script>

<EditSheet
	title={$lang('hearth_custom_css')}
	onclose={() => editor.set(null)}
	onback={back}
	ondone={save}
	doneDisabled={!loaded || saving}
>
	<div class="hint">{$lang('hearth_custom_css_hint')}</div>
	<div class="code-workspace">
		{#if loaded}
			{#await import('$lib/ui/CodeEditor.svelte') then CodeEditor}
				<CodeEditor.default
					{value}
					type="css"
					transitionend={true}
					onchange={(next) => (value = next)}
				/>
			{/await}
		{:else}
			<div class="hint">{$lang('hearth_loading')}</div>
		{/if}
	</div>
	{#if error}<div class="error" role="alert">{error}</div>{/if}
</EditSheet>

<style>
	.hint {
		font-size: var(--h-type-secondary);
		color: var(--h-text-6);
		margin-bottom: 12px;
	}

	.code-workspace {
		min-height: 320px;
	}

	.error {
		margin-top: 12px;
		color: var(--h-bad-text);
		font-size: var(--h-type-secondary);
	}
</style>
