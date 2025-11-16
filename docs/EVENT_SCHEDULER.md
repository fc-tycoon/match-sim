# Event Scheduler Architecture

> Authoritative reference for the scheduler stack that powers match simulations in `match-sim`.

## Objectives

- Maintain a deterministic tick timeline where **1 tick = 1 ms** of match time.
- Keep the core scheduler tiny: one priority queue, one execution primitive (`runUntil`).
- Compose runtime behaviors (real-time pacing, instant results) through lightweight wrappers instead of bloating the base class.
- Provide ergonomic helpers so callers never violate "future-only" scheduling rules.

## Time Model & Rules

| Rule | Description |
| --- | --- |
| Tick granularity | 1 tick = 1 ms. Always use integers; no fractional ticks. |
| Future-only scheduling | Minimum legal tick is `currentTick + 1`, even when the queue is idle. |
| Priority ordering | Events with earlier ticks execute first; ties are broken by `EventType` (lower value = higher priority). |
| Sequential execution | No batching today—each callback runs to completion before the next begins. |
| No mid-tick pause | Wrappers must wait for the current tick to finish before reporting a paused state. |

## Core Implementation (`src/utils/EventScheduler.ts`)

### ScheduledEvent container

`ScheduledEvent` stores `tick`, `type`, `callback`, optional `payload`, and its heap index. It exposes:

- `cancel()` – removes the event if still scheduled.
- `reschedule(newTick, payload?)` – forwards to the owning scheduler with optional payload replacement.
- `rescheduleOnOffset(offset, payload?)` – reschedules relative to the scheduler’s current tick.
- `isScheduled` / `scheduler` getters.

### EventScheduler class

Responsibilities:

1. Track the next tick to process (`tick` getter) and enforce future-only scheduling.
2. Maintain a binary min-heap of `ScheduledEvent` instances.
3. Provide a single execution primitive `runUntil(targetTick)` plus `runUntilEnd()` for full drains.

#### Public API quick reference

| Method | Purpose |
| --- | --- |
| `schedule(tick, type, callback, payload?)` | Insert a new event. Validates tick/type and wraps data in `ScheduledEvent`. |
| `scheduleOnNextTick(type, callback, payload?)` | Sugar for `currentTick + 1`. |
| `scheduleOnOffset(offset, type, callback, payload?)` | Sugar for `currentTick + offset` with validation. |
| `reschedule(event, newTick, payload?)` | Move an event to a new absolute tick. Optionally swap payloads. |
| `rescheduleOnOffset(event, offset, payload?)` | Move an event to `currentTick + offset`. |
| `cancel(event)` | Remove an event if still pending. |
| `runUntil(targetTick)` | Drain all events `<= targetTick` (exclusive) and set `currentTick = targetTick`. |
| `runUntilEnd()` | Drain the queue completely (used by headless mode). |
| `clear()` | Drop every queued event and reset state. |
| `hasPendingEvents` / `nextScheduledTick` | Lightweight visibility helpers for wrappers. |

#### Execution flow

1. Callers enqueue events via `schedule*` helpers.
2. Wrappers invoke `runUntil(target)` with the desired upper bound.
3. `runUntil` hands off to `#drainUntil`, which pops from the heap while the next tick is within bounds.
4. After every drain, `currentTick` advances to the requested boundary so callers can safely compute offsets.

### Convenience helpers

- `scheduleOnNextTick` – avoids manual `+1` math.
- `scheduleOnOffset` – schedules relative to the current tick with validation (offset must be a positive integer).
- `rescheduleOnOffset` – supported on both the scheduler and `ScheduledEvent` instances, mirroring the absolute `reschedule` API.

## Wrapper Classes

### HeadlessScheduler (`src/utils/HeadlessScheduler.ts`)

- Accepts an existing `EventScheduler` or creates a fresh one.
- `run()` guards against re-entrancy and calls `scheduler.runUntilEnd()`.
- Designed for "Instant Result" flows: no pause control, minimal condition checks, and maximum throughput.

### RealTimeScheduler (`src/utils/RealTimeScheduler.ts`)

- Drives an `EventScheduler` using wall-clock deltas and a speed multiplier.
- Methods: `start()`, `pause()`, `resume()`, `stop()`, and `setSpeed(multiplier)`.
- Pause semantics: `pause()` returns a promise that resolves once the current tick finishes (never mid-tick).
- Implements a simple catch-up loop: measure elapsed ms, scale by `speed`, convert to ticks, then call `runUntil(current + ticks)`. A small frame delay (default 4 ms) keeps the UI responsive.

## Usage Patterns

### Scheduling from gameplay code

```ts
const scheduler = new EventScheduler()

// Schedule an absolute tick
const kickoff = scheduler.schedule(
	100,
	EventType.BALL_PHYSICS,
	(tick) => console.log('Kickoff physics at', tick),
)

// Schedule relative helpers
scheduler.scheduleOnNextTick(EventType.PLAYER_AI, (tick) => {
	console.log('Player brain check at', tick)
})

scheduler.scheduleOnOffset(60, EventType.VISION, handleVision)

// Reschedule later if tactics change
kickoff.rescheduleOnOffset(30)
```

### Running in headless mode

```ts
const headless = new HeadlessScheduler(scheduler)
await headless.run() // drains queue via runUntilEnd()
```

### Running in real-time

```ts
const realTime = new RealTimeScheduler(scheduler, { speed: 1 })
realTime.start()

// Later in UI handlers
await realTime.pause() // resolves after current tick completes
realTime.setSpeed(8.5)
realTime.resume()
await realTime.stop()
```

## Future Work

- **Frame batching helper**: optional `processFrame(ticks)` utility for systems that prefer coarse-grained control.
- **Worker-friendly headless loop**: expose an optional yield interval once we know the threading model.
- **Deterministic replay hooks**: when/if we need perfect replays, add entry points to snapshot queue state.

For requirement-level detail, see [`docs/EVENT_SCHEDULER_REQUIREMENTS.md`](./EVENT_SCHEDULER_REQUIREMENTS.md). This document focuses on the implementation that currently ships and the wrappers that sit on top of it.
