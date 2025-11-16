/**
 * FC Tycoon™ 2027 Match Simulator - Event Scheduler
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

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
 * - Events CANNOT be scheduled on current tick (minimum is tick + 1, even when idle)
 * - Events are processed in priority order by EventType (lower value = higher priority)
 * - We do NOT keep sequence numbers: identical tick/type pairs may execute in any order
 * - Cannot pause mid-tick (pause() waits for current tick to complete)
 * - Events within same tick/type execute sequentially (one at a time)
 * - Illegal to enqueue event for current tick during execution
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
 *    - Single execution primitive: runUntil(targetTick)
 *    - No pause/resume/start/stop state management
 *    - Hard validation: throws on invalid tick values, types, or scheduler ownership
 *    - Optimized for dynamic ticks (often single event per tick)
 *    - Provides helpers: scheduleOnNextTick() / scheduleOnOffset() for convenience
 *
 * 2. **RealTimeScheduler (Wrapper)**
 *    - Real-time run/pause/resume/stop controls
 *    - Speed control: 0.1x (slow motion) to 100x+ (fast forward)
 *    - Uses await wait(delay) + catch-up loops
 *    - pause() returns Promise that resolves after current tick completes
 *    - Handles setTimeout/setInterval ~15ms overhead with catch-up mechanism
 *
 * 3. **HeadlessScheduler (Wrapper)**
 *    - Instant result simulation (as fast as possible)
 *    - No pause feature (runs start-to-finish)
 *    - Can continue from existing scheduler state (player clicks "Instant Results")
 *    - Runs runUntil(Infinity) in tight loop
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
 * // Basic scheduling
 * const scheduler = new EventScheduler()
 * const event = scheduler.schedule(100, EventType.BALL_PHYSICS, (tick) => {
 *   console.log('Ball physics at tick', tick)
 * })
 *
 * // Convenience helper (schedule for next tick)
 * scheduler.scheduleOnNextTick(EventType.PLAYER_AI, (tick) => {
 *   console.log('Player AI at tick', tick)
 * })
 *
 * // Offset helper (schedule relative to current tick)
 * scheduler.scheduleOnOffset(60, EventType.VISION, (tick) => {
 *   console.log('Scan field one simulated minute later', tick)
 * })
 *
 * // Event manipulation
 * event.reschedule(150)  // Move to different tick
 * event.cancel()         // Remove from queue
 *
 * // Run simulation
 * await scheduler.runUntil(200)  // Process all events up to tick 200
 *
 * @see EVENT_SCHEDULER_REQUIREMENTS.md for complete specification
 */

/**
 * Event callback function signature
 */
export type EventCallback<T = unknown> = (tick: number, payload: T) => void | Promise<void>

/**
 * Event Types
 *
 * Values define priority order (lower = higher priority).
 * Critical for ensuring ball physics updates before player AI/vision.
 */
export enum EventType {
	BALL_PHYSICS = 0,
	PLAYER_PHYSICS = 1,
	VISION = 2,
	SHOUT = 3,
	PLAYER_AI = 4,
	HEAD_AI = 5,
	HEAD_PHYSICS = 6,
	TACTICAL_CHANGE = 7,
	REFEREE = 8,
	OTHER = 9,
}

/**
 * Scheduled event container
 *
 * Holds event data and maintains heap index for efficient removal/rescheduling.
 * Provides methods for cancellation and rescheduling.
 *
 * @example
 * const event = scheduler.schedule(100, EventType.BALL_PHYSICS, (tick) => {
 *   console.log('Ball physics at tick', tick)
 * })
 *
 * // Reschedule to different tick
 * event.reschedule(150)
 *
 * // Cancel event
 * event.cancel()
 */
class ScheduledEvent<T = unknown> {
	tick: number
	type: EventType
	callback: EventCallback<T>
	payload: T
	heapIndex: number
	#scheduler: EventScheduler

