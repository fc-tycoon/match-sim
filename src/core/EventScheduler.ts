/**
 * FC Tycoon™ 2027 Match Simulator - Event Scheduler
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import type { ExternalEventPayload } from '@/core/ExternalEventTypes'

/**
 * Event Scheduler Architecture
 *
 * # Overview
 *
 * The Event Scheduler is a priority queue system for processing game simulation events
 * in deterministic tick-based order. It supports both real-time gameplay and headless
 * instant result simulation modes.
 *
 * # Time Model
 *
 * - 1 tick = 1ms of simulated match time (NOT wall-clock time)
 * - Ticks are always integers (no fractional ticks)
 * - Simulation is completely detached from frame rate and wall clock
 * - Every match runs the same simulation regardless of hardware speed
 * - A 90-minute match = 5,400,000 ticks (well within 32-bit integer range)
 *
 * # Scheduling Rules
 *
 * - All scheduling is OFFSET-BASED: callers specify "how many ticks in the future" (tickOffset >= 0)
 * - Events can be scheduled on current tick (tickOffset = 0) or any future tick
 * - Events are processed sequentially in the order they were scheduled
 * - Sequence numbers provide deterministic FIFO ordering for events at the same tick
 * - Cannot pause mid-tick (pause() waits for current tick to complete)
 * - Once tick finishes, current tick increments immediately
 *
 * # Event Processing
 *
 * Events are processed sequentially (not batched) to minimize allocations and align
 * with our "dynamic tick" model where most ticks only process 1-2 events. Future
 * optimization: per-type batching with Promise.all if Web Workers or 3D collision
 * pipeline demands concurrent execution.
 *
 * # Architecture Layers
 *
 * 1. **EventScheduler (Base Class)**
 *    - Min-heap priority queue implementation
 *    - Single execution primitive: advance(ticks)
 *    - No pause/resume/start/stop state management
 *    - Hard validation: throws on invalid tickOffset values or scheduler ownership
 *    - Optimized for dynamic ticks (often single event per tick)
 *    - Offset-based scheduling: schedule(tickOffset, type, callback)
 *    - Sequence numbers ensure deterministic FIFO ordering for events
 *
 * 2. **RealTimeScheduler (Wrapper)**
 *    - Real-time run/stop controls (no pause/resume)
 *    - Speed control: 0.1x (slow motion) to 100x+ (fast forward)
 *    - Uses wait(0)/wait(4) backoff with catch-up loops
 *    - Auto-stops when the queue drains to empty
 *    - Handles setTimeout/setInterval ~4–15ms overhead with catch-up mechanism
 *
 * 3. **HeadlessScheduler (Wrapper)**
 *    - Instant result simulation (as fast as possible)
 *    - No pause feature (runs start-to-finish)
 *    - Can continue from existing scheduler state (player clicks "Instant Results")
 *    - Runs runUntilEnd() to drain entire queue
 *    - Optional yielding with await Promise.resolve() every N ticks for responsiveness
 *    - Avoids unnecessary checks and allocations on hot path
 *
 * # Determinism
 *
 * - Event Scheduler itself is NOT required to be deterministic for replays
 * - AI implementations using the scheduler may or may not be deterministic
 * - Simulation outputs deterministic stream of positions/vectors that gets serialized
 * - Viewers read the event stream output, not the scheduler callback results
 *
 * # Performance Considerations
 *
 * - JavaScript setTimeout/setInterval have 4-15ms overhead (measured)
 * - Catch-up mechanism processes events quickly when real-time falls behind
 * - Avoid recursive loops (will blow stack) - use iterative loops instead
 * - Prefer await wait(delay) in loops - easier to reason about
 * - 32-bit integers sufficient (5.4M ticks for 90 minutes << 2^31 limit)
 * - Optimized for common case: 1 event per tick, minimize allocations
 *
 * # Usage Patterns
 *
 * @example
 * // Basic scheduling (offset-based)
 * const scheduler = new EventScheduler()
 * const event = scheduler.schedule(100, EventType.BALL_PHYSICS, (event) => {
 *   console.log('Ball physics 100ms from now at tick', event.tick)
 * })
 *
 * // Schedule on next tick (offset of 1)
 * scheduler.schedule(1, EventType.PLAYER_AI, (event) => {
 *   console.log('Player AI at tick', event.tick)
 * })
 *
 * // Schedule 60 ticks (60ms) in the future
 * scheduler.schedule(60, EventType.VISION, (event) => {
 *   console.log('Scan field one simulated minute later', event.tick)
 * })
 *
 * // Event manipulation (reschedule from within callback)
 * scheduler.schedule(100, EventType.BALL_PHYSICS, (event) => {
 *   if (needsMoreTime) {
 *     event.reschedule(10)  // Reschedule 10 ticks from now
 *   }
 * })
 *
 * // Or reschedule externally
 * event.reschedule(150)  // Move to 150 ticks from current tick
 * event.cancel()         // Remove from queue
 *
 * // Run simulation (offset-based)
 * await scheduler.advance(200)  // Process next 200 ticks from current position
 *
 * @see EVENT_SCHEDULER_REQUIREMENTS.md for complete specification
 */

