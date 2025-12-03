/**
 * FC Tycoon™ 2027 Match Simulator - Steering Behaviors
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

// Low-level implementation of Craig Reynolds' style Steering Behaviors
// OPTIMIZED FOR ZERO ALLOCATIONS (Reusable objects, no 'new' in loops)
// STATEFUL CLASSES (Per-player instances with persistent scratchpads)
//
// NOTE: All vectors are 2D (THREE.Vector2) to match the physics simulation.
// Target positions from intentions (Vector3) are converted to 2D (x, z -> x, y).
//
// MOVEMENT SYSTEM:
// ================
// The AI sets intentions with:
// - targetPosition: Where to go
// - faceTarget: Where to look while moving (optional)
// - speedHint: How fast (WALK/JOG/RUN/SPRINT)
// - movementMode: How to move (FORWARD/BACKWARD/STRAFE/AUTO)
//
// Steering calculates:
// - Linear force (direction and magnitude)
// - Angular force (rotation toward faceTarget)
// - The physics layer applies these forces respecting movement mode constraints

import * as THREE from 'three'
import type { PlayerContext } from '@/core/ai/PlayerContext'
import {
	SpeedHint,
	SpeedHintVelocity,
	MovementMode,
	MovementModeSpeedMultiplier,
} from '@/core/ai/PlayerIntentions'

// ═══════════════════════════════════════════════════════════════════════════════
//                      C O N S T A N T S
// ═══════════════════════════════════════════════════════════════════════════════

export const MAX_SPEED = 9.5			// Maximum possible speed (sprint, m/s)
export const MAX_ACCELERATION = 15.0	// Explosive acceleration (m/s²)
export const MAX_ANGULAR_SPEED = 8.0	// Max rotation speed (rad/s, ~460°/s)
export const ARRIVE_RADIUS = 2.0		// Distance to start slowing down (m)
export const TARGET_RADIUS = 0.3		// Distance to consider "arrived" (m)

// ═══════════════════════════════════════════════════════════════════════════════
//                      S T E E R I N G   O U T P U T
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reusable output container to avoid GC thrashing.
 * Pass this instance into calculateSteering().
 *
 * NOTE: Uses Vector2 for 2D physics simulation.
 */
export class SteeringOutput {
	/** Linear acceleration/force vector (m/s²) */
	linear: THREE.Vector2 = new THREE.Vector2()

	/**
	 * Target facing direction (unit vector in WORLD space).
	 * The physics integrator will rotate the body toward this direction.
	 * Using Vector2 instead of radians for easier calculations and intuition.
	 */
	faceDirection: THREE.Vector2 = new THREE.Vector2(1, 0)

	/** Whether the player has arrived at the target position */
	arrived: boolean = false

	/** The calculated movement mode based on AUTO resolution */
	resolvedMovementMode: MovementMode = MovementMode.FORWARD

	/** Maximum speed for this movement (m/s). 0 = use default */
	maxSpeed: number = 0

	clear(): this {
		this.linear.set(0, 0)
		this.faceDirection.set(1, 0)
		this.arrived = false
		this.resolvedMovementMode = MovementMode.FORWARD
		this.maxSpeed = 0
		return this
	}
}

export interface SteeringBehavior {
	calculateSteering(ctx: PlayerContext, out: SteeringOutput): void
}

// ═══════════════════════════════════════════════════════════════════════════════
//                      H E L P E R   F U N C T I O N S
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert a Vector3 lookAtTarget to Vector2 (for body rotation only).
 * Maps: x -> x, z -> y (Y is up in 3D, so we use X and Z for ground plane).
 *
 * NOTE: Only used for lookAtTarget which remains Vector3 for vertical look.
 * Movement targets (targetPosition, faceTarget) are already Vector2.
 */
function _lookAt3DToGround2D(target: THREE.Vector3, out: THREE.Vector2): THREE.Vector2 {
	return out.set(target.x, target.z)
}

/**
 * Get the maximum speed for a given speed hint and movement mode.
 */
function getMaxSpeed(speedHint: SpeedHint, movementMode: MovementMode): number {
	const baseSpeed = SpeedHintVelocity[speedHint] ?? SpeedHintVelocity[SpeedHint.JOG]
	const modeMultiplier = MovementModeSpeedMultiplier[movementMode] ?? 1.0
	return baseSpeed * modeMultiplier
}

/**
 * Calculate the angle between two 2D vectors (radians).
 * Returns value in range [-PI, PI].
 */
function angleBetween(from: THREE.Vector2, to: THREE.Vector2): number {
	const dot = from.x * to.x + from.y * to.y
	const cross = from.x * to.y - from.y * to.x
	return Math.atan2(cross, dot)
}

