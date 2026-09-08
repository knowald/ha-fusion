<script lang="ts">
	import { integerFromInput } from '../../edit/numbers';
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import Ripple from '$lib/ui/actions/ripple';
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
		const heightValue = integerFromInput(height);
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
	label={$lang('hearth_widget_type')}
	bind:value={fusionType}
	options={FUSION_WIDGET_TYPES.map((option) => ({ ...option, label: $lang(option.label) }))}
	onchange={() => advancedOpen && resetAdvancedYaml()}
/>
<FusionFields type={fusionType} bind:options />
<TextField label={$lang('hearth_height_in_px_optional')} bind:value={height} placeholder="120" />
<div
	class="advanced-toggle pressable"
	use:Ripple={PRESS_RIPPLE}
	role="button"
	tabindex="0"
	onclick={toggleAdvanced}
	onkeydown={(event) => activateOnKeyboard(event, toggleAdvanced)}
>
	<Icon name={advancedOpen ? 'expand_less' : 'expand_more'} size={ICON.control} />
	<span>{$lang('hearth_advanced_yaml')}</span>
</div>
{#if advancedOpen}
	<YamlField
		label={$lang('hearth_other_options_yaml')}
		bind:value={() => advancedYaml, setAdvancedYaml}
		placeholder={yamlPlaceholder}
	/>
	<div class="hint">
		{$lang('hearth_options_match_the_original_ha_fusion_2')}
	</div>
{/if}