/**
 * Event callback function signature
 *
 * @param event - The scheduled event being executed, providing access to tick, type, and reschedule capability
 */
export type EventCallback = (event: ScheduledEvent) => void | Promise<void>

/**
 * Type for the exclusive scheduleExternal function.
 *
 * This is the return type of EventScheduler.getExclusiveScheduleExternalFn().
 * Match uses this to store the bound function for scheduling external events.
 */
export type ScheduleExternalFn = (
	tickOffset: number,
	data: ExternalEventPayload,
	callback: EventCallback,
) => ScheduledEvent

/**
 * Maximum tick value for "run until end" operations.
 *
 * This value stays within V8's SMI (Small Integer) range (~1 billion / (2³⁰ - 1 = 1,073,741,823))
 * to ensure all tick comparisons use fast integer math instead of floating-point.
 *
 * 100 million ticks = ~27.7 hours of simulated time, far exceeding any match duration.
 * A 90-minute match only needs ~5.4 million ticks.
 * Use 100 million as "infinity" - way more than any match needs, and stays within SMI for fast integer math.
 */
const MAX_TICK = 100_000_000

/**
 * Starting sequence number for simulation events.
 *
 * Simulation events (AI, physics, etc.) use seq numbers starting at 1,000,000.
 * External events (substitutions, tactics, shouts) use seq numbers 0 to 999,999.
 * This ensures external events always execute FIRST within a tick (lower seq wins).
 */
const SEQ_SIMULATION_START = 1_000_000

/**
 * Event Types
 *
 * Used for event identification, inspection, and logging.
 * Simulation events (AI, physics) use these types directly.
 * External events (human input only) use EXTERNAL type internally.
 */
export const enum EventType {
	BALL_PHYSICS,
	PLAYER_PHYSICS,
	VISION,
	SHOUT,
	PLAYER_AI,
	HEAD_AI,
	HEAD_PHYSICS,
	TACTICAL_CHANGE,
	SUBSTITUTION,
	REFEREE,
	/**
	 * External event type (human input only).
	 *
	 * This type is used internally by scheduleExternal() for all external events.
	 * The specific event type (substitution, tactical, shout) is determined by
	 * the ExternalEventPayload.type field in the event data.
	 *
	 * External events are EXCLUSIVELY for human input - AI decisions are
	 * deterministic (seeded PRNG) and don't use this type.
	 *
	 * External events use reserved sequence numbers (0 to 999,999) to ensure
	 * they execute FIRST within their tick, before any simulation events.
	 */
	EXTERNAL,
	/**
	 * Generic event type for debugging and testing.
	 */
	DEBUG,
}

/**
 * Scheduled event container
 *
 * Holds event data and maintains heap index for efficient removal/rescheduling.
 * Provides methods for cancellation and rescheduling.
 *
 * @example
 * const event = scheduler.schedule(100, EventType.BALL_PHYSICS, (event) => {
 *   console.log('Ball physics 100ms from now at tick', event.tick)
 *   // Can reschedule from within callback
 *   if (needsMoreProcessing) {
 *     event.reschedule(5)  // Reschedule 5 ticks from now
 *   }
 * })
 *
 * // Reschedule to different offset (150 ticks from current tick)
 * event.reschedule(150)
 *
 * // Cancel event
 * event.cancel()
 */
