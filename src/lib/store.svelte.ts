const READING_SECS = 5 * 60
const MAX_DURATION_SECS = Math.floor(Number.MAX_SAFE_INTEGER / 1000)

type TimerState =
	| { kind: "idle" }
	| {
			kind: "running"
			endMonoTime: number
			readingPhase: boolean
	  }
	| {
			kind: "paused"
			remainingSecs: number
			readingRemainingSecs: number
	  }
	| { kind: "finished" }

export type Timer = {
	id: string
	label: string
	durationSecs: number
	hasReadingTime: boolean
	order: number
	state: TimerState
}

function compareTimers(a: Timer, b: Timer): number {
	return a.order !== b.order
		? a.order - b.order
		: a.label.localeCompare(b.label)
}

class TimerStore {
	public timers: Timer[] = $state([])
	public nowMonoTime: number = $state(performance.now())
	public warning: string | null = $state(null)

	public sortedTimers: Timer[] = $derived.by(() =>
		[...this.timers].sort(compareTimers),
	)
	public canStartAll: boolean = $derived(
		this.timers.some(
			(timer) =>
				timer.state.kind === "idle" ||
				timer.state.kind === "paused",
		),
	)
	public canPauseAll: boolean = $derived(
		this.timers.some((timer) => timer.state.kind === "running"),
	)

	private intervalId: number | null = null
	private previousTickMonoTime: number | null = null
	private previousTickWallTime: number | null = null

	private formatMs(ms: number): string {
		const rounded = Math.round(ms)
		const sign = rounded >= 0 ? "+" : "-"
		return `${sign}${Math.abs(rounded).toLocaleString()}\u202fms`
	}

	private captureNow(): void {
		this.nowMonoTime = performance.now()
	}

	private updateDesyncWarning(): void {
		if (!this.anyRunning()) return
		if (
			this.previousTickMonoTime === null ||
			this.previousTickWallTime === null
		)
			return
		const monoDelta = this.nowMonoTime - this.previousTickMonoTime
		const wallDelta = Date.now() - this.previousTickWallTime
		const monoLateness = monoDelta - 1000
		const wallMonoDisagreement = wallDelta - monoDelta
		if (
			monoLateness <= 1000 &&
			Math.abs(wallMonoDisagreement) <= 1000
		)
			return
		this.warning = `Timing anomaly detected. As of ${this.formatMs(this.nowMonoTime)} monotonic time, the most recent nominal 1000\u202fms interval measured ${this.formatMs(monoDelta)} monotonic and ${this.formatMs(wallDelta)} wall time. On the monotonic clock, the callback was ${this.formatMs(monoLateness)} late. Over the same interval, wall time advanced ${this.formatMs(wallMonoDisagreement)} more than monotonic time.`
	}

	private remainingMs(timer: Timer): number {
		if (timer.state.kind !== "running") return 0
		const monoRemaining = timer.state.endMonoTime - this.nowMonoTime
		return Math.max(0, monoRemaining)
	}

	private tick(): void {
		this.captureNow()
		this.updateDesyncWarning()
		this.previousTickMonoTime = this.nowMonoTime
		this.previousTickWallTime = Date.now()
		for (const timer of this.timers) {
			while (
				timer.state.kind === "running" &&
				this.remainingMs(timer) === 0
			) {
				if (timer.state.readingPhase) {
					const readingEndMonoTime =
						timer.state.endMonoTime
					timer.state = {
						kind: "running",
						endMonoTime:
							readingEndMonoTime +
							timer.durationSecs *
								1000,
						readingPhase: false,
					}
				} else {
					timer.state = { kind: "finished" }
				}
			}
		}
		if (!this.anyRunning()) this.stopInterval()
	}

	private startInterval(): void {
		if (this.intervalId !== null) return
		this.previousTickMonoTime = this.nowMonoTime
		this.previousTickWallTime = Date.now()
		this.intervalId = window.setInterval(() => this.tick(), 1000)
	}

	private stopInterval(): void {
		if (this.intervalId === null) return
		window.clearInterval(this.intervalId)
		this.intervalId = null
		this.previousTickMonoTime = null
		this.previousTickWallTime = null
	}

	private anyRunning(): boolean {
		return this.timers.some((t) => t.state.kind === "running")
	}

	public displaySecs(timer: Timer): number {
		switch (timer.state.kind) {
			case "idle":
				return timer.hasReadingTime
					? READING_SECS
					: timer.durationSecs
			case "running":
				return Math.max(
					0,
					Math.ceil(
						this.remainingMs(timer) / 1000,
					),
				)
			case "paused":
				return timer.state.readingRemainingSecs > 0
					? timer.state.readingRemainingSecs
					: timer.state.remainingSecs
			case "finished":
				return 0
		}
	}

	public add(
		label: string,
		durationSecs: number,
		hasReadingTime: boolean,
	): void {
		if (
			!Number.isFinite(durationSecs) ||
			!Number.isInteger(durationSecs) ||
			durationSecs <= 0 ||
			durationSecs > MAX_DURATION_SECS
		)
			return
		const order =
			this.timers.length === 0
				? 0
				: Math.max(...this.timers.map((t) => t.order)) +
					1
		this.timers.push({
			id: crypto.randomUUID(),
			label,
			durationSecs,
			hasReadingTime,
			order,
			state: { kind: "idle" },
		})
	}

