<script lang="ts">
	let {
		label,
		value,
		onchange
	}: { label: string; value: string; onchange: (value: string) => void } = $props();
</script>

<label class="field">
	<input type="color" {value} onchange={(event) => onchange(event.currentTarget.value)} />
	<span class="field-label">{label}</span>
</label>

<style>
	.field {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: var(--h-radius-xs);
		background: var(--h-inset);
		cursor: pointer;
	}

	.field-label {
		font-size: 13px;
		color: var(--h-text-3);
	}

	input[type='color'] {
		width: 30px;
		height: 30px;
		padding: 0;
		border: 1px solid rgb(var(--h-surface-rgb) / 0.15);
		border-radius: 9px;
		background: none;
		cursor: pointer;
	}

	input[type='color']::-webkit-color-swatch-wrapper {
		padding: 2px;
	}

	input[type='color']::-webkit-color-swatch {
		border: none;
		border-radius: 6px;
	}
</style>
