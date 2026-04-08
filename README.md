# Exam Chrono

## Development

```
bun install
bun run dev
```

## Build and deploy

```
bun install
bun run check
bun run build
```

A production build will then be in `build/`.

## A note on timing

The program assumes the timer remains visible and active while in use. If the
browser is suspended, backgrounded, throttled, or otherwise delayed, the timer
may still continue based on monotonic elapsed time, but the program may report
that timing integrity was affected.

The timer measures elapsed time using the browser's monotonic clock while the
page remains loaded.

The program updates the display on a nominal 1-second interval. If the browser
delays callback execution or if wall-clock time and monotonic time diverge
significantly, the program shows a timing anomaly warning above the timers. The
warning only reports what was observed; it does not try to guess the exact
cause, or attempt to adjust for it, as it is impossible to do so reliably.

Due to JavaScript's use of IEEE 754 doubles, exam lengths above
150,119,987,579 minutes (about 285 centuries) are rejected.

## License

2-clause BSD. See the `LICENSE` file.
