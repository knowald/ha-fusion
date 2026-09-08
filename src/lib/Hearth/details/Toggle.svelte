<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states, entityActive } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';
	import { toggleEntity } from '$lib/core/domains/entity';

	let { entity }: { entity: string } = $props();

	let on = $derived(entityActive(entity, $states?.[entity]));
	let domain = $derived(entity.split('.')[0]);

	function set(state: boolean) {
		// group members span domains, so only homeassistant.* covers them
		const target = domain === 'group' || domain === 'remote' ? 'homeassistant' : domain;
		callEntityService(target, state ? 'turn_on' : 'turn_off', entity);
	}
</script>

<div class="label">{$lang('state')}</div>
<div class="segments">
	<button type="button" class="segment" class:active={on} onclick={() => set(true)}>
		{$lang('hearth_turn_on')}
	</button>
	<button type="button" class="segment" class:active={!on} onclick={() => set(false)}>
		{$lang('hearth_turn_off')}
	</button>
	<button type="button" class="segment" onclick={() => toggleEntity(entity)}
		>{$lang('toggle')}</button
	>
</div>
