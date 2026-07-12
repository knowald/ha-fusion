<script lang="ts">
	import * as yaml from 'js-yaml';

	let {
		label,
		value = $bindable(''),
		placeholder = ''
	}: { label: string; value?: string; placeholder?: string } = $props();

	let error = $derived.by(() => {
		if (!value.trim()) return null;
		try {
			const parsed = yaml.load(value);
			return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
				? null
				: 'Expected a YAML mapping';
		} catch (parseError) {
			return parseError instanceof Error ? parseError.message.split('\n')[0] : 'Invalid YAML';
		}
	});
</script>

<label class="field">
	<span class="field-label">{label}</span>
	<textarea bind:value {placeholder} rows="7" spellcheck="false"></textarea>
	{#if error}
		<span class="error">{error}</span>
	{/if}
</label>

<style>
	.field {
		display: block;
		margin-bottom: 14px;
	}

	.field-label {
		display: block;
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-label);
		margin-bottom: 6px;
	}

	textarea {
		width: 100%;
		padding: 11px 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: var(--h-track);
		color: var(--h-text-2);
		font-family: var(--h-font-mono);
		font-size: 13px;
		line-height: 1.5;
		outline: none;
		resize: vertical;
		box-sizing: border-box;
	}

	textarea:focus {
		border-color: rgb(var(--h-accent-rgb) / 0.4);
	}

	textarea::placeholder {
		color: var(--h-text-6);
	}

	.error {
		display: block;
		margin-top: 6px;
		font-size: 12px;
		color: var(--h-bad-text);
	}
</style>