// ═══════════════════════════════════════════════════════════════════════════════
//                      B E H A V I O R S
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SEEK: Move towards target at max speed.
 * Use for: Chasing, covering large distances quickly.
 */
export class SeekBehavior implements SteeringBehavior {
	// Persistent scratchpad for this instance
	private _desiredVelocity = new THREE.Vector2()

	calculateSteering(ctx: PlayerContext, out: SteeringOutput): void {
		const target = ctx.intentions.targetPosition
		if (!target || !ctx.player.body) return

		const speedHint = ctx.intentions.speedHint ?? SpeedHint.RUN
		const maxSpeed = getMaxSpeed(speedHint, MovementMode.FORWARD)

		// targetPosition is already Vector2 - use directly
		// desired = (target - pos).normalize * max_speed
		this._desiredVelocity.subVectors(target, ctx.player.body.position).normalize().multiplyScalar(maxSpeed)

		// steering = desired - velocity
		out.linear.subVectors(this._desiredVelocity, ctx.player.body.velocity)
		out.resolvedMovementMode = MovementMode.FORWARD
	}
}

/** Distance to start anticipatory turning toward final facing (m) */
export const ANTICIPATORY_TURN_RADIUS = 3.0

/** Max angle (rad) where we can move while rotating - allows lateral movement */
export const LATERAL_MOVEMENT_THRESHOLD = Math.PI * 0.4 // ~72° - humans can easily sidestep

/**
 * ARRIVE: Move towards target and slow down to stop at the spot.
 *
 * HUMAN-LIKE MOVEMENT:
 * - Players can move laterally (sidestep) without fully rotating first
 * - Head leads body rotation - eyes/head turn first, body follows
 * - Anticipatory turning: starts rotating toward final facing before arriving
 * - Speed is reduced when moving at an angle to facing (can't sprint sideways)
 *
 * Supports:
 * - Speed hints (WALK/JOG/RUN/SPRINT)
 * - Movement modes (FORWARD/BACKWARD/STRAFE/AUTO)
 * - Face target while moving (for jockeying/containing)
 *
 * Use for: Moving to a tactical position, receiving a pass, jockeying.
 */
export class ArriveBehavior implements SteeringBehavior {
	private _direction = new THREE.Vector2()
	private _desiredVelocity = new THREE.Vector2()
	private _faceDir = new THREE.Vector2()
	private _finalFaceDir = new THREE.Vector2()

