/**
 * FC Tycoon™ 2027 Match Simulator - Physics Integrator
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import type { PlayerBody } from '@/core/ai/PlayerBody'
import type { SteeringOutput } from '@/core/ai/SteeringBehaviors'

// ═══════════════════════════════════════════════════════════════════════════════
//                      C O N S T A N T S
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Movement constraints and physics parameters.
 * These can be modified by player attributes, fatigue, etc.
 */
export const PhysicsConstants = Object.freeze({
	/** Maximum possible speed any player can achieve (m/s) */
	MAX_SPEED: 9.5,

	/** Minimum angular speed for rotation (rad/s) - when walking slowly */
	MIN_ANGULAR_SPEED: 2.0,

	/** Maximum angular speed for rotation (rad/s) - quick turns while running */
	MAX_ANGULAR_SPEED: 8.0,

	/** Braking deceleration when no steering force applied (m/s²) */
	BRAKING_DECELERATION: 12.0,

	/** Minimum velocity to consider player "moving" (m/s) */
	VELOCITY_THRESHOLD: 0.01,

	/** Minimum angle difference to trigger rotation (radians) */
	ROTATION_THRESHOLD: 0.01,
})

// ═══════════════════════════════════════════════════════════════════════════════
//                      P H Y S I C S   I N T E G R A T O R
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PhysicsIntegrator handles the physics simulation for player movement.
 *
 * RESPONSIBILITIES:
 * - Apply steering forces to velocity
 * - Apply angular steering to body direction
 * - Handle braking when no force applied
 * - Enforce speed limits
 * - Update position from velocity
 *
 * DOES NOT:
 * - Make AI decisions (that's the Brain/Context)
 * - Calculate steering forces (that's SteeringBehaviors)
 * - Store any state (uses PlayerBody as data source)
 *
 * The integrator is stateless and operates purely on the provided inputs.
 */
export class PhysicsIntegrator {
	/**
	 * Integrate physics for a single time step.
	 *
	 * @param body - The player's physical body (position, velocity, direction)
	 * @param steering - The steering output (forces and target angle)
	 * @param dt - Delta time in seconds
	 */
	static integrate(body: PlayerBody, steering: SteeringOutput, dt: number): void {
		// 1. Apply linear forces
		this.applyLinearForces(body, steering, dt)

		// 2. Apply angular steering (rotation toward target angle)
		this.applyAngularSteering(body, steering, dt)

		// 3. Apply braking if no steering force
		this.applyBraking(body, steering, dt)

		// 4. Enforce speed limit
		this.enforceSpeedLimit(body, steering)

		// 5. Update position
		this.updatePosition(body, dt)
	}

	/**
	 * Apply linear acceleration from steering force.
	 */
	private static applyLinearForces(body: PlayerBody, steering: SteeringOutput, dt: number): void {
		body.velocity.addScaledVector(steering.linear, dt)
	}

	/**
	 * Rotate body toward the target facing direction.
	 * Angular speed is scaled based on the player's current speed.
	 * - Walking slowly = slower rotation (more natural)
	 * - Running fast = faster rotation (more agile)
	 *
	 * @param body - Player body to rotate
	 * @param steering - Steering output with faceDirection Vector2
	 * @param dt - Delta time in seconds
	 */
	private static applyAngularSteering(body: PlayerBody, steering: SteeringOutput, dt: number): void {
		// Skip if no facing direction requested
		if (steering.faceDirection.lengthSq() < 0.001) return

		// Calculate signed angle between current facing and target facing
		// Using cross product for sign and dot product for angle magnitude
		const currentDir = body.bodyDir
		const targetDir = steering.faceDirection

		// Cross product (2D): a.x * b.y - a.y * b.x gives signed sin of angle
		const cross = currentDir.x * targetDir.y - currentDir.y * targetDir.x
		// Dot product: a.x * b.x + a.y * b.y gives cos of angle
		const dot = currentDir.x * targetDir.x + currentDir.y * targetDir.y
		// atan2(cross, dot) gives signed angle from current to target
		const angleDiff = Math.atan2(cross, dot)

		// Only rotate if there's meaningful difference
		if (Math.abs(angleDiff) > PhysicsConstants.ROTATION_THRESHOLD) {
			// Scale angular speed based on current velocity (faster = more agile)
			const speed = body.velocity.length()
			const speedRatio = Math.min(speed / PhysicsConstants.MAX_SPEED, 1.0)

			// Interpolate between min and max angular speed
			const angularSpeed = PhysicsConstants.MIN_ANGULAR_SPEED +
				speedRatio * (PhysicsConstants.MAX_ANGULAR_SPEED - PhysicsConstants.MIN_ANGULAR_SPEED)

			// Clamp rotation to max angular speed
			const maxRotation = angularSpeed * dt
			const rotation = Math.max(-maxRotation, Math.min(maxRotation, angleDiff))

			// Apply rotation using setter (enforces head/eye constraints)
			const currentAngle = Math.atan2(currentDir.y, currentDir.x)
			const newAngle = currentAngle + rotation
			body.setBodyAngle(newAngle)
		}
	}

	/**
	 * Apply braking when no steering force is active.
	 */
	private static applyBraking(body: PlayerBody, steering: SteeringOutput, dt: number): void {
		if (steering.linear.lengthSq() < 0.001) {
			const speed = body.velocity.length()
			if (speed > PhysicsConstants.VELOCITY_THRESHOLD) {
				const newSpeed = Math.max(0, speed - PhysicsConstants.BRAKING_DECELERATION * dt)
				if (newSpeed > 0) {
					body.velocity.multiplyScalar(newSpeed / speed)
				} else {
					body.velocity.set(0, 0)
				}
			}
		}
	}

	/**
	 * Enforce maximum speed limit.
	 * Uses the max speed from steering output if provided, otherwise uses constant.
	 */
	private static enforceSpeedLimit(body: PlayerBody, steering: SteeringOutput): void {
		const maxSpeed = steering.maxSpeed > 0 ? steering.maxSpeed : PhysicsConstants.MAX_SPEED
		if (body.velocity.lengthSq() > maxSpeed * maxSpeed) {
			body.velocity.setLength(maxSpeed)
		}
	}

	/**
	 * Update position based on velocity.
	 */
	private static updatePosition(body: PlayerBody, dt: number): void {
		body.position.addScaledVector(body.velocity, dt)
	}
}