	constructor(tick: number, type: EventType, callback: EventCallback<T>, payload: T, scheduler: EventScheduler) {
		this.tick = tick
		this.type = type
		this.callback = callback
		this.payload = payload
		this.heapIndex = -1
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
	 * Reschedule event to different tick
	 *
	 * @param newTick - New future tick value (must be > current tick)
	 * @param payload - Optional new payload value for event
	 * @returns true if rescheduled successfully
	 * @throws {Error} If newTick is invalid
	 */
	reschedule(newTick: number, payload?: T): boolean {
		if (arguments.length >= 2) {
			return this.#scheduler.reschedule(this, newTick, payload)
		}
		return this.#scheduler.reschedule(this, newTick)
	}

	/**
	 * Convenience helper to reschedule relative to the current tick.
	 *
	 * @param offset Positive integer offset added to scheduler current tick
	 * @param payload Optional new payload value
	 * @returns true if rescheduled successfully
	 */
	rescheduleOnOffset(offset: number, payload?: T): boolean {
		if (arguments.length >= 2) {
			return this.#scheduler.rescheduleOnOffset(this, offset, payload)
		}
		return this.#scheduler.rescheduleOnOffset(this, offset)
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
 * Processes events sequentially by tick and priority (EventType).
 * No pause/resume state management - use RealTimeScheduler wrapper for that.
 *
 * @example
 * const scheduler = new EventScheduler()
 * const event = scheduler.schedule(100, EventType.BALL_PHYSICS, (tick) => {
 *   console.log('Ball physics at tick', tick)
 * })
 * await scheduler.runUntil(200)
 */
export class EventScheduler {
	/**
	 * Current tick value - the tick that will be processed next by runUntil().
	 *
	 * IMPORTANT: This represents the NEXT tick to be executed, not the last completed tick.
	 * Even if the scheduler is idle, we enforce a strict "future-only" policy: callers
	 * must always schedule on currentTick + 1 or later. This keeps the API consistent and
	 * avoids edge cases where callers would have to know whether the scheduler is running.
	 *
	 * Example timeline:
	 * - Scheduler created: currentTick = 0 (first valid tick to schedule = 1)
	 * - During tick 50 processing: currentTick = 50 (next valid tick = 51)
	 * - After runUntil(100) completes: currentTick = 100 (next valid tick = 101)
	 */
	#currentTick: number = 0
	#heap: ScheduledEvent<any>[] = []
	#running: boolean = false

	constructor() {}

	/**
	 * Convenience helper that schedules one tick in the future.
	 *
	 * @template T
	 * @param {EventType} type Event priority type
	 * @param {EventCallback<T>} callback Function executed next tick
	 * @param {T} [payload] Optional payload passed to callback
	 * @returns {ScheduledEvent<T>} Handle to the newly scheduled event
	 */
	scheduleOnNextTick<T = unknown>(type: EventType, callback: EventCallback<T>, payload?: T): ScheduledEvent<T> {
		return this.schedule(this.#currentTick + 1, type, callback, payload)
	}

	/**
	 * Schedule an event on a tick offset relative to the current tick.
	 *
	 * @template T
	 * @param {number} offset Positive integer offset added to current tick
	 * @param {EventType} type Event priority type
	 * @param {EventCallback<T>} callback Function executed at the offset tick
	 * @param {T} [payload] Optional payload passed to callback
	 * @returns {ScheduledEvent<T>} Handle to the newly scheduled event
	 */
	scheduleOnOffset<T = unknown>(offset: number, type: EventType, callback: EventCallback<T>, payload?: T): ScheduledEvent<T> {
		if (!Number.isInteger(offset) || offset <= 0) {
			throw new Error('Offset must be a positive integer')
		}
		return this.schedule(this.#currentTick + offset, type, callback, payload)
	}

	/**
	 * Schedule a new event on a future tick.
	 *
	 * Validates all arguments up front, enforcing the "future-only" policy and
	 * ensuring the callback is a function before touching the heap. Callers can
	 * optionally attach a payload that will be passed through to the callback.
	 *
	 * @template T Payload type stored with the event
	 * @param {number} tick Future tick value (must be > current tick)
	 * @param {EventType} type Event priority used for ordering
	 * @param {EventCallback<T>} callback Function invoked when the event fires
	 * @param {T} [payload] Optional payload forwarded to the callback
	 * @returns {ScheduledEvent<T>} Handle for later cancellation/rescheduling
	 * @throws {Error} If tick is not future, type is invalid, or callback is not a function
	 */
	schedule<T = unknown>(tick: number, type: EventType, callback: EventCallback<T>, payload?: T): ScheduledEvent<T> {
		this.#assertTick(tick)
		if (tick <= this.#currentTick) {
			throw new Error('Events must be scheduled in the future (tick + 1 or greater)')
		}
		if (!Number.isInteger(type) || type < 0 || type >= EventType.OTHER + 1) {
			throw new Error(`Invalid event type: ${type}`)
		}
		if (typeof callback !== 'function') {
			throw new Error('Event callback must be a function')
		}

		const event = new ScheduledEvent(tick, type, callback, payload as T, this)
		this.#heapPush(event)
		return event
	}

	/**
	 * Move an existing event to a different future tick.
	 *
	 * The event must belong to this scheduler and remain scheduled. Payload can be
	 * replaced by supplying the third argument; to clear it, pass `undefined`
	 * explicitly. The heap is adjusted in-place without reallocating the event.
	 *
	 * @template T Payload type stored with the event
	 * @param {ScheduledEvent<T>} event Handle returned from schedule()
	 * @param {number} newTick New future tick value (> current tick)
	 * @param {T} [payload] Optional new payload to store with the event
	 * @returns {boolean} true when rescheduled, false is never returned
	 * @throws {Error} If the event is foreign/cleared or newTick is invalid/past
	 */
	reschedule<T = unknown>(event: ScheduledEvent<T>, newTick: number, payload?: T): boolean {
		const target = this.#ensureOwnedEvent(event)
		this.#assertTick(newTick)
		if (newTick <= this.#currentTick) {
			throw new Error('Cannot reschedule event on or before current tick')
		}

		const oldTick = target.tick
		target.tick = newTick
		if (arguments.length >= 3) {
			target.payload = payload as T
		}

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
	 * Reschedule an event by offset relative to the current tick.
	 *
	 * @template T
	 * @param {ScheduledEvent<T>} event Event handle from schedule()
	 * @param {number} offset Positive integer offset from current tick
	 * @param {T} [payload] Optional new payload
	 * @returns {boolean} true once rescheduled
	 */
	rescheduleOnOffset<T = unknown>(event: ScheduledEvent<T>, offset: number, payload?: T): boolean {
		if (!Number.isInteger(offset) || offset <= 0) {
			throw new Error('Offset must be a positive integer')
		}
		if (arguments.length >= 3) {
			return this.reschedule(event, this.#currentTick + offset, payload)
		}
		return this.reschedule(event, this.#currentTick + offset)
	}

	/**
	 * Cancel a pending event.
	 *
	 * @param {ScheduledEvent<any>} event Handle obtained from schedule()
	 * @returns {boolean} true if the event was removed, false if it already fired/was cancelled
	 * @throws {Error} When the handle originated from a different scheduler
	 */
	cancel(event: ScheduledEvent<any>): boolean {
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
	}

	/**
	 * Process events until (but not including) the requested tick.
	 *
	 * Headless callers should prefer {@link runUntilEnd}. For finite targets the
	 * scheduler drains everything at or before the tick, then sets
	 * `#currentTick = targetTick` so clients can schedule relative to the exact
	 * boundary they requested.
	 *
	 * @param {number} targetTick Tick to run up to (exclusive)
	 * @returns {Promise<void>} Resolves when all eligible events are processed
	 * @throws {Error} If the scheduler is already running or asked to go backward
	 */
	async runUntil(targetTick: number): Promise<void> {
		if (this.#running) {
			throw new Error('EventScheduler is already running')
		}
		if (targetTick === Infinity) {
			await this.runUntilEnd()
			return
		}

		this.#assertTick(targetTick)
		if (targetTick < this.#currentTick) {
			throw new Error('Cannot run backwards in time')
		}

		await this.#drainUntil(targetTick)
		this.#currentTick = targetTick
	}

	/**
	 * Drain the queue entirely, regardless of tick.
	 *
	 * Used by headless execution to sprint to the end without pausing at arbitrary
	 * boundaries. Mutates `#currentTick` to the last processed tick.
	 *
	 * @returns {Promise<void>} Resolves when the heap is empty
	 * @throws {Error} If the scheduler is already running
	 */
	async runUntilEnd(): Promise<void> {
		if (this.#running) {
			throw new Error('EventScheduler is already running')
		}

		await this.#drainUntil(Number.MAX_SAFE_INTEGER)
	}

	/**
	 * Internal helper: process events while the next tick is <= limitTick.
	 *
	 * @param {number} limitTick Highest tick allowed to execute
	 * @returns {Promise<void>} Resolves when no eligible events remain
	 * @private
	 */
	async #drainUntil(limitTick: number): Promise<void> {
		this.#running = true

		try {
			while (this.#heap.length > 0) {
				const nextTick = this.#heap[0].tick
				if (nextTick > limitTick) {
					break
				}

				this.#currentTick = nextTick

				do {
					const event = this.#heapPop()
					await event.callback(nextTick, event.payload)
				} while (this.#heap.length > 0 && this.#heap[0].tick === nextTick)
			}
		} finally {
			this.#running = false
		}
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
	get tick(): number {
		return this.#currentTick
	}

	/**
	 * Whether runUntil/runUntilEnd is currently executing.
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
	 * Tick setter disabled - use runUntil() instead
	 */
	set tick(_value: number) {
		throw new Error('Cannot set tick directly')
	}

	#assertTick(value: number): void {
		if (!Number.isFinite(value) || !Number.isInteger(value)) {
			throw new Error('Tick value must be a finite integer')
		}
	}

	#ensureOwnedEvent<T>(event: ScheduledEvent<T>): ScheduledEvent<T> {
		if (!event || event.scheduler !== this) {
			throw new Error('Event does not belong to this scheduler')
		}
		return event
	}

	#heapPush(event: ScheduledEvent<any>): void {
		event.heapIndex = this.#heap.length
		this.#heap.push(event)
		this.#bubbleUp(event.heapIndex)
	}

	#heapPop(): ScheduledEvent<any> {
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

			let lastLessRemoved = last.tick < removed.tick
			if (last.tick === removed.tick) {
				if (last.type !== removed.type) {
					lastLessRemoved = last.type < removed.type
				} else {
					lastLessRemoved = false
				}
			}

			if (lastLessRemoved) {
				this.#bubbleUp(index)
			} else if (last.tick > removed.tick) {
				this.#bubbleDown(index)
			} else {
				if (last.type > removed.type) {
					this.#bubbleDown(index)
				}
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
		if (a.type !== b.type) return a.type < b.type
		return false // No FIFO guarantee: identical tick/type pairs are interchangeable
	}

	#swap(i: number, j: number): void {
		const temp = this.#heap[i]
		this.#heap[i] = this.#heap[j]
		this.#heap[j] = temp
		this.#heap[i].heapIndex = i
		this.#heap[j].heapIndex = j
	}
}
