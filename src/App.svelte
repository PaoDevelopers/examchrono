<script lang="ts">
	import { onMount } from "svelte"
	import { store } from "./lib/store.svelte"
	import TimerCard from "./lib/TimerCard.svelte"
	import TimerForm from "./lib/TimerForm.svelte"

	const currentTimeFormatter = new Intl.DateTimeFormat(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	})

	let now = $state(Date.now())

	onMount(() => {
		const intervalId = window.setInterval(() => {
			now = Date.now()
		}, 1000)
		return () => window.clearInterval(intervalId)
	})
</script>

<main>
	<TimerForm />
	<p class="current-time">
		Local time {currentTimeFormatter.format(now)}
	</p>
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

	.current-time {
		margin: 0.75rem 0 0;
		font-variant-numeric: tabular-nums;
		color: var(--fg-muted);
	}
</style>
