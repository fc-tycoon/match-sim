# Event Scheduler Architecture

> Authoritative reference for the scheduler stack that powers match simulations in `match-sim`.

## Objectives

- Maintain a deterministic tick timeline where **1 tick = 1 ms** of match time.
- Keep the core scheduler tiny: one priority queue, one execution primitive (`advance`).
- Compose runtime behaviors (real-time pacing, instant results) through lightweight wrappers instead of bloating the base class.
- Enable self-rescheduling patterns where callbacks can reschedule themselves.

## Time Model & Rules

| Rule | Description |
| --- | --- |
| Tick granularity | 1 tick = 1 ms. Always use integers; no fractional ticks. |
| Offset-based scheduling | All scheduling uses `tickOffset >= 0` (relative to current tick). |
| Same-tick scheduling | Events can be scheduled for the current tick (`tickOffset = 0`) or any future tick. |
| FIFO ordering | Events at the same tick execute in FIFO order (deterministic via sequence numbers). |
| Sequential execution | No batching today—each callback runs to completion before the next begins. |
| No mid-tick pause | Wrappers must wait for the current tick to finish before reporting a paused state. |
| Callback receives event | Callbacks are invoked with the `ScheduledEvent` instance, enabling self-rescheduling. |

## Core Implementation (`src/core/EventScheduler.ts`)

### ScheduledEvent container

`ScheduledEvent` stores `tick`, `type`, `callback`, `data`, and its heap index. It exposes:

- `cancel()` – removes the event if still scheduled.
- `reschedule(tickOffset)` – reschedules the event relative to the current tick.
- `isScheduled` / `scheduler` getters.
- `tick` – the absolute tick when this event will execute.
- `type` – the event type for logging and debugging.
- `data` – optional payload (any type) for callback access.

### EventScheduler class

Responsibilities:

1. Track the current tick (`currentTick` getter).
2. Maintain a binary min-heap of `ScheduledEvent` instances ordered by tick, then sequence number.
3. Provide execution primitives: `advance(ticks)` and `runUntilEnd()` for full drains.
4. Ensure deterministic FIFO ordering via auto-incrementing sequence numbers.

#### Public API quick reference

| Method | Purpose |
| --- | --- |
| `schedule(tickOffset, type, callback, data?)` | Insert a new event at `currentTick + tickOffset`. Validates offset and type. |
| `reschedule(event, tickOffset)` | Move an event to `currentTick + tickOffset`. |
| `cancel(event)` | Remove an event if still pending. |
| `advance(ticks)` | Process `ticks` number of events from current position (offset-based). |
| `runUntilEnd()` | Drain the queue completely (used by headless mode). |
| `clear()` | Drop every queued event and reset state. |
| `hasPendingEvents` / `nextScheduledTick` | Lightweight visibility helpers for wrappers. |

#### Execution flow

1. Callers enqueue events via `schedule(tickOffset, type, callback, data?)`.
2. Each event receives an auto-incrementing sequence number for deterministic FIFO ordering.
3. Wrappers invoke `advance(ticks)` with the number of ticks to advance (offset-based).
4. `advance` hands off to `#drainUntil`, which pops from the heap while the next tick is within bounds.
5. Each callback is invoked with the `ScheduledEvent` instance: `callback(event)`.
6. Callbacks can access `event.tick`, `event.type`, `event.data`, and call `event.reschedule(offset)` for self-rescheduling.
7. After every drain, `currentTick` advances to the requested boundary.

### Offset-based scheduling

All scheduling is **offset-based** to simplify caller logic:

- `schedule(tickOffset, type, callback, data?)` – schedules at `currentTick + tickOffset` where `tickOffset >= 0`.
- `reschedule(event, tickOffset)` – reschedules to `currentTick + tickOffset`.
- No absolute tick parameters exposed – all relative to the current tick.
- Optional `data` payload stored in `event.data` for callback access.

### Self-rescheduling pattern

Callbacks receive the `ScheduledEvent` instance, enabling self-rescheduling:

