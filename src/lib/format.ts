import type { Timer } from "./store.svelte"

export type PhaseLabel =
	| "Ready"
	| "Reading"
	| "Reading paused"
	| "Exam"
	| "Exam paused"
	| "Finished"

export function formatSecs(secs: number): string {
	const h = Math.floor(secs / 3600)
	const m = Math.floor((secs % 3600) / 60)
	const s = secs % 60
	if (h === 0) {
		return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
	}
	return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function formatSummary(timer: Timer): string {
	const examMins = timer.durationSecs / 60
	if (timer.hasReadingTime) {
		return `Reading → ${examMins} min exam`
	}
	return `${examMins} min exam`
}

export function phaseLabel(timer: Timer): PhaseLabel {
	switch (timer.state.kind) {
		case "idle":
			return "Ready"
		case "running":
			return timer.state.readingPhase ? "Reading" : "Exam"
		case "paused":
			return timer.state.readingRemainingSecs > 0
				? "Reading paused"
				: "Exam paused"
		case "finished":
			return "Finished"
	}
}

export function startButtonLabel(timer: Timer): "Start" | "Resume" {
	return timer.state.kind === "paused" ? "Resume" : "Start"
}
