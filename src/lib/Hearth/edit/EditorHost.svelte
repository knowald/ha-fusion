<script lang="ts">
	import { editor } from '../store';
	import BlindEditSheet from './BlindEditSheet.svelte';
	import CardEditSheet from './CardEditSheet.svelte';
	import CodeEditSheet from './CodeEditSheet.svelte';
	import DeviceEditSheet from './DeviceEditSheet.svelte';
	import LightEditSheet from './LightEditSheet.svelte';
	import RailWidgetEditSheet from './RailWidgetEditSheet.svelte';
	import RoomEditSheet from './RoomEditSheet.svelte';
	import SettingsEditSheet from './SettingsEditSheet.svelte';
	import ThemeEditSheet from './ThemeEditSheet.svelte';
</script>

{#if $editor}
	<!-- keyed so switching targets remounts the sheet with fresh field state -->
	{#key JSON.stringify($editor)}
		{#if $editor.kind === 'light'}
			<LightEditSheet id={$editor.id} />
		{:else if $editor.kind === 'blind'}
			<BlindEditSheet id={$editor.id} />
		{:else if $editor.kind === 'device'}
			<DeviceEditSheet roomId={$editor.roomId} index={$editor.index} />
		{:else if $editor.kind === 'room'}
			<RoomEditSheet id={$editor.id} />
		{:else if $editor.kind === 'card'}
			<CardEditSheet column={$editor.column} index={$editor.index} roomId={$editor.roomId} />
		{:else if $editor.kind === 'railWidget'}
			<RailWidgetEditSheet index={$editor.index} />
		{:else if $editor.kind === 'settings'}
			<SettingsEditSheet />
		{:else if $editor.kind === 'code'}
			<CodeEditSheet />
		{:else}
			<ThemeEditSheet />
		{/if}
	{/key}
{/if}
