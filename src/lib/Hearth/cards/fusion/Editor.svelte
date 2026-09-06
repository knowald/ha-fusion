<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import Ripple from '$lib/ui/actions/ripple';
	import { PRESS_RIPPLE } from '../../config';
	import { activateOnKeyboard } from '../../interaction';
	import type { CardEditorProps } from '../types';
	import { FUSION_OBJECT_TYPES, type FusionCard } from './descriptor';
	import FusionFields, {
		applyLeftoverYaml,
		dumpLeftoverYaml
	} from '../../edit/FusionFields.svelte';
	import Icon from '../../Icon.svelte';
	import SelectField from '../../edit/SelectField.svelte';
	import YamlField from '../../edit/YamlField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<FusionCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	const initialConfig = initial?.config ?? {};
	let fusionType = $state<string>(String(initialConfig.type ?? 'button'));
	let options = $state<Record<string, any>>(withoutType(initialConfig));
	let advancedOpen = $state(false);
	let advancedYaml = $state('');
	let advancedValid = $state(true);

	const yamlPlaceholder = 'entity_id: light.living_room\nname: Living Room';

	function withoutType(config: Record<string, any>) {
		const rest = { ...config };
		delete rest.type;
		return rest;
	}

	// the YAML area edits only the keys the form fields do not cover, so its
	// text is re-dumped whenever the covered key set can have changed
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
		onchange({
			fields: {
				config: { type: fusionType, ...$state.snapshot(options) },
				height: initial?.height
			},
			valid: !advancedOpen || advancedValid
		});
	});
</script>

<SelectField
	label={$lang('hearth_object_type')}
	bind:value={fusionType}
	options={FUSION_OBJECT_TYPES}
	onchange={() => advancedOpen && resetAdvancedYaml()}
/>
<FusionFields type={fusionType} bind:options />
<div
	class="advanced-toggle pressable"
	use:Ripple={PRESS_RIPPLE}
	role="button"
	tabindex="0"
	onclick={toggleAdvanced}
	onkeydown={(event) => activateOnKeyboard(event, toggleAdvanced)}
>
	<Icon name={advancedOpen ? 'expand_less' : 'expand_more'} size={18} />
	<span>{$lang('hearth_advanced_yaml')}</span>
</div>
{#if advancedOpen}
	<YamlField
		label={$lang('hearth_other_options_yaml')}
		bind:value={() => advancedYaml, setAdvancedYaml}
		placeholder={yamlPlaceholder}
	/>
	<div class="hint">
		{$lang('hearth_options_match_the_original_ha_fusion')}
	</div>
{/if}
