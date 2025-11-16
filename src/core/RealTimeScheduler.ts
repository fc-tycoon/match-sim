/**
 * FC Tycoon™ 2027 Match Simulator - Real-Time Event Scheduler
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { EventScheduler } from './EventScheduler'

const wait = (delay: number): Promise<void> => new Promise((resolve) => {
	setTimeout(resolve, delay)
})

export interface RealTimeSchedulerOptions {
	frameDelay?: number
	speed?: number
}

/**
 * Real-time scheduler wrapper for {@link EventScheduler}.
 *
 * Drives the underlying scheduler with wall-clock pacing, supporting speed
 * multipliers, pause/resume semantics, and automatic catch-up when timers fall
 * behind. The wrapper never schedules events directly—it only calls
 * {@link EventScheduler.runUntil} with the desired target tick.
 */
export class RealTimeScheduler {
	#scheduler: EventScheduler
	#running: boolean = false
	#paused: boolean = false
	#speed: number
	#frameDelay: number
	#loopPromise: Promise<void> | null = null
	#lastTimestamp: number = 0
	#fractionalCarry: number = 0
	#pausePromise: Promise<void> | null = null
	#pauseResolver: (() => void) | null = null

	constructor(scheduler?: EventScheduler, options?: RealTimeSchedulerOptions) {
		this.#scheduler = scheduler ?? new EventScheduler()
		this.#frameDelay = Math.max(1, Math.floor(options?.frameDelay ?? 4))
		this.#speed = this.#sanitizeSpeed(options?.speed ?? 1)
	}

	/**
	 * Scheduler managed by this wrapper.
	 */
	get scheduler(): EventScheduler {
		return this.#scheduler
	}

	/**
	 * Current playback speed multiplier.
	 */
	get speed(): number {
		return this.#speed
	}

	/**
	 * Whether the wrapper is currently running.
	 */
	get running(): boolean {
		return this.#running
	}

	/**
	 * Whether execution is paused (run loop idle, but not stopped).
	 */
	get paused(): boolean {
		return this.#paused
	}

	/**
	 * Start the real-time run loop.
	 *
	 * @throws {Error} If already running
	 */
	start(): void {
		if (this.#running) {
			throw new Error('RealTimeScheduler is already running')
		}

		this.#running = true
		this.#paused = false
		this.#fractionalCarry = 0
		this.#lastTimestamp = this.#now()
		this.#loopPromise = this.#loop()
	}

	/**
	 * Pause execution after the in-flight tick completes.
	 *
	 * @returns {Promise<void>} Resolves when the scheduler has reached a safe boundary
	 * @throws {Error} If not currently running
	 */
	async pause(): Promise<void> {
		if (!this.#running) {
			throw new Error('RealTimeScheduler is not running')
		}
		if (this.#paused) {
			return this.#pausePromise ?? Promise.resolve()
		}

		this.#paused = true
		if (!this.#pausePromise) {
			this.#pausePromise = new Promise((resolve) => {
				this.#pauseResolver = resolve
			})
		}

		return this.#pausePromise
	}

	/**
	 * Resume execution after a pause.
	 */
	resume(): void {
		if (!this.#running) {
			throw new Error('RealTimeScheduler is not running')
		}
		if (!this.#paused) return

		this.#paused = false
		this.#fractionalCarry = 0
		this.#lastTimestamp = this.#now()
	}

	/**
	 * Stop the loop entirely and wait for the worker task to finish.
	 */
	async stop(): Promise<void> {
		if (!this.#running) return

		this.#running = false
		this.#paused = false
		this.#resolvePauseWaiters()
		await this.#loopPromise
		this.#loopPromise = null
		this.#pausePromise = null
		this.#pauseResolver = null
	}

	/**
	 * Update the playback speed multiplier.
	 *
	 * @param {number} multiplier Finite positive value (0.1x – 100x typical)
	 */
	setSpeed(multiplier: number): void {
		this.#speed = this.#sanitizeSpeed(multiplier)
	}

	#sanitizeSpeed(value: number): number {
		if (!Number.isFinite(value) || value <= 0) {
			throw new Error('Speed multiplier must be a positive finite number')
		}
		return value
	}

	async #loop(): Promise<void> {
		while (this.#running) {
			if (this.#paused) {
				this.#resolvePauseWaiters()
				await wait(this.#frameDelay)
				this.#lastTimestamp = this.#now()
				continue
			}

			const now = this.#now()
			const elapsed = Math.max(0, now - this.#lastTimestamp)
			this.#lastTimestamp = now

			const scaled = elapsed * this.#speed + this.#fractionalCarry
			const ticksToProcess = Math.floor(scaled)
			this.#fractionalCarry = scaled - ticksToProcess

			if (ticksToProcess > 0) {
				const targetTick = this.#scheduler.tick + ticksToProcess
				await this.#scheduler.runUntil(targetTick)
				if (this.#paused) {
					this.#resolvePauseWaiters()
				}
			}

			await wait(this.#frameDelay)
		}
	}

	#resolvePauseWaiters(): void {
		if (this.#pauseResolver) {
			this.#pauseResolver()
			this.#pauseResolver = null
			this.#pausePromise = null
		}
	}

	#now(): number {
		if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
			return performance.now()
		}
		return Date.now()
	}
}
