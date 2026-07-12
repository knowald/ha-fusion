<script lang="ts">
	import { states } from '$lib/Stores';

	const uid = $props.id();

	let {
		label,
		value = $bindable(''),
		domains = []
	}: { label: string; value?: string; domains?: string[] } = $props();

	let options = $derived(
		Object.keys($states ?? {})
			.filter((id) => domains.length === 0 || domains.includes(id.split('.')[0]))
			.sort()
	);
</script>

<label class="field">
	<span class="field-label">{label}</span>
	<input type="text" bind:value list="entities-{uid}" placeholder="entity_id" spellcheck="false" />
	<datalist id="entities-{uid}">
		{#each options as option (option)}
			<option value={option}>{$states?.[option]?.attributes?.friendly_name ?? ''}</option>
		{/each}
	</datalist>
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
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		background: var(--h-track);
		color: var(--h-text-2);
		font-family: var(--h-font-mono);
		font-size: 13px;
		outline: none;
	}

	input:focus {
		border-color: rgb(var(--h-accent-rgb) / 0.4);
	}

	input::placeholder {
		color: var(--h-text-6);
	}
</style>