	public start(id: string): void {
		this.captureNow()
		const timer = this.timers.find((t) => t.id === id)
		if (timer === undefined) return
		if (
			timer.state.kind !== "idle" &&
			timer.state.kind !== "paused"
		)
			return
		if (timer.state.kind === "idle") {
			timer.state = timer.hasReadingTime
				? {
						kind: "running",
						endMonoTime:
							this.nowMonoTime +
							READING_SECS * 1000,
						readingPhase: true,
					}
				: {
						kind: "running",
						endMonoTime:
							this.nowMonoTime +
							timer.durationSecs *
								1000,
						readingPhase: false,
					}
		} else {
			const secs =
				timer.state.readingRemainingSecs > 0
					? timer.state.readingRemainingSecs
					: timer.state.remainingSecs
			timer.state = {
				kind: "running",
				endMonoTime: this.nowMonoTime + secs * 1000,
				readingPhase:
					timer.state.readingRemainingSecs > 0,
			}
		}
		this.startInterval()
	}

	public startAll(): void {
		this.captureNow()
		let startedAny = false
		for (const timer of this.timers) {
			if (
				timer.state.kind !== "idle" &&
				timer.state.kind !== "paused"
			)
				continue
			if (timer.state.kind === "idle") {
				timer.state = timer.hasReadingTime
					? {
							kind: "running",
							endMonoTime:
								this
									.nowMonoTime +
								READING_SECS *
									1000,
							readingPhase: true,
						}
					: {
							kind: "running",
							endMonoTime:
								this
									.nowMonoTime +
								timer.durationSecs *
									1000,
							readingPhase: false,
						}
			} else {
				const secs =
					timer.state.readingRemainingSecs > 0
						? timer.state
								.readingRemainingSecs
						: timer.state.remainingSecs
				timer.state = {
					kind: "running",
					endMonoTime:
						this.nowMonoTime + secs * 1000,
					readingPhase:
						timer.state
							.readingRemainingSecs >
						0,
				}
			}
			startedAny = true
		}
		if (startedAny) this.startInterval()
	}

	public pause(id: string): void {
		this.captureNow()
		const timer = this.timers.find((t) => t.id === id)
		if (timer === undefined) return
		if (timer.state.kind !== "running") return
		const secsLeft = Math.max(
			0,
			Math.ceil(this.remainingMs(timer) / 1000),
		)
		timer.state = timer.state.readingPhase
			? {
					kind: "paused",
					remainingSecs: timer.durationSecs,
					readingRemainingSecs: secsLeft,
				}
			: {
					kind: "paused",
					remainingSecs: secsLeft,
					readingRemainingSecs: 0,
				}
		if (!this.anyRunning()) this.stopInterval()
	}

	public pauseAll(): void {
		this.captureNow()
		let pausedAny = false
		for (const timer of this.timers) {
			if (timer.state.kind !== "running") continue
			const secsLeft = Math.max(
				0,
				Math.ceil(this.remainingMs(timer) / 1000),
			)
			timer.state = timer.state.readingPhase
				? {
						kind: "paused",
						remainingSecs:
							timer.durationSecs,
						readingRemainingSecs: secsLeft,
					}
				: {
						kind: "paused",
						remainingSecs: secsLeft,
						readingRemainingSecs: 0,
					}
			pausedAny = true
		}
		if (pausedAny && !this.anyRunning()) this.stopInterval()
	}

	public reset(id: string): void {
		const timer = this.timers.find((t) => t.id === id)
		if (timer === undefined) return
		timer.state = { kind: "idle" }
		if (!this.anyRunning()) this.stopInterval()
	}

	public remove(id: string): void {
		const index = this.timers.findIndex((t) => t.id === id)
		if (index === -1) return
		this.timers.splice(index, 1)
		if (!this.anyRunning()) this.stopInterval()
	}

	public moveUp(id: string): void {
		const sorted = [...this.timers].sort(compareTimers)
		const idx = sorted.findIndex((t) => t.id === id)
		if (idx <= 0) return
		const a = sorted[idx]
		const b = sorted[idx - 1]
		if (a === undefined || b === undefined) return
		const idxA = this.timers.findIndex((t) => t.id === a.id)
		const idxB = this.timers.findIndex((t) => t.id === b.id)
		if (idxA === -1 || idxB === -1) return
		this.timers[idxA] = { ...a, order: b.order }
		this.timers[idxB] = { ...b, order: a.order }
	}

	public moveDown(id: string): void {
		const sorted = [...this.timers].sort(compareTimers)
		const idx = sorted.findIndex((t) => t.id === id)
		if (idx === -1 || idx >= sorted.length - 1) return
		const a = sorted[idx]
		const b = sorted[idx + 1]
		if (a === undefined || b === undefined) return
		const idxA = this.timers.findIndex((t) => t.id === a.id)
		const idxB = this.timers.findIndex((t) => t.id === b.id)
		if (idxA === -1 || idxB === -1) return
		this.timers[idxA] = { ...a, order: b.order }
		this.timers[idxB] = { ...b, order: a.order }
	}
}

export const store = new TimerStore()