```ts
const event = scheduler.schedule(10, EventType.PLAYER_AI, (event) => {
	console.log('AI tick at', event.tick)
	// Reschedule self 100 ticks in the future
	event.reschedule(100)
})
```

## Wrapper Classes

### HeadlessScheduler (`src/core/HeadlessScheduler.ts`)

- Accepts an existing `EventScheduler` or creates a fresh one.
- `run()` guards against re-entrancy and calls `scheduler.runUntilEnd()`.
- Designed for "Instant Result" flows: no pause control, minimal condition checks, and maximum throughput.

### RealTimeScheduler (`src/core/RealTimeScheduler.ts`)

- Drives an `EventScheduler` using wall-clock deltas and a speed multiplier.
- Methods: `run()`, `stop()`, and `speed` property (getter/setter).
- **No pause/resume**: Simplified API—just stop and restart. Since `EventScheduler` maintains tick state, stopping doesn't lose progress.
- **Speed control**: `speed` property can be changed on-the-fly, even while running. Common values: 0.25 (slow motion), 1.0 (real-time), 2.5x, 10x, 100x.
- **Backoff strategy**: Uses adaptive yielding for optimal performance:
	- When processing ticks: scheduler drains with small microtask yields between ticks
	- When idle (first 50 iterations): `await wait(0)` for fast response to new events
	- When idle (50+ iterations): `await wait(4)` to reduce CPU usage
- **Fractional precision**: Maintains sub-millisecond accuracy using fractional carry to prevent drift.
- **Catch-up mechanism**: Processes ticks as fast as possible when behind schedule (e.g., at 100x speed).

## Usage Patterns

### Scheduling from gameplay code

```ts
const scheduler = new EventScheduler()

// Schedule 100 ticks in the future
const kickoff = scheduler.schedule(
	100,
	EventType.BALL_PHYSICS,
	(event) => {
		console.log('Kickoff physics at', event.tick)
	},
)

// Schedule on current tick (tickOffset = 0)
scheduler.schedule(0, EventType.PLAYER_AI, (event) => {
	console.log('Immediate player check at', event.tick)
})

// Schedule 60 ticks ahead
scheduler.schedule(60, EventType.VISION, handleVision)

// Reschedule later if tactics change
kickoff.reschedule(30)
```

### Self-rescheduling pattern

```ts
// AI system that reschedules itself
scheduler.schedule(0, EventType.PLAYER_AI, (event) => {
	updatePlayerAI(event.tick)
	// Reschedule self 100 ticks in the future
	event.reschedule(100)
})

// Physics update loop
scheduler.schedule(0, EventType.BALL_PHYSICS, (event) => {
	simulatePhysics(event.tick)
	if (!matchEnded) {
		event.reschedule(1) // Run every tick
	}
})
```

### Running in headless mode

```ts
const headless = new HeadlessScheduler(scheduler)
await headless.run() // drains queue via runUntilEnd()
```

### Running in real-time

```ts
const realTime = new RealTimeScheduler(scheduler)

// Start execution
realTime.run()

// Change speed on-the-fly
realTime.speed = 2.5 // 2.5x speed

// Stop execution (can restart later with run())
await realTime.stop()

// Resume from current tick
realTime.run()

// Speed up to near-instant
realTime.speed = 100
```

## External Events & Deterministic Replay

### The Problem

The match simulation is **fully deterministic**—given the same seed, the same simulation events occur in the same order. However, manager actions (substitutions, tactical changes, shouts) are **external inputs** injected at arbitrary times:

```
Live match at tick 3600000:
├── Manager clicks "Make Substitution"
├── External event injected into queue
└── Must be recorded for replay

Replay at tick 3600000:
├── External event must execute at EXACT same position
└── Simulation events must produce identical results
```

The challenge: if external events get sequence numbers from the same auto-increment counter as simulation events, replay will produce different seq numbers because the simulation state differs.

### The Solution: Exclusive Ownership Pattern

External events are scheduled **exclusively through Match**, not directly on the scheduler:

