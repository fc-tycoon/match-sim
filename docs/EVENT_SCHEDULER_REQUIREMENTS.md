# Checklist of requirements for the Event Scheduler

* 1 tick = 1ms
* a 'tick' is always an `integer`, never a `float` value! ie. we don't have "half ticks"!
* Our 1 tick = 1ms is because the simulation is COMPLETELY DETACHED from the wall clock and frame rate. Every match, on every PC, will run roughly the same simulations, as our ticks are NOT representative of a wall clock speed during runtime. They represent a 1ms time slice within the match itself. How fast or slow we run the simulation of those 1ms time intervals (ticks) is irrelevant to the match engine. We could progress at 1 tick on a UI button press, or run at 100x, or process those ticks as fast as possible without any delay (Headless / Instant Results). They would still represent a 1ms time slice within the match!
* All scheduling is OFFSET-BASED: `tickOffset >= 0` - callers specify "how many ticks in the future"
* Events can be scheduled on the current tick (tickOffset = 0) or any future tick
* `tick` (current tick) cannot be paused mid-tick
	* Pause/resume is not supported in the current real-time wrapper design. If added in the future, a pause must wait for the current tick to finish before reporting paused.
* Events are processed sequentially in the order they were scheduled (FIFO via sequence numbers)
	* **Current implementation**: callbacks execute sequentially, one event at a time, to minimize allocations and align with our "dynamic tick" model where most ticks only touch a couple of entities.
	* **Future option**: if we push heavy work into Web Workers / worker threads or a 3D collision pipeline demands it, we can bring back per-type batching (`Promise.all` per type) so every event for the same tick/type completes concurrently before advancing.
* **Callbacks receive event reference**: Callbacks are invoked with the `ScheduledEvent` instance as the parameter
	* This gives access to `event.tick` for the current tick value
	* Enables self-rescheduling via `event.reschedule(tickOffset)` from within the callback
	* Provides access to `event.type` for logging and debugging
* **FULLY DETERMINISTIC**: The match engine is 100% deterministic using a seeded PRNG.
	* Given the same initial conditions (teams, formations, seed), the simulation produces IDENTICAL results every time
	* This enables perfect replay functionality without storing position data
	* Replays are achieved by re-running the simulation from the same seed with the same inputs
	* File sizes for match replay are minimal (seed + external events only, no position data)
* **External events** (substitutions, tactical changes, shouts) are **human inputs only** - not used by AI
	* AI decisions are deterministic (seeded PRNG) and don't need recording
	* Human input is non-deterministic and must be recorded to make replay deterministic
	* External events use a reserved sequence number range (0 to 999,999) so they always execute FIRST within a tick
	* Simulation events use sequence numbers starting at 1,000,000
	* External events CANNOT be injected mid-tick - scheduler uses `#minExternalTick` to track earliest safe tick
	* All external events use `EventType.EXTERNAL` - specific type is in the payload's `type` field
	* **Exclusive ownership**: `scheduler.getExclusiveScheduleExternalFn()` returns the scheduling function ONCE only
	* **Match is the single owner**: `Match` retrieves the function and provides `match.scheduleExternal()`
	* `match.scheduleExternal(tickOffset, data, callback)` uses formula: `actualTick = #minExternalTick + tickOffset`
	* Data payload is `ExternalEventPayload` union type from `ExternalEventTypes.ts` (SubstitutionData | TacticalChangeData | ShoutData)
	* Returns index in `match.externalEvents[]` array (for later reference)
	* Recording is automatic - `match.scheduleExternal()` both schedules AND records the event
	* For replay, sort external events by seq and pre-schedule through Match before simulation starts
* Support for both "Real Time" and "Headless" (Instant Results) modes.
	* Ideally, "Headless" mode should run as fast as possible, avoid any timers and unecessary condition checks
	* Headless mode is either run from start-to-finish for a match, or it's run from the current tick until the end of a match.
		* This requirement then does NOT require "Headless" mode to check for "pauses()", as "Headless" mode cannot be paused once started
		* it cannot be paused or stopped once started
		* The primary use case for Headless mode is to execute events and finish the simulation as fast as possible, performing as few needless checks (and allocations) as possible to achieve this.
		* The "hot-path" should be as efficient and fast as possible, including fewer condition checks, and as few memory allocations as possible.
* Customizable simulation speed from 0.1 (slow motion), to 1.0 (normal), 2.5x, 3.8x, 5.6x, 8.2x, 10x, 100x etc. Basically any finite float value.
* JavaScript `setTimeout` and `setInterval` have a ridiculous overhead, from 4ms (reported) to ~15ms benchmarked on my modern Core Ultra 7 265K
	* Due to this, we need a "catch up" mechanism, that will process events as quickly as possible until they've caught up
	* setTimeout (1 ms) and setInterval (1 ms) revealed a 4ms average overhead for `setTimeout` and `setInterval`
