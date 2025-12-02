/**
 * FC Tycoon™ 2027 Match Simulator - Team Formation Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { PositionSlot } from './PositionSlot'
import { PositionRole } from './PositionRole'
import { Formation } from './Formation'
import { Player } from './Player'

/**
 * SlotPlayer Interface.
 *
 * Maps a player to a specific tactical slot and role within a formation.
 */
export interface SlotPlayer {
	/** @type {PositionSlot} The tactical slot (e.g., GK, LB, CD-L, CD-R, CM-L, CM-R, ST) */
	slot: PositionSlot

	/** @type {PositionRole} The specific role instructions (e.g., Sweeper Keeper, False 9) */
	role: PositionRole

	/** @type {Player} The player assigned to this slot */
	player: Player
}

/**
 * Team Formation Class.
 *
 * Manages the structural arrangement of players on the pitch.
 * Links the abstract Formation definition with actual Players via SlotPlayers.
 */
export class TeamFormation {
	/** @type {Formation} The base formation template (e.g., 4-4-2) */
	formation: Formation

	/** @type {SlotPlayer[]} List of active players assigned to slots */
	slotPlayers: SlotPlayer[]

	/**
	 * Create a new TeamFormation instance.
	 * @param {Formation} formation - Base formation template
	 * @param {SlotPlayer[]} slotPlayers - Player assignments
	 */
	constructor(formation: Formation, slotPlayers: SlotPlayer[]) {
		this.formation = formation
		this.slotPlayers = slotPlayers

		// ═══════════════════════════════════════════════════════════
		//                F R E E Z E   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.freeze(this)
	}
}
