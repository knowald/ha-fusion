<script lang="ts">
	import { editor } from '../store';
	import CardEditSheet from './CardEditSheet.svelte';
	import CodeEditSheet from './CodeEditSheet.svelte';
	import RailWidgetEditSheet from './RailWidgetEditSheet.svelte';
	import RoomEditSheet from './RoomEditSheet.svelte';
	import SettingsEditSheet from './SettingsEditSheet.svelte';
	import StackEditSheet from './StackEditSheet.svelte';
	import ThemeEditSheet from './ThemeEditSheet.svelte';
	import AppSettingsEditSheet from './AppSettingsEditSheet.svelte';
</script>

{#if $editor}
	<!-- keyed so switching targets remounts the sheet with fresh field state -->
	{#key JSON.stringify($editor)}
		{#if $editor.kind === 'room'}
			<RoomEditSheet id={$editor.id} />
		{:else if $editor.kind === 'card'}
			<CardEditSheet
				roomId={$editor.roomId}
				id={$editor.id}
				column={$editor.column}
				stackId={$editor.stackId}
			/>
		{:else if $editor.kind === 'stack'}
			<StackEditSheet roomId={$editor.roomId} column={$editor.column} index={$editor.index} />
		{:else if $editor.kind === 'railWidget'}
			<RailWidgetEditSheet index={$editor.index} />
		{:else if $editor.kind === 'settings'}
			<SettingsEditSheet />
		{:else if $editor.kind === 'appSettings'}
			<AppSettingsEditSheet />
		{:else if $editor.kind === 'code'}
			<CodeEditSheet />
		{:else}
			<ThemeEditSheet />
		{/if}
	{/key}
{/if}
