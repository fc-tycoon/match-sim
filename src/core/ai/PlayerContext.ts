/**
 * FC Tycoon™ 2027 Match Simulator - Player AI Context
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { Player } from '@/core/Player'
import { MatchState } from '@/core/MatchState'
import { Team } from '@/core/Team'
import { PlayerIntentions, IntentionType } from '@/core/ai/PlayerIntentions'

export interface PlayerAIState {
	debug: boolean
	// Placeholder for future AI-specific state properties
	currentBehavior: string | null        // e.g. 'RUN_IN_BEHIND', 'PRESS', 'HOLD_SHAPE'
	behaviorStartedTick: number
	behaviorPlannedEndTick: number       // for scheduled / long-running intents
	nextDecisionTick: number             // AI tick scheduling
	lastContextVersionSeen: number       // for reactivity
	// optional:
	//   lastNodeName: string
	//   debugTag: string
	//   any behavior-local data you want (targetPos, targetOpponentId, etc.)
}

/**
 * PLAYER CONTEXT (The "Blackboard")
 *
 * This class serves as the data container for the AI decision-making process.
 * In our "Stateless AI" architecture, the Logic (BrainStem) is immutable and shared,
 * while the Data (PlayerContext) is unique to each agent and passed through the tree.
 *
 * It aggregates all the knowledge the player has access to:
 * - Self: The physical player entity (stats, position).
 * - Memory: The player's perception of the world (can be flawed/outdated).
 * - Team: Tactical instructions and squad data.
 * - Match: Global truth (time, score, ball position).
 * - Intentions: The current goals/desires of the agent.
 * - Steering: The motor control system to execute movement intentions.
 */
export class PlayerContext {
	/** The physical player entity this context belongs to. */
	readonly player: Player
	/** The global match state (source of truth). */
	readonly match: MatchState
	/** The team this player belongs to (tactics, teammates). */
	readonly team: Team

	// Subsystems (Owned by the Context/Agent)
	/** The current intention set by the AI. */
	readonly intentions: PlayerIntentions

	// Scratchpad State
	readonly ai: PlayerAIState = {
		debug: false,
		currentBehavior: null,
		behaviorStartedTick: 0,
		behaviorPlannedEndTick: 0,
		nextDecisionTick: 0,
		lastContextVersionSeen: 0,
	}

	/**
	 * Creates a new execution context for an AI agent.
	 * @param player - The player entity.
	 * @param match - The current match state.
	 * @param team - The player's team.
	 */
	constructor(
		player: Player,
		match: MatchState,
		team: Team,
	) {
		this.player = player
		this.match = match
		this.team = team

		// Initialize Subsystems

		this.intentions = {
			type: IntentionType.IDLE,
		}

		// ═══════════════════════════════════════════════════════════
		//                  S E A L   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.seal(this.ai)

		// ═══════════════════════════════════════════════════════════
		//                F R E E Z E   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.freeze(this)
	}
}
