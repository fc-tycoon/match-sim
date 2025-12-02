/**
 * FC Tycoon™ 2027 Match Simulator - Match Engine
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { Match } from './Match'
import { PlayerBody } from '@/core/ai/PlayerBody'
import { PlayerContext } from '@/core/ai/PlayerContext'
import { EventType } from '@/core/EventScheduler'
import { Player } from '@/core/Player'
import { RealTimeScheduler } from './RealTimeScheduler'
import { HeadlessScheduler } from './HeadlessScheduler'

export class MatchEngine {
	readonly match: Match
	readonly headless: HeadlessScheduler | null = null
	readonly realtime: RealTimeScheduler | null = null

	constructor(match: Match, scheduler: HeadlessScheduler | RealTimeScheduler) {
		this.match = match
		if (scheduler instanceof HeadlessScheduler) {
			this.headless = scheduler
		} else {
			this.realtime = scheduler
		}

		Object.freeze(this)
	}

	initialize() {
		// 1. Initialize Players (Body, Vision, AI)
		for (const team of this.match.teams) {
			// Only create bodies for players currently in the formation (on the pitch)
			const slotPlayers = team.tactics.formation.slotPlayers
			for (const slotPlayer of slotPlayers) {
				const player = slotPlayer.player
				const slot = slotPlayer.slot
				const isGoalkeeper = slot.code === 'GK'

				// Create Body (which creates Vision)
				player.body = new PlayerBody(player, this.match)

				// Set initial position
				if (isGoalkeeper) {
					// GKs are positioned independently, NOT via FormationAABB
					// Place GK 5m in front of goal line, centered in goal
					const goalLineX = team.state.defendingSide * this.match.field.LENGTH_HALF
					const gkOffsetFromGoal = 5 // meters in front of goal
					const gkX = goalLineX + (-team.state.defendingSide * gkOffsetFromGoal)
					player.body.position.set(gkX, 0)
				} else {
					// Outfield players use FormationAABB
					const worldPos = slot.toWorld2D(team)
					player.body.position.copy(worldPos)
				}

				// Set initial facing direction (toward opponent goal)
				player.body.bodyDir.copy(team.state.attackDir)

				// Create AI Context
				player.context = new PlayerContext(player, this.match.state, team)

				// Schedule Updates
				this.schedulePlayerUpdates(player)
			}
		}

		// Log initial positions for debugging
		console.log('[MatchEngine] Initial player positions:')
		for (const team of this.match.teams) {
			console.log(`  ${team.name} (defending ${team.state.defendingSide === -1 ? 'LEFT' : 'RIGHT'}):`)
			for (const sp of team.tactics.formation.slotPlayers) {
				const pos = sp.player.body?.position
				const isGK = sp.slot.code === 'GK'
				console.log(`    ${sp.slot.code}${isGK ? ' (GK)' : ''}: (${pos?.x.toFixed(1)}, ${pos?.y.toFixed(1)})`)
			}
		}

		// 2. Schedule Ball Physics
		this.scheduleBallPhysics()

		// 3. Schedule Referee/Rules (optional for now)
	}

	private schedulePlayerUpdates(player: Player) {
		const scheduler = this.match.state.scheduler

		// A. Physics & Movement (High Frequency: 10ms)
		scheduler.schedule(0, EventType.PLAYER_PHYSICS, (event) => {
			// 10ms = 0.01s
			this.updatePlayerPhysics(player, 0.01)
			event.reschedule(10)
		})

		// B. Vision Scan (Dynamic Frequency)
		scheduler.schedule(0, EventType.VISION, (event) => {
			this.updatePlayerVisionScan(player)

			// Reschedule based on attributes
			if (player.body) {
				const nextScan = player.body.vision.scanFrequency
				event.reschedule(Math.round(nextScan))
			} else {
				event.reschedule(1000) // Fallback
			}
		})

		// C. AI Think (Medium Frequency: 100ms)
		scheduler.schedule(0, EventType.PLAYER_AI, (event) => {
			// TODO: Implement AI thinking logic
			// player.ai.think()
			event.reschedule(100)
		})
	}

	private scheduleBallPhysics() {
		const scheduler = this.match.state.scheduler
		scheduler.schedule(0, EventType.BALL_PHYSICS, (event) => {
			console.log('Updating ball physics')
			this.updateBallPhysics(0.01)
			event.reschedule(10)
		})
	}

	private updatePlayerPhysics(player: Player, dt: number) {
		if (!player.body || !player.context) return

		// 1. Update Steering
		const steering = player.body.steering.update(dt, player.context)

		// 2. Integrate Physics
		player.body.integrate(dt, steering)

		// 3. Update Vision Spatial State (Cheap)
		player.body.vision.update(dt, this.match.state.timeElapsed)
	}

	private updatePlayerVisionScan(player: Player) {
		if (!player.body) return
		player.body.vision.scan()
	}

	private updateBallPhysics(dt: number) {
		this.match.ball.update(dt)
	}
}
