<script lang="ts">
	import type { ClockWidget } from './descriptor';
	import Clock from './Clock.svelte';

	let { widget }: { widget: ClockWidget } = $props();
</script>

<Clock
	timezone={widget.timezone}
	hour_format={widget.hour_format}
	show_seconds={widget.show_seconds}
/>
