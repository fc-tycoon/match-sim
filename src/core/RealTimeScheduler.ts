/**
 * FC Tycoon™ 2027 Match Simulator - Real-Time Event Scheduler
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { EventScheduler } from './EventScheduler'

/**
 * Promise-based timer helper using setTimeout.
 *
 * Note: Actual delay is typically 4ms minimum on modern browsers due to timer
 * throttling, regardless of requested delay. This is why the backoff strategy
 * in #run() uses wait(0) for low-latency yields when idle initially, and only
 * falls back to wait(4) when idle for longer to reduce CPU usage.
 *
 * @param {number} delay - Requested delay in milliseconds (actual may be higher)
 * @returns {Promise<void>} Resolves after approximately `delay` milliseconds
 */
const wait = (delay: number): Promise<void> => new Promise((resolve) => {
	setTimeout(resolve, delay)
})

/**
 * Real-time scheduler wrapper for {@link EventScheduler}.
 *
 * Drives the underlying scheduler with wall-clock pacing, supporting speed
 * multipliers and automatic catch-up when timers fall behind. The wrapper
 * converts elapsed wall-clock time into simulation ticks and calls
 * {@link EventScheduler.advance} to process them.
 *
 * ## Design Philosophy
 *
 * **Single Source of Truth**: The `#runLoopPromise` field is the definitive
 * state indicator. When null, the scheduler is stopped. When non-null, the
 * loop is actively running (or shutting down).
 *
 * **No Pause/Resume**: Pause semantics are intentionally omitted. Calling
 * `stop()` halts execution cleanly, and `run()` restarts from the current
 * tick. Since {@link EventScheduler} maintains tick state internally, stopping
 * doesn't lose progress—it's effectively a pause. This eliminates the
 * complexity of dual state flags and pause/resume lifecycle management.
 *
 * **Speed Control**: The `speed` property can be changed on-the-fly, even
 * while the loop is running. The next iteration will use the updated value.
 *
 * ## Backoff Strategy
 *
 * The run loop uses an adaptive backoff strategy to balance responsiveness
 * with CPU efficiency:
 *
 * - **When processing ticks** (behind schedule): Yields with
 *   `await Promise.resolve()` to stay responsive while catching up. No
 *   artificial delays are added when the simulation is behind.
 *
 * - **When idle** (caught up, no ticks to process): Starts with
 *   `await Promise.resolve()` for low-latency response (first 50 iterations),
 *   then backs off to `await wait(4)` to reduce CPU usage. Even though
 *   wait(4) has non-deterministic delay (usually 4ms-16ms), this is
 *   acceptable when idle since there's no work to do anyway. And because
 *   after the wait(4), the loop will catch up on the next iteration.
 *   Our internal ticks are always exactly 1ms, so the simulation always
 *   stays accurate and deterministic, regardless of run/paused/stop state.
 *
 * This strategy ensures maximum throughput at high speeds (e.g., 100x) while
 * remaining power-efficient during normal playback or when paused.
 *
 * ## Fractional Tick Precision
 *
 * Wall-clock deltas are rarely exact multiples of 1ms. The loop maintains
 * sub-millisecond precision using `fractionalCarry` to accumulate remainders.
 * For example, at 60fps with 16.7ms frames:
 * - Frame 1: 16.7ms → 16 ticks processed, 0.7ms carried
 * - Frame 2: 16.7ms + 0.7ms carry = 17.4ms → 17 ticks processed, 0.4ms carried
 *
 * Over time, this averages to exactly 1000 ticks/second with no drift.
 *
 * ## Usage Example
 *
 * ```typescript
 * const scheduler = new EventScheduler()
 * const realTime = new RealTimeScheduler(scheduler)
 *
 * // Schedule some events
 * scheduler.schedule(100, EventType.KICKOFF, handleKickoff)
 * scheduler.schedule(500, EventType.BALL_PHYSICS, updatePhysics)
 *
 * // Start real-time execution
 * realTime.run()
 *
 * // Change speed on-the-fly
 * realTime.speed = 2.5 // 2.5x speed
 *
 * // Stop execution (can restart later with run())
 * await realTime.stop()
 *
 * // Speed up to instant results
 * realTime.speed = 100
 * realTime.run()
 * ```
 *
 * @see {@link EventScheduler} for the core scheduling primitives
 * @see {@link HeadlessScheduler} for maximum-speed execution without delays
 */
export class RealTimeScheduler {
	/** The underlying EventScheduler instance being driven by wall-clock time. */
	#scheduler: EventScheduler

	/**
	 * The currently executing run loop promise, or null if stopped.
	 * Used for awaiting clean shutdown in stop().
	 */
	#runLoopPromise: Promise<void> | null = null

	/**
	 * Whether the run loop should continue executing.
	 * Set to true before #run() starts, checked by the while loop.
	 * Set to false by stop() to signal the loop to exit.
	 */
	#running: boolean = false

	/** Current playback speed multiplier (1.0 = real-time, 2.0 = 2x speed, etc.). */
	#speed: number = 1

	/** Last error captured from the run loop or event callbacks (if any). */
	#lastError: unknown | null = null

