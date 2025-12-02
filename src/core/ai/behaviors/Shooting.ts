/**
 * FC Tycoon™ 2027 Match Simulator - Shooting Behavior
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { Sequence, Condition, Action, Selector, IfElse } from '@/core/ai/AiPrimitives'
import { PlayerContext } from '@/core/ai/PlayerContext'

// =============================================================================
// SHOOTING BEHAVIOR (GOAL-ORIENTED)
// Goal: "Score a Goal"
// Logic: Explicit If/Else branching to prevent fall-through.
// =============================================================================

// -----------------------------------------------------------------------------
// CONDITIONS
// -----------------------------------------------------------------------------

const IsInShootingRange = new Condition('IsInShootingRange', (ctx: PlayerContext) => {
	const goalX = ctx.player.team.id === 0 ? 50 : -50
	const playerX = ctx.player.body?.position.x ?? 0
	const dist = Math.abs(playerX - goalX)
	return dist < 25
})

const HasLineOfSight = new Condition('HasLineOfSight', (_ctx: PlayerContext) => {
	return true
})

// -----------------------------------------------------------------------------
// ACTIONS
// -----------------------------------------------------------------------------

const CommitToShot = new Action('CommitToShot', (ctx: PlayerContext) => {
	console.log(`Player ${ctx.player.id} -> SHOOTING`)
})

const MoveToShootingRange = new Action('MoveToShootingRange', (ctx: PlayerContext) => {
	console.log(`Player ${ctx.player.id} -> MOVING TO RANGE`)
})

const CreateShootingAngle = new Action('CreateShootingAngle', (ctx: PlayerContext) => {
	console.log(`Player ${ctx.player.id} -> CREATING ANGLE`)
})

// -----------------------------------------------------------------------------
// THE BEHAVIOR TREE (Explicit Branching)
// -----------------------------------------------------------------------------

// Logic:
// IF (In Range) {
//    Try to Shoot OR Create Angle
// } ELSE {
//    Move To Range
// }

export const ScoreGoalBehavior = new IfElse('ScoreGoalLogic',
	// 1. The Condition
	IsInShootingRange,

	// 2. THEN: We are in range. We are COMMITTED to this branch.
	// Even if shooting fails, we will NOT fall through to "MoveToShootingRange".
	new Selector('InPositionOptions', [
		// Option A: Shoot immediately
		new Sequence('ShootNow', [ HasLineOfSight, CommitToShot ]),

		// Option B: We are in range but blocked -> Fix Angle
		CreateShootingAngle,
	]),

	// 3. ELSE: We are not in range.
	MoveToShootingRange,
)
