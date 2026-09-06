<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { entityIds } from '$lib/core/ha/entities';
	import * as parser from 'js-yaml';
	import { editor, hearthConfig, updateConfig } from '../store';
	import { ConfigTooNewError, migrateHearthConfig } from '../migrate';
	import { hearthConfigIssues, normalizeHearthConfig } from '../normalize';
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
				return 'Configuration must be a YAML mapping'; // copy ok: yaml diagnostic
			}
			// pasted older files are lifted first, so their shapes are judged
			// after migration rather than reported as unknown types
			const issues = hearthConfigIssues(migrateHearthConfig(parsed));
			return issues.length ? issues.slice(0, 5).join('; ') : null;
		} catch (parseError) {
			if (parseError instanceof ConfigTooNewError) return parseError.message;
			return parseError instanceof Error ? parseError.message.split('\n')[0] : 'Invalid YAML'; // copy ok: yaml diagnostic
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

<EditSheet
	title={$lang('hearth_configuration_yaml')}
	onclose={close}
	ondone={apply}
	doneDisabled={!!error}
>
	<div class="hint">
		{$lang('hearth_edits_the_whole_configuration_applies_as')}
	</div>
	<div class="code-workspace">
		{#await import('$lib/ui/CodeEditor.svelte') then CodeEditor}
			<CodeEditor.default
				{value}
				type="yaml"
				transitionend={true}
				autocompleteList={$entityIds}
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
		font-size: var(--h-type-small);
		color: var(--h-text-6);
		margin: 4px 0 12px;
	}

	.error {
		font-size: var(--h-type-small);
		color: var(--h-bad-text);
		margin-top: 10px;
	}

	.code-workspace {
		min-height: 480px;
	}
</style>
