/**
 * FC Tycoon™ 2027 Match Simulator - Player Body
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import type { Player } from '@/core/Player'
import { Match } from '@/core/Match'
import { PlayerSteering } from '@/core/ai/PlayerSteering'
import { PlayerVision } from '@/core/ai/PlayerVision'
import { SteeringOutput } from '@/core/ai/SteeringBehaviors'
import { PhysicsIntegrator } from '@/core/ai/PhysicsIntegrator'
import { HeadMovementSystem, type HeadState } from '@/core/ai/HeadMovement'

// ═══════════════════════════════════════════════════════════════════════════════
//                      C O N S T R A I N T S
// ═══════════════════════════════════════════════════════════════════════════════

/** Maximum head rotation from body direction (radians). Head can turn ±80° */
export const MAX_HEAD_ROTATION_RAD = 80 * Math.PI / 180

/**
 * Error thrown when attempting to set a direction outside valid constraints.
 */
export class ConstraintViolationError extends Error {
	constructor(
		public readonly constraintType: 'head',
		public readonly attemptedAngle: number,
		public readonly maxAllowedAngle: number,
	) {
		super(
			`${constraintType.toUpperCase()} constraint violation: ` +
			`attempted ${(attemptedAngle * 180 / Math.PI).toFixed(1)}° ` +
			`from body, max allowed is ±${(maxAllowedAngle * 180 / Math.PI).toFixed(1)}°`,
		)
		this.name = 'ConstraintViolationError'
	}
}

/**
 * Movement speed modes (m/s)
 */
export const MOVEMENT_SPEED = {
	IDLE: 0,		// 0 m/s
	WALK: 1.5,		// 1.5 m/s
	JOG: 4,			// 4.0 m/s
	RUN: 7,			// 7.0 m/s
	SPRINT: 9.5,	// 9.5 m/s (modified by pace/sprint speed attribute)
}

/**
 * Player Body - Physical state of a player on the field.
 *
 * Coordinate System:
 * - position: 2D world coordinates (x = goal-to-goal, y = touchline-to-touchline)
 * - velocity: 2D movement vector in m/s
 * - bodyDir: Unit vector (length = 1) indicating body facing direction
 * - headAngle: Relative angle from body direction (radians, 0 = forward)
 *
 * Direction Convention:
 * - { x: 1, y: 0 } = facing +X (toward Away goal)
 * - { x: -1, y: 0 } = facing -X (toward Home goal)
 * - { x: 0, y: 1 } = facing +Y (toward top touchline)
 * - { x: 0, y: -1 } = facing -Y (toward bottom touchline/camera)
 *
 * Constraint System:
 * - Head can rotate ±80° from body direction (relative angle)
 * - Setters THROW ConstraintViolationError if limits exceeded
 * - Eyes removed (future: Vector3 lookAt system)
 */
export class PlayerBody {
	readonly player: Player

	// ═══════════════════════════════════════════════════════════════════════════
	//                      P H Y S I C A L   S T A T E
	// ═══════════════════════════════════════════════════════════════════════════

	/** Position on field (2D world space, meters) */
	position: THREE.Vector2 = new THREE.Vector2()

	/** Movement velocity (2D, m/s) - does NOT determine facing direction */
	velocity: THREE.Vector2 = new THREE.Vector2()

	/** Body facing direction (unit vector) */
	#bodyDir: THREE.Vector2 = new THREE.Vector2(1, 0)

	/** Head angle relative to body (radians). 0 = forward, positive = counter-clockwise */
	#headAngle: number = 0

	/** Cached head world direction (computed from body + headAngle) */
	#headWorldDir: THREE.Vector2 = new THREE.Vector2(1, 0)

	/** Whether #headWorldDir needs recalculation */
	#headWorldDirDirty: boolean = false

	// ═══════════════════════════════════════════════════════════════════════════
	//                      D I R E C T I O N   A C C E S S O R S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Body facing direction (unit vector).
	 */
	get bodyDir(): THREE.Vector2 {
		return this.#bodyDir
	}

	set bodyDir(value: THREE.Vector2) {
		this.#bodyDir.copy(value).normalize()
		this.#headWorldDirDirty = true
	}

	/**
	 * Head angle relative to body (radians).
	 * 0 = looking straight ahead (same as body)
	 * Positive = looking counter-clockwise (left)
	 * Negative = looking clockwise (right)
	 *
	 * THROWS ConstraintViolationError if angle exceeds ±80°.
	 */
	get headAngle(): number {
		return this.#headAngle
	}

	set headAngle(value: number) {
		if (Math.abs(value) > MAX_HEAD_ROTATION_RAD) {
			throw new ConstraintViolationError('head', value, MAX_HEAD_ROTATION_RAD)
		}
		this.#headAngle = value
		this.#headWorldDirDirty = true
	}

