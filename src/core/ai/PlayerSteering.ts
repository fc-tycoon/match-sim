/**
 * FC Tycoon™ 2027 Match Simulator - Player Steering System
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import type { Player } from '@/core/Player'
import { PlayerContext } from '@/core/ai/PlayerContext'
import {
	SteeringOutput,
	SeekBehavior,
	ArriveBehavior,
	PursueBehavior,
	FaceBehavior,
	CollisionAvoidanceBehavior,
} from '@/core/ai/SteeringBehaviors'
import { IntentionType } from '@/core/ai/PlayerIntentions'

export class PlayerSteering {
	private _player: Player
	private _output: SteeringOutput = new SteeringOutput()

	// Behaviors
	// We instantiate them once per player to avoid any sharing issues,
	// although they are mostly stateless (except temp vars).
	private _seek: SeekBehavior = new SeekBehavior()
	private _arrive: ArriveBehavior = new ArriveBehavior()
	private _pursue: PursueBehavior = new PursueBehavior()
	private _face: FaceBehavior = new FaceBehavior()
	private _collisionAvoidance: CollisionAvoidanceBehavior = new CollisionAvoidanceBehavior()

	constructor(player: Player) {
		this._player = player
	}

	/**
	 * Calculates the steering force based on the current intention.
	 * @param dt Delta time in seconds
	 * @param ctx The player's AI context (contains memory, match state, etc.)
	 * @returns The steering output (force and torque)
	 */
	update(dt: number, ctx: PlayerContext): SteeringOutput {
		this._output.clear()

		const intention = ctx.intentions

		switch (intention.type) {
		case IntentionType.MOVE_TO:
			// Standard movement
			this._arrive.calculateSteering(ctx, this._output)
			break

		case IntentionType.SPRINT_TO:
			// Urgent movement - ignore slowing down radius until very close?
			// For now, use Seek for urgency, or Arrive with smaller radius.
			this._seek.calculateSteering(ctx, this._output)
			break

		case IntentionType.CHASE:
		case IntentionType.PRESS:
			this._pursue.calculateSteering(ctx, this._output)
			break

		case IntentionType.JOCKEY:
		case IntentionType.MARK:
		case IntentionType.GK_COVER_ANGLE:
			// Face target + maintain distance
			this._face.calculateSteering(ctx, this._output)
			// TODO: Add 'MaintainDistance' or 'Interpose' behavior
			break

		case IntentionType.IDLE:
		case IntentionType.GK_IDLE:
			// Stop moving, but apply facing if faceTarget is set
			this._output.linear.set(0, 0)
			if (ctx.intentions.faceTarget) {
				this._face.calculateSteering(ctx, this._output)
			}
			break

		default:
			// Default to stop
			this._output.linear.set(0, 0)
			break
		}

		// ═══════════════════════════════════════════════════════════
		// APPLY COLLISION AVOIDANCE (always, except when idle)
		// ═══════════════════════════════════════════════════════════
		// This adds an avoidance force to prevent players from walking
		// through each other. Applied after the main behavior.

		if (intention.type !== IntentionType.IDLE && intention.type !== IntentionType.GK_IDLE) {
			this._collisionAvoidance.applyAvoidance(ctx, this._output)
		}

		return this._output
	}
}
