/**
 * FC Tycoon™ 2027 Match Simulator - Team Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { TeamTactics } from '@/core/TeamTactics'
import { TeamState } from '@/core/TeamState'
import type { Player } from '@/core/Player'

/**
 * Team Intensity Level.
 *
 * Influences AI behavior, risk-taking, and tactical adjustments.
 * This is NOT a tactical setting, but an overall team mindset.
 */
export const enum TeamIntensity {
	LOW,
	NORMAL,
	HIGH,		// e.g. derby match, cup final etc
	EXTREME,	// e.g. world cup final, ultra competitive scenarios
}

/**
 * Venue Type.
 *
 * Represents the team's status relative to the match location.
 * Used for home advantage calculations and crowd support.
 */
export const enum Venue {
	HOME = 1.0,
	NEUTRAL = 0.0,
	AWAY = -1.0,
}

/**
 * Team Class.
 *
 * Represents a football team in the match simulation.
 * Contains static data (id, name, players) and dynamic state (tactics, state).
 */
export class Team {
	// ═══════════════════════════════════════════════════════════════════════════
	//                    D E F A U L T   C O L O R S
	// ═══════════════════════════════════════════════════════════════════════════

	/** Default home team color (red) */
	static readonly COLOR_HOME = 0xef4444

	/** Default away team color (blue) */
	static readonly COLOR_AWAY = 0x3b82f6

	// ═══════════════════════════════════════════════════════════════════════════
	//                    I N S T A N C E   P R O P E R T I E S
	// ═══════════════════════════════════════════════════════════════════════════

	/** @type {number} Unique team identifier */
	readonly id: number

	/** @type {Venue} Venue status (Home/Away/Neutral) */
	readonly venue: Venue

	/** @type {string} Team name */
	readonly name: string

	/** @type {number} Team primary color (hex) */
	readonly color: number

	/** @type {Player[]} List of all players in the squad (including subs) */
	readonly players: Player[]

	/** @type {TeamTactics} Current team tactics and formation */
	readonly tactics: TeamTactics

	/** @type {TeamIntensity} Current team intensity/mindset */
	readonly intensity: TeamIntensity

	/** @type {TeamState} Dynamic team state (score, possession, etc.) */
	readonly state: TeamState = new TeamState()

	/**
	 * Create a new Team instance.
	 *
	 * @param {number} id - Unique team identifier
	 * @param {Venue} venue - Venue status
	 * @param {string} name - Team name
	 * @param {number} color - Team color (hex)
	 * @param {Player[]} players - List of players
	 * @param {TeamTactics} tactics - Initial tactics
	 * @param {TeamIntensity} [intensity=TeamIntensity.NORMAL] - Initial intensity
	 */
	constructor(
		id: number,
		venue: Venue,
		name: string,
		color: number,
		players: Player[],
		tactics: TeamTactics,
		intensity: TeamIntensity = TeamIntensity.NORMAL,
	) {
		this.id = id
		this.venue = venue
		this.name = name
		this.color = color
		this.players = players
		this.tactics = tactics
		this.intensity = intensity

		// ═══════════════════════════════════════════════════════════
		//                F R E E Z E   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		// Players cannot be added/removed during a match
		Object.freeze(this.players)
		Object.freeze(this)
	}
}
