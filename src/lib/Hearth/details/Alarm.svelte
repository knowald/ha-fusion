<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let features = $derived<number>(stateObj?.attributes?.supported_features ?? 0);
	let codeFormat = $derived<string | null>(stateObj?.attributes?.code_format ?? null);
	let codeArmRequired = $derived(stateObj?.attributes?.code_arm_required !== false);
	let code = $state('');

	// supported_features bits from Home Assistant's AlarmControlPanelEntityFeature
	const MODES = [
		{ bit: 1, service: 'alarm_arm_home', state: 'armed_home', label: 'hearth_arm_home' },
		{ bit: 2, service: 'alarm_arm_away', state: 'armed_away', label: 'hearth_arm_away' },
		{ bit: 4, service: 'alarm_arm_night', state: 'armed_night', label: 'hearth_arm_night' },
		{
			bit: 32,
			service: 'alarm_arm_vacation',
			state: 'armed_vacation',
			label: 'hearth_arm_vacation'
		},
		{
			bit: 16,
			service: 'alarm_arm_custom_bypass',
			state: 'armed_custom_bypass',
			label: 'hearth_arm_custom_bypass'
		}
	];

	function call(service: string, arming: boolean) {
		const needsCode = codeFormat && (arming ? codeArmRequired : true);
		callEntityService('alarm_control_panel', service, entity, needsCode ? { code } : {});
		code = '';
	}
</script>

{#if codeFormat}
	<div class="field">
		<input
			type={codeFormat === 'number' ? 'tel' : 'password'}
			inputmode={codeFormat === 'number' ? 'numeric' : undefined}
			placeholder={$lang('hearth_code')}
			bind:value={code}
			autocomplete="off"
		/>
	</div>
{/if}
<div class="segments">
	{#each MODES.filter((mode) => (features & mode.bit) === mode.bit) as mode (mode.service)}
		<button
			type="button"
			class="segment"
			class:active={stateObj?.state === mode.state}
			onclick={() => call(mode.service, true)}
		>
			{$lang(mode.label)}
		</button>
	{/each}
	<button
		type="button"
		class="segment danger"
		class:active={stateObj?.state === 'disarmed'}
		onclick={() => call('alarm_disarm', false)}
	>
		{$lang('hearth_disarm')}
	</button>
</div>