	/**
	 * Head world direction (unit vector).
	 * Computed from body direction + head angle.
	 * Cached for performance - only recalculated when body or head changes.
	 *
	 * @returns Reference to internal cached vector (DO NOT MODIFY)
	 */
	get headWorldDir(): THREE.Vector2 {
		if (this.#headWorldDirDirty) {
			const bodyAngle = Math.atan2(this.#bodyDir.y, this.#bodyDir.x)
			const worldAngle = bodyAngle + this.#headAngle
			this.#headWorldDir.set(Math.cos(worldAngle), Math.sin(worldAngle))
			this.#headWorldDirDirty = false
		}
		return this.#headWorldDir
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                      C O N S T R A I N T   H E L P E R S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Calculate signed angle between two unit vectors (radians).
	 * Positive = counter-clockwise from a to b.
	 */
	#angleBetween(a: THREE.Vector2, b: THREE.Vector2): number {
		return Math.atan2(
			a.x * b.y - a.y * b.x,  // cross product (gives sign)
			a.x * b.x + a.y * b.y,   // dot product (gives cos)
		)
	}

	/**
	 * Set head angle safely, clamping to valid range instead of throwing.
	 * Use this for gradual head movements where exceeding constraint means "look as far as possible".
	 * @param angle Target angle in radians (relative to body)
	 * @returns The actual angle set (may be clamped)
	 */
	setHeadAngleClamped(angle: number): number {
		const clampedAngle = Math.max(-MAX_HEAD_ROTATION_RAD, Math.min(MAX_HEAD_ROTATION_RAD, angle))
		this.#headAngle = clampedAngle
		this.#headWorldDirDirty = true
		return clampedAngle
	}

	/**
	 * Set head to look at a world position, clamping to valid range.
	 * @param target World position to look at
	 * @returns The actual angle achieved (may be clamped)
	 */
	lookAtClamped(target: THREE.Vector2): number {
		const dx = target.x - this.position.x
		const dy = target.y - this.position.y
		const len = Math.sqrt(dx * dx + dy * dy)
		if (len < 0.001) return this.#headAngle

		// Calculate direction to target
		const targetDir = new THREE.Vector2(dx / len, dy / len)

		// Get angle from body to target direction
		const angleFromBody = this.#angleBetween(this.#bodyDir, targetDir)

		// Clamp and set
		return this.setHeadAngleClamped(angleFromBody)
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                      S U B S Y S T E M S
	// ═══════════════════════════════════════════════════════════════════════════

	steering: PlayerSteering
	vision: PlayerVision

	/** Physical fatigue: 0.0 (fresh) to 1.0 (exhausted) */
	fatigue: number = 0.0

	/** Head movement state for natural head behavior */
	headState: HeadState

	/** Whether player was moving last frame (for animation transitions) */
	wasMoving: boolean = false

	constructor(player: Player, match: Match) {
		this.player = player
		this.steering = new PlayerSteering(player)
		this.vision = new PlayerVision(player, match)
		this.headState = HeadMovementSystem.createState(
			match.state.scheduler.currentTick,
			match.state.random,
		)
	}

	/**
	 * Applies steering forces to the player's velocity and updates position.
	 *
	 * The steering output contains:
	 * - linear: Acceleration force vector (m/s²)
	 * - faceDirection: Target facing direction (Vector2, normalized)
	 * - arrived: Whether the player has reached the target position
	 * - resolvedMovementMode: The movement mode being used
	 * - maxSpeed: Maximum speed for this movement (m/s)
	 *
	 * Delegates to PhysicsIntegrator for all physics calculations.
	 *
	 * @param dt Delta time in seconds
	 * @param steering The steering output (force and target direction)
	 */
	integrate(dt: number, steering: SteeringOutput) {
		PhysicsIntegrator.integrate(this, steering, dt)
	}

	/**
	 * Set body direction to face a target position.
	 * @param target Target position to face
	 */
	facePosition(target: THREE.Vector2) {
		const dx = target.x - this.position.x
		const dy = target.y - this.position.y
		const len = Math.sqrt(dx * dx + dy * dy)
		if (len > 0.001) {
			this.#bodyDir.set(dx / len, dy / len)
			this.#headWorldDirDirty = true
		}
	}

	/**
	 * Set body direction to face along velocity (if moving).
	 */
	faceMovementDirection() {
		const speed = this.velocity.length()
		if (speed > 0.1) {
			this.#bodyDir.copy(this.velocity).normalize()
			this.#headWorldDirDirty = true
		}
	}

	/**
	 * Get angle of body direction (for compatibility with angle-based systems).
	 * @returns Angle in radians (0 = +X, counter-clockwise positive)
	 */
	getBodyAngle(): number {
		return Math.atan2(this.#bodyDir.y, this.#bodyDir.x)
	}

	/**
	 * Set body direction from angle (for compatibility with angle-based systems).
	 * @param angle Angle in radians (0 = +X, counter-clockwise positive)
	 */
	setBodyAngle(angle: number) {
		this.#bodyDir.set(Math.cos(angle), Math.sin(angle))
		this.#headWorldDirDirty = true
	}
}