1. **Match** calls `scheduler.getExclusiveScheduleExternalFn()` in its constructor
2. This returns a bound function that can only be retrieved **ONCE**
3. Match provides `scheduleExternal()` which both schedules AND records the event
4. No other code can bypass the recording mechanism

```ts
// Match constructor:
this.#scheduleExternalFn = scheduler.getExclusiveScheduleExternalFn()

// Match.scheduleExternal() - the ONLY way to schedule external events:
scheduleExternal(tickOffset, data, callback) {
    const event = this.#scheduleExternalFn(tickOffset, data, callback)
    this.externalEvents.push({ tick: event.tick, seq: event.seq, data })
    return this.externalEvents.length - 1
}
```

### Reserved Sequence Number Ranges

```
Sequence Number Space (within V8 SMI range)
┌─────────────────────────────────────────────────────────────────┐
│  0 ... 999,999              │  1,000,000 ... 999,999,999        │
│  ───────────────────────    │  ────────────────────────────     │
│  EXTERNAL EVENTS            │  SIMULATION EVENTS                │
│  match.scheduleExternal()   │  scheduler.schedule()             │
│  seq: 0, 1, 2, 3...         │  seq: 1M, 1M+1, 1M+2...           │
└─────────────────────────────────────────────────────────────────┘
```

**Key Properties:**
- **External events always execute FIRST** within a tick (lower seq number wins)
- **Simulation events start at 1,000,000** to guarantee no collision
- **External seq numbers are DB-friendly** (clean integers starting at 0)
- **All external events use `EventType.EXTERNAL`** - specific type is in payload

### API

```ts
// Constants
const SEQ_SIMULATION_START = 1_000_000  // Simulation seq starts here

// Standard scheduling (simulation events) - auto-increment from 1M+
scheduler.schedule(tickOffset, EventType.PLAYER_AI, callback)

// External event scheduling - MUST go through Match
// tickOffset is relative to #minExternalTick (earliest safe tick)
match.scheduleExternal(tickOffset, data, callback)  // returns array index
```

**External Event Types:**
```ts
// Types defined in ExternalEventTypes.ts
const enum ExternalEventType {
    SUBSTITUTION,   // Player substitution
    TACTICAL,       // Formation/instruction changes
    SHOUT,          // Sideline shout to player
}

// Payload is a discriminated union:
type ExternalEventPayload = SubstitutionData | TacticalChangeData | ShoutData
```

**Scheduling External Events:**
```ts
import { ExternalEventType } from '@/core/ExternalEventTypes'

// Schedule a substitution
const idx = match.scheduleExternal(
    0,  // next available tick
    {
        type: ExternalEventType.SUBSTITUTION,
        playerOutId: 7,
        playerInId: 15,
    },
    (event) => {
        const data = event.data as SubstitutionData
        performSubstitution(data.playerOutId, data.playerInId)
    }
)

// idx is the index in match.externalEvents[] for later reference
```

### Recording External Events

During live play, `match.scheduleExternal()` automatically records events:

```ts
// From ExternalEventTypes.ts
interface ExternalEventRecord {
    tick: number                // Absolute tick (from event.tick after scheduling)
    seq: number                 // Sequence (0, 1, 2...) - for ordering only
    data: ExternalEventPayload  // Typed payload (contains type discriminator)
}

// Stored in Match:
match.externalEvents: ExternalEventRecord[]  // All external events recorded here
```

### Replay Process

1. **Load replay data**: seed + external event log from `match.externalEvents`
2. **Sort external events by `seq`** (preserves insertion order)
3. **Pre-schedule each event** using `match.scheduleExternal(tick, ...)` before simulation starts
4. **Run simulation**: deterministic events get same seq numbers (1M+)
5. **Perfect reproduction**: external events execute at exact same queue position

