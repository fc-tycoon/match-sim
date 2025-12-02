/**
 * FC Tycoon™ 2027 Match Simulator - Formation AABB Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import { DefendingSide } from './TeamState'

/**
 * Formation AABB (Axis-Aligned Bounding Box)
 *
 * Represents the spatial area a team's OUTFIELD formation occupies on the field.
 * The AABB has FOUR INDEPENDENT EDGES that can be positioned independently:
 *
 * - backEdge:  Where defenders (slot_y = -1) are positioned (world_x)
 * - frontEdge: Where strikers (slot_y = +1) are positioned (world_x)
 * - leftEdge:  Where left-sided players (slot_x = -1) are positioned (world_y)
 * - rightEdge: Where right-sided players (slot_x = +1) are positioned (world_y)
 *
 * IMPORTANT: Goalkeepers are NOT part of the formation AABB!
 * GKs move independently and are positioned relative to their goal, not the AABB.
 * This AABB only governs the 10 outfield players.
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                        COORDINATE SYSTEMS                                    ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  SLOT COORDINATES (relative to AABB, from player's perspective):             ║
 * ║  ─────────────────────────────────────────────────────────────               ║
 * ║  • slot_x: Left (-1) ←──────→ Right (+1)   [across the pitch WIDTH]          ║
 * ║  • slot_y: Back (-1) ←──────→ Front (+1)   [along the pitch LENGTH]          ║
 * ║                                                                              ║
 * ║  WORLD COORDINATES (field space):                                            ║
 * ║  ────────────────────────────────                                            ║
 * ║  • world_x: Goal-to-goal axis, -52.5m to +52.5m (pitch LENGTH)               ║
 * ║  • world_y: Touchline-to-touchline, -34m to +34m (pitch WIDTH)               ║
 * ║                                                                              ║
 * ║  MAPPING (slot → world):                                                     ║
 * ║  ───────────────────────                                                     ║
 * ║  • slot_x (left/right) → world_y (touchline direction)                       ║
 * ║  • slot_y (back/front) → world_x (goal direction)                            ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                        FIELD LAYOUT (Bird's Eye View)                        ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║                         world_y (WIDTH / touchlines)                         ║
 * ║                              -34m ←───→ +34m                                 ║
 * ║                                    ↑                                         ║
 * ║    ┌─────────────────────────────────────────────────────────────────┐       ║
 * ║    │                             │                                   │       ║
 * ║    │   HOME GOAL                 │                      AWAY GOAL    │       ║
 * ║    │   (x=-52.5)                 │ halfway              (x=+52.5)    │       ║
 * ║    │                             │ line                              │       ║
 * ║    │  ┌───────────┐              │              ┌───────────┐        │       ║
 * ║    │  │ HOME AABB │              │              │ AWAY AABB │        │       ║
 * ║    │  │ attacks → │              │              │ ← attacks │        │       ║
 * ║    │  │ (+X dir)  │              │              │ (-X dir)  │        │       ║
 * ║    │  └───────────┘              │              └───────────┘        │       ║
 * ║    │                             │                                   │       ║
 * ║    └─────────────────────────────────────────────────────────────────┘       ║
 * ║         ←────────────────────────────────────────────────────────→           ║
 * ║                    world_x (LENGTH / goal-to-goal)                           ║
 * ║                         -52.5m ←───→ +52.5m                                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     FOUR INDEPENDENT EDGES                                   ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  Each edge is positioned INDEPENDENTLY in world coordinates:                 ║
 * ║                                                                              ║
 * ║  • backEdge:  world_x position where slot_y = -1 (defenders)                 ║
 * ║  • frontEdge: world_x position where slot_y = +1 (strikers)                  ║
 * ║  • leftEdge:  world_y position where slot_x = -1 (left-sided players)        ║
 * ║  • rightEdge: world_y position where slot_x = +1 (right-sided players)       ║
 * ║                                                                              ║
 * ║  This allows moving defenders without affecting strikers, and vice versa!    ║
 * ║                                                                              ║
 * ║         AABB from above (home team, attacking +X):                           ║
 * ║                                                                              ║
 * ║                    leftEdge              rightEdge                           ║
 * ║                    (world_y)             (world_y)                           ║
 * ║                       ↓                     ↓                                ║
 * ║              slot_x=-1        slot_x=0        slot_x=+1                      ║
 * ║                 LW              ST               RW         ← frontEdge      ║
 * ║                  ┌───────────────┬───────────────┐            (world_x)      ║
 * ║                  │               │               │            slot_y=+1      ║
 * ║                  │               │               │                           ║
 * ║             LM ──┼───────────────●───────────────┼── RM      slot_y=0        ║
 * ║                  │            (center)           │                           ║
 * ║                  │               │               │                           ║
 * ║                  │               │               │                           ║
 * ║                  └───────────────┴───────────────┘            slot_y=-1      ║
 * ║                 LB              CB               RB         ← backEdge       ║
 * ║                                                               (world_x)      ║
 * ║                         (toward own goal)                                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * TYPICAL SLOT POSITIONS (outfield only):
 * =======================================
 * CB  (±0.35, -1)  = Center backs at back edge of AABB
 * LB  (-1, -0.9)   = Left back, wide and slightly ahead of CBs
 * RB  (+1, -0.9)   = Right back, wide and slightly ahead of CBs
 * DM  (0, -0.5)    = Defensive midfielder
 * CM  (0, 0)       = Center midfielder, middle of AABB
 * AM  (0, +0.5)    = Attacking midfielder
 * LW  (-1, +0.8)   = Left winger, wide and attacking
 * RW  (+1, +0.8)   = Right winger, wide and attacking
 * ST  (0, +1)      = Striker at front edge of AABB
 *
 * NOTE: GK slot coordinates exist in the database but are handled separately.
 * GK positioning is based on goal position, not the formation AABB.
 */