class ScheduledEvent {
	tick: number
	type: EventType
	callback: EventCallback
	data: unknown
	heapIndex: number
	seq: number
	#scheduler: EventScheduler

	constructor(
		tick: number,
		type: EventType,
		callback: EventCallback,
		seq: number,
		scheduler: EventScheduler,
		data?: unknown,
	) {
		this.tick = tick
		this.type = type
		this.callback = callback
		this.data = data
		this.heapIndex = -1
		this.seq = seq
		this.#scheduler = scheduler
	}

	/**
	 * Cancel this event
	 *
	 * Removes event from scheduler queue. Safe to call multiple times.
	 *
	 * @returns true if cancelled, false if already executed/cancelled
	 */
	cancel(): boolean {
		return this.#scheduler.cancel(this)
	}

	/**
	 * Reschedule event to different offset from current tick
	 *
	 * @param tickOffset - Non-negative integer offset from current tick (>= 0)
	 * @returns true if rescheduled successfully
	 * @throws {Error} If tickOffset is invalid
	 */
	reschedule(tickOffset: number): boolean {
		return this.#scheduler.reschedule(this, tickOffset)
	}

	/**
	 * Check if event is still scheduled (not cancelled or executed)
	 */
	get isScheduled(): boolean {
		return this.heapIndex !== -1
	}

	/**
	 * Scheduler that created this event (read-only)
	 */
	get scheduler(): EventScheduler {
		return this.#scheduler
	}
}

/**
 * Base event scheduler using min-heap priority queue
 *
 * Processes events sequentially by tick and sequence order.
 * No pause/resume state management - use RealTimeScheduler wrapper for that.
 * All scheduling is offset-based for simplicity and determinism.
 *
 * @example
 * const scheduler = new EventScheduler()
 * const event = scheduler.schedule(100, EventType.BALL_PHYSICS, (event) => {
 *   console.log('Ball physics 100ms from now at tick', event.tick)
 *   // Access to event allows self-rescheduling
 *   event.reschedule(10)  // Reschedule 10 ticks from now
 * })
 * await scheduler.advance(200)  // Advance 200 ticks from current position
 */
export class EventScheduler {
	/**
	 * Current tick value - the tick that will be processed next by advance().
	 *
	 * IMPORTANT: This represents the NEXT tick to be executed, not the last completed tick.
	 * With offset-based scheduling, callers can use tickOffset >= 0 (including 0 for current tick).
	 * Sequence numbers ensure deterministic ordering when multiple events target the same tick.
	 *
	 * Example timeline:
	 * - Scheduler created: currentTick = 0 (tickOffset = 0 schedules to tick 0, tickOffset = 1 to tick 1)
	 * - During tick 50 processing: currentTick = 50 (tickOffset = 0 schedules to tick 50, tickOffset = 1 to tick 51)
	 * - After advance(100) completes: currentTick = 100 (advanced 100 ticks from previous position)
	 */
	#currentTick: number = 0
	#heap: ScheduledEvent[] = []
	#running: boolean = false
	#seq: number = SEQ_SIMULATION_START

	/**
	 * External event sequence counter.
	 *
	 * External events (substitutions, tactics, shouts) use seq numbers 0 to 999,999.
	 * This counter auto-increments for each external event scheduled.
	 */
	#externalSeq: number = 0

	/**
	 * Minimum tick for external event scheduling.
	 *
	 * External events cannot be injected into a tick that has already passed.
	 * This value tracks the earliest tick that external events can target.
	 *
	 * - When a tick starts draining: bumped to tick + 1 (can't inject mid-tick)
	 * - After advance() completes: set to targetTick (can't schedule in the past)
	 *
	 * scheduleExternal() uses: actualTick = #minExternalTick + tickOffset
	 *
	 * Before simulation starts: #minExternalTick = 0 (allows pre-scheduling at tick 0)
	 * After advance(1000): #minExternalTick = 1000 (tickOffset=0 means tick 1000)
	 */
	#minExternalTick: number = 0