```ts
// Replay initialization (before simulation starts, #minExternalTick = 0)
function initReplay(replayData: MatchReplayData) {
    const scheduler = new EventScheduler()
    const match = new Match(field, team1, team2, replayData.seed, scheduler)
    
    // Sort by seq to preserve original insertion order
    const sorted = replayData.externalEvents.sort((a, b) => a.seq - b.seq)
    
    // Pre-schedule ALL external events through Match
    // Since #minExternalTick = 0, tick offset equals absolute tick
    for (const record of sorted) {
        match.scheduleExternal(
            record.tick,  // absolute tick works as offset when #minExternalTick = 0
            record.data,
            createCallback(record.data)
        )
    }
    
    // Simulation will produce identical results
    return { scheduler, match }
}
```

**Why This Works:**
- Before simulation starts, `#minExternalTick = 0`
- `actualTick = 0 + tickOffset = tickOffset` (absolute tick)
- External events are recorded with seq 0, 1, 2, 3... during live play
- Sorting by seq preserves the original insertion order
- `scheduleExternal()` assigns seq 0, 1, 2, 3... during replay
- Same order in = same seq numbers out

### Why External Events Execute First

This ordering is **semantically correct**:

1. Manager makes substitution at tick 200
2. Substitution event (seq=5) executes BEFORE AI events (seq=100M+)
3. New player is on field when AI processes that tick
4. AI reacts to the new game state

External events are **inputs** that modify state; simulation events **react** to that state.

### Critical: No Mid-Tick Injection

**External events CANNOT be injected into a tick that is already processing!**

```
Tick 200 processing in progress:
├── seq=100,000,045: AI decision    ✓ EXECUTED
├── seq=100,000,046: Physics        ✓ EXECUTED  
├── seq=100,000,047: Vision         ⏳ NEXT
│
└── Manager clicks "Substitute" NOW
    → Cannot inject at tick 200 (already processing)
    → Must schedule at tick 201
```

**Why This Matters:**
- Determinism requires identical event execution order
- Mid-tick injection would place external event AFTER simulation events that already ran
- Replay would produce different results (external event would run BEFORE those events)

**Solution**: Track `#minExternalTick` - bumped to `tick + 1` when each tick starts processing:

```typescript
// Internal state
#currentTick = 0
#minExternalTick = 0  // Bumped to tick+1 when tick starts draining

// scheduleExternal formula:
actualTick = #minExternalTick + tickOffset
```

The `tickOffset` is **relative to the earliest safe tick**, not `currentTick`.

**Live Play Examples:**
```typescript
import { ExternalEventType } from '@/core/ExternalEventTypes'

// Before simulation starts (#minExternalTick = 0)
match.scheduleExternal(0, { type: ExternalEventType.TACTICAL, ... }, callback)
// → tick 0, returns index 0

// Simulation starts processing tick 0 → #minExternalTick = 1
match.scheduleExternal(0, { type: ExternalEventType.SUBSTITUTION, ... }, callback)
// → tick 1, returns index 1

// During tick 200 processing (#minExternalTick = 201)
const idx = match.scheduleExternal(0, {
    type: ExternalEventType.TACTICAL,
    teamId: 1,
    formationId: 5,
}, callback)
// Scheduled at tick 201, recorded at match.externalEvents[idx]

match.scheduleExternal(5, { type: ExternalEventType.SHOUT, ... }, callback)
// → tick 206
```

**Replay Example:**
```typescript
// Before simulation starts (#minExternalTick = 0)
// Use match.scheduleExternal() - absolute tick works as offset when #minExternalTick = 0
match.scheduleExternal(200, replayData.externalEvents[0].data, callback)
// → actualTick = 0 + 200 = 200
```

## Future Work

- **Frame batching helper**: optional `processFrame(ticks)` utility for systems that prefer coarse-grained control.
- **Worker-friendly headless loop**: expose an optional yield interval once we know the threading model.

For requirement-level detail, see [`docs/EVENT_SCHEDULER_REQUIREMENTS.md`](./EVENT_SCHEDULER_REQUIREMENTS.md). This document focuses on the implementation that currently ships and the wrappers that sit on top of it.