export class FormationAABB {
	// ═══════════════════════════════════════════════════════════════════════════
	//                     F O U R   I N D E P E N D E N T   E D G E S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Back edge position in world_x (goal-to-goal axis).
	 * This is where slot_y = -1 maps to (defenders).
	 *
	 * For home team (defending -X): typically around -30m to -35m
	 * For away team (defending +X): typically around +30m to +35m
	 */
	backEdge: number = 0

	/**
	 * Front edge position in world_x (goal-to-goal axis).
	 * This is where slot_y = +1 maps to (strikers).
	 *
	 * For home team (attacking +X): typically around -5m to -10m (behind halfway)
	 * For away team (attacking -X): typically around +5m to +10m (behind halfway)
	 */
	frontEdge: number = 0

	/**
	 * Left edge position in world_y (touchline axis).
	 * This is where slot_x = -1 maps to (left-sided players).
	 *
	 * Typically around -28m to -32m (left touchline at -34m)
	 */
	leftEdge: number = -30

	/**
	 * Right edge position in world_y (touchline axis).
	 * This is where slot_x = +1 maps to (right-sided players).
	 *
	 * Typically around +28m to +32m (right touchline at +34m)
	 */
	rightEdge: number = +30

	// ═══════════════════════════════════════════════════════════════════════════
	//                          O R I E N T A T I O N
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Which side the team is defending.
	 * - LEFT (-1): Team defends -X side (home goal), attacks toward +X
	 * - RIGHT (+1): Team defends +X side (away goal), attacks toward -X
	 */
	defendingSide: DefendingSide = DefendingSide.LEFT

	// ═══════════════════════════════════════════════════════════════════════════
	//                     D E F A U L T   P O S I T I O N S
	// ═══════════════════════════════════════════════════════════════════════════

	/** Default back edge distance from own goal line (positive = toward center) */
	static readonly DEFAULT_BACK_FROM_GOAL = 22 // ~30m from goal at kickoff

	/** Default front edge distance behind halfway line (positive = in own half) */
	static readonly DEFAULT_FRONT_FROM_HALFWAY = 8 // ~8m behind halfway at kickoff

	/** Default left/right edge distance from center (symmetric) */
	static readonly DEFAULT_SIDE_SPAN = 30 // ±30m from center (60m total width)

