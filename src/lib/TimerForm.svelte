<script lang="ts">
	import { store } from "./store.svelte"

	const MAX_DURATION_MINS = Math.floor(Number.MAX_SAFE_INTEGER / 60000)

	let label = $state("")
	let durationMins = $state(60)
	let hasReadingTime = $state(false)

	function submit(e: SubmitEvent): void {
		e.preventDefault()
		const trimmed = label.trim()
		if (
			trimmed === "" ||
			!Number.isFinite(durationMins) ||
			!Number.isInteger(durationMins) ||
			durationMins <= 0 ||
			durationMins > MAX_DURATION_MINS
		)
			return
		store.add(trimmed, durationMins * 60, hasReadingTime)
		label = ""
	}
</script>

<section>
	<details>
		<summary>Add timer</summary>
		<form onsubmit={submit}>
			<label>
				Label
				<input type="text" bind:value={label} />
			</label>
			<label>
				Duration (min)
				<input
					type="number"
					min="1"
					max={MAX_DURATION_MINS}
					step="1"
					bind:value={durationMins}
				/>
			</label>
			<label class="checkbox">
				<input
					type="checkbox"
					bind:checked={hasReadingTime}
				/>
				Reading time
			</label>
			<button type="submit">Add</button>
		</form>
	</details>
	<div class="bulk-actions">
		<button
			type="button"
			onclick={() => store.startAll()}
			disabled={!store.canStartAll}
		>
			Start all
		</button>
		<button
			type="button"
			onclick={() => store.pauseAll()}
			disabled={!store.canPauseAll}
		>
			Pause all
		</button>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}

	form {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 0.75rem;
	}

	.bulk-actions {
		display: flex;
		gap: 0.75rem;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	input[type="text"] {
		width: 16rem;
	}

	input[type="number"] {
		width: 5rem;
	}

	details {
		display: inline-block;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background-color: var(--card-bg);
	}

	details > summary {
		padding: 0.75rem;
		cursor: pointer;
		user-select: none;
	}

	details[open] > summary {
		border-bottom: 1px solid var(--border);
	}
</style>