	calculateSteering(ctx: PlayerContext, out: SteeringOutput): void {
		const target = ctx.intentions.targetPosition
		if (!target || !ctx.player.body) return

		const body = ctx.player.body
		const speedHint = ctx.intentions.speedHint ?? SpeedHint.JOG
		let movementMode = ctx.intentions.movementMode ?? MovementMode.AUTO

		// Calculate direction to target
		this._direction.subVectors(target, body.position)
		const distance = this._direction.length()

		// Determine final facing direction (what we want to face when we arrive)
		let hasFinalFaceTarget = false
		if (ctx.intentions.faceTarget) {
			this._finalFaceDir.subVectors(ctx.intentions.faceTarget, body.position).normalize()
			hasFinalFaceTarget = true
		}

		// Check if arrived
		if (distance < TARGET_RADIUS) {
			out.linear.set(0, 0)
			out.arrived = true

			// Face the final target direction
			if (hasFinalFaceTarget) {
				out.faceDirection.copy(this._finalFaceDir).normalize()
			}
			return
		}

		// Normalize direction for calculations
		const dirNormalized = this._direction.clone().normalize()

		// Calculate angle between current facing and movement direction
		const angleToMovement = angleBetween(body.bodyDir, dirNormalized)
		const absAngleToMovement = Math.abs(angleToMovement)

		// ═══════════════════════════════════════════════════════════
		// RESOLVE MOVEMENT MODE (if AUTO)
		// Human-like: prefer lateral movement over stopping to rotate
		// ═══════════════════════════════════════════════════════════

		if (movementMode === MovementMode.AUTO) {
			if (hasFinalFaceTarget) {
				// We have a face target - determine how to move while maintaining facing
				const angleFromFaceToTarget = angleBetween(this._finalFaceDir, dirNormalized)
				const absAngleFromFace = Math.abs(angleFromFaceToTarget)

				if (absAngleFromFace > Math.PI * 0.7) {
					// Target is behind where we need to face - backpedal
					movementMode = MovementMode.BACKWARD
				} else if (absAngleFromFace > Math.PI * 0.25) {
					// Target is to the side - strafe (humans can easily sidestep)
					movementMode = angleFromFaceToTarget > 0 ? MovementMode.STRAFE_LEFT : MovementMode.STRAFE_RIGHT
				} else {
					movementMode = MovementMode.FORWARD
				}
			} else {
				// No face target - move toward target
				// Human-like: we can move at angles without fully rotating first
				if (absAngleToMovement > Math.PI * 0.8) {
					// Target is almost directly behind - backpedal if close, else turn
					if (distance < 3.0) {
						movementMode = MovementMode.BACKWARD
					} else {
						// Turn and walk - will rotate while moving
						movementMode = MovementMode.FORWARD
					}
				} else if (absAngleToMovement > LATERAL_MOVEMENT_THRESHOLD) {
					// Target is to the side - use lateral movement
					movementMode = angleToMovement > 0 ? MovementMode.STRAFE_LEFT : MovementMode.STRAFE_RIGHT
				} else {
					movementMode = MovementMode.FORWARD
				}
			}
		}

		out.resolvedMovementMode = movementMode

		// ═══════════════════════════════════════════════════════════
		// CALCULATE TARGET SPEED
		// Human-like: speed is reduced when moving at an angle
		// ═══════════════════════════════════════════════════════════

		const baseMaxSpeed = getMaxSpeed(speedHint, movementMode)

		// Reduce speed when moving at an angle to our facing
		// cos(0) = 1.0 (full speed forward), cos(90°) = 0 (can't sprint sideways)
		// But allow at least 40% speed for any direction (humans can shuffle)
		const angleSpeedFactor = Math.max(0.4, Math.cos(absAngleToMovement * 0.5))
		const maxSpeed = baseMaxSpeed * angleSpeedFactor
		out.maxSpeed = maxSpeed

		let targetSpeed = maxSpeed
		if (distance < ARRIVE_RADIUS) {
			// Slow down as we approach
			targetSpeed = maxSpeed * (distance / ARRIVE_RADIUS)
		}

		// ═══════════════════════════════════════════════════════════
		// CALCULATE LINEAR FORCE
		// Human-like: always move toward target, speed varies by mode
		// ═══════════════════════════════════════════════════════════

		// Movement is always toward target, but speed is affected by mode
		this._desiredVelocity.copy(dirNormalized).multiplyScalar(targetSpeed)

		// Steering force = desired - current
		out.linear.subVectors(this._desiredVelocity, body.velocity)

		// ═══════════════════════════════════════════════════════════
		// CALCULATE ANGULAR TARGET (Face Direction)
		// Human-like: anticipatory turning before arriving
		// ═══════════════════════════════════════════════════════════

		if (hasFinalFaceTarget) {
			// We have a final face target
			if (distance < ANTICIPATORY_TURN_RADIUS) {
				// Close to destination - start turning toward final facing
				// Blend between movement direction and final facing based on proximity
				const blendFactor = distance / ANTICIPATORY_TURN_RADIUS

				// Lerp between movement direction and final face direction
				out.faceDirection
					.copy(dirNormalized)
					.lerp(this._finalFaceDir, 1 - blendFactor)
					.normalize()
			} else {
				// Far from destination - face the face target direction
				out.faceDirection.copy(this._finalFaceDir).normalize()
			}
		} else if (movementMode === MovementMode.BACKWARD) {
			// Backpedaling without face target - keep current facing
			out.faceDirection.copy(body.bodyDir)
		} else {
			// No face target - face movement direction
			out.faceDirection.copy(dirNormalized)
		}
	}
}

/**
 * PURSUE: Predict where the target will be and seek that point.
 * Use for: Intercepting a ball, closing down a running player.
 *
 * NOTE: This behavior requires PlayerContext to have a 'memory' property
 * with perceived player data. Currently stubbed to fall back to Seek.
 */
export class PursueBehavior implements SteeringBehavior {
	private _seek = new SeekBehavior() // Composition: Pursue uses Seek

	calculateSteering(ctx: PlayerContext, out: SteeringOutput): void {
		// TODO: Implement when PlayerContext.memory is available
		// For now, fall back to standard Seek
		this._seek.calculateSteering(ctx, out)
	}
}

/**
 * FACE: Rotate to face the target (no linear movement).
 * Use for: Jockeying, preparing to shoot/pass.
 * Note: This returns Angular velocity only.
 */
export class FaceBehavior implements SteeringBehavior {
	private _direction = new THREE.Vector2()
	private _lookAt2D = new THREE.Vector2()

