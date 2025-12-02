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
 * - bodyDir/headDir/eyeDir: Unit vectors (length = 1) indicating facing direction
 *
 * Direction Convention:
 * - { x: 1, y: 0 } = facing +X (toward Away goal)
 * - { x: -1, y: 0 } = facing -X (toward Home goal)
 * - { x: 0, y: 1 } = facing +Y (toward top touchline)
 * - { x: 0, y: -1 } = facing -Y (toward bottom touchline/camera)
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
	bodyDir: THREE.Vector2 = new THREE.Vector2(1, 0)

	/** Head facing direction (unit vector, relative to body or absolute TBD) */
	headDir: THREE.Vector2 = new THREE.Vector2(1, 0)

	/** Eye gaze direction (unit vector, relative to head) */
	eyeDir: THREE.Vector2 = new THREE.Vector2(1, 0)

	// ═══════════════════════════════════════════════════════════════════════════
	//                      S U B S Y S T E M S
	// ═══════════════════════════════════════════════════════════════════════════

	steering: PlayerSteering
	vision: PlayerVision

	/** Physical fatigue: 0.0 (fresh) to 1.0 (exhausted) */
	fatigue: number = 0.0

	constructor(player: Player, match: Match) {
		this.player = player
		this.steering = new PlayerSteering(player)
		this.vision = new PlayerVision(player, match)
	}

	/**
	 * Applies steering forces to the player's velocity and updates position.
	 * @param dt Delta time in seconds
	 * @param steering The steering output (force and torque)
	 */
	integrate(dt: number, steering: SteeringOutput) {
		// Apply linear acceleration to velocity
		this.velocity.addScaledVector(steering.linear, dt)

		// Apply angular velocity to rotate bodyDir
		if (Math.abs(steering.angular) > 0.001) {
			const cos = Math.cos(steering.angular * dt)
			const sin = Math.sin(steering.angular * dt)
			const newX = this.bodyDir.x * cos - this.bodyDir.y * sin
			const newY = this.bodyDir.x * sin + this.bodyDir.y * cos
			this.bodyDir.set(newX, newY).normalize()
		}

		// Apply braking when no steering force
		if (steering.linear.lengthSq() < 0.001) {
			const speed = this.velocity.length()
			if (speed > 0) {
				const brakingForce = 10.0 // m/s²
				const newSpeed = Math.max(0, speed - brakingForce * dt)
				this.velocity.multiplyScalar(newSpeed / speed)
			}
		}

		// Cap speed
		// TODO: Use player stats (pace)
		const maxSpeed = 9.5
		if (this.velocity.lengthSq() > maxSpeed * maxSpeed) {
			this.velocity.setLength(maxSpeed)
		}

		// Update position
		this.position.addScaledVector(this.velocity, dt)

		// Body rotation is controlled ONLY by steering.angular
		// Velocity does NOT affect body direction - players can move sideways/backwards
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
			this.bodyDir.set(dx / len, dy / len)
		}
	}

	/**
	 * Set body direction to face along velocity (if moving).
	 */
	faceMovementDirection() {
		const speed = this.velocity.length()
		if (speed > 0.1) {
			this.bodyDir.copy(this.velocity).normalize()
		}
	}

	/**
	 * Get angle of body direction (for compatibility with angle-based systems).
	 * @returns Angle in radians (0 = +X, counter-clockwise positive)
	 */
	getBodyAngle(): number {
		return Math.atan2(this.bodyDir.y, this.bodyDir.x)
	}

	/**
	 * Set body direction from angle (for compatibility with angle-based systems).
	 * @param angle Angle in radians (0 = +X, counter-clockwise positive)
	 */
	setBodyAngle(angle: number) {
		this.bodyDir.set(Math.cos(angle), Math.sin(angle))
	}
}
