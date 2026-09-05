<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let domain = $derived(entity.split('.')[0]);
	let password = $derived(stateObj?.attributes?.mode === 'password');
	// svelte-ignore state_referenced_locally
	let draft = $state(stateObj?.state ?? '');

	function commit() {
		callEntityService(domain, 'set_value', entity, { value: draft });
	}
</script>

<form class="field" onsubmit={(event) => (event.preventDefault(), commit())}>
	<input
		type={password ? 'password' : 'text'}
		bind:value={draft}
		minlength={stateObj?.attributes?.min}
		maxlength={stateObj?.attributes?.max}
	/>
	<button type="submit" class="segment">{$lang('hearth_set_value')}</button>
</form>
