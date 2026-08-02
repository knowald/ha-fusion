<script lang="ts">
	import { autocompleteList } from '$lib/Stores';
	import * as parser from 'js-yaml';
	import { editor, hearthConfig, updateConfig } from '../store';
	import { hearthConfigIssues, normalizeHearthConfig } from '../config';
	import EditSheet from './EditSheet.svelte';

	// snapshot at open time - the editor owns the draft until Apply/discard,
	// it doesn't track further store changes while the sheet is open
	const init = parser.dump($hearthConfig);
	let value = $state(init);

	let error = $derived.by(() => {
		try {
			const parsed = parser.load(value);
			// scalars and arrays parse fine but would normalize to the default
			// config, silently wiping the layout - only a mapping is acceptable
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				return 'Configuration must be a YAML mapping';
			}
			const issues = hearthConfigIssues(parsed);
			return issues.length ? issues.slice(0, 5).join('; ') : null;
		} catch (parseError) {
			return parseError instanceof Error ? parseError.message.split('\n')[0] : 'Invalid YAML';
		}
	});

	function close() {
		editor.set(null);
	}

	function apply() {
		if (error) return;
		const normalized = normalizeHearthConfig(parser.load(value));
		// replace every key in one updateConfig call so undo/redo treats the
		// whole-config edit as a single step
		updateConfig((config) => {
			const draft = config as unknown as Record<string, unknown>;
			for (const key of Object.keys(draft)) delete draft[key];
			Object.assign(draft, normalized);
		});
		editor.set(null);
	}
</script>

<EditSheet title="Configuration YAML" onclose={close} ondone={apply} doneDisabled={!!error}>
	<div class="hint">
		Edits the whole configuration. Applies as a single undo step; invalid YAML is rejected.
	</div>
	<div class="code-workspace">
		{#await import('$lib/Components/CodeEditor.svelte') then CodeEditor}
			<CodeEditor.default
				{value}
				type="yaml"
				transitionend={true}
				autocompleteList={$autocompleteList}
				onchange={(next) => (value = next)}
			/>
		{/await}
	</div>
	{#if error}
		<div class="error">{error}</div>
	{/if}
</EditSheet>

<style>
	.hint {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 4px 0 12px;
	}

	.error {
		font-size: 12px;
		color: var(--h-bad-text);
		margin-top: 10px;
	}

	.code-workspace {
		min-height: 480px;
	}
</style>
