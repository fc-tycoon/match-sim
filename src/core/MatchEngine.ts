/**
 * FC Tycoon™ 2027 Match Simulator - Match Engine
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import { Match } from './Match'
import { PlayerBody } from '@/core/ai/PlayerBody'
import { PlayerContext } from '@/core/ai/PlayerContext'
import { EventType } from '@/core/EventScheduler'
import { Player } from '@/core/Player'
import { Team } from '@/core/Team'
import { RealTimeScheduler } from './RealTimeScheduler'
import { HeadlessScheduler } from './HeadlessScheduler'
import { IntentionType, SpeedHint, MovementMode, TacticalReason, type PlayerIntentions } from '@/core/ai/PlayerIntentions'
import { HeadMovementSystem } from '@/core/ai/HeadMovement'
import { AiPlayState } from '@/core/ai/AiPlayStates'

// ═══════════════════════════════════════════════════════════════════════════════
//                      C O N S T A N T S
// ═══════════════════════════════════════════════════════════════════════════════

/** Physics update interval in milliseconds (60 Hz) */
const PHYSICS_INTERVAL_MS = 16

/** Physics delta time in seconds */
const PHYSICS_DT = PHYSICS_INTERVAL_MS / 1000

/** AI decision tick interval in milliseconds */
const AI_TICK_INTERVAL_MS = 100

/** Jitter range for AI tick scheduling (±ms) for deterministic variation */
const AI_TICK_JITTER_MS = 10