* Do NOT run the scheduler in a loop that calls itself  **recursively** (usually done internally), as this will blow up the stack. Run it in a loop!
* Prefer to use an `await wait(delay)` style calls in a loop, as they are easier to reason about, and the typical delays are small. Check for a paused state after.
* `advance(ticks)` is the primary execution primitive exposed by the base class, taking an **offset** (number of ticks to advance). All other behaviors (single-step buttons, real-time pacing, headless bursts) are composed by calling `advance` with the desired tick count.
* We could add a `processFrame(16)` or `processFrame(1000 / fps)` that could handle batch processing a "frame" (multiple ticks) at a time. However,
	- we either need to choose a fixed frame rate, eg. 60 fps
	- or get it reliably from WebGPU/WebGL
	- if the `setInterval` and `setTimeout` latency is already about 15ms, then it's essentially the same thing, except that we would be "playing catch up", as opposed to pre-emptively and pro-actively processing multiple frames.




## Architecture

We have THREE classes:

### 1. Base Class: EventScheduler

* Owns the min-heap, event data model, and the **primary** execution primitives: `advance(ticks)` and `runUntilEnd()`.
* `runUntilEnd()` drains the entire queue (calls internal drain with a very large tick value).
* `advance(ticks)` is **offset-based**: advances the scheduler by `ticks` from current position. Drains all events at or before `currentTick + ticks`, then advances `currentTick` to that boundary. Empty ticks are skipped efficiently.
* No pause/resume/start/stop state lives here. Wrappers manage lifecycle; the base just enforces invariants and performs work.
* HARD validation on inserts/reschedules: throw if `tickOffset < 0`, throw when an event belongs to a different scheduler.
* Offset-based scheduling: `schedule(tickOffset, type, callback, data?)` where tickOffset >= 0
* Callbacks receive the event instance: `callback(event)` where event provides tick, type, data, and reschedule capability
* Optimized for "dynamic ticks" (often a single event per tick): keep allocations/sorts to a minimum and favor sequential execution.
* 32-bit integer ticks are sufficient (90 minutes = 5.4M ticks ≪ 2^31), but documented to revisit if season-long sims ever chain multiple matches without resetting.
* Sequence numbers ensure deterministic FIFO ordering for events at the same tick

### 2. RealTimeScheduler Wrapper

* Wraps an `EventScheduler` instance (or creates a fresh one).
* Provides real-time execution with `run()` and `stop()` lifecycle controls.
* **No pause/resume**: Simplified design—call `stop()` to halt, `run()` to restart. Since `EventScheduler` maintains tick state internally, stopping doesn't lose progress. This eliminates dual-state complexity.
* **Speed control**: `speed` property (getter/setter) supports any finite positive value (0.1x to 100x+). Can be changed on-the-fly while running.
* **Single source of truth**: `#runLoopPromise` field indicates state — null means stopped, Promise means running.
* **Adaptive backoff strategy**:
	- When processing ticks (behind schedule): minimal microtask yields between ticks inside the scheduler
	- When idle (first 50 iterations): `await wait(0)` for fast response to new events  
	- When idle (50+ iterations): `await wait(4)` to reduce CPU usage (~4–15ms actual delay due to browser timer throttling)
* **Fractional tick precision**: Maintains `fractionalCarry` variable to accumulate sub-millisecond remainders, preventing drift over time.
* **Catch-up mechanism**: When behind schedule (e.g., 100x speed), processes ticks continuously without artificial delays.
* **Clean shutdown**: `stop()` sets `#runLoopPromise = null` to signal exit, then awaits the promise to ensure current tick completes before resolving.
* All timing state (lastTimestamp, fractionalCarry, idleCount) is scoped locally in the `#run()` loop, ensuring clean state on restart.

### 3. HeadlessScheduler Wrapper

* Wraps an `EventScheduler` instance (or creates a fresh one).
* Can continue from existing scheduler state—useful when a player switches from real-time to "Instant Results" mid-match.
* Provides a single method: `run()` which calls `scheduler.runUntilEnd()`.
* NO pause feature—runs start-to-finish once begun.
* Guards against re-entrant calls with a `running` flag.
* Future enhancement: optional yielding with `await Promise.resolve()` every N ticks to keep the JS event loop responsive when headless executes on the main thread (less important if headless lives in a dedicated worker).
