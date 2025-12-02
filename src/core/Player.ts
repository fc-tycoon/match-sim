/**
 * FC Tycoon™ 2027 Match Simulator - Player Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { Team } from '@/core/Team'
import { PlayerSkills, DEFAULT_SKILLS } from '@/core/PlayerSkills'
import { PlayerContext } from '@/core/ai/PlayerContext'
import { PlayerBody } from '@/core/ai/PlayerBody'
import { PositionSlot } from './PositionSlot'

export class Player {
	readonly id: number
	readonly name: string
	readonly team: Team
	readonly shirtNumber: number
	readonly height: number
	readonly rightFoot: number
	readonly leftFoot: number
	readonly skills: PlayerSkills

	yellowCards: number = 0
	redCarded: boolean = false
	foulsCommitted: number = 0
	goalsScored: number = 0
	assists: number = 0
	minutesPlayed: number = 0

	// ═══════════════════════════════════════════════════════════
	//                 P H Y S I C A L   S T A T E
	// ═══════════════════════════════════════════════════════════
	// In world space

	// The physical body of the player. Only exists when on the field.
	body: PlayerBody | null = null

	// Condition & Fitness
	fatigue: number = 0.0			// 0.0 (fresh) to 1.0 (exhausted)
	fitness: number = 1.0			// Training fitness (0.0-1.0) - long-term condition
	matchFitness: number = 1.0		// Match-specific fitness (0.0-1.0)
	matchSharpness: number = 1.0	// Match sharpness (0.0-1.0) - recent play time

	// ═══════════════════════════════════════════════════════════
	//                 M E N T A L   S T A T E
	// ═══════════════════════════════════════════════════════════

	morale: number = 0.5		// 0.0 (low) to 1.0 (high)
	motivation: number = 0.5	// 0.0 (low) to 1.0 (high)
	experience: number = 0.0	// 0.0 (rookie) to 1.0 (veteran)
	confidence: number = 0.5	// 0.0 (low) to 1.0 (high)

	// ═══════════════════════════════════════════════════════════
	//              P L A Y E R   B R A I N   ( A I )
	// ═══════════════════════════════════════════════════════════
	// Per-player brain state for on-field AI

	context: PlayerContext | null = null

	constructor(config: {
		id: number,
		name: string,
		team: Team,
		shirt_number?: number,
		height?: number,
		right_foot?: number,
		left_foot?: number,
		skills?: PlayerSkills,
	}) {
		const {
			id,
			name,
			team,
			shirt_number = 0,
			height = 1.75,			// Average height in meters
			right_foot = 1.0,		// 1.0 = 100% right-footed
			left_foot = 0.5,		// 0.5 = 50% left-footed
			skills = DEFAULT_SKILLS,
		} = config

		this.id = id
		this.name = name
		this.team = team
		this.shirtNumber = shirt_number
		this.height = height
		this.rightFoot = right_foot
		this.leftFoot = left_foot
		this.skills = skills

		// ═══════════════════════════════════════════════════════════
		//                F R E E Z E   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.freeze(this.skills) // "deep freeze" skills, because it's just a regular object, not a class

		// ═══════════════════════════════════════════════════════════
		//                  S E A L   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.seal(this)
	}

	get slot(): PositionSlot | null {
		// Loop through the team's formation slots to find this player's slot
		const { slotPlayers } = this.team.tactics.formation
		for (const slotPlayer of slotPlayers) {
			if (slotPlayer.player.id === this.id) {
				return slotPlayer.slot
			}
		}
		return null
	}
}
