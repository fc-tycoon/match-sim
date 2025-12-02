/**
 * FC Tycoon™ 2027 Match Simulator - AI Play States
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

// NOT USED ANYMORE - REPLACED BY PlayState
export const enum _PlayState {
	/** The ball is rolling, players track ball/opponents dynamically */
	LIVE = 0,

	/** The ball is out/stopped. Players must move to "Setup" positions */
	DEAD_BALL = 1,

	/** Administrative stoppage (VAR check, Injury, Sub, Celebration) */
	PAUSED = 2,

	/** The game is effectively over or in a major break (Half-time) */
	SUSPENDED = 3
}

// Determines AI Player movement and behavior
// We do not put any states here that are not directly used to drive on-field AI player movement and decision making.
// ALL these states are directly linked to player movement/behavior/decision making on the field while the simulation is running
// This is the intersection point between what's happening in the match, and how the Player AI behaves
export const enum AiPlayState {
	NORMAL_PLAY,			// AKA "Open Play"

	// Set pieces
	// The Referee signals for the set piece to be taken (ball is placed, players move into position, designated taker gets ready)
	// The Referee then transitions to the actual set piece state when all players are ready and the taker is ready to take the kick
	KICKOFF_SETUP,			// Players move to kickoff positions. The designated kickoff taker is ready to take the kick.
	KICKOFF,				// The designated kickoff taker makes the kickoff kick.
	THROW_IN_SETUP,			// Players move to throw-in positions. The designated thrower takes the ball and is ready to take the throw-in.
	THROW_IN,				// The designated thrower makes a run up and takes the throw-in.
	GOAL_KICK_SETUP,		// Players move to goal kick positions. The designated goal kick taker places the ball, moves back and gets ready to take the kick.
	GOAL_KICK,				// The designated goal kick taker makes a run up and takes the kick.
	CORNER_KICK_SETUP,
	CORNER_KICK,			// The designated corner taker makes a run up and takes the kick.
	FREE_KICK_SETUP,		// This could be a quick free kick or a set piece free kick. Players move into position, the designated free kick taker places the ball and gets ready to take the kick.
	FREE_KICK,				// The designated free kick taker makes a run up and takes the kick.
	PENALTY_KICK_SETUP,
	PENALTY_KICK,			// The designated penalty taker makes a run up and takes the kick.

	// Penalty Shootout
	PENALTY_SHOOTOUT_KICK_SETUP,
	PENALTY_SHOOTOUT_KICK,		// The designated penalty taker makes a run up and takes the kick.
	PENALTY_SHOOTOUT_KICKED,	// Ball has been kicked, Goalkeeper tries to save. Only the Goalkeeper is active during this state.

	// Match events/breaks
	GOAL_CELEBRATION,		// Scoring team celebrates, transitions to KICKOFF_SETUP
	HALF_TIME_BREAK,		// Players move towards the tunnel.
	EXTRA_TIME_BREAK,		// Players move towards the manager.
	PENALTY_SHOOTOUT_BREAK, // e.g., between kicks

	// Ceremonial
	PRE_MATCH_CEREMONY,
	POST_MATCH_CEREMONY,

	// Stoppages
	STOPPAGE_FOUL,
	STOPPAGE_OFFSIDE,
	STOPPAGE_CARD,
	STOPPAGE_SUBSTITUTION,	// NOTE: A substitution decision can be made at any point, then you'll see the player move to the sideline. THEN the match state will enter the STOPPAGE_SUBSTITUTION state.
}

/**
 * Team-specific tactical states.
 * These describe the current strategic context for a specific team.
 */
export const enum AiTeamState {
	// Defending Phases
	DEFENDING_DEEP,			// "Parking the bus", low block
	DEFENDING_MID_BLOCK,	// Standard defensive shape
	DEFENDING_HIGH_PRESS,	// Aggressive pressing in opponent half
	DEFENDING_SET_PIECE,	// Defending a corner or free kick

	// Transition Phases
	TRANSITION_TO_ATTACK,	// Won possession, looking to counter
	TRANSITION_TO_DEFENSE,	// Lost possession, recovering shape

	// Attacking Phases
	ATTACKING_BUILDUP,		// Controlled possession in own/middle third
	ATTACKING_FINAL_THIRD,	// Looking for scoring opportunity
	ATTACKING_SET_PIECE,	// Taking a corner or free kick
}

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
