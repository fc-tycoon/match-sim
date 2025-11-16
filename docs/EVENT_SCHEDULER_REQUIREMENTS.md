# Checklist of requirements for the Event Scheduler

* 1 tick = 1ms
* a 'tick' is always an `integer`, never a `float` value! ie. we don't have "half ticks"!
* Our 1 tick = 1ms is because the simulation is COMPLETELY DETACHED from the wall clock and frame rate. Every match, on every PC, will run roughly the same simulations, as our ticks are NOT representative of a wall clock speed during runtime. They represent a 1ms time slice within the match itself. How fast or slow we run the simulation of those 1ms time intervals (ticks) is irrelevant to the match engine. We could progress at 1 tick on a UI button press, or run at 100x, or process those ticks as fast as possible without any delay (Headless / Instant Results). They would still represent a 1ms time slice within the match!
* events can NEVER be scheduled on the current `tick` value, the minimum tick value they can be scheduled on is `tick + 1`
* `tick` (current tick) cannot be paused mid-tick
	* a `pause()` should ideally wait for the current tick to be fully processed and resolved before returning!
* Events are processed in order of their `EventType` values, which represents their priority.
	* **Current implementation**: callbacks execute sequentially, one event at a time, to minimize allocations and align with our "dynamic tick" model where most ticks only touch a couple of entities.
	* **Future option**: if we push heavy work into Web Workers / worker threads or a 3D collision pipeline demands it, we can bring back per-type batching (`Promise.all` per type) so every event for the same tick/type completes concurrently before advancing.
* Deterministic replays/rewinds/output from the Event Scheduler is NOT a requirement.
	* The main reason why, is because this is used for multiple AI implementations, which may or may not also be deterministic
	* The simulation outputs a stream of player and ball positions, vectors, etc. which IS deterministic and will be serialized
	* "Viewers" of the simulation do not view the outcome of the Event Scheduler callbacks, they read the event stream it produces
* Support for both "Real Time" and "Headless" (Instant Results) modes.
	* Ideally, "Headless" mode should run as fast as possible, avoid any timers and unecessary condition checks
	* Headless mode is either run from start-to-finish for a match, or it's run from the current tick until the end of a match.
		* This requirement then does NOT require "Headless" mode to check for "pauses()", as "Headless" mode cannot be paused once started
		* it cannot be paused or stopped once started
		* The primary use case for Headless mode is to execute events and finish the simulation as fast as possible, performing as few needless checks (and allocations) as possible to achieve this.
		* The "hot-path" should be as efficient and fast as possible, including fewer condition checks, and as few memory allocations as possible.
* Ideally, `scheduler.pause()` should return a promise, so we can `await scheduler.pause()`. This is ONLY a requirement for the real-time scheduler
* Customizable simulation speed from 0.1 (slow motion), to 1.0 (normal), 2.5x, 3.8x, 5.6x, 8.2x, 10x, 100x etc. Basically any finite float value.
* JavaScript `setTimeout` and `setInterval` have a ridiculous overhead, from 4ms (reported) to ~15ms benchmarked on my modern Core Ultra 7 265K
	* Due to this, we need a "catch up" mechanism, that will process events as quickly as possible until they've caught up
	* setTimeout (1 ms) and setInterval (1 ms) revealed a 4ms average overhead for `setTimeout` and `setInterval`
* Do NOT run the scheduler in a loop that calls itself  **recursively** (usually done internally), as this will blow up the stack. Run it in a loop!
* Prefer to use an `await wait(delay)` style calls in a loop, as they are easier to reason about, and the typical delays are small. Check for a paused state after.
* `runUntil(targetTick)` is the only primitive exposed by the base class. All other behaviors (single-step buttons, real-time pacing, headless bursts) are composed by calling `runUntil` with the desired upper bound.
* We could add a `processFrame(16)` or `processFrame(1000 / fps)` that could handle batch processing a "frame" (multiple ticks) at a time. However,
	- we either need to choose a fixed frame rate, eg. 60 fps
	- or get it reliably from WebGPU/WebGL
	- if the `setInterval` and `setTimeout` latency is already about 15ms, then it's essentially the same thing, except that we would be "playing catch up", as opposed to pre-emptively and pro-actively processing multiple frames.




## Architecture

We have THREE classes:

### 1. Base Class: EventScheduler

* Owns the min-heap, event data model, and the **primary** execution primitives: `runUntil(targetTick)` and `runUntilEnd()`.
* `runUntilEnd()` drains the entire queue (calls internal drain with a very large tick value).
* `runUntil` drains all events at or before the target tick (in priority order), then advances `currentTick` to the target. Empty ticks are skipped efficiently.
* No pause/resume/start/stop state lives here. Wrappers manage lifecycle; the base just enforces invariants and performs work.
* HARD validation on inserts/reschedules: throw if `event.tick <= currentTick`, throw on invalid types, throw when an event belongs to a different scheduler.
* Provides convenience helpers:
	* `scheduleOnNextTick(type, callback, payload?)` - schedules for `currentTick + 1`
	* `scheduleOnOffset(offset, type, callback, payload?)` - schedules for `currentTick + offset`
	* `rescheduleOnOffset(event, offset, payload?)` - reschedules to `currentTick + offset`
* During tick execution, it is illegal to enqueue another event for the same tick; everything must target `currentTick + 1` or later (even when the queue is idle) or the scheduler throws. Once a tick finishes, `currentTick` increments immediately, so the "no events on current tick" rule remains true at all times.
* Optimized for "dynamic ticks" (often a single event per tick): keep allocations/sorts to a minimum and favor sequential execution.
* 32-bit integer ticks are sufficient (90 minutes = 5.4M ticks ≪ 2^31), but documented to revisit if season-long sims ever chain multiple matches without resetting.

### 2. RealTimeScheduler Wrapper

* Wraps an `EventScheduler` instance (or creates a fresh one).
* Provides real-time run, pause, resume, start, stop lifecycle controls.
* Speed control (0.1x up to 100x+) via `setSpeed(multiplier)`.
* Uses `await wait(delay)` + catch-up loops to handle timer overhead.
* `pause()` returns a Promise that resolves once the current tick finishes (never mid-tick).
* Maintains fractional tick accumulation to handle non-integer speed × elapsed time accurately.
* Default frame delay: 4ms (configurable via constructor options).

### 3. HeadlessScheduler Wrapper

* Wraps an `EventScheduler` instance (or creates a fresh one).
* Can continue from existing scheduler state—useful when a player switches from real-time to "Instant Results" mid-match.
* Provides a single method: `run()` which calls `scheduler.runUntilEnd()`.
* NO pause feature—runs start-to-finish once begun.
* Guards against re-entrant calls with a `running` flag.
* Future enhancement: optional yielding with `await Promise.resolve()` every N ticks to keep the JS event loop responsive when headless executes on the main thread (less important if headless lives in a dedicated worker).
