/**
 * FC Tycoon™ 2027 Match Simulator - Team Tactics Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import { TeamFormation } from '@/core/TeamFormation'
import { FormationAABB } from '@/core/FormationAABB'
import { DefendingSide } from '@/core/TeamState'

/**
 * Team Tactics Class.
 *
 * Manages team formation, tactical instructions (tempo, width, depth),
 * and spatial calculations (FormationAABB).
 *
 * COORDINATE SYSTEM (see COORDINATES.md):
 * - World X: Goal-to-goal (-52.5m to +52.5m)
 * - World Y: Touchline-to-touchline (-34m to +34m)
 */
export class TeamTactics {
	/** @type {TeamFormation} Current formation and player roles */
	formation: TeamFormation

	/** @type {number} Timestamp of last AABB update */
	aabbLastUpdated: number = 0

	/**
	 * Formation AABB - the bounding box where the team's formation lives.
	 *
	 * This replaces the old THREE.Box2 teamAABB with a more sophisticated
	 * system that properly handles:
	 * - Position (center point in world coordinates)
	 * - Dimensions (halfWidth, halfDepth based on tactical settings)
	 * - Orientation (facing direction for slot-to-world transforms)
	 *
	 * The AABB moves dynamically during the match as the team pushes up
	 * or drops back based on ball position and tactical instructions.
	 */
	formationAABB: FormationAABB

	/**
	 * @deprecated Use formationAABB instead. Kept for backward compatibility.
	 * Returns a THREE.Box2 approximation of the formationAABB.
	 */
	get teamAABB(): THREE.Box2 {
		const corners = this.formationAABB.getCorners()
		const box = new THREE.Box2()
		corners.forEach(c => box.expandByPoint(c))
		return box
	}

	/** @type {number} Play tempo (0.2=slow to 1.0=fast) */
	tempo: number = 0.5

	/** @type {number} Tactical width (0.2=narrow to 1.0=wide) */
	width: number = 0.5

	/** @type {number} Defensive line depth (0.2=deep to 1.0=high) */
	depth: number = 0.5

	/**
	 * Create a new TeamTactics instance.
	 *
	 * @param formation - Initial formation
	 * @param defendingSide - Which side the team is defending (default: LEFT)
	 * @param fieldHalfLength - Half field length in meters (default: 52.5)
	 */
	constructor(
		formation: TeamFormation,
		defendingSide: DefendingSide = DefendingSide.LEFT,
		fieldHalfLength: number = 52.5,
	) {
		this.formation = formation

		// Create FormationAABB with proper orientation
		this.formationAABB = new FormationAABB(defendingSide, fieldHalfLength)

		// ═══════════════════════════════════════════════════════════
		//                  S E A L   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.seal(this)
	}

	/**
	 * Update tactical width and sync to FormationAABB.
	 * Adjusts left and right edges symmetrically.
	 *
	 * @param value - Width value (0.0 = narrow, 1.0 = wide)
	 */
	setWidth(value: number): void {
		this.width = Math.max(0, Math.min(1, value))
		// Map 0-1 to edge span (e.g., 18-32m from center)
		const minSpan = 18
		const maxSpan = 32
		const span = minSpan + this.width * (maxSpan - minSpan)
		this.formationAABB.setLeftEdge(-span)
		this.formationAABB.setRightEdge(+span)
	}

	/**
	 * Update tactical depth and sync to FormationAABB.
	 * Adjusts the back edge (defensive line) position.
	 *
	 * @param value - Depth value (0.0 = deep, 1.0 = high pressing)
	 */
	setDepth(value: number): void {
		this.depth = Math.max(0, Math.min(1, value))
		// For now, just store the value - actual edge adjustment
		// depends on game state (ball position, etc.)
		// Future: adjust backEdge based on depth setting
	}
}
