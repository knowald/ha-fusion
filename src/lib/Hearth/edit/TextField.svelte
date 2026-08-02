<script lang="ts">
	let {
		label,
		value = $bindable(''),
		placeholder = ''
	}: { label: string; value?: string; placeholder?: string } = $props();
</script>

<label class="field">
	<span class="field-label">{label}</span>
	<input type="text" bind:value {placeholder} spellcheck="false" />
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

	input {
		width: 100%;
		padding: 11px 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		background: var(--h-track);
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 14px;
		outline: none;
	}

	input:focus {
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
	}

	input::placeholder {
		color: var(--h-text-6);
	}
</style>
