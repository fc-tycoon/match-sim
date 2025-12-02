/**
 * FC Tycoon™ 2027 Match Simulator - Match Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { Field } from '@/core/Field'
import { Team } from '@/core/Team'
import { Player } from '@/core/Player'
import { DefendingSide } from '@/core/TeamState'
import { Random } from '@/core//Random'
import { EventScheduler, type EventCallback, type ScheduleExternalFn } from '@/core/EventScheduler'
import type { ExternalEventPayload, ExternalEventRecord } from '@/core/ExternalEventTypes'
import { MatchEvent } from '@/core/MatchEvents'
import { Ball } from '@/core/Ball'
import { MatchState, MatchType } from '@/core/MatchState'

export class Match {
	readonly field: Field
	readonly ball: Ball
	readonly teams: [Team, Team]

	/** @type {Player[]} Cached array of all players from both teams (frozen) */
	readonly players: Player[]

	readonly events: MatchEvent[] = []

	// This is the match state handed to the Player AI.
	// We purposefully restrict what the AI can see here.
	// In particular it doesn't have direct access to the Ball or opposition team data/players.
	readonly state: MatchState

	/**
	 * External events are human inputs during a match (substitutions, tactical changes, shouts).
	 * Stored for deterministic replay - see ExternalEventTypes.ts
	 *
	 * AI decisions are deterministic (seeded PRNG) and don't need recording.
	 * Human input is non-deterministic and must be recorded to make replay deterministic.
	 *
	 * All external events MUST be scheduled via match.scheduleExternal() to ensure
	 * they are recorded here. The scheduler's scheduleExternal is private and only
	 * accessible via the exclusive function retrieved in the constructor.
	 */
	readonly externalEvents: ExternalEventRecord[] = []

	/**
	 * Exclusive access to the scheduler's scheduleExternal function.
	 *
	 * Retrieved once in the constructor via getExclusiveScheduleExternalFn().
	 * This ensures Match is the ONLY owner that can schedule external events,
	 * which is critical for centralized recording and deterministic replay.
	 */
	#scheduleExternalFn: ScheduleExternalFn

	constructor(
		field: Field,
		team1: Team,
		team2: Team,
		seed: number,
		scheduler: EventScheduler,
		type: MatchType = MatchType.LEAGUE,
	) {
		this.field = field
		this.teams = [team1, team2]

		this.state = new MatchState(
			type,
			new Random(seed),
			scheduler,
			false,
			false,
		)

		// Get exclusive access to external event scheduling.
		// This ensures all external events go through match.scheduleExternal()
		// and are automatically recorded for replay.
		this.#scheduleExternalFn = scheduler.getExclusiveScheduleExternalFn()

		// Initialize Ball
		this.ball = new Ball({
			field: this.field,
		})

		// Team Attack Directions (World 2D - see COORDINATES.md)
		// Home team (teams[0]): Attacks +X (toward Away goal)
		// Away team (teams[1]): Attacks -X (toward Home goal)
		this.teams[0].state.attackDir.set(1, 0)
		this.teams[1].state.attackDir.set(-1, 0)

		// Team Defending Sides
		// LEFT = Defending -X side (Home team)
		// RIGHT = Defending +X side (Away team)
		this.teams[0].state.defendingSide = DefendingSide.LEFT
		this.teams[1].state.defendingSide = DefendingSide.RIGHT

		// Cache all players from both teams
		this.players = [...this.teams[0].players, ...this.teams[1].players]

		// ═══════════════════════════════════════════════════════════
		//                F R E E Z E   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		// Players cannot be added/removed during a match
		Object.freeze(this.players)
		Object.freeze(this)
	}

	/**
	 * Schedule an external event (manager input) and record it for replay.
	 *
	 * This is the ONLY way to schedule external events. The scheduler's
	 * scheduleExternal function is private and only accessible via this method.
	 * This ensures all external events are recorded for deterministic replay.
	 *
	 * External events use a reserved sequence number range (0 to 999,999) to
	 * ensure they execute FIRST within their tick, before any simulation events.
	 *
	 * @param tickOffset - Offset from earliest safe tick (0 = next available tick)
	 * @param data - External event payload (substitution, tactical change, or shout)
	 * @param callback - Function to execute when the event fires
	 * @returns Index of the recorded event in externalEvents[]
	 *
	 * @example
	 * // Schedule a substitution for the next available tick
	 * match.scheduleExternal(0, {
	 *     type: ExternalEventType.SUBSTITUTION,
	 *     playerOutId: 123,
	 *     playerInId: 456,
	 * }, (event) => {
	 *     const data = event.data as SubstitutionData
	 *     performSubstitution(data.playerOutId, data.playerInId)
	 * })
	 */
	scheduleExternal(tickOffset: number, data: ExternalEventPayload, callback: EventCallback): number {
		const event = this.#scheduleExternalFn(tickOffset, data, callback)

		this.externalEvents.push({
			tick: event.tick,
			seq: event.seq,
			data,
		})

		return this.externalEvents.length - 1
	}

	/**
	 * Switch sides at half-time and extra-time.
	 */
	switchSides() {
		this.teams[0].state.defendingSide *= -1
		this.teams[1].state.defendingSide *= -1
	}

	/**
	 * Get the defending side for a specific team.
	 */
	getDefendingSide(_team: Team): number {
		throw Error('Use: team.defendingSide')
	}

	/**
	 * Get the attacking side for a specific team (opposite of defending).
	 */
	getAttackingSide(_team: Team): number {
		throw Error('Use: -team.defendingSide')
	}
}
