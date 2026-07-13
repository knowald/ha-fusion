<script module lang="ts">
	import * as yaml from 'js-yaml';

	type FusionField =
		| { key: string; label: string; control: 'entity'; domains?: string[] }
		| { key: string; label: string; control: 'text' | 'numeric'; placeholder?: string }
		| { key: string; label: string; control: 'select'; options: { value: string; label: string }[] }
		| { key: string; label: string; control: 'check' }
		| { key: string; label: string; control: 'template' };

	const GRAPH_PERIOD_OPTIONS = [
		{ value: '', label: 'Default' },
		{ value: '5minute', label: '5 minute' },
		{ value: 'hour', label: 'Hour' },
		{ value: 'day', label: 'Day' },
		{ value: 'week', label: 'Week' },
		{ value: 'month', label: 'Month' }
	];

	const HISTORY_PERIOD_OPTIONS = GRAPH_PERIOD_OPTIONS.filter(
		(option) => option.value !== '5minute'
	);

	const FIELD_SPECS: Record<string, FusionField[]> = {
		button: [
			{ key: 'entity_id', label: 'Entity', control: 'entity' },
			{ key: 'name', label: 'Name', control: 'text' },
			{ key: 'icon', label: 'Icon', control: 'text', placeholder: 'mdi:lightbulb or Material name' }
		],
		camera: [{ key: 'entity_id', label: 'Entity', control: 'entity', domains: ['camera'] }],
		days_since: [
			{ key: 'entity_id', label: 'Entity', control: 'entity' },
			{ key: 'name', label: 'Name', control: 'text' }
		],
		sensor: [
			{ key: 'entity_id', label: 'Entity', control: 'entity', domains: ['sensor'] },
			{ key: 'prefix', label: 'Prefix', control: 'text' },
			{ key: 'suffix', label: 'Suffix', control: 'text' }
		],
		template: [{ key: 'template', label: 'Template', control: 'template' }],
		graph: [
			{ key: 'entity_id', label: 'Entity', control: 'entity', domains: ['sensor'] },
			{ key: 'period', label: 'Period', control: 'select', options: GRAPH_PERIOD_OPTIONS },
			{ key: 'stroke', label: 'Stroke width', control: 'numeric', placeholder: '2' }
		],
		bar: [
			{ key: 'entity_id', label: 'Entity', control: 'entity' },
			{ key: 'name', label: 'Name', control: 'text' },
			{ key: 'math', label: 'Math', control: 'text' }
		],
		radial: [
			{ key: 'entity_id', label: 'Entity', control: 'entity', domains: ['sensor'] },
			{ key: 'name', label: 'Name', control: 'text' },
			{ key: 'stroke', label: 'Stroke width', control: 'numeric' }
		],
		history: [
			{ key: 'entity_id', label: 'Entity', control: 'entity' },
			{ key: 'period', label: 'Period', control: 'select', options: HISTORY_PERIOD_OPTIONS }
		],
		image: [
			{ key: 'entity_id', label: 'Entity', control: 'entity', domains: ['image', 'camera'] },
			{ key: 'url', label: 'URL', control: 'text' }
		],
		iframe: [
			{ key: 'url', label: 'URL', control: 'text' },
			{ key: 'size', label: 'Size', control: 'numeric' }
		],
		time: [
			{ key: 'hour12', label: '12-hour clock', control: 'check' },
			{ key: 'seconds', label: 'Show seconds', control: 'check' }
		],
		date: [
			{ key: 'short_day', label: 'Short day name', control: 'check' },
			{ key: 'short_month', label: 'Short month name', control: 'check' }
		],
		timer: [{ key: 'entity_id', label: 'Entity', control: 'entity', domains: ['timer'] }],
		weather: [{ key: 'entity_id', label: 'Entity', control: 'entity', domains: ['weather'] }],
		weather_forecast: [
			{ key: 'entity_id', label: 'Entity', control: 'entity', domains: ['weather'] }
		]
	};

	export function fusionSpecKeys(type: string): string[] {
		return (FIELD_SPECS[type] ?? []).map((field) => field.key);
	}

	/** YAML for the options the form fields of `type` do not cover. */
	export function dumpLeftoverYaml(type: string, options: Record<string, any>): string {
		const spec = fusionSpecKeys(type);
		const leftover = Object.fromEntries(
			Object.entries(options).filter(([key]) => !spec.includes(key))
		);
		return Object.keys(leftover).length ? yaml.dump(leftover) : '';
	}

	/**
	 * Replaces the non-spec keys of `options` with the parsed YAML mapping.
	 * Spec-covered keys typed in the YAML merge into the form fields instead
	 * of being dropped. Returns false (options untouched) when invalid.
	 */
	export function applyLeftoverYaml(
		type: string,
		options: Record<string, any>,
		text: string
	): boolean {
		let parsed: unknown = {};
		if (text.trim()) {
			try {
				parsed = yaml.load(text);
			} catch {
				return false;
			}
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
		}
		const spec = fusionSpecKeys(type);
		for (const key of Object.keys(options)) {
			if (!spec.includes(key)) delete options[key];
		}
		for (const [key, value] of Object.entries(parsed as Record<string, any>)) {
			options[key] = value;
		}
		return true;
	}
