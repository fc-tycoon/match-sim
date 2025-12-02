import { Player } from './Player'
import { Team } from './Team'

export const enum MatchEventType {
	PERIOD_START,
	PERIOD_END,
	KICK_OFF,
	HALF_TIME,
	FULL_TIME,

	GOAL,
	OWN_GOAL,
	PENALTY_AWARDED,
	PENALTY_KICK,
	PENALTY_SHOOTOUT_KICK,

	GOAL_RESTART,

	SHOT,
	SAVE,
	OFFSIDE,
	FOUL,
	CARD,

	// Match interventions:
	SUBSTITUTION,
	TACTICAL,
	SHOUT,
}

export interface MatchClock {
	// Internal engine time:
	tick: number

	// NOTE: A "tick" might not actually correspond exactly to real time, depending on simulation speed etc.
	// For example, each tick could represent 3 milliseconds of real time, making a 90-minute match take 30 minutes to simulate. Or 5 ms per tick for 18 minutes total (90 / 5).
	// 90 / 3 = 30 minutes
	// 90 / 4 = 22.5 minutes
	// 90 / 5 = 18 minutes

	// Presentation time:
	minute: number           // 0–120 etc
	second: number           // 0–59
	addedMinute?: number     // for 45+2, 90+3, 105+1 etc
}

/**
 * Event Module
 * ----------------
 * This module defines the Event class, which represents discrete occurrences during a football match.
 * Events can include goals, fouls, cards, substitutions, tactical changes, shouts, and other significant actions that impact the match state.
 *
 * The Event class tracks the match tick at which the event occurs and can be extended to include additional event-specific data.
 */
export interface MatchEventBase {
	tick: number

	type: MatchEventType
	periodId: string            // links into MatchPeriod
	time: MatchClock
}

export type MatchEvent =
	| MatchEventBase          // for generic/unstructured events
	| GoalEvent
	| CardEvent
	| PenaltyShootoutKickEvent
	| SubstitutionEvent
	| ShotEvent

export interface GoalEvent extends MatchEventBase {
	type: MatchEventType.GOAL | MatchEventType.OWN_GOAL
	scoringTeam: Team
	scoringPlayer: Player
	assistPlayerId?: Player
	isFromPenalty: boolean      // penalty taken in live play, NOT shootout
	isFromFreeKick: boolean
	isHeader: boolean
	xg?: number
}

export const enum PenaltyOutcome {
	SCORED,
	MISSED,
	SAVED,
}

export interface PenaltyShootoutKickEvent extends MatchEventBase {
	type: MatchEventType.PENALTY_SHOOTOUT_KICK
	order: number              // 1, 2, 3, ...
	team: Team
	player: Player
	outcome: PenaltyOutcome
	isSuddenDeath: boolean
}

export enum CardType {
	YELLOW = 1,
	SECOND_YELLOW = 2,
	RED = 3,
}

export interface CardEvent extends MatchEventBase {
	type: MatchEventType.CARD
	player: Player
	cardType: CardType
	// reason?: ...
}

export interface SubstitutionEvent extends MatchEventBase {
	type: MatchEventType.SUBSTITUTION
	team: Team
	playerOff: Player
	playerOn: Player
}

export interface ShotEvent extends MatchEventBase {
	type: MatchEventType.SHOT
	team: Team
	player: Player
	onTarget: boolean
	xg?: number
}
