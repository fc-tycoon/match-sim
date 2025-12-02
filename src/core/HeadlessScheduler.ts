/**
 * FC Tycoon™ 2027 Match Simulator - Headless Event Scheduler
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

/**
 * Headless scheduler wrapper for {@link EventScheduler}.
 *
 * Provides an instant-results execution mode that advances the underlying
 * scheduler as fast as possible without involving timers, animation frames, or
 * pause hooks. Once execution begins, the wrapper drains the queue to the end
 * using {@link EventScheduler.runUntilEnd}, producing results for
 * "Instant Result" flows.
 *
 * @example
 * const headless = new HeadlessScheduler(existingScheduler)
 * await headless.run()
 */
import { EventScheduler } from './EventScheduler'

export class HeadlessScheduler {
	#scheduler: EventScheduler
	#running: boolean = false

	/**
	 * Create a new headless runner.
	 *
	 * @param {EventScheduler} [scheduler] Optional scheduler to control.
	 * When omitted, a fresh {@link EventScheduler} instance is created.
	 */
	constructor(scheduler?: EventScheduler) {
		this.#scheduler = scheduler ?? new EventScheduler()

		// ═══════════════════════════════════════════════════════════
		//                  S E A L   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.seal(this)
	}

	/**
	 * Scheduler controlled by this headless runner.
	 *
	 * @returns {EventScheduler}
	 */
	get scheduler(): EventScheduler {
		return this.#scheduler
	}

	/**
	 * Whether a headless run is currently in progress.
	 *
	 * @returns {boolean}
	 */
	get running(): boolean {
		return this.#running
	}

	/**
	 * Drain the underlying scheduler until all events have executed.
	 *
	 * Throws if a previous headless run is still in progress, mirroring the
	 * {@link EventScheduler.runUntilEnd} guard against concurrent execution.
	 *
	 * @returns {Promise<void>} Resolves when the scheduler queue is empty
	 * @throws {Error} When called re-entrantly while still running
	 */
	async run(): Promise<void> {
		if (this.#running) {
			throw new Error('HeadlessScheduler is already running')
		}

		this.#running = true
		try {
			await this.#scheduler.runUntilEnd()
		} finally {
			this.#running = false
		}
	}
}
