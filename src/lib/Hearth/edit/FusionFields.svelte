<script module lang="ts">
	import * as yaml from 'js-yaml';

	type FusionField =
		| { key: string; label: string; control: 'entity'; domains?: string[] }
		| { key: string; label: string; control: 'text' | 'numeric'; placeholder?: string }
		| { key: string; label: string; control: 'select'; options: { value: string; label: string }[] }
		| { key: string; label: string; control: 'check' | 'check-false' }
		| { key: string; label: string; control: 'template' };

	const GRAPH_PERIOD_OPTIONS = [
		{ value: '', label: 'hearth_default_2' },
		{ value: '5minute', label: 'hearth_5_minute' },
		{ value: 'hour', label: 'period_hour' },
		{ value: 'day', label: 'day' },
		{ value: 'week', label: 'period_week' },
		{ value: 'month', label: 'month' }
	];

	const HISTORY_PERIOD_OPTIONS = GRAPH_PERIOD_OPTIONS.filter(
		(option) => option.value !== '5minute'
	);

	const FIELD_SPECS: Record<string, FusionField[]> = {
		button: [
			{ key: 'entity_id', label: 'entity', control: 'entity' },
			{ key: 'name', label: 'name', control: 'text' },
			{
				key: 'icon',
				label: 'icon',
				control: 'text',
				placeholder: 'mdi:lightbulb or Material name'
			}
		],
		camera: [{ key: 'entity_id', label: 'entity', control: 'entity', domains: ['camera'] }],
		days_since: [
			{ key: 'entity_id', label: 'entity', control: 'entity' },
			{ key: 'name', label: 'name', control: 'text' }
		],
		sensor: [
			{ key: 'entity_id', label: 'entity', control: 'entity', domains: ['sensor'] },
			{ key: 'prefix', label: 'hearth_prefix', control: 'text' },
			{ key: 'suffix', label: 'hearth_suffix', control: 'text' }
		],
		template: [{ key: 'template', label: 'template', control: 'template' }],
		graph: [
			{ key: 'entity_id', label: 'entity', control: 'entity', domains: ['sensor'] },
			{ key: 'period', label: 'period', control: 'select', options: GRAPH_PERIOD_OPTIONS },
			{ key: 'stroke', label: 'hearth_stroke_width', control: 'numeric', placeholder: '2' }
		],
		bar: [
			{ key: 'entity_id', label: 'entity', control: 'entity' },
			{ key: 'name', label: 'name', control: 'text' },
			{ key: 'math', label: 'hearth_math', control: 'text' }
		],
		radial: [
			{ key: 'entity_id', label: 'entity', control: 'entity', domains: ['sensor'] },
			{ key: 'name', label: 'name', control: 'text' },
			{ key: 'stroke', label: 'hearth_stroke_width', control: 'numeric' }
		],
		history: [
			{ key: 'entity_id', label: 'entity', control: 'entity' },
			{ key: 'period', label: 'period', control: 'select', options: HISTORY_PERIOD_OPTIONS }
		],
		image: [
			{ key: 'entity_id', label: 'entity', control: 'entity', domains: ['image', 'camera'] },
			{ key: 'url', label: 'url', control: 'text' }
		],
		iframe: [
			{ key: 'url', label: 'url', control: 'text' },
			{ key: 'size', label: 'size', control: 'numeric' }
		],
		time: [
			{ key: 'hour12', label: '12-hour clock', control: 'check' },
			{ key: 'seconds', label: 'hearth_show_seconds', control: 'check' }
		],
		date: [
			{ key: 'short_day', label: 'hearth_short_day_name', control: 'check' },
			{ key: 'short_month', label: 'hearth_short_month_name', control: 'check' }
		],
		timer: [{ key: 'entity_id', label: 'entity', control: 'entity', domains: ['timer'] }],
		weather: [{ key: 'entity_id', label: 'entity', control: 'entity', domains: ['weather'] }],
		weather_forecast: [
			{ key: 'entity_id', label: 'entity', control: 'entity', domains: ['weather'] }
		],
		entities: [
			{ key: 'name', label: 'name', control: 'text' },
			{
				key: 'wildcard',
				label: 'hearth_entity_wildcard',
				control: 'text',
				placeholder: 'light.kitchen_*'
			}
		],
		conditional_media: [
			{
				key: 'entity_id',
				label: 'hearth_fallback_entity',
				control: 'entity',
				domains: ['media_player']
			},
			{ key: 'name', label: 'name', control: 'text' },
			{ key: 'icon', label: 'icon', control: 'text' },
			{
				key: 'timeout',
				label: 'hearth_paused_timeout_seconds',
				control: 'numeric',
				placeholder: '900'
			},
			{ key: 'show_timeout', label: 'hearth_show_paused_timeout', control: 'check' },
			{ key: 'marquee', label: 'hearth_scroll_long_titles', control: 'check' }
		],
		spotify_player: [
			{
				key: 'entity_id',
				label: 'hearth_spotify_media_player',
				control: 'entity',
				domains: ['media_player']
			},
			{ key: 'name', label: 'name', control: 'text' },
			{ key: 'icon', label: 'icon', control: 'text', placeholder: 'mdi:spotify' },
			{
				key: 'color',
				label: 'hearth_accent_color',
				control: 'text',
				placeholder: '#1ed760'
			},
			{ key: 'show_progress', label: 'hearth_show_progress', control: 'check' },
			{
				key: 'default_device',
				label: 'hearth_default_spotify_connect_device',
				control: 'text'
			}
		],
		spotify_player_large: [
			{
				key: 'entity_id',
				label: 'hearth_spotify_media_player',
				control: 'entity',
				domains: ['media_player']
			},
			{ key: 'name', label: 'name', control: 'text' },
			{ key: 'icon', label: 'icon', control: 'text', placeholder: 'mdi:spotify' },
			{
				key: 'color',
				label: 'hearth_accent_color',
				control: 'text',
				placeholder: '#1ed760'
			},
			{ key: 'show_progress', label: 'hearth_show_progress', control: 'check' },
			{
				key: 'default_device',
				label: 'hearth_default_spotify_connect_device',
				control: 'text'
			}
		],
		divider: [
			{
				key: 'mode',
				label: 'hearth_style',
				control: 'select',
				options: [
					{ value: '', label: 'hearth_divider_line' },
					{ value: 'empty', label: 'hearth_empty_space' }
				]
			},
			{
				key: 'size',
				label: 'hearth_empty_space_height',
				control: 'numeric',
				placeholder: '50'
			}
		],
		notifications: [{ key: 'expand', label: 'hearth_start_collapsed', control: 'check-false' }]
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
	import { lang } from '$lib/core/i18n';
	import { entityIds } from '$lib/core/ha/entities';
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

	function setFalseCheck(key: string, checked: boolean) {
		if (checked) options[key] = false;
		else delete options[key];
	}
</script>

{#each fields as field (field.key)}
	{#if field.control === 'entity'}
		<EntityField
			label={$lang(field.label)}
			domains={field.domains ?? []}
			bind:value={() => textValue(field.key), (value) => setText(field.key, value)}
		/>
	{:else if field.control === 'text'}
		<TextField
			label={$lang(field.label)}
			placeholder={field.placeholder ?? ''}
			bind:value={() => textValue(field.key), (value) => setText(field.key, value)}
		/>
	{:else if field.control === 'numeric'}
		<TextField
			label={$lang(field.label)}
			placeholder={field.placeholder ?? ''}
			bind:value={() => textValue(field.key), (value) => setNumeric(field.key, value)}
		/>
	{:else if field.control === 'select'}
		<SelectField
			label={$lang(field.label)}
			options={field.options.map((option) => ({ ...option, label: $lang(option.label) }))}
			bind:value={() => textValue(field.key), (value) => setText(field.key, value)}
		/>
	{:else if field.control === 'check'}
		<label class="check">
			<input
				type="checkbox"
				checked={!!options[field.key]}
				onchange={(event) => setCheck(field.key, event.currentTarget.checked)}
			/>
			<span>{$lang(field.label)}</span>
		</label>
	{:else if field.control === 'check-false'}
		<label class="check">
			<input
				type="checkbox"
				checked={options[field.key] === false}
				onchange={(event) => setFalseCheck(field.key, event.currentTarget.checked)}
			/>
			<span>{$lang(field.label)}</span>
		</label>
	{:else if field.control === 'template'}
		<label class="field">
			<span class="field-label">{$lang(field.label)}</span>
			{#await import('$lib/ui/CodeEditor.svelte')}
				<textarea
					value={textValue(field.key)}
					oninput={(event) => setText(field.key, event.currentTarget.value)}
					rows="7"
					spellcheck="false"></textarea>
			{:then CodeEditor}
				<div class="code-editor">
					<CodeEditor.default
						value={textValue(field.key)}
						type="jinja2"
						transitionend={true}
						autocompleteList={$entityIds}
						onchange={(next) => setText(field.key, next)}
					/>
				</div>
			{/await}
		</label>
	{/if}
{:else}
	<div class="hint">{$lang('hearth_no_form_fields_for_this_type')}</div>
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
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
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
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
	}

	.code-editor :global(.cm-scroller) {
		max-height: 200px !important;
		overflow-y: auto;
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