// ═══════════════════════════════════════════════════════════════════════════════
//                      M A T C H   E N G I N E
// ═══════════════════════════════════════════════════════════════════════════════

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

	/**
	 * Initialize the match engine.
	 * Sets up all players with:
	 * - Random starting positions (within field bounds)
	 * - Random facing directions
	 * - Physics, Vision, and AI event scheduling
	 */
	initialize() {
		const random = this.match.state.random
		const field = this.match.field

		// Field bounds for random positioning (with padding)
		const fieldPadding = 5 // meters from touchlines/goal lines
		const minX = -field.LENGTH_HALF + fieldPadding
		const maxX = field.LENGTH_HALF - fieldPadding
		const minY = -field.WIDTH_HALF + fieldPadding
		const maxY = field.WIDTH_HALF - fieldPadding

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

				// ═══════════════════════════════════════════════════════════
				// RANDOM STARTING POSITIONS
				// ═══════════════════════════════════════════════════════════

				if (isGoalkeeper) {
					// GKs start randomly within their goal area
					const goalLineX = team.state.defendingSide * field.LENGTH_HALF
					const gkMinX = goalLineX + (-team.state.defendingSide * 2) // 2m from goal line
					const gkMaxX = goalLineX + (-team.state.defendingSide * 10) // up to 10m out
					const gkX = random.float(Math.min(gkMinX, gkMaxX), Math.max(gkMinX, gkMaxX))
					const gkY = random.float(-8, 8) // Within goal width area
					player.body.position.set(gkX, gkY)
				} else {
					// Outfield players start at random positions
					player.body.position.set(
						random.float(minX, maxX),
						random.float(minY, maxY),
					)
				}

				// Face toward opponent goal (attackDir) using setter to enforce constraints
				const attackAngle = Math.atan2(team.state.attackDir.y, team.state.attackDir.x)
				player.body.setBodyAngle(attackAngle)

				// Create AI Context
				player.context = new PlayerContext(player, this.match.state, team)

				// Schedule Updates (with staggered timing for deterministic distribution)
				const staggerOffset = random.int(0, AI_TICK_INTERVAL_MS - 1)
				this.schedulePlayerUpdates(player, staggerOffset)
			}
		}

		// Log initial positions for debugging
		console.log('[MatchEngine] Initial player positions (RANDOM):')
		for (const team of this.match.teams) {
			console.log(`  ${team.name} (defending ${team.state.defendingSide === -1 ? 'LEFT' : 'RIGHT'}):`)
			for (const sp of team.tactics.formation.slotPlayers) {
				const pos = sp.player.body?.position
				const dir = sp.player.body?.bodyDir
				const isGK = sp.slot.code === 'GK'
				const angle = dir ? Math.round(Math.atan2(dir.y, dir.x) * 180 / Math.PI) : 0
				console.log(`    ${sp.slot.code}${isGK ? ' (GK)' : ''}: pos(${pos?.x.toFixed(1)}, ${pos?.y.toFixed(1)}) facing ${angle}°`)
			}
		}

		// 2. Schedule Ball Physics
		this.scheduleBallPhysics()

		// 3. Schedule Referee/Rules (optional for now)
	}

	/**
	 * Schedule all update events for a player.
	 * @param player - The player to schedule updates for
	 * @param staggerOffset - Initial offset in ms to stagger AI ticks
	 */
	private schedulePlayerUpdates(player: Player, staggerOffset: number) {
		const scheduler = this.match.state.scheduler
		const random = this.match.state.random

		// ═══════════════════════════════════════════════════════════
		// A. PHYSICS & MOVEMENT (High Frequency: 16ms / 60Hz)
		// ═══════════════════════════════════════════════════════════

		scheduler.schedule(0, EventType.PLAYER_PHYSICS, (event) => {
			this.updatePlayerPhysics(player, PHYSICS_DT)
			event.reschedule(PHYSICS_INTERVAL_MS)
		})

		// ═══════════════════════════════════════════════════════════
		// B. VISION SCAN (Dynamic Frequency)
		// ═══════════════════════════════════════════════════════════

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

		// ═══════════════════════════════════════════════════════════
		// C. AI DECISION TICK (Medium Frequency: ~100ms)
		// ═══════════════════════════════════════════════════════════
		// Staggered initial scheduling to distribute CPU load.
		// Each tick includes deterministic jitter for variation.

		scheduler.schedule(staggerOffset, EventType.PLAYER_AI, (event) => {
			this.updatePlayerAI(player)

			// Reschedule with deterministic jitter
			const jitter = random.int(-AI_TICK_JITTER_MS, AI_TICK_JITTER_MS)
			event.reschedule(AI_TICK_INTERVAL_MS + jitter)
		})
	}

	/**
	 * Schedule ball physics updates.
	 */
	private scheduleBallPhysics() {
		const scheduler = this.match.state.scheduler
		scheduler.schedule(0, EventType.BALL_PHYSICS, (event) => {
			this.updateBallPhysics(PHYSICS_DT)
			event.reschedule(PHYSICS_INTERVAL_MS)
		})
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                      U P D A T E   M E T H O D S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Update player physics (steering + integration).
	 * Called at 60Hz (every 16ms).
	 */
	private updatePlayerPhysics(player: Player, dt: number) {
		if (!player.body || !player.context) return

		// 1. Update Steering (calculates forces based on current intention)
		const steering = player.body.steering.update(dt, player.context)

		// 2. Integrate Physics (applies forces to velocity/position)
		player.body.integrate(dt, steering)

		// 3. Update Head Movement (natural head behavior)
		const intentions = player.context.intentions
		const hasDestination = intentions.type === IntentionType.MOVE_TO && !!intentions.targetPosition
		let destinationAngle = 0
		if (hasDestination && intentions.targetPosition) {
			const dx = intentions.targetPosition.x - player.body.position.x
			const dy = intentions.targetPosition.y - player.body.position.y
			destinationAngle = Math.atan2(dy, dx)
		}

		HeadMovementSystem.update(
			player.body,
			player.body.headState,
			this.match.state.scheduler.currentTick,
			dt,
			this.match.state.random,
			hasDestination,
			destinationAngle,
		)

		// 4. Update Vision Spatial State (cheap position-based updates)
		player.body.vision.update(dt, this.match.state.timeElapsed)
	}

	/**
	 * Update player vision scan.
	 * Called at dynamic frequency based on player attributes.
	 */
	private updatePlayerVisionScan(player: Player) {
		if (!player.body) return
		player.body.vision.scan()
	}

	/**
	 * Update player AI decision making.
	 * Called at ~100ms intervals.
	 *
	 * This is where the AI "thinks" and sets intentions.
	 * The behavior is driven by the current AiPlayState.
	 *
	 * IMPORTANT: Goalkeepers are NOT part of the formation system.
	 * They have their own positioning logic based on ball position,
	 * danger assessment, and goalkeeper-specific tendencies.
	 * See: docs/GOALKEEPERS.md for goalkeeper positioning rules.
	 */
	private updatePlayerAI(player: Player) {
		if (!player.body || !player.context) return

		const intentions = player.context.intentions
		const team = player.team
		const playState = this.match.state.playState
		const isGoalkeeper = player.isGoalkeeper

		// Dispatch to appropriate handler based on AiPlayState
		switch (playState) {
		// ═══════════════════════════════════════════════════════════
		// SET PIECE SETUP STATES: Players move to positions
		// ═══════════════════════════════════════════════════════════
		case AiPlayState.KICKOFF_SETUP:
		case AiPlayState.THROW_IN_SETUP:
		case AiPlayState.GOAL_KICK_SETUP:
		case AiPlayState.CORNER_KICK_SETUP:
		case AiPlayState.FREE_KICK_SETUP:
		case AiPlayState.PENALTY_KICK_SETUP:
		case AiPlayState.PENALTY_SHOOTOUT_KICK_SETUP:
			if (isGoalkeeper) {
				this.updateGoalkeeperSetupAI(player, intentions, team)
			} else {
				this.updateOutfieldSetupAI(player, intentions, team)
			}
			break

			// ═══════════════════════════════════════════════════════════
			// SET PIECE EXECUTION STATES: Designated player takes action
			// ═══════════════════════════════════════════════════════════
		case AiPlayState.KICKOFF:
		case AiPlayState.THROW_IN:
		case AiPlayState.GOAL_KICK:
		case AiPlayState.CORNER_KICK:
		case AiPlayState.FREE_KICK:
		case AiPlayState.PENALTY_KICK:
		case AiPlayState.PENALTY_SHOOTOUT_KICK:
		case AiPlayState.PENALTY_SHOOTOUT_KICKED:
			// TODO: Implement set piece execution
			// For now, idle
			intentions.type = IntentionType.IDLE
			break

			// ═══════════════════════════════════════════════════════════
			// NORMAL PLAY: Full AI decision making
			// ═══════════════════════════════════════════════════════════
		case AiPlayState.NORMAL_PLAY:
			if (isGoalkeeper) {
				this.updateGoalkeeperPlayAI(player, intentions, team)
			} else {
				this.updateOutfieldPlayAI(player, intentions, team)
			}
			break

			// ═══════════════════════════════════════════════════════════
			// STOPPAGES & CEREMONIES: Limited movement
			// ═══════════════════════════════════════════════════════════
		case AiPlayState.GOAL_CELEBRATION:
		case AiPlayState.HALF_TIME_BREAK:
		case AiPlayState.EXTRA_TIME_BREAK:
		case AiPlayState.PENALTY_SHOOTOUT_BREAK:
		case AiPlayState.PRE_MATCH_CEREMONY:
		case AiPlayState.POST_MATCH_CEREMONY:
		case AiPlayState.STOPPAGE_FOUL:
		case AiPlayState.STOPPAGE_OFFSIDE:
		case AiPlayState.STOPPAGE_CARD:
		case AiPlayState.STOPPAGE_SUBSTITUTION:
			// TODO: Implement ceremony/stoppage behavior
			intentions.type = IntentionType.IDLE
			break

		default:
			intentions.type = IntentionType.IDLE
			break
		}
	}

	/**
	 * Update outfield player AI during setup phases.
	 * Players move to their formation slot positions.
	 * They walk FORWARD toward their slot, then turn to face attackDir when close.
	 */
	private updateOutfieldSetupAI(player: Player, intentions: PlayerIntentions, team: Team) {
		const slot = player.slot

		if (!slot) {
			intentions.type = IntentionType.IDLE
			intentions.targetPosition = undefined
			intentions.tacticalReason = TacticalReason.NONE
			return
		}

		// Get world position for our slot
		const slotWorld2D = slot.toWorld2D(team)
		const targetPosition = new THREE.Vector2(slotWorld2D.x, slotWorld2D.y)

		// Check distance to slot
		const dx = slotWorld2D.x - player.body!.position.x
		const dy = slotWorld2D.y - player.body!.position.y
		const distanceToSlot = Math.sqrt(dx * dx + dy * dy)

		// If we're close enough, switch to IDLE and face attackDir
		if (distanceToSlot < 0.5) {
			intentions.type = IntentionType.IDLE
			intentions.targetPosition = undefined
			intentions.tacticalReason = TacticalReason.HOLD_POSITION

			// Face toward opponent goal when idle at slot
			const faceX = player.body!.position.x + team.state.attackDir.x * 10
			const faceY = player.body!.position.y + team.state.attackDir.y * 10
			intentions.faceTarget = new THREE.Vector2(faceX, faceY)
			return
		}

		// Move to slot position
		intentions.type = IntentionType.MOVE_TO
		intentions.targetPosition = targetPosition
		intentions.speedHint = SpeedHint.JOG  // Brisk walk during setup
		intentions.movementMode = MovementMode.FORWARD  // Always walk forward toward slot
		intentions.tacticalReason = TacticalReason.MOVE_TO_SLOT

		// Only start turning toward attackDir when close to slot (anticipatory turn)
		if (distanceToSlot < 5.0) {
			// Near slot - start facing attackDir while finishing approach
			const faceX = player.body!.position.x + team.state.attackDir.x * 10
			const faceY = player.body!.position.y + team.state.attackDir.y * 10
			intentions.faceTarget = new THREE.Vector2(faceX, faceY)
		} else {
			// Far from slot - face movement direction (walk forward)
			intentions.faceTarget = undefined
		}
	}

	/**
	 * Update outfield player AI during normal play.
	 * This is where the full AI brain would be invoked.
	 * For now, implements basic "move to slot" behavior.
	 */
	private updateOutfieldPlayAI(player: Player, intentions: PlayerIntentions, team: Team) {
		// TODO: Implement full AI brain (Utility AI, Behavior Trees)
		// For now, fallback to setup behavior (move to slot)
		this.updateOutfieldSetupAI(player, intentions, team)
	}

	/**
	 * Update goalkeeper AI during setup phases.
	 * Goalkeepers move to their base position near the goal line.
	 */
	private updateGoalkeeperSetupAI(player: Player, intentions: PlayerIntentions, team: Team) {
		const field = this.match.field

		// Goalkeeper base position: 3m off goal line, centered
		const goalLineX = team.state.defendingSide * field.LENGTH_HALF
		const baseX = goalLineX + (-team.state.defendingSide * 3)
		const baseY = 0

		const targetPosition = new THREE.Vector2(baseX, baseY)

		// Check distance to base position
		const dx = baseX - player.body!.position.x
		const dy = baseY - player.body!.position.y
		const distance = Math.sqrt(dx * dx + dy * dy)

		if (distance < 0.5) {
			intentions.type = IntentionType.IDLE
			intentions.targetPosition = undefined
			intentions.tacticalReason = TacticalReason.HOLD_POSITION

			// Face toward opponent goal
			const faceX = player.body!.position.x + team.state.attackDir.x * 10
			const faceY = player.body!.position.y + team.state.attackDir.y * 10
			intentions.faceTarget = new THREE.Vector2(faceX, faceY)
		} else {
			intentions.type = IntentionType.MOVE_TO
			intentions.targetPosition = targetPosition
			intentions.speedHint = SpeedHint.JOG
			intentions.movementMode = MovementMode.FORWARD
			intentions.tacticalReason = TacticalReason.MOVE_TO_SLOT

			// Only face attackDir when close
			if (distance < 5.0) {
				const faceX = player.body!.position.x + team.state.attackDir.x * 10
				const faceY = player.body!.position.y + team.state.attackDir.y * 10
				intentions.faceTarget = new THREE.Vector2(faceX, faceY)
			} else {
				intentions.faceTarget = undefined
			}
		}
	}

	/**
	 * Update goalkeeper AI during normal play.
	 * Goalkeepers position based on ball position and danger assessment.
	 * See: docs/GOALKEEPERS.md for detailed positioning rules.
	 */
	private updateGoalkeeperPlayAI(player: Player, intentions: PlayerIntentions, team: Team) {
		// TODO: Implement full goalkeeper AI (ball tracking, angle cutting)
		// For now, fallback to setup behavior (stay at base position)
		this.updateGoalkeeperSetupAI(player, intentions, team)
	}

	/**
	 * Update ball physics.
	 * Called at 60Hz (every 16ms).
	 */
	private updateBallPhysics(dt: number) {
		this.match.ball.update(dt)
	}
}
