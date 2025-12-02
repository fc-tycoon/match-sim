/**
 * FC Tycoon™ 2027 Match Simulator - Match Store
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { reactive, App, markRaw } from 'vue'
import { MatchEngine } from '@/core/MatchEngine'
import { MatchGenerator } from '@/core/MatchGenerator'
import { RealTimeScheduler } from '@/core/RealTimeScheduler'
import { EventType } from '@/core/EventScheduler'
import { Player } from '@/core/Player'
import { Ball } from '@/core/Ball'
import { Field } from '@/core/Field'
import { Team } from '@/core/Team'

/**
 * Match Store Class
 *
 * This store holds the currently "visualized" real-time match.
 * Headless matches do NOT use this store - they run independently.
 *
 * Tick represents simulation milliseconds (1 tick = 1ms).
 */
class MatchStore {
	/** @type {MatchEngine | null} The active match engine (markRaw to prevent deep reactivity) */
	engine: MatchEngine | null = null

	/** @type {boolean} Is the match currently running? */
	running = false

	/** @type {number} Current simulation tick (milliseconds) */
	tick = 0

	// ═══════════════════════════════════════════════════════════
	//                  C O M P U T E D   A C C E S S O R S
	// ═══════════════════════════════════════════════════════════

	/**
	 * Get home team name.
	 */
	get homeTeam(): string {
		return this.engine?.match.teams[0].name ?? 'Home'
	}

	/**
	 * Get away team name.
	 */
	get awayTeam(): string {
		return this.engine?.match.teams[1].name ?? 'Away'
	}

	/**
	 * Get home team score.
	 */
	get homeScore(): number {
		return this.engine?.match.teams[0].state.goals ?? 0
	}

	/**
	 * Get away team score.
	 */
	get awayScore(): number {
		return this.engine?.match.teams[1].state.goals ?? 0
	}

	/**
	 * Get all players from the match.
	 */
	get players(): Player[] {
		return this.engine?.match.players ?? []
	}

	/**
	 * Get the teams from the match.
	 */
	get teams(): Team[] {
		return this.engine?.match.teams ?? []
	}

	/**
	 * Get the ball from the match.
	 */
	get ball(): Ball | null {
		return this.engine?.match.ball ?? null
	}

	/**
	 * Get the field from the match.
	 */
	get field(): Field | null {
		return this.engine?.match.field ?? null
	}

	// ═══════════════════════════════════════════════════════════
	//                        M E T H O D S
	// ═══════════════════════════════════════════════════════════

	/**
	 * Set the active match engine.
	 * Use markRaw to prevent Vue from making the engine deeply reactive.
	 *
	 * @param {MatchEngine} engine - The match engine to set
	 */
	setEngine(engine: MatchEngine): void {
		this.engine = markRaw(engine)
		this.running = false
		this.tick = 0
	}

	/**
	 * Clear the active match engine.
	 */
	clearEngine(): void {
		if (this.engine?.realtime) {
			this.engine.realtime.stop()
		}
		this.engine = null
		this.running = false
		this.tick = 0
	}

	/**
	 * Create a new real-time match with the given seed.
	 * Creates the RealTimeScheduler, Match, and MatchEngine.
	 *
	 * @param {number} seed - The random seed for deterministic simulation
	 */
	create(seed: number): void {
		// Clear any existing match
		this.clearEngine()

		// Create RealTimeScheduler
		const realtime = new RealTimeScheduler()

		// Generate the full match (creates Match + Engine, sets engine in store)
		MatchGenerator.generateFullMatch(realtime, seed)
	}

	/**
	 * Start the real-time match.
	 */
	start(): void {
		if (!this.engine?.realtime) {
			console.warn('Cannot start: No real-time scheduler available')
			return
		}
		this.running = true
		this.engine.realtime.run()
	}

	/**
	 * Stop the real-time match.
	 */
	stop(): void {
		if (this.engine?.realtime) {
			this.engine.realtime.stop()
		}
		this.running = false
	}

	/**
	 * Reset the match state.
	 */
	reset(): void {
		this.stop()
		this.clearEngine()
	}

	/**
	 * Schedule a debug event on the underlying EventScheduler.
	 * Used for testing tick events.
	 *
	 * @param {number} tick - The tick offset to schedule at
	 * @param {Function} callback - The callback to execute
	 */
	scheduleDebugEvent(tick: number, callback: (e: { tick: number }) => void): void {
		if (!this.engine?.realtime) {
			console.warn('Cannot schedule: No real-time scheduler available')
			return
		}
		this.engine.realtime.scheduler.schedule(tick, EventType.DEBUG, callback)
	}
}

/** Reactive match store instance */
export const match = reactive(new MatchStore())

export default {
	install(app: App) {
		app.config.globalProperties.$match = match
	},
}
