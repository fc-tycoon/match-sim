/**
 * FC Tycoon™ 2027 Match Simulator - Formation
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { PositionSlot } from '@/core/PositionSlot'

export class Formation {
	readonly id: number
	readonly family: string // We convert a number such as 4231 into a string "4-2-3-1"
	readonly name: string
	readonly slots: PositionSlot[]

	constructor(id: number, family: number, name: string, slots: PositionSlot[]) {
		this.id = id
		this.family = family.toString().split('').join('-')
		this.name = name
		this.slots = slots

		// ═══════════════════════════════════════════════════════════
		//                F R E E Z E   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.freeze(this)
	}
}
