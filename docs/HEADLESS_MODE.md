# EventScheduler - Headless Mode

## Overview

Headless mode is implemented as a dedicated `HeadlessScheduler` wrapper around the
base `EventScheduler`. It runs the simulation at maximum speed without using
timers, pause states, or UI-driven pacing. Once started, a headless run will not
pause until it reaches the requested tick boundary or drains every pending event.

## Usage

```javascript
import { EventScheduler, EventType } from '@/utils/EventScheduler'
import { HeadlessScheduler } from '@/utils/HeadlessScheduler'

const scheduler = new EventScheduler()
const headless = new HeadlessScheduler({ scheduler })

// Schedule events (always tick + 1 or later)
for (let tick = scheduler.tick + 1; tick < 5_400_000; tick += 100) {
	scheduler.schedule(tick, EventType.BALL_PHYSICS, (currentTick) => {
		ball.update(currentTick)
	})
}

// Process everything until the end-of-match boundary (exclusive)
await headless.runToEnd(5_400_000)
console.log('Simulation reached full-time tick boundary')

// Later, if more events were queued (e.g., penalties), drain them instantly
await headless.drainQueue()
```

## Performance

Based on internal demos:

- **Small simulation** (1,000 events): ~2 ms
- **Full match** (885,600 events): ~200 ms (≈26,000× faster than real-time)
- **Stress test** (1,000,000 events): ~400 ms (≈2.5 M events/second)

Actual numbers vary per CPU, but the loop never waits on timers, so it always
runs as fast as available compute allows.

## Key Features

### No Timers

- Zero `setTimeout`/`setInterval` usage
- Tight while loops drive `runUntil` directly
- Optional cooperative yields keep the UI responsive when sharing a thread

### Maintains Event Order

- Same guarantees as the base scheduler:
  1. Earlier ticks always execute first
  2. Lower `EventType` values win ties within a tick
  3. Scheduling order is preserved when tick/type match

### Async-Friendly

- Awaited callbacks still resolve per tick before advancing
- Works with promises returned by event handlers
- No batching or Promise.all needed on the hot path (keeps allocations minimal)

### No Pause/Resume State

- Headless runs are fire-and-forget
- No pause flag to poll; the wrapper simply runs until its goal is finished
- Perfect for Instant Results, AI training, or batch sims without UI controls

## Use Cases

1. **Instant Match Results**
	```javascript
	await headless.runToEnd(MATCH_FINAL_TICK)
	persistMatchResult(bufferedStats)
	```

2. **Continue From Real-Time Scheduler**
	```javascript
	// Player pressed "Instant Result" midway through a live match
	const headless = new HeadlessScheduler({ scheduler: realTime.scheduler })
	await headless.runToEnd(MATCH_FINAL_TICK)
	```

3. **Batch Processing / AI Experiments**
	```javascript
	for (const scenario of trainingScenarios) {
		setupScenario(scenario)
		await headless.drainQueue()
		collectOutputs(scenario)
	}
	```

4. **Testing / Debugging**
	```javascript
	await headless.drainQueue({ yieldEveryTicks: 50_000 })
	assert.equal(ball.position.x, expectedX)
	```

## API

### `new HeadlessScheduler(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scheduler` | `EventScheduler` | `new EventScheduler()` | Existing scheduler to drive (pass the real-time instance to resume instantly). |
| `yieldEveryTicks` | `number` | `0` (disabled) | Cooperative yield interval. When > 0, the runner periodically yields back to the event loop after advancing the specified number of ticks. |
| `yieldHandler` | `() => void \| Promise<void>` | `() => {}` | Callback invoked whenever a yield is triggered (e.g., `await Promise.resolve()` or `await wait(0)`). |

### `headless.runToEnd(finalTick, options?)`

Fast-forwards the scheduler until `finalTick` (exclusive). Throws if `finalTick`
is before the current tick or if another headless run is already active.

Per-run `options` support the same `yieldEveryTicks` and `yieldHandler` keys as
the constructor, allowing one-off overrides (e.g., temporarily yield every
50,000 ticks when running on the main thread).

### `headless.drainQueue(options?)`

Processes every pending event regardless of final tick. Useful for AI sims that
simply want to empty the queue (e.g., auto-resolve background matches). Returns
immediately when there is nothing scheduled.

## Implementation Details

```ts
while (this.#scheduler.tick < targetTick) {
	const before = this.#scheduler.tick
	const chunkTarget = this.#computeChunkTarget(targetTick, yieldEvery)
	await this.#scheduler.runUntil(chunkTarget)
	await this.#maybeYield(yieldEvery, yieldHandler, this.#scheduler.tick - before)
}
```

- Chunk size equals the remaining ticks until the yield boundary (or until the
  target tick) so the loop does not allocate intermediate arrays.
- `yieldEveryTicks` can be `0` to disable yielding entirely—ideal for worker
  threads or CLI tools.
- The wrapper relies on the base scheduler's public getters (`tick`,
  `hasPendingEvents`, `nextScheduledTick`) instead of poking into private heap
  state.

## Tests

Unit tests cover:

- Chunked `runToEnd` progress with and without yields
- Queue draining after mid-match Instant Result handoff
- Protection against re-entrant runs
- Yield overrides (custom interval + handler)

Additional integration scenarios (full match sims, stress cases) run inside the
match-engine test harness.
