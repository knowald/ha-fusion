<script lang="ts">
	import { hearthConfig } from './store';
	import CardColumns from './CardColumns.svelte';
</script>

<CardColumns
	columns={$hearthConfig.overview}
	locate={(config) => config.overview}
	groupName="hearth-cards"
	fill
/>
