<script lang="ts">
	import { states } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from '../config';
	import Icon from '../Icon.svelte';
	import EntityPicker from './EntityPicker.svelte';

	const uid = $props.id();

	let {
		label,
		value = $bindable(''),
		domains = []
	}: { label: string; value?: string; domains?: string[] } = $props();

	let pickerOpen = $state(false);

	let options = $derived(
		Object.keys($states ?? {})
			.filter((id) => domains.length === 0 || domains.includes(id.split('.')[0]))
			.sort()
	);
</script>

<label class="field">
	<span class="field-label">{label}</span>
	<span class="input-wrap">
		<input
			type="text"
			bind:value
			list="entities-{uid}"
			placeholder="entity_id"
			spellcheck="false"
		/>
		<span
			class="search pressable"
			use:Ripple={PRESS_RIPPLE}
			onclick={(event) => {
				// prevent the label from bouncing focus back to the input
				event.preventDefault();
				pickerOpen = true;
			}}
		>
			<Icon name="search" size={18} />
		</span>
	</span>
	<datalist id="entities-{uid}">
		{#each options as option (option)}
			<option value={option}>{$states?.[option]?.attributes?.friendly_name ?? ''}</option>
		{/each}
	</datalist>
</label>

{#if pickerOpen}
	<EntityPicker
		{domains}
		onselect={(entityId) => (value = entityId)}
		onclose={() => (pickerOpen = false)}
	/>
{/if}

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

	.input-wrap {
		position: relative;
		display: block;
	}

	input {
		width: 100%;
		padding: 11px 40px 11px 13px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		background: var(--h-track);
		color: var(--h-text-2);
		font-family: var(--h-font-mono);
		font-size: 13px;
		outline: none;
	}

	input:focus {
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
	}

	input::placeholder {
		color: var(--h-text-6);
	}

	/* centered via auto margins, not translateY - the global .pressable:active
	   transform would override a transform-based centering */
	.search {
		position: absolute;
		right: 6px;
		top: 0;
		bottom: 0;
		height: 30px;
		margin: auto 0;
		display: flex;
		align-items: center;
		padding: 6px;
		border-radius: var(--h-radius-xs);
		color: var(--h-icon);
		cursor: pointer;
	}

	.search:hover {
		color: var(--h-text-3);
	}
</style>
