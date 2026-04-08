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

const hhmmFormatter = new Intl.DateTimeFormat(undefined, {
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
})

export function formatEndTimeFromNow(remainingSecs: number): string {
	return hhmmFormatter.format(Date.now() + remainingSecs * 1000)
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
