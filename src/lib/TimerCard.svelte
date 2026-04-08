<script lang="ts">
	import { store, type Timer } from "./store.svelte"
	import {
		formatEndTimeFromNow,
		formatSecs,
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

	function endTimeLabel(): string | null {
		if (timer.state.kind !== "running") return null
		return formatEndTimeFromNow(store.displaySecs(timer))
	}
</script>

<article>
	<div class="top">
		<h2>{timer.label}</h2>
		<span class="summary">
			{#if timer.hasReadingTime}
				{#if timer.state.kind === "running" && timer.state.readingPhase}
					<strong>Reading</strong> → {timer.durationSecs /
						60} min exam
				{:else if timer.state.kind === "running" && !timer.state.readingPhase}
					Reading → <strong
						>{timer.durationSecs / 60} min exam</strong
					>
				{:else}
					Reading → {timer.durationSecs / 60} min exam
				{/if}
			{:else if timer.state.kind === "running"}
				<strong
					>{timer.durationSecs / 60} min exam</strong
				>
			{:else}
				{timer.durationSecs / 60} min exam
			{/if}
		</span>
	</div>

	<p class="time">{formatSecs(store.displaySecs(timer))}</p>

	<div class="bottom">
		<span class="end-time">
			{#if endTimeLabel() !== null}
				Ends {endTimeLabel()}
			{/if}
		</span>
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
			text-align: right;
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
		align-items: flex-end;
		gap: 1rem;

		.end-time {
			display: flex;
			align-items: flex-end;
			color: var(--fg-muted);
			font-variant-numeric: tabular-nums;
			line-height: 1;
		}

		.actions {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			justify-content: end;
		}
	}
</style>
