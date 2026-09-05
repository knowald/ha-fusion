<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let attributes = $derived(stateObj?.attributes ?? {});
	let available = $derived(stateObj?.state === 'on');
	// UpdateEntityFeature: 1 install
	let canInstall = $derived(((attributes.supported_features ?? 0) & 1) === 1);
	let inProgress = $derived(
		attributes.in_progress === true || typeof attributes.in_progress === 'number'
	);
</script>

<div class="readout">
	<span>{$lang('hearth_installed_version')}</span><strong
		>{attributes.installed_version ?? '-'}</strong
	>
</div>
<div class="readout">
	<span>{$lang('hearth_latest_version')}</span><strong>{attributes.latest_version ?? '-'}</strong>
</div>
{#if attributes.release_url}
	<div class="note">
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- an external page from the integration, not a route -->
		<a class="link" href={attributes.release_url} target="_blank" rel="noreferrer"
			>{$lang('hearth_release_notes')}</a
		>
	</div>
{/if}
{#if available}
	<div class="segments">
		{#if canInstall}
			<button
				type="button"
				class="segment active"
				disabled={inProgress}
				onclick={() => callEntityService('update', 'install', entity)}
				>{$lang('hearth_install')}</button
			>
		{/if}
		<button
			type="button"
			class="segment"
			onclick={() => callEntityService('update', 'skip', entity)}
			>{$lang('hearth_skip_version')}</button
		>
	</div>
{:else}
	<div class="note">{$lang('hearth_up_to_date')}</div>
{/if}
