/**
 * FC Tycoon™ 2027 Match Simulator - Period of Play
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

export const enum PeriodOfPlay {
	NONE = 0,						// For pre-match setup, half-time intervals, full-time, etc. The ball is not in play.
	FIRST_HALF = 1,
	SECOND_HALF = 2,
	EXTRA_TIME_FIRST_HALF = 3,
	EXTRA_TIME_SECOND_HALF = 4,
	PENALTIES = 5,
}

// Mainly used for drop down lists and UI descriptions
export const period_of_play = new Map([
	[PeriodOfPlay.NONE, 'Not in Play'],
	[PeriodOfPlay.FIRST_HALF, 'First Half'],
	[PeriodOfPlay.SECOND_HALF, 'Second Half'],
	[PeriodOfPlay.EXTRA_TIME_FIRST_HALF, 'Extra Time First Half'],
	[PeriodOfPlay.EXTRA_TIME_SECOND_HALF, 'Extra Time Second Half'],
	[PeriodOfPlay.PENALTIES, 'Penalties'],
])

/**
 * Match phases (game states)
 * This drives Player AI behavior (decisions and movement) as well as certain match logic.
 * For example, during KICKOFF phase, players will move to their kickoff positions.
 * During PLAYING phase, normal play occurs.
 * Other phases like GOAL_KICK, CORNER_KICK, etc. set up specific scenarios.
 * HALF_TIME and FULL_TIME indicate breaks in play.
 * GOAL_CELEBRATION is a brief pause after a goal is scored.
 */
export const enum OpenPlayPhase { // AKA OpenPlayPhase ... phases of open play
	PRE_MATCH = 0,
	KICKOFF,			// Players move to kickoff positions.
	PLAYING,			// Normal/open play phase.
	GOAL_KICK,			// Goal Kick scenario setup.
	CORNER_KICK,		// Corner Kick scenario setup.
	THROW_IN,			// Throw-In scenario setup.
	FREE_KICK,			// Free Kick scenario setup.
	PENALTY,			// Two types: Penalty Kick during normal play, and Penalty Shootout. Check the PeriodOfPlay to determine which.
	GOAL_CELEBRATION,	// Brief pause after a goal is scored.
	HALF_TIME,			// Players move towards the tunnel, teams go to locker rooms.
	FULL_TIME,			// Match has ended.
}

export enum MatchPhase {
	PRE_MATCH_CEREMONY,
	PRE_FIRST_HALF_KICKOFF,
	FIRST_HALF,
	FIRST_HALF_ADDED_TIME,
	HALF_TIME_INTERVAL,
	PRE_SECOND_HALF_KICKOFF,
	SECOND_HALF,
	SECOND_HALF_ADDED_TIME,
	FULL_TIME,
	EXTRA_TIME_FIRST_PERIOD,
	EXTRA_TIME_FIRST_PERIOD_ADDED_TIME,
	EXTRA_TIME_INTERVAL,
	EXTRA_TIME_SECOND_PERIOD,
	EXTRA_TIME_SECOND_PERIOD_ADDED_TIME,
	PENALTY_SHOOTOUT,
	POST_MATCH_CEREMONY,
}