	/**
	 * Flag to enforce single-owner pattern for external event scheduling.
	 *
	 * The scheduleExternal function can only be retrieved ONCE via
	 * getExclusiveScheduleExternalFn(). This ensures that only one owner
	 * (typically the Match class) can schedule external events, which is
	 * critical for:
	 *
	 * 1. Centralized recording: All external events must be recorded in
	 *    Match.externalEvents[] for deterministic replay
	 * 2. Preventing bypass: No code can accidentally schedule external events
	 *    without them being recorded
	 * 3. Clear ownership: Makes it explicit that Match owns external event
	 *    scheduling, not arbitrary code with scheduler access
	 */
	#scheduleExternalFnRetrieved: boolean = false

	/**
	 * Optional callback fired when the scheduler advances to a new tick.
	 *
	 * Called once per tick during advance(), AFTER all events for that tick
	 * have been processed. Only fires for ticks that actually had events.
	 *
	 * This is primarily useful for RealTimeScheduler to update UI/state.
	 * HeadlessScheduler can leave this unset for zero overhead.
	 *
	 * @param tick - The tick that was just completed
	 */
	onTick?: (tick: number) => void

	constructor() {
		// ═══════════════════════════════════════════════════════════
		//                  S E A L   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.seal(this)
	}

	/**
	 * Schedule a new event at an offset from the current tick.
	 *
	 * The offset is added to the current tick to determine the absolute tick value.
	 * This is the primary scheduling method - callers should always think in terms
	 * of "how many ticks in the future" rather than absolute tick values.
	 *
	 * @param {number} tickOffset Non-negative integer offset from current tick (>= 0)
	 * @param {EventType} type Event type for reference and logging
	 * @param {EventCallback} callback Function invoked when the event fires
	 * @param {unknown} [data] Optional payload accessible via event.data in callback
	 * @returns {ScheduledEvent} Handle for later cancellation/rescheduling
	 * @throws {Error} If tickOffset is not a non-negative integer or callback is not a function
	 */
	schedule(tickOffset: number, type: EventType, callback: EventCallback, data?: unknown): ScheduledEvent {
		if (__DEBUG__) {
			if (!Number.isInteger(tickOffset) || tickOffset < 0) {
				throw new Error('tickOffset must be a non-negative integer (>= 0)')
			}
			if (!Number.isInteger(type) || type < 0 || type > EventType.DEBUG) {
				throw new Error(`Invalid event type: ${type}`)
			}
			if (typeof callback !== 'function') {
				throw new Error('Event callback must be a function')
			}
		}

		const tick = this.#currentTick + tickOffset
		const seq = this.#seq++
		const event = new ScheduledEvent(tick, type, callback, seq, this, data)
		this.#heapPush(event)

		return event
	}

	/**
	 * Get exclusive access to the scheduleExternal function.
	 *
	 * This method can only be called ONCE. It returns a bound function that
	 * schedules external events (manager inputs) with the reserved sequence
	 * number range.
	 *
	 * # Single-Owner Pattern
	 *
	 * The returned function should be stored by a single owner (typically Match)
	 * that is responsible for:
	 * 1. Recording all external events for deterministic replay
	 * 2. Providing a public interface (e.g., match.scheduleExternal()) that
	 *    both schedules AND records the event
	 *
	 * This pattern ensures no code can bypass the recording mechanism by
	 * calling scheduler.scheduleExternal() directly.
	 *
	 * # Usage
	 *
	 * @example
	 * // In Match constructor:
	 * this.#scheduleExternalFn = scheduler.getExclusiveScheduleExternalFn()
	 *
	 * // Match provides public method:
	 * scheduleExternal(tickOffset, data, callback) {
	 *     const event = this.#scheduleExternalFn(tickOffset, data, callback)
	 *     this.externalEvents.push({ tick: event.tick, seq: event.seq, data })
	 *     return event
	 * }
	 *
	 * @returns Bound function: (tickOffset, data, callback) => ScheduledEvent
	 * @throws {Error} If called more than once
	 */
	getExclusiveScheduleExternalFn(): (tickOffset: number, data: ExternalEventPayload, callback: EventCallback) => ScheduledEvent {
		if (this.#scheduleExternalFnRetrieved) {
			throw new Error(
				'scheduleExternal function already retrieved. ' +
				'Only one owner (Match) should schedule external events to ensure proper recording.',
			)
		}
		this.#scheduleExternalFnRetrieved = true

		return this.#scheduleExternal.bind(this)
	}