	/** Optional callback fired when run loop starts. */
	onStart?: () => void

	/** Optional callback fired when run loop stops (for any reason). */
	onStop?: () => void

	/** Optional callback fired when the queue drains to empty. */
	onDrain?: () => void

	/** Optional callback fired when entering idle state. */
	onIdle?: () => void

	/** Optional callback fired when an error occurs inside the loop. */
	onError?: (error: unknown) => void

	/**
	 * Create a new real-time scheduler wrapper.
	 *
	 * @param {EventScheduler} [scheduler] - Optional EventScheduler instance to wrap.
	 *   If omitted, creates a new EventScheduler internally. Providing an existing
	 *   scheduler is useful for:
	 *   - Testing (inject a mock scheduler)
	 *   - Switching modes (e.g., from headless to real-time mid-match)
	 *   - Sharing a scheduler between multiple wrappers
	 *
	 * @example
	 * // Create with internal scheduler
	 * const realTime = new RealTimeScheduler()
	 *
	 * @example
	 * // Share scheduler with headless mode
	 * const scheduler = new EventScheduler()
	 * const realTime = new RealTimeScheduler(scheduler)
	 * const headless = new HeadlessScheduler(scheduler)
	 */
	constructor(scheduler?: EventScheduler) {
		this.#scheduler = scheduler ?? new EventScheduler()

		// ═══════════════════════════════════════════════════════════
		//                  S E A L   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.seal(this)
	}

	/**
	 * Scheduler managed by this wrapper.
	 */
	get scheduler(): EventScheduler {
		return this.#scheduler
	}

	/**
	 * Whether the wrapper is currently running.
	 */
	get running(): boolean {
		return this.#running
	}

