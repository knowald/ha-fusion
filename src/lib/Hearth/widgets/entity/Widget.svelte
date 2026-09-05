<script lang="ts">
	import type { EntityWidget } from './descriptor';
	import EntityTile from '../../EntityTile.svelte';

	let { widget }: { widget: EntityWidget } = $props();
</script>

<EntityTile
	entity={widget.entity!}
	name={widget.name}
	icon={widget.icon}
	compact={widget.vertical_padding === 'compact'}
/>
