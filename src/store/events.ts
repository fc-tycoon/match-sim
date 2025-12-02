/**
 * FC Tycoon™ 2027 Match Simulator - Events Store
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { reactive, App } from 'vue'
import { match } from './match'

/**
 * Log event severity levels.
 */
export type LogLevel = 'debug' | 'log' | 'info' | 'warning' | 'error'

/**
 * Log event interface.
 */
export interface LogEvent {
	id: number
	tick: number
	message: string
	level: LogLevel
}

let seq: number = 0

/**
 * Events Store
 *
 * Centralized logging for match events. Automatically captures the current
 * tick from the match scheduler.
 */
export const events = reactive({
	items: [] as LogEvent[],

	/**
	 * Internal logging method. All public methods delegate to this.
	 *
	 * @param {string} message - The log message
	 * @param {LogLevel} level - The log level
	 */
	log(message: string, level: LogLevel = 'log') {
		// Get current tick from match scheduler
		const tick = match.engine?.realtime?.scheduler.currentTick ?? match.tick

		this.items.push({
			id: seq++,
			tick,
			message,
			level,
		})

		// Keep log size manageable
		if (this.items.length > 200) {
			this.items.shift()
		}
	},

	/**
	 * Log a debug message.
	 *
	 * @param {string} message - The debug message
	 */
	debug(message: string) {
		this.log(message, 'debug')
	},

	/**
	 * Log an info message.
	 *
	 * @param {string} message - The info message
	 */
	info(message: string) {
		this.log(message, 'info')
	},

	/**
	 * Log a warning message.
	 *
	 * @param {string} message - The warning message
	 */
	warning(message: string) {
		this.log(message, 'warning')
	},

	/**
	 * Log an error message.
	 *
	 * @param {string} message - The error message
	 */
	error(message: string) {
		this.log(message, 'error')
	},

	/**
	 * Clear all log events.
	 */
	clear() {
		this.items = []
	},
})

export default {
	install(app: App) {
		app.config.globalProperties.$events = events
	},
}
