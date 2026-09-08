<script lang="ts">
	let {
		label,
		value = $bindable(''),
		options,
		onchange
	}: {
		label: string;
		value?: string;
		options: { value: string; label: string }[];
		onchange?: (value: string) => void;
	} = $props();
</script>

<label class="field">
	<span class="field-label">{label}</span>
	<select bind:value onchange={() => onchange?.(value)}>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</label>

<style>
	.field {
		display: block;
		margin-bottom: 14px;
	}

	.field-label {
		display: block;
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-label);
		margin-bottom: 6px;
	}

	select {
		width: 100%;
		padding: 12px 14px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		background: var(--h-track);
		color: var(--h-text-2);
		font-family: inherit;
		font-size: var(--h-type-body);
		outline: none;
		appearance: none;
	}

	select:focus {
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
	}

	option {
		background: var(--h-sheet-0);
	}
</style>