	/**
	 * Start the real-time run loop.
	 *
	 * Begins executing scheduled events at the current playback speed. The loop
	 * will continue until {@link stop} is called or all events are processed.
	 *
	 * Can be called multiple times to restart after stopping—the underlying
	 * EventScheduler maintains tick state, so execution resumes from where it
	 * left off.
	 *
	 * @throws {Error} If already running (check `running` getter first to avoid)
	 *
	 * @example
	 * const realTime = new RealTimeScheduler()
	 * realTime.run() // Start execution
	 * await realTime.stop() // Stop after some time
	 * realTime.run() // Resume from current tick
	 */
	run(): void {
		console.log('Scheduler running at speed:', this.#speed)
		if (this.#running) {
			throw new Error('RealTimeScheduler is already running')
		}

		// Set flag BEFORE calling #run() so the while loop sees it
		this.#running = true
		this.#runLoopPromise = this.#run()
	}

	/**
	 * Stop the run loop and wait for clean shutdown.
	 *
	 * Signals the loop to exit by setting `#runLoopPromise` to null, then waits
	 * for the current iteration to complete. This ensures:
	 * - No events are left mid-processing
	 * - The current tick completes fully
	 * - All async operations finish gracefully
	 *
	 * After stopping, the scheduler state is preserved—call {@link run} again
	 * to resume from the current tick.
	 *
	 * Safe to call multiple times (no-op if already stopped).
	 *
	 * @returns {Promise<void>} Resolves when the loop has fully exited
	 *
	 * @example
	 * realTime.run()
	 * // ... some time later
	 * await realTime.stop() // Waits for current tick to complete
	 * console.log('Stopped at tick:', realTime.scheduler.currentTick)
	 */
	async stop(): Promise<void> {
		if (!this.#running) return

		const runLoopPromise = this.#runLoopPromise
		this.#running = false
		if (runLoopPromise) {
			await runLoopPromise
		}
	}

	/**
	 * Current playback speed multiplier.
	 *
	 * @returns {number} Speed multiplier (1.0 = real-time, 2.0 = 2x speed, etc.)
	 */
	get speed(): number {
		return this.#speed
	}

	/**
	 * Update the playback speed multiplier.
	 *
	 * Can be changed on-the-fly while the loop is running. The next iteration
	 * will use the updated speed value.
	 *
	 * Common values:
	 * - 0.25 = quarter speed (slow motion)
	 * - 1.0 = real-time
	 * - 2.5 = 2.5x speed
	 * - 10.0 = 10x speed
	 * - 100.0 = near-instant (still yields for UI responsiveness)
	 *
	 * For maximum speed without any yields, use {@link HeadlessScheduler} instead.
	 *
	 * @param {number} multiplier - Must be a finite positive number
	 * @throws {Error} If multiplier is not finite, zero, or negative
	 *
	 * @example
	 * realTime.speed = 1.0   // Normal speed
	 * realTime.speed = 2.5   // 2.5x speed
	 * realTime.speed = 0.5   // Half speed (slow motion)
	 * realTime.speed = 100   // Very fast (but still yields)
	 */
	set speed(multiplier: number) {
		this.#speed = this.#sanitizeSpeed(multiplier)
	}

	/**
	 * Last error thrown during execution, if any.
	 *
	 * Cleared when a new run starts.
	 */
	get lastError(): unknown | null {
		return this.#lastError
	}

	/**
	 * Validate and sanitize a speed multiplier value.
	 *
	 * Rejects:
	 * - NaN (not a number)
	 * - Infinity / -Infinity
	 * - Zero (would freeze simulation)
	 * - Negative values (time doesn't go backwards)
	 *
	 * @param {number} value - Speed multiplier to validate
	 * @returns {number} The validated value (unchanged if valid)
	 * @throws {Error} If value is invalid
	 * @private
	 */
	#sanitizeSpeed(value: number): number {
		if (!Number.isFinite(value) || value <= 0) {
			throw new Error('Speed multiplier must be a positive finite number')
		}
		return value
	}

	/**
	 * Main run loop that drives the scheduler using wall-clock time.
	 *
	 * This is the heart of the real-time scheduler. It:
	 * 1. Measures elapsed wall-clock time since last iteration
	 * 2. Scales elapsed time by current speed multiplier
	 * 3. Converts scaled time to integer ticks (with fractional carry)
	 * 4. Calls EventScheduler.advance(ticks) to process events
	 * 5. Yields control using adaptive backoff strategy
	 *
	 * ## Local Variables
	 *
	 * All state is scoped locally to this function:
	 * - `lastTimestamp`: Last wall-clock reading (from performance.now())
	 * - `fractionalCarry`: Sub-millisecond remainder from previous iteration
	 * - `idleCount`: Number of consecutive iterations with no ticks to process
	 *
	 * This ensures clean state when the loop restarts after stop/run cycles.
	 *
	 * ## Fractional Carry Example
	 *
	 * At 60fps (16.7ms per frame) with 1x speed:
	 * - Iteration 1: elapsed=16.7ms → ticks=16, carry=0.7ms
	 * - Iteration 2: elapsed=16.7ms + carry=0.7ms = 17.4ms → ticks=17, carry=0.4ms
	 * - Iteration 3: elapsed=16.7ms + carry=0.4ms = 17.1ms → ticks=17, carry=0.1ms
	 * - Over time: averages to exactly 60 ticks/second with no drift
	 *
	 * ## Backoff Strategy
	 *
	 * **When processing** (ticks > 0):
	 * - Calls `advance(ticks)` to process events
	 * - Resets idle counter to 0
	 * - Yields with `Promise.resolve()` for low-latency responsiveness
	 *
	 * **When idle** (ticks === 0):
	 * - First 50 iterations: `Promise.resolve()` for fast response to new events
	 * - After 50 iterations: `wait(1)` (~4ms actual) to reduce CPU usage
	 *
	 * This ensures:
	 * - Maximum throughput at high speeds (100x) when behind schedule
	 * - Low latency when events are scheduled dynamically
	 * - Power efficiency when caught up or truly idle
	 *
	 * ## Loop Termination
	 *
	 * The loop runs while `this.#runLoopPromise !== null`. When {@link stop}
	 * is called, it sets `#runLoopPromise = null`, causing the loop to exit
	 * on the next iteration check.
	 *
	 * @returns {Promise<void>} Resolves when the loop exits (after stop() is called)
	 * @private
	 */
	async #run(): Promise<void> {
		console.log('RealTimeScheduler loop started')
		// Reset error state and notify start
		this.#lastError = null
		if (this.onStart) this.onStart()

		let lastTimestamp = performance.now()
		let fractionalCarry = 0
		let idleCount = 0

		try {
			console.log('RealTimeScheduler entering main loop')
			console.log('this.#running:', this.#running)
			while (this.#running) {
				const now = performance.now()
				const elapsed = Math.max(0, now - lastTimestamp)
				lastTimestamp = now

				const scaledTicks = elapsed * this.#speed + fractionalCarry
				const ticksToProcess = Math.floor(scaledTicks)
				fractionalCarry = scaledTicks - ticksToProcess

				if (ticksToProcess > 0) {
					const hasMore = await this.#scheduler.advance(ticksToProcess)
					// Notify when queue drains, but DON'T auto-stop
					// Events are scheduled dynamically during gameplay
					if (!hasMore && this.onDrain) {
						try { this.onDrain() } catch { /* ignore errors thrown by onDrain */ }
					}
					idleCount = 0
				} else {
					// Backoff strategy when idle: wait(0) first, then wait(4)
					if (idleCount === 0 && this.onIdle) {
						try { this.onIdle() } catch { /* ignore errors thrown by onIdle */ }
					}
					if (idleCount < 50) {
						idleCount++
						await wait(0)			// Low-latency when initially idle
					} else {
						await wait(4)			// Power-efficient when truly idle
					}
				}
			}
		} catch (err) {
			console.error('RealTimeScheduler encountered an error:', err)
			this.#lastError = err
			if (this.onError) {
				try { this.onError(err) } catch { /* ignore errors thrown by onError */ }
			}
		} finally {
			console.log('RealTimeScheduler loop exited')
			// Clean up state on exit and notify stop
			this.#running = false
			this.#runLoopPromise = null
			if (this.onStop) {
				try { this.onStop() } catch { /* ignore errors thrown by onStop */ }
			}
		}
	}
}
