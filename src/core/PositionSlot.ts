/**
 * FC Tycoon™ 2027 Match Simulator - Position Slot Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import { Channel } from '@/core/Channels.js'
import { Team } from '@/core/Team.js'

/**
 * Position Slot Definition
 *
 * Used to define player positions on the field in formations and tactics.
 * Slots are used primarily for tactical positioning by the AI.
 * These slots are relative positions within the team's FormationAABB.
 *
 * SLOT COORDINATE SYSTEM:
 * =======================
 * Slot coordinates are normalized -1 to +1 values representing relative position
 * within the team's FormationAABB (bounding box):
 *
 * - slot_x: Left (-1) to Right (+1) in player's perspective
 *   - LB/LW = -1 (left side)
 *   - RB/RW = +1 (right side)
 *   - CB/CM/ST = 0 (center)
 *
 * - slot_y: Back (-1) to Front (+1) within the formation
 *   - GK = -1 (behind AABB, in goal)
 *   - CB = -0.8 (defensive line)
 *   - CM = 0 (midfield)
 *   - ST = +1 (attacking line)
 *
 * WORLD COORDINATE SYSTEM (see COORDINATES.md):
 * =============================================
 * - World X: Goal-to-goal (-52.5m to +52.5m), Home attacks +X, Away attacks -X
 * - World Y: Touchline-to-touchline (-34m to +34m), +Y = top touchline
 *
 * THREE.JS COORDINATE SYSTEM:
 * ===========================
 * - Three.js X = World X (goal-to-goal)
 * - Three.js Y = Height (vertical axis)
 * - Three.js Z = World Y (touchline-to-touchline)
 */
export class PositionSlot {
	readonly id: number
	readonly position_id: number
	readonly code: string // e.g., "CF-C"
	readonly name: string // e.g., "Centre Forward (Center)"
	readonly channel: Channel

	/** Slot X: Left (-1) to Right (+1) in player's perspective */
	readonly slot_x: number

	/** Slot Y: Back (-1) to Front (+1) within the formation */
	readonly slot_y: number

	constructor(
		id: number,
		position_id: number,
		code: string,
		name: string,
		channel: Channel,
		position_x: number,
		position_y: number,
	) {
		this.id = id
		this.position_id = position_id
		this.code = code
		this.name = name
		this.channel = channel

		// Store slot coordinates with clear naming
		this.slot_x = position_x // From DB: left (-1) to right (+1)
		this.slot_y = position_y // From DB: back (-1) to front (+1)

		// ═══════════════════════════════════════════════════════════
		//                F R E E Z E   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.freeze(this)
	}

	/**
	 * Convert slot position (-1.0 to 1.0) to world 2D position.
	 *
	 * Uses the team's FormationAABB to transform slot coordinates
	 * to world coordinates. The AABB handles:
	 * - Position (center of formation in world space)
	 * - Dimensions (width/depth based on tactical settings)
	 * - Orientation (facing direction for proper coordinate mapping)
	 *
	 * @param team - The team this slot belongs to
	 * @returns World 2D position (x = goal-to-goal, y = touchline)
	 */
	toWorld2D(team: Team): THREE.Vector2 {
		return team.tactics.formationAABB.slotToWorld(this.slot_x, this.slot_y)
	}

	/**
	 * Convert slot position to Three.js world position.
	 *
	 * @param team - The team this slot belongs to
	 * @returns Three.js Vector3 position (X=goal-to-goal, Y=height, Z=touchline)
	 */
	toWorldPosition(team: Team): THREE.Vector3 {
		const world2D = this.toWorld2D(team)
		// Return as Three.js coordinates: X=World X (goal-to-goal), Y=height, Z=World Y (touchline)
		return new THREE.Vector3(world2D.x, 0, world2D.y)
	}

	// Legacy property accessors for backward compatibility
	// TODO: Remove these once all code is updated to use slot_x/slot_y

	/** @deprecated Use slot_x instead */
	get position_x(): number {
		return this.slot_x
	}

	/** @deprecated Use slot_y instead */
	get position_z(): number {
		return this.slot_y
	}
}
