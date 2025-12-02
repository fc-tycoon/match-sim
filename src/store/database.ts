/**
 * FC Tycoon™ 2027 Match Simulator - Database Store
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import formations from '../exports/formations.json'
import positions from '../exports/positions.json'
import positionRoles from '../exports/position_roles.json'
import positionSlots from '../exports/position_slots.json'
import positionSlotRoles from '../exports/position_slot_roles.json'

export interface Formation {
	id: number
	family: number
	name: string
	sort_order: number
	position_slots: {
		items: number[]
	}
}

export interface PositionSlot {
	id: number
	position_id: number
	code: string
	name: string
	channel: number
	position_x: number
	position_y: number
}

export const Database = {
	formations: formations as Formation[],
	positions,
	positionRoles,
	positionSlots: positionSlots as PositionSlot[],
	positionSlotRoles,

	getFormation(id: number) {
		return this.formations.find(f => f.id === id)
	},

	getSlot(id: number) {
		return this.positionSlots.find(s => s.id === id)
	},

	getFormationFamilyName(familyId: number): string {
		const s = familyId.toString()
		// 4231 -> 4-2-3-1
		// 442 -> 4-4-2
		// 433 -> 4-3-3
		// 352 -> 3-5-2
		// 532 -> 5-3-2
		// 343 -> 3-4-3
		// 41212 -> 4-1-2-1-2 ?
		// Let's assume single digits for now.
		return s.split('').join('-')
	},

	getFormationSlots(formationId: number): PositionSlot[] {
		const formation = this.getFormation(formationId)
		if (!formation) return []
		return formation.position_slots.items.map(id => this.getSlot(id)).filter((s): s is PositionSlot => !!s)
	},
}
