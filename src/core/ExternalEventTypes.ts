/**
 * FC Tycoon™ 2027 Match Simulator - External Event Types
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

/**
 * External Event Types Module
 * ---------------------------
 *
 * This module defines the types for external events (human input only) that can
 * be injected into the match simulation. These types are shared between:
 *
 * - EventScheduler (for type-safe scheduleExternal)
 * - Match (for the externalEvents array and scheduleExternal method)
 *
 * External events are EXCLUSIVELY for human input - state changes from "outside"
 * the deterministic simulation. AI decisions are driven by the seeded PRNG and
 * don't need recording. Human input is non-deterministic and must be recorded
 * to make replay deterministic.
 *
 * Examples: human-initiated substitutions, tactical changes, sideline shouts.
 *
 * @see EventScheduler.getExclusiveScheduleExternalFn() for scheduling API
 * @see Match.scheduleExternal() for the public scheduling interface
 */

// ═══════════════════════════════════════════════════════════════════════════
//                          E X T E R N A L   E V E N T   T Y P E S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Types of external events (manager inputs)
 *
 * These are stored in the database as ENUM fields.
 * Values are auto-assigned (0, 1, 2) by TypeScript const enum.
 */
export const enum ExternalEventType {
	/** Player substitution (player out, player in) */
	SUBSTITUTION,

	/** Tactical change (formation, instructions, mentality) */
	TACTICAL,

	/** Sideline shout to a player (PRESS_HIGH, HOLD_POSITION, etc.) */
	SHOUT,
}

// ═══════════════════════════════════════════════════════════════════════════
//                          E X T E R N A L   E V E N T   D A T A
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base interface for all external event data payloads
 */
export interface ExternalEventData {
	type: ExternalEventType
}

/**
 * Substitution event data
 */
export interface SubstitutionData extends ExternalEventData {
	type: ExternalEventType.SUBSTITUTION
	/** ID of player being substituted off */
	playerOutId: number
	/** ID of player coming on */
	playerInId: number
	/** Position slot the incoming player will take (optional, defaults to outgoing player's slot) */
	positionSlotId?: number
}

/**
 * Tactical change event data
 */
export interface TacticalChangeData extends ExternalEventData {
	type: ExternalEventType.TACTICAL
	/** Team ID making the change */
	teamId: number
	/** New formation ID (optional) */
	formationId?: number
	/** Changed instructions (optional) */
	instructions?: Record<number, unknown>
	/** New mentality (optional) */
	mentality?: number
}

/**
 * Shout types available to managers
 *
 * These are stored in the database as ENUM fields.
 * Values are auto-assigned by TypeScript const enum.
 */
export const enum ShoutType {
	/** Press high up the pitch */
	PRESS_HIGH,
	/** Press harder - more aggressive than normal */
	PRESS_HARDER,
	/** Hold current position */
	HOLD_POSITION,
	/** Get forward into attack */
	GET_FORWARD,
	/** Track back defensively */
	TRACK_BACK,
	/** Demand more effort */
	DEMAND_MORE,
	/** Encourage/praise */
	ENCOURAGE,
	/** Urge player to stay focused */
	FOCUS,
	/** Urge player to concentrate */
	CONCENTRATE,
	/** Calm the player down */
	CALM_DOWN,
	/** Relax and take it easy */
	RELAX,
	/** Have fun - good for youngsters */
	HAVE_FUN,
	/** Criticize a player - must be used sparingly */
	CRITICIZE,
	/** Close down the opponent quickly */
	CLOSE_DOWN,
}

/**
 * Shout event data
 */
export interface ShoutData extends ExternalEventData {
	type: ExternalEventType.SHOUT
	/** ID of player being shouted at */
	playerId: number
	/** Type of shout */
	shoutType: ShoutType
}

/**
 * Union type for all external event data payloads
 *
 * This is the required data type for scheduling external events.
 * The `type` field discriminates between the three event types.
 */
export type ExternalEventPayload = SubstitutionData | TacticalChangeData | ShoutData

// ═══════════════════════════════════════════════════════════════════════════
//                  E X T E R N A L   E V E N T   R E C O R D
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Recorded external event for storage and replay.
 *
 * This is the format stored in the database and used for deterministic replay.
 * The seq number ensures identical execution order during replay.
 */
export interface ExternalEventRecord {
	/** Absolute tick (0 to ~5.4M for 90 min match) */
	tick: number

	/** Sequence number (0, 1, 2, 3... - determines execution order within tick) */
	seq: number

	/** Event-specific payload (contains type discriminator) */
	data: ExternalEventPayload
}
