<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from '../../config';
	import { activateOnKeyboard } from '../../interaction';
	import type { WidgetEditorProps } from '../types';
	import { FUSION_WIDGET_TYPES, type FusionWidget } from './descriptor';
	import FusionFields, {
		applyLeftoverYaml,
		dumpLeftoverYaml
	} from '../../edit/FusionFields.svelte';
	import Icon from '../../Icon.svelte';
	import SelectField from '../../edit/SelectField.svelte';
	import TextField from '../../edit/TextField.svelte';
	import YamlField from '../../edit/YamlField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<FusionWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	const initialConfig = initial?.config ?? {};
	let fusionType = $state<string>(String(initialConfig.type ?? 'sensor'));
	let options = $state<Record<string, any>>(withoutType(initialConfig));
	let height = $state<string>(initial?.height ? String(initial.height) : '');
	let advancedOpen = $state(false);
	let advancedYaml = $state('');
	let advancedValid = $state(true);

	const yamlPlaceholder = 'entity_id: sensor.average_temperature\nname: Home';

	function withoutType(config: Record<string, any>) {
		const rest = { ...config };
		delete rest.type;
		return rest;
	}

	function resetAdvancedYaml() {
		advancedYaml = dumpLeftoverYaml(fusionType, options);
		advancedValid = true;
	}

	function toggleAdvanced() {
		advancedOpen = !advancedOpen;
		if (advancedOpen) resetAdvancedYaml();
	}

	function setAdvancedYaml(value: string) {
		advancedYaml = value;
		advancedValid = applyLeftoverYaml(fusionType, options, value);
	}

	$effect(() => {
		const heightValue = parseInt(height, 10);
		onchange({
			fields: {
				config: { type: fusionType, ...$state.snapshot(options) },
				height: Number.isFinite(heightValue) && heightValue >= 40 ? heightValue : undefined
			},
			valid: !advancedOpen || advancedValid
		});
	});
</script>

<SelectField
	label="Widget type"
	bind:value={fusionType}
	options={FUSION_WIDGET_TYPES}
	onchange={() => advancedOpen && resetAdvancedYaml()}
/>
<FusionFields type={fusionType} bind:options />
<TextField label="Height in px (optional)" bind:value={height} placeholder="120" />
<div
	class="advanced-toggle pressable"
	use:Ripple={PRESS_RIPPLE}
	role="button"
	tabindex="0"
	onclick={toggleAdvanced}
	onkeydown={(event) => activateOnKeyboard(event, toggleAdvanced)}
>
	<Icon name={advancedOpen ? 'expand_less' : 'expand_more'} size={18} />
	<span>Advanced (YAML)</span>
</div>
{#if advancedOpen}
	<YamlField
		label="Other options (YAML)"
		bind:value={() => advancedYaml, setAdvancedYaml}
		placeholder={yamlPlaceholder}
	/>
	<div class="hint">
		Options match the original ha-fusion sidebar config for the chosen type, e.g. entity_id, name,
		period.
	</div>
{/if}
