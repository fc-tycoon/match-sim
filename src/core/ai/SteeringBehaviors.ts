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

import * as THREE from 'three'
import type { PlayerContext } from '@/core/ai/PlayerContext'

export const MAX_SPEED = 8.0			// Meters per second (approx 28 km/h)
export const MAX_ACCELERATION = 15.0	// Meters per second squared (explosive start)
export const ARRIVE_RADIUS = 2.0		// Distance to start slowing down
export const TARGET_RADIUS = 0.1		// Distance to consider "arrived"

/**
 * Reusable output container to avoid GC thrashing.
 * Pass this instance into calculateSteering().
 *
 * NOTE: Uses Vector2 for 2D physics simulation.
 */
export class SteeringOutput {
	linear: THREE.Vector2 = new THREE.Vector2()
	angular: number = 0

	clear(): this {
		this.linear.set(0, 0)
		this.angular = 0
		return this
	}
}

export interface SteeringBehavior {
	calculateSteering(ctx: PlayerContext, out: SteeringOutput): void
}

/**
 * Helper to convert a Vector3 target (from intentions) to Vector2 (for physics).
 * Maps: x -> x, z -> y (Y is up in 3D, so we use X and Z for ground plane).
 */
function toVector2(target: THREE.Vector3, out: THREE.Vector2): THREE.Vector2 {
	return out.set(target.x, target.z)
}

/**
 * SEEK: Move towards target at max speed.
 * Use for: Chasing, covering large distances quickly.
 */
export class SeekBehavior implements SteeringBehavior {
	// Persistent scratchpad for this instance
	private _target2D = new THREE.Vector2()
	private _desiredVelocity = new THREE.Vector2()

	calculateSteering(ctx: PlayerContext, out: SteeringOutput): void {
		const target = ctx.intentions.targetPosition
		if (!target || !ctx.player.body) return

		toVector2(target, this._target2D)

		// desired = (target - pos).normalize * max_speed
		this._desiredVelocity.subVectors(this._target2D, ctx.player.body.position).normalize().multiplyScalar(MAX_SPEED)

		// steering = desired - velocity
		out.linear.subVectors(this._desiredVelocity, ctx.player.body.velocity)
		out.angular = 0
	}
}

/**
 * ARRIVE: Move towards target and slow down to stop at the spot.
 * Use for: Moving to a tactical position, receiving a pass.
 */
export class ArriveBehavior implements SteeringBehavior {
	private _target2D = new THREE.Vector2()
	private _direction = new THREE.Vector2()
	private _desiredVelocity = new THREE.Vector2()

	calculateSteering(ctx: PlayerContext, out: SteeringOutput): void {
		const target = ctx.intentions.targetPosition
		if (!target || !ctx.player.body) return

		toVector2(target, this._target2D)

		this._direction.subVectors(this._target2D, ctx.player.body.position)
		const distance = this._direction.length()

		if (distance < TARGET_RADIUS) {
			out.linear.set(0, 0)
			out.angular = 0
			return
		}

		let targetSpeed = MAX_SPEED
		if (distance < ARRIVE_RADIUS) {
			targetSpeed = MAX_SPEED * (distance / ARRIVE_RADIUS)
		}

		this._desiredVelocity.copy(this._direction).normalize().multiplyScalar(targetSpeed)
		out.linear.subVectors(this._desiredVelocity, ctx.player.body.velocity)
		out.angular = 0
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
 * FACE: Rotate to face the target.
 * Use for: Jockeying, preparing to shoot/pass.
 * Note: This returns Angular acceleration only.
 */
export class FaceBehavior implements SteeringBehavior {
	private _target2D = new THREE.Vector2()
	private _direction = new THREE.Vector2()

	calculateSteering(ctx: PlayerContext, out: SteeringOutput): void {
		// Check for explicit lookAtTarget hint first, then movement target
		const target = ctx.intentions.lookAtTarget || ctx.intentions.targetPosition
		if (!target || !ctx.player.body) return

		toVector2(target, this._target2D)

		this._direction.subVectors(this._target2D, ctx.player.body.position)
		// Use atan2 on X and Y for 2D ground rotation
		const targetAngle = Math.atan2(this._direction.y, this._direction.x)

		out.linear.set(0, 0)
		out.angular = targetAngle
	}
}
