/**
 * FC Tycoon™ 2027 Match Simulator - Team State Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'

/**
 * Defending Side Enum.
 * Indicates which side of the pitch the team is defending.
 *
 * World 2D Coordinate System (see COORDINATES.md):
 * - X axis: Goal-to-goal (+X = Away goal, -X = Home goal)
 * - Y axis: Touchline-to-touchline
 *
 * LEFT (-1) = Defending -X side (Home team default)
 *   - attackDir = { x: 1, y: 0 } (attacking toward +X / Away goal)
 *
 * RIGHT (1) = Defending +X side (Away team default)
 *   - attackDir = { x: -1, y: 0 } (attacking toward -X / Home goal)
 */
export const enum DefendingSide {
	LEFT = -1,
	UNKNOWN = 0,
	RIGHT = 1,
}

/**
 * Team State Class.
 *
 * Tracks dynamic state of a team during a match.
 * Includes score, possession, and defending direction.
 */
export class TeamState {

	/** @type {boolean} Whether the team currently has possession of the ball */
	inPosession: boolean = false

	/** @type {number} Number of goals scored */
	goals: number = 0

	/** @type {number} Goal difference (goals scored - goals conceded) */
	goalDiff: number = 0

	/** @type {number} Goal difference alias (TODO: Unify with goalDiff) */
	goalDifference: number = 0

	/** @type {number} Possession percentage (0-100) */
	possessionPercentage: number = 0

	/** @type {number} Number of shots on target */
	shotsOnTarget: number = 0

	/** @type {number} Number of shots conceded on target */
	opponentShotsOnTarget: number = 0

	/** @type {DefendingSide} Which side the team is defending */
	attackDir: THREE.Vector2 = new THREE.Vector2()

	/** @type {DefendingSide} Which side the team is defending */
	defendingSide: DefendingSide = DefendingSide.UNKNOWN

	constructor() {

		// ═══════════════════════════════════════════════════════════
		//                  S E A L   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.seal(this)
	}
}