	/**
	 * Schedule an external event (manager input) at an offset from the earliest safe tick.
	 *
	 * This is a PRIVATE method. Access via getExclusiveScheduleExternalFn().
	 *
	 * External events (substitutions, tactical changes, shouts) use a reserved sequence
	 * number range (0 to 999,999) to ensure they always execute FIRST within a tick,
	 * before any simulation events.
	 *
	 * The tickOffset is relative to #minExternalTick (NOT currentTick):
	 * - Before simulation starts: #minExternalTick = 0, so tickOffset = absolute tick
	 * - During tick N: #minExternalTick = N + 1, so tickOffset = 0 means "next tick"
	 *
	 * This prevents mid-tick injection which would break deterministic replay.
	 *
	 * @param tickOffset Non-negative integer offset from earliest safe tick (>= 0)
	 * @param data External event payload (required) - contains type and event-specific data
	 * @param callback Function invoked when the event fires
	 * @returns ScheduledEvent with actual tick in event.tick (for recording)
	 * @throws {Error} If tickOffset is invalid or callback is not a function
	 */
	#scheduleExternal(tickOffset: number, data: ExternalEventPayload, callback: EventCallback): ScheduledEvent {
		if (!Number.isInteger(tickOffset) || tickOffset < 0) {
			throw new Error('tickOffset must be a non-negative integer (>= 0)')
		}
		if (typeof callback !== 'function') {
			throw new Error('Event callback must be a function')
		}

		const tick = this.#minExternalTick + tickOffset
		const seq = this.#externalSeq++
		const event = new ScheduledEvent(tick, EventType.EXTERNAL, callback, seq, this, data)
		this.#heapPush(event)

