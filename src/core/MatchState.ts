/**
 * FC Tycoon™ 2027 Match Simulator - Match State
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { EventScheduler } from '@/core/EventScheduler'
import { Random } from '@/core/Random'

// Determines part of the match intensity. For instance, AI Managers might behave more aggressively in KNOCKOUT matches.
// NOTE: There is another MatchIntensity in TeamState.ts that is per-team.
export const enum MatchType {
	FRIENDLY,
	LEAGUE,
	KNOCKOUT,	// e.g. cup matches, tournaments. What about group stages?
}

/**
 * MatchState.ts
 *
 * This structure is given to players' AI to make decisions based on the current match context.
 * Along with TeamState, it forms the basis of the AI decision-making process.
 * @module core/MatchState
 */
export class MatchState {
	readonly type: MatchType
	readonly rand: Random
	readonly scheduler: EventScheduler

	timeElapsed: number = 0
	totalTime: number = 0
	kickoff: number = 0

	readonly hasExtraTime: boolean
	readonly hasPenalties: boolean

	constructor(
		type: MatchType,
		rand: Random,
		scheduler: EventScheduler,
		hasExtraTime: boolean,
		hasPenalties: boolean,
	) {
		this.type = type
		this.rand = rand
		this.scheduler = scheduler
		this.hasExtraTime = hasExtraTime
		this.hasPenalties = hasPenalties

		Object.seal(this)
	}
}