	calculateSteering(ctx: PlayerContext, out: SteeringOutput): void {
		const body = ctx.player.body
		if (!body) return

		// Priority: faceTarget (Vector2) > lookAtTarget (Vector3 -> project to 2D) > targetPosition (Vector2)
		let targetX: number
		let targetY: number

		if (ctx.intentions.faceTarget) {
			// faceTarget is Vector2
			targetX = ctx.intentions.faceTarget.x
			targetY = ctx.intentions.faceTarget.y
		} else if (ctx.intentions.lookAtTarget) {
			// lookAtTarget is Vector3 - project to ground plane (x, z -> x, y)
			targetX = ctx.intentions.lookAtTarget.x
			targetY = ctx.intentions.lookAtTarget.z
		} else if (ctx.intentions.targetPosition) {
			// targetPosition is Vector2
			targetX = ctx.intentions.targetPosition.x
			targetY = ctx.intentions.targetPosition.y
		} else {
			return // No target to face
		}

		this._direction.set(targetX - body.position.x, targetY - body.position.y)

		out.linear.set(0, 0)
		out.faceDirection.copy(this._direction).normalize()
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
//                      C O L L I S I O N   A V O I D A N C E
// ═══════════════════════════════════════════════════════════════════════════════

/** Collision avoidance parameters */
const _COLLISION_RADIUS = 0.5			// Player collision radius (m) - reserved for future use
const AVOIDANCE_RADIUS = 2.0			// Distance to start avoiding (m)
const AVOIDANCE_FORCE_SCALE = 8.0		// Scale factor for avoidance force
const MAX_NEIGHBORS_TO_CHECK = 8		// Performance limit

/**
 * COLLISION AVOIDANCE: Steer away from nearby players to avoid collisions.
 *
 * This is a MODIFIER behavior - it doesn't set the primary steering but
 * adds an avoidance force to the existing output. Call after the main behavior.
 *
 * Uses the player's vision system to get perceived player positions.
 * Players can only avoid what they can "see" (perceived players).
 *
 * Use for: General movement, preventing players from walking through each other.
 */
export class CollisionAvoidanceBehavior {
	private _toNeighbor = new THREE.Vector2()
	private _avoidanceForce = new THREE.Vector2()

	/**
	 * Modify the steering output to add collision avoidance force.
	 * Call this AFTER the main behavior has calculated its steering.
	 *
	 * @param ctx - Player context with vision system
	 * @param out - Steering output to modify (adds avoidance force)
	 */
	applyAvoidance(ctx: PlayerContext, out: SteeringOutput): void {
		const body = ctx.player.body
		if (!body) return

		this._avoidanceForce.set(0, 0)
		let neighborCount = 0

		// Use the vision system's perceived players
		const perceivedPlayers = body.vision.players

		for (const perceived of perceivedPlayers) {
			if (neighborCount >= MAX_NEIGHBORS_TO_CHECK) break

			// Get vector from this player to the neighbor
			this._toNeighbor.subVectors(perceived.position, body.position)
			const distance = this._toNeighbor.length()

			// Skip if outside avoidance radius or if this IS us somehow
			if (distance > AVOIDANCE_RADIUS || distance < 0.01) continue

			neighborCount++

			// Calculate repulsion force (stronger when closer)
			// Using inverse-square-ish falloff: force = scale * (1 - dist/radius)^2
			const proximity = 1 - (distance / AVOIDANCE_RADIUS)
			const forceMagnitude = AVOIDANCE_FORCE_SCALE * proximity * proximity

			// Direction: away from neighbor (negative of toNeighbor, normalized)
			if (distance > 0.01) {
				this._toNeighbor.normalize()
				// Add repulsion (away from neighbor)
				this._avoidanceForce.x -= this._toNeighbor.x * forceMagnitude
				this._avoidanceForce.y -= this._toNeighbor.y * forceMagnitude
			}
		}

		// Add the avoidance force to the steering output
		if (neighborCount > 0) {
			out.linear.add(this._avoidanceForce)
		}
	}
}

/**
 * Helper function to calculate distance between two 2D positions.
 * @param a First position
 * @param b Second position
 * @returns Distance in meters
 */
export function distance2D(a: THREE.Vector2, b: THREE.Vector2): number {
	const dx = b.x - a.x
	const dy = b.y - a.y
	return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Helper function to normalize an angle to the range [-PI, PI].
 * @param angle Angle in radians
 * @returns Normalized angle in [-PI, PI]
 */
export function normalizeAngle(angle: number): number {
	while (angle > Math.PI) angle -= 2 * Math.PI
	while (angle < -Math.PI) angle += 2 * Math.PI
	return angle
}

/**
 * Helper function to get the signed angle difference between two angles.
 * Returns the shortest path from 'from' to 'to'.
 * @param from Starting angle (radians)
 * @param to Target angle (radians)
 * @returns Signed angle difference in [-PI, PI]
 */
export function angleDifference(from: number, to: number): number {
	return normalizeAngle(to - from)
}
