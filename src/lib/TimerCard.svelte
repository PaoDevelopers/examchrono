<script lang="ts">
	import { store, type Timer } from "./store.svelte"
	import {
		formatSecs,
		formatSummary,
		phaseLabel,
		startButtonLabel,
	} from "./format"

	const {
		timer,
		isFirst,
		isLast,
	}: {
		timer: Timer
		isFirst: boolean
		isLast: boolean
	} = $props()

	function confirmReset(): void {
		if (!window.confirm(`Reset “${timer.label}”?`)) return
		store.reset(timer.id)
	}

	function confirmRemove(): void {
		if (!window.confirm(`Remove “${timer.label}”?`)) return
		store.remove(timer.id)
	}
</script>

<article>
	<div class="top">
		<h2>{timer.label}</h2>
		<span class="summary">{formatSummary(timer)}</span>
	</div>

	<p class="time">{formatSecs(store.displaySecs(timer))}</p>

	<div class="bottom">
		<span class="phase">{phaseLabel(timer)}</span>
		<div class="actions">
			{#if timer.state.kind === "running"}
				<button
					type="button"
					onclick={() => store.pause(timer.id)}
				>
					Pause
				</button>
			{/if}
			{#if timer.state.kind === "paused" || timer.state.kind === "finished"}
				<button type="button" onclick={confirmReset}
					>Reset</button
				>
				<button type="button" onclick={confirmRemove}
					>Remove</button
				>
			{/if}
			{#if timer.state.kind === "idle"}
				<button type="button" onclick={confirmRemove}
					>Remove</button
				>
			{/if}
			{#if timer.state.kind === "idle" || timer.state.kind === "paused"}
				<button
					type="button"
					onclick={() => store.start(timer.id)}
				>
					{startButtonLabel(timer)}
				</button>
			{/if}
			<button
				type="button"
				onclick={() => store.moveUp(timer.id)}
				disabled={isFirst}>↑</button
			>
			<button
				type="button"
				onclick={() => store.moveDown(timer.id)}
				disabled={isLast}>↓</button
			>
		</div>
	</div>
</article>

<style>
	article {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--card-bg);
	}

	.top {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 1rem;

		h2 {
			font-size: 1.2rem;
		}

		.summary {
			white-space: nowrap;
		}
	}

	.time {
		margin: 0;
		text-align: center;
		font-size: 3rem;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		font-weight: bold;
		letter-spacing: 1px;
	}

	.bottom {
		display: flex;
		justify-content: space-between;
		align-items: end;

		.actions {
			display: flex;
			gap: 0.5rem;
		}
	}
</style>