		return event
	}

	/**
	 * Move an existing event to a different offset from the current tick.
	 *
	 * The event must belong to this scheduler and remain scheduled.
	 * The heap is adjusted in-place without reallocating the event.
	 *
	 * @param {ScheduledEvent} event Handle returned from schedule()
	 * @param {number} tickOffset Non-negative integer offset from current tick (>= 0)
	 * @returns {boolean} true when rescheduled, false is never returned
	 * @throws {Error} If the event is foreign/cleared or tickOffset is invalid
	 */
	reschedule(event: ScheduledEvent, tickOffset: number): boolean {
		const target = this.#ensureOwnedEvent(event)
		if (!Number.isInteger(tickOffset) || tickOffset < 0) {
			throw new Error('tickOffset must be a non-negative integer (>= 0)')
		}

		const newTick = this.#currentTick + tickOffset
		const oldTick = target.tick
		target.tick = newTick
		target.seq = this.#seq++ // Assign new sequence number for deterministic ordering

		if (target.heapIndex === -1) {
			this.#heapPush(target)
			return true
		}

		if (newTick < oldTick) {
			this.#bubbleUp(target.heapIndex)
		} else if (newTick > oldTick) {
			this.#bubbleDown(target.heapIndex)
		}

		return true
	}

	/**
	 * Cancel a pending event.
	 *
	 * @param {ScheduledEvent} event Handle obtained from schedule()
	 * @returns {boolean} true if the event was removed, false if it already fired/was cancelled
	 * @throws {Error} When the handle originated from a different scheduler
	 */
	cancel(event: ScheduledEvent): boolean {
		const target = this.#ensureOwnedEvent(event)
		if (target.heapIndex === -1) return false
		this.#heapRemove(target.heapIndex)
		return true
	}

	/**
	 * Remove all queued events and reset tick/running state.
	 */
	clear(): void {
		while (this.#heap.length > 0) {
			const event = this.#heap.pop()!
			event.heapIndex = -1
		}
		this.#currentTick = 0
		this.#running = false
		this.#seq = SEQ_SIMULATION_START
		this.#externalSeq = 0
		this.#minExternalTick = 0
	}

	/**
	 * Process events for the specified number of ticks from the current tick.
	 *
	 * This is an offset-based method: it advances the scheduler by `ticks` from the current position.
	 * The scheduler drains all events at or before `currentTick + ticks`, then sets
	 * `#currentTick` to that boundary so clients can schedule relative to the exact
	 * boundary they requested.
	 *
	 * Headless callers should prefer {@link runUntilEnd}.
	 *
	 * @param {number} ticks Number of ticks to advance from current tick (>= 0)
	 * @returns {Promise<boolean>} Resolves to true if pending events remain after the drain,
	 *   or false if the queue was fully drained up to the target boundary
	 * @throws {Error} If the scheduler is already running or ticks is negative
	 */
	async advance(ticks: number): Promise<boolean> {
		this.#assertTick(ticks)

		if (ticks < 0) {
			throw new Error('Cannot run backwards in time')
		}

		return this.#drainUntil(this.#currentTick + ticks)
	}

	/**
	 * Drain the queue entirely, regardless of tick.
	 *
	 * Used by headless execution to sprint to the end without pausing at arbitrary
	 * boundaries. Mutates `#currentTick` to the last processed tick.
	 *
	 * @returns {Promise<boolean>} Resolves to true if pending events remain (rare),
	 *   or false if the queue was fully drained
	 * @throws {Error} If the scheduler is already running
	 */
	async runUntilEnd(): Promise<boolean> {
		return this.#drainUntil(MAX_TICK)
	}

	/**
	 * Internal helper: process events while the next tick is <= targetTick.
	 *
	 * NOTE: This internal method uses ABSOLUTE tick values, unlike the public
	 * advance() which is offset-based.
	 *
	 * @param {number} targetTick Absolute tick value - highest tick allowed to execute
	 * @returns {Promise<boolean>} Resolves to true if pending events remain after the drain,
	 *   or false if the queue was fully drained up to the target boundary
	 * @private
	 */
	async #drainUntil(targetTick: number): Promise<boolean> {
		if (this.#running) {
			throw new Error('EventScheduler is already running')
		}

		this.#running = true

		try {
			while (this.#heap.length > 0) {
				const nextTick = this.#heap[0].tick
				if (nextTick > targetTick) {
					break
				}

				this.#currentTick = nextTick
				// Bump minExternalTick BEFORE processing events for this tick
				// External events scheduled during this tick will go to nextTick + 1
				this.#minExternalTick = nextTick + 1

				do {
					const event = this.#heapPop()
					await event.callback(event)
				} while (this.#heap.length > 0 && this.#heap[0].tick === nextTick)

				// Notify tick completion (primarily for RealTimeScheduler UI updates)
				if (this.onTick) this.onTick(nextTick)
			}

			// Always advance currentTick to targetTick, even if queue drained early
			this.#currentTick = targetTick
			// Keep minExternalTick in sync - external events can't go to past ticks
			this.#minExternalTick = targetTick
		} finally {
			this.#running = false
		}

		return this.#heap.length > 0
	}

	/**
	 * Get delta time in seconds from a given tick to the current tick.
	 *
	 * @param {number} time Tick value to measure from
	 * @returns {number} Delta time in seconds (can be negative if time > currentTick)
	 */
	getDeltaTimeFrom(time: number): number {
		return (this.#currentTick - time) / 1000
	}

	/**
	 * Number of events currently in the queue.
	 */
	get eventCount(): number {
		return this.#heap.length
	}

	/**
	 * Next legal tick value for scheduling (current tick + 1).
	 */
	get nextTick(): number {
		return this.#currentTick + 1
	}

	/**
	 * Current tick value (represents the next event boundary).
	 */
	get currentTick(): number {
		return this.#currentTick
	}

	/**
	 * Tick setter disabled - use advance() instead
	 */
	set currentTick(_value: number) {
		throw new Error('Cannot set current tick directly. Just add some events to a future tick and the scheduler will run from that point.')
	}

	/**
	 * Whether advance/runUntilEnd is currently executing.
	 */
	get running(): boolean {
		return this.#running
	}

	/**
	 * Check if there are any pending events waiting in the queue.
	 *
	 * Exposed primarily for wrapper schedulers (headless/real-time) that need to
	 * determine when the queue has been fully drained without peeking into
	 * private heap state.
	 */
	get hasPendingEvents(): boolean {
		return this.#heap.length > 0
	}

	/**
	 * Peek the tick of the next scheduled event, without removing it.
	 *
	 * Helpful for wrappers that want to know the next boundary without touching
	 * private heap internals.
	 */
	get nextScheduledTick(): number | null {
		return this.#heap.length > 0 ? this.#heap[0].tick : null
	}

	/**
	 * Minimum tick at which external events can be scheduled.
	 *
	 * - Before simulation starts: 0 (allows pre-scheduling at tick 0)
	 * - During tick N processing: N + 1 (can't inject mid-tick)
	 * - After advance(X) completes: X (can't schedule in the past)
	 *
	 * scheduleExternal(tickOffset) schedules at: minExternalTick + tickOffset
	 */
	get minExternalTick(): number {
		return this.#minExternalTick
	}

	#assertTick(value: number): void {
		if (!Number.isFinite(value) || !Number.isInteger(value)) {
			throw new Error('Tick value must be a finite integer')
		}
	}

	#ensureOwnedEvent(event: ScheduledEvent): ScheduledEvent {
		if (!event || event.scheduler !== this) {
			throw new Error('Event does not belong to this scheduler')
		}

		return event
	}

	#heapPush(event: ScheduledEvent): void {
		event.heapIndex = this.#heap.length
		this.#heap.push(event)
		this.#bubbleUp(event.heapIndex)
	}

	#heapPop(): ScheduledEvent {
		const root = this.#heap[0]
		const last = this.#heap.pop()!

		if (this.#heap.length > 0) {
			this.#heap[0] = last
			last.heapIndex = 0
			this.#bubbleDown(0)
		}
		root.heapIndex = -1

		return root
	}

	#heapRemove(index: number): void {
		if (index < 0 || index >= this.#heap.length) return

		const removed = this.#heap[index]
		const last = this.#heap.pop()!

		if (index < this.#heap.length) {
			this.#heap[index] = last
			last.heapIndex = index

			// Determine direction using same logic as #less() for consistency
			const lastLessThanRemoved = last.tick < removed.tick ||
				(last.tick === removed.tick && last.seq < removed.seq)

			if (lastLessThanRemoved) {
				this.#bubbleUp(index)
			} else {
				this.#bubbleDown(index)
			}
		}

		removed.heapIndex = -1
	}

	#bubbleUp(index: number): void {
		while (index > 0) {
			const parent = (index - 1) >> 1
			if (!this.#less(index, parent)) break
			this.#swap(index, parent)
			index = parent
		}
	}

	#bubbleDown(index: number): void {
		const length = this.#heap.length
		for (;;) {
			const left = (index << 1) + 1
			const right = left + 1
			let smallest = index

			if (left < length && this.#less(left, smallest)) {
				smallest = left
			}
			if (right < length && this.#less(right, smallest)) {
				smallest = right
			}
			if (smallest === index) break
			this.#swap(index, smallest)
			index = smallest
		}
	}

	#less(i: number, j: number): boolean {
		const a = this.#heap[i]
		const b = this.#heap[j]
		if (a.tick !== b.tick) return a.tick < b.tick

		return a.seq < b.seq // Deterministic FIFO: sequence number breaks ties
	}

	#swap(i: number, j: number): void {
		const temp = this.#heap[i]
		this.#heap[i] = this.#heap[j]
		this.#heap[j] = temp
		this.#heap[i].heapIndex = i
		this.#heap[j].heapIndex = j
	}
}
