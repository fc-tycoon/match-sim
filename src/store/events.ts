/**
 * FC Tycoon™ 2027 Match Simulator - Events Store
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { reactive, App } from 'vue'

export interface LogEvent {
	id: number
	tick: number
	message: string
	type?: string
}

export const events = reactive({
	items: [] as LogEvent[],

	log(message: string, tick: number = 0, type: string = 'info') {
		this.items.push({
			id: Date.now() + Math.random(),
			tick,
			message,
			type,
		})

		// Keep log size manageable
		if (this.items.length > 200) {
			this.items.shift()
		}
	},

	clear() {
		this.items = []
	},
})

export default {
	install(app: App) {
		app.config.globalProperties.$events = events
	},
}
