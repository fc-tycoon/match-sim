/**
 * FC Tycoon™ 2027 Match Simulator - Head Movement System
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import type { PlayerBody } from '@/core/ai/PlayerBody'
import type { Random } from '@/core/Random'

// ═══════════════════════════════════════════════════════════════════════════════
//                      C O N S T A N T S
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Head movement constraints and parameters.
 *
 * HEAD ROTATION LIMITS (relative to body):
 * - Humans can rotate head ~80° to each side (comfortable range ~60°)
 * - Football players frequently "check shoulders" (~90° quick glances)
 */
export const HeadConstants = Object.freeze({
	/** Maximum head rotation from body direction (radians) ~80° */
	MAX_HEAD_ROTATION: Math.PI * 0.44,

	/** Maximum angular speed for head rotation (rad/s) */
	MAX_HEAD_ANGULAR_SPEED: 6.0,

	/** Duration to hold a "check shoulder" glance (ms) */
	SHOULDER_CHECK_DURATION: 200,

	/** Duration to look at destination when moving (ms) */
	LOOK_AT_DESTINATION_DURATION: 400,

	/** Minimum time between random look-around (ms) */
	LOOK_AROUND_MIN_INTERVAL: 800,

	/** Maximum time between random look-around (ms) */
	LOOK_AROUND_MAX_INTERVAL: 2500,

	/** How long a random look-around lasts (ms) */
	LOOK_AROUND_DURATION: 350,
})

// ═══════════════════════════════════════════════════════════════════════════════
//                      H E A D   B E H A V I O R S
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Head behavior states - what the head is currently doing.
 */
export const enum HeadBehavior {
	/** Head follows body direction (default) */
	FOLLOW_BODY,
	/** Looking at a specific target (ball, opponent, teammate) */
	LOOK_AT_TARGET,
	/** Looking toward movement destination */
	LOOK_AT_DESTINATION,
	/** Quick glance to check shoulder (left or right) */
	CHECK_SHOULDER,
	/** Random look-around for awareness */
	LOOK_AROUND,
}

/**
 * Head movement state - tracks current head behavior and timing.
 */
export interface HeadState {
	behavior: HeadBehavior
	/** Target angle for head (relative to body, radians) */
	targetAngle: number
	/** When current behavior started (tick) */
	startedTick: number
	/** When current behavior should end (tick) */
	endTick: number
	/** Next scheduled look-around (tick) */
	nextLookAroundTick: number
}

