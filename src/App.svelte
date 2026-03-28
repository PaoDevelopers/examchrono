<script lang="ts">
	import { store } from "./lib/store.svelte"
	import TimerCard from "./lib/TimerCard.svelte"
	import TimerForm from "./lib/TimerForm.svelte"
</script>

<main>
	<TimerForm />
	{#if store.warning !== null}
		<p><span class="warning">Warning!</span> {store.warning}</p>
	{/if}
	<div class="grid">
		{#each store.sortedTimers as timer, i (timer.id)}
			<TimerCard
				{timer}
				isFirst={i === 0}
				isLast={i === store.sortedTimers.length - 1}
			/>
		{/each}
	</div>
</main>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.warning {
		font-weight: bold;
	}
</style>