	// ═══════════════════════════════════════════════════════════════════════════
	//                      C O N S T R U C T O R
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Create a new FormationAABB with four independent edges.
	 *
	 * @param defendingSide - Which side the team is defending (-1 = left, +1 = right)
	 * @param fieldHalfLength - Half the field length in meters (default 52.5)
	 */
	constructor(defendingSide: DefendingSide, fieldHalfLength: number = 52.5) {
		this.defendingSide = defendingSide

		// Set width edges (symmetric, same for both teams)
		this.leftEdge = -FormationAABB.DEFAULT_SIDE_SPAN
		this.rightEdge = +FormationAABB.DEFAULT_SIDE_SPAN

		// Set depth edges based on defending side
		// Home team (defendingSide = -1): goal at -52.5, attacks toward +X
		// Away team (defendingSide = +1): goal at +52.5, attacks toward -X
		const goalLineX = defendingSide * fieldHalfLength

		if (defendingSide === DefendingSide.LEFT) {
			// Home team: defending -X
			// Back edge (defenders): goal line + offset toward center
			this.backEdge = goalLineX + FormationAABB.DEFAULT_BACK_FROM_GOAL
			// Front edge (strikers): halfway line - offset into own half
			this.frontEdge = -FormationAABB.DEFAULT_FRONT_FROM_HALFWAY + 7
		} else {
			// Away team: defending +X
			// Back edge (defenders): goal line - offset toward center
			this.backEdge = goalLineX - FormationAABB.DEFAULT_BACK_FROM_GOAL
			// Front edge (strikers): halfway line + offset into own half
			this.frontEdge = +FormationAABB.DEFAULT_FRONT_FROM_HALFWAY
		}
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                     C O M P U T E D   P R O P E R T I E S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Get the center position of the AABB.
	 * Computed from the four edges.
	 */
	get center(): THREE.Vector2 {
		const centerX = (this.backEdge + this.frontEdge) / 2
		const centerY = (this.leftEdge + this.rightEdge) / 2
		return new THREE.Vector2(centerX, centerY)
	}

	/**
	 * Get the depth (slot_y span) of the AABB.
	 * Distance from back edge to front edge.
	 */
	get depth(): number {
		return Math.abs(this.frontEdge - this.backEdge)
	}

	/**
	 * Get the width (slot_x span) of the AABB.
	 * Distance from left edge to right edge.
	 */
	get width(): number {
		return Math.abs(this.rightEdge - this.leftEdge)
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                     C O O R D I N A T E   T R A N S F O R M
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Convert slot coordinates to world position.
	 *
	 * Slot coordinates:
	 * - slot_x: Left (-1) to Right (+1) → world_y (touchline direction)
	 * - slot_y: Back (-1) to Front (+1) → world_x (goal direction)
	 *
	 * Uses linear interpolation between the four independent edges.
	 *
	 * @param slotX - Slot X coordinate (-1 to +1, left to right across pitch)
	 * @param slotY - Slot Y coordinate (-1 to +1, back to front along pitch)
	 * @returns World 2D position (x = goal-to-goal, y = touchline)
	 */
	slotToWorld(slotX: number, slotY: number): THREE.Vector2 {
		// slot_y (-1 to +1) → world_x via linear interpolation between backEdge and frontEdge
		// slot_y = -1 → backEdge
		// slot_y = +1 → frontEdge
		const t_y = (slotY + 1) / 2 // Convert -1..+1 to 0..1
		const worldX = this.backEdge + t_y * (this.frontEdge - this.backEdge)

		// slot_x (-1 to +1) → world_y via linear interpolation between leftEdge and rightEdge
		// slot_x = -1 → leftEdge
		// slot_x = +1 → rightEdge
		const t_x = (slotX + 1) / 2 // Convert -1..+1 to 0..1
		const worldY = this.leftEdge + t_x * (this.rightEdge - this.leftEdge)

		return new THREE.Vector2(worldX, worldY)
	}

	/**
	 * Convert world position to slot coordinates.
	 *
	 * @param worldX - World X coordinate (goal-to-goal)
	 * @param worldY - World Y coordinate (touchline)
	 * @returns Slot coordinates { x: -1..+1, y: -1..+1 }
	 */
	worldToSlot(worldX: number, worldY: number): { x: number, y: number } {
		// Inverse of slotToWorld
		const t_y = (worldX - this.backEdge) / (this.frontEdge - this.backEdge)
		const slotY = t_y * 2 - 1 // Convert 0..1 to -1..+1

		const t_x = (worldY - this.leftEdge) / (this.rightEdge - this.leftEdge)
		const slotX = t_x * 2 - 1 // Convert 0..1 to -1..+1

		return { x: slotX, y: slotY }
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                     B O U N D A R Y   A C C E S S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Get the four corners of the AABB in world coordinates.
	 * Useful for rendering the AABB outline.
	 *
	 * @returns Array of 4 corners: [backLeft, backRight, frontRight, frontLeft]
	 */
	getCorners(): THREE.Vector2[] {
		return [
			new THREE.Vector2(this.backEdge, this.leftEdge),   // Back-Left
			new THREE.Vector2(this.backEdge, this.rightEdge),  // Back-Right
			new THREE.Vector2(this.frontEdge, this.rightEdge), // Front-Right
			new THREE.Vector2(this.frontEdge, this.leftEdge),  // Front-Left
		]
	}

	/**
	 * Get the center of the back edge (defensive line).
	 */
	getBackCenter(): THREE.Vector2 {
		return new THREE.Vector2(this.backEdge, (this.leftEdge + this.rightEdge) / 2)
	}

	/**
	 * Get the center of the front edge (attacking line).
	 */
	getFrontCenter(): THREE.Vector2 {
		return new THREE.Vector2(this.frontEdge, (this.leftEdge + this.rightEdge) / 2)
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                     E D G E   M A N I P U L A T I O N
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Set the back edge (defensive line) position.
	 * Does NOT affect the front edge.
	 *
	 * @param worldX - New back edge position in world_x
	 */
	setBackEdge(worldX: number): void {
		this.backEdge = worldX
	}

	/**
	 * Set the front edge (striker line) position.
	 * Does NOT affect the back edge.
	 *
	 * @param worldX - New front edge position in world_x
	 */
	setFrontEdge(worldX: number): void {
		this.frontEdge = worldX
	}

	/**
	 * Set the left edge position.
	 * Does NOT affect the right edge.
	 *
	 * @param worldY - New left edge position in world_y
	 */
	setLeftEdge(worldY: number): void {
		this.leftEdge = worldY
	}

	/**
	 * Set the right edge position.
	 * Does NOT affect the left edge.
	 *
	 * @param worldY - New right edge position in world_y
	 */
	setRightEdge(worldY: number): void {
		this.rightEdge = worldY
	}

	/**
	 * Move the entire AABB by a delta (all four edges).
	 *
	 * @param dx - Delta X in world coordinates (goal-to-goal)
	 * @param dy - Delta Y in world coordinates (touchline)
	 */
	translate(dx: number, dy: number): void {
		this.backEdge += dx
		this.frontEdge += dx
		this.leftEdge += dy
		this.rightEdge += dy
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                     D E B U G   /   R E N D E R I N G
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Get AABB data for rendering/debugging.
	 */
	toRenderData(): FormationAABBRenderData {
		const corners = this.getCorners()
		const center = this.center
		return {
			center: { x: center.x, y: center.y },
			corners: corners.map(c => ({ x: c.x, y: c.y })),
			backEdge: this.backEdge,
			frontEdge: this.frontEdge,
			leftEdge: this.leftEdge,
			rightEdge: this.rightEdge,
			depth: this.depth,
			width: this.width,
		}
	}
}

/**
 * Data structure for rendering FormationAABB.
 */
export interface FormationAABBRenderData {
	center: { x: number, y: number }
	corners: { x: number, y: number }[]
	backEdge: number
	frontEdge: number
	leftEdge: number
	rightEdge: number
	depth: number
	width: number
}