// ═══════════════════════════════════════════════════════════════════════════════
//                      H E A D   M O V E M E N T   S Y S T E M
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * HeadMovementSystem manages natural head movement for players.
 *
 * RESPONSIBILITIES:
 * - Rotate head toward points of interest
 * - Periodic "check shoulder" behavior
 * - Random look-around for awareness
 * - Smooth head rotation within constraints
 *
 * DOES NOT:
 * - Affect body movement (that's steering/physics)
 * - Make AI decisions (that's the brain)
 *
 * The system operates on PlayerBody.headAngle directly (relative to body).
 */
export class HeadMovementSystem {
	/**
	 * Initialize head state for a player.
	 * Call once when player is created.
	 *
	 * @param currentTick - Current simulation tick
	 * @param random - Random number generator for scheduling
	 * @returns Initial head state
	 */
	static createState(currentTick: number, random: Random): HeadState {
		return {
			behavior: HeadBehavior.FOLLOW_BODY,
			targetAngle: 0,
			startedTick: currentTick,
			endTick: currentTick,
			nextLookAroundTick: currentTick + random.int(
				HeadConstants.LOOK_AROUND_MIN_INTERVAL,
				HeadConstants.LOOK_AROUND_MAX_INTERVAL,
			),
		}
	}

	/**
	 * Update head direction for a player.
	 * Call every physics tick.
	 *
	 * @param body - Player body to update
	 * @param state - Head movement state
	 * @param currentTick - Current simulation tick
	 * @param dt - Delta time in seconds
	 * @param random - Random number generator
	 * @param hasDestination - Whether player is moving to a destination
	 * @param destinationAngle - Angle to destination (world space, radians)
	 */
	static update(
		body: PlayerBody,
		state: HeadState,
		currentTick: number,
		dt: number,
		random: Random,
		hasDestination: boolean = false,
		destinationAngle: number = 0,
	): void {
		// Check if current behavior has ended
		if (currentTick >= state.endTick) {
			// Reset to follow body
			state.behavior = HeadBehavior.FOLLOW_BODY
			state.targetAngle = 0
		}

		// Check if it's time for a random look-around
		if (currentTick >= state.nextLookAroundTick && state.behavior === HeadBehavior.FOLLOW_BODY) {
			this.triggerLookAround(state, currentTick, random)
		}

		// Calculate target head angle based on behavior
		let targetWorldAngle: number

		switch (state.behavior) {
		case HeadBehavior.LOOK_AT_DESTINATION:
			// Look toward destination
			targetWorldAngle = destinationAngle
			break

		case HeadBehavior.CHECK_SHOULDER:
		case HeadBehavior.LOOK_AROUND:
			// Use stored relative angle
			targetWorldAngle = this.bodyAngle(body) + state.targetAngle
			break

		case HeadBehavior.FOLLOW_BODY:
		default:
			// If moving to destination, occasionally glance that way
			if (hasDestination && random.chance(0.05)) { // 5% per tick to glance at destination
				this.triggerLookAtDestination(state, currentTick, destinationAngle, body)
			}
			// Default: head follows body
			targetWorldAngle = this.bodyAngle(body)
			break
		}

		// Apply head rotation with constraints
		this.rotateHeadToward(body, targetWorldAngle, dt)
	}

	/**
	 * Trigger a shoulder check (quick glance to left or right).
	 *
	 * @param state - Head state to modify
	 * @param currentTick - Current tick
	 * @param isLeft - Check left shoulder (true) or right (false)
	 */
	static triggerShoulderCheck(state: HeadState, currentTick: number, isLeft: boolean): void {
		state.behavior = HeadBehavior.CHECK_SHOULDER
		state.targetAngle = isLeft
			? HeadConstants.MAX_HEAD_ROTATION * 0.9
			: -HeadConstants.MAX_HEAD_ROTATION * 0.9
		state.startedTick = currentTick
		state.endTick = currentTick + HeadConstants.SHOULDER_CHECK_DURATION
	}

	/**
	 * Trigger looking at destination.
	 */
	private static triggerLookAtDestination(
		state: HeadState,
		currentTick: number,
		destAngle: number,
		body: PlayerBody,
	): void {
		const bodyAngle = this.bodyAngle(body)
		const relativeAngle = this.normalizeAngle(destAngle - bodyAngle)

		// Only look if destination is within head rotation range
		if (Math.abs(relativeAngle) <= HeadConstants.MAX_HEAD_ROTATION) {
			state.behavior = HeadBehavior.LOOK_AT_DESTINATION
			state.targetAngle = relativeAngle
			state.startedTick = currentTick
			state.endTick = currentTick + HeadConstants.LOOK_AT_DESTINATION_DURATION
		}
	}

	/**
	 * Trigger random look-around behavior.
	 */
	private static triggerLookAround(state: HeadState, currentTick: number, random: Random): void {
		state.behavior = HeadBehavior.LOOK_AROUND
		// Random angle within head rotation range
		state.targetAngle = random.float(
			-HeadConstants.MAX_HEAD_ROTATION * 0.8,
			HeadConstants.MAX_HEAD_ROTATION * 0.8,
		)
		state.startedTick = currentTick
		state.endTick = currentTick + HeadConstants.LOOK_AROUND_DURATION

		// Schedule next look-around
		state.nextLookAroundTick = currentTick + random.int(
			HeadConstants.LOOK_AROUND_MIN_INTERVAL,
			HeadConstants.LOOK_AROUND_MAX_INTERVAL,
		)
	}

	/**
	 * Rotate head toward target angle, respecting constraints.
	 * @param body Player body to rotate head
	 * @param targetWorldAngle Target world angle in radians
	 * @param dt Delta time in seconds
	 */
	private static rotateHeadToward(body: PlayerBody, targetWorldAngle: number, dt: number): void {
		const bodyAngle = this.bodyAngle(body)

		// Calculate relative target angle from body
		let relativeTarget = this.normalizeAngle(targetWorldAngle - bodyAngle)

		// Clamp to head rotation limits
		relativeTarget = Math.max(
			-HeadConstants.MAX_HEAD_ROTATION,
			Math.min(HeadConstants.MAX_HEAD_ROTATION, relativeTarget),
		)

		// Calculate angle difference from current head position
		let angleDiff = relativeTarget - body.headAngle

		// Apply rotation at limited speed
		const maxRotation = HeadConstants.MAX_HEAD_ANGULAR_SPEED * dt
		const rotation = Math.max(-maxRotation, Math.min(maxRotation, angleDiff))

		// Set new head angle (clamped handles constraint)
		body.setHeadAngleClamped(body.headAngle + rotation)
	}

	/**
	 * Get body angle from direction vector.
	 */
	private static bodyAngle(body: PlayerBody): number {
		return Math.atan2(body.bodyDir.y, body.bodyDir.x)
	}

	/**
	 * Normalize angle to [-PI, PI].
	 */
	private static normalizeAngle(angle: number): number {
		while (angle > Math.PI) angle -= 2 * Math.PI
		while (angle < -Math.PI) angle += 2 * Math.PI
		return angle
	}
}