</script>

<script lang="ts">
	import EntityField from './EntityField.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';

	let { type, options = $bindable() }: { type: string; options: Record<string, any> } = $props();

	let fields = $derived(FIELD_SPECS[type] ?? []);

	function textValue(key: string): string {
		const value = options[key];
		return value === undefined || value === null ? '' : String(value);
	}

	function setText(key: string, value: string) {
		if (value.trim() === '') delete options[key];
		else options[key] = value;
	}

	function setNumeric(key: string, value: string) {
		const trimmed = value.trim();
		if (trimmed === '') {
			delete options[key];
		} else {
			// round-trip-stable numbers become numbers (Graph stroke, Divider
			// size expect them), anything else (e.g. iframe size '150px')
			// stays a string
			options[key] = String(Number(trimmed)) === trimmed ? Number(trimmed) : value;
		}
	}

	function setCheck(key: string, checked: boolean) {
		if (checked) options[key] = true;
		else delete options[key];
	}
</script>

{#each fields as field (field.key)}
	{#if field.control === 'entity'}
		<EntityField
			label={field.label}
			domains={field.domains ?? []}
			bind:value={() => textValue(field.key), (value) => setText(field.key, value)}
		/>
	{:else if field.control === 'text'}
		<TextField
			label={field.label}
			placeholder={field.placeholder ?? ''}
			bind:value={() => textValue(field.key), (value) => setText(field.key, value)}
		/>
	{:else if field.control === 'numeric'}
		<TextField
			label={field.label}
			placeholder={field.placeholder ?? ''}
			bind:value={() => textValue(field.key), (value) => setNumeric(field.key, value)}
		/>
	{:else if field.control === 'select'}
		<SelectField
			label={field.label}
			options={field.options}
			bind:value={() => textValue(field.key), (value) => setText(field.key, value)}
		/>
	{:else if field.control === 'check'}
		<label class="check">
			<input
				type="checkbox"
				checked={!!options[field.key]}
				onchange={(event) => setCheck(field.key, event.currentTarget.checked)}
			/>
			<span>{field.label}</span>
		</label>
	{:else if field.control === 'template'}
		<label class="field">
			<span class="field-label">{field.label}</span>
			<textarea
				value={textValue(field.key)}
				oninput={(event) => setText(field.key, event.currentTarget.value)}
				rows="7"
				spellcheck="false"></textarea>
		</label>
	{/if}
{:else}
	<div class="hint">No form fields for this type - configure it under Advanced (YAML).</div>
{/each}

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

	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--h-text-3);
		margin-bottom: 14px;
		cursor: pointer;
	}

	.check input {
		accent-color: var(--h-accent-deep);
		width: 16px;
		height: 16px;
	}

	.hint {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 4px 0 12px;
	}
</style>
