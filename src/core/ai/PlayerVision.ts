/**
 * FC Tycoon™ 2027 Match Simulator - Player Vision
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import { Match } from '@/core/Match'
import { Player } from '@/core/Player'
import { Ball } from '@/core/Ball'
import { Random } from '@/core/Random'

// MVP: Direct access to the exact position/velocity of the target player
// "Video Game Radar" style - perfect information, no noise.
// This will be modified later to include perception errors, memory decay, confidence, etc.
export class VisualPlayerMemory {
	#target: Player
	readonly isOpponent: boolean

	constructor(observer: Player, target: Player) {
		this.#target = target
		this.isOpponent = observer.team.id !== this.#target.team.id

		Object.seal(this)
	}

	get id(): number { return this.#target.id }

	get position(): THREE.Vector2 {
		return this.#target.body!.position
	}

	get velocity(): THREE.Vector2 {
		return this.#target.body!.velocity
	}
}

export class VisualBallMemory {
	#ball: Ball

	constructor(_observer: Player, ball: Ball) {
		this.#ball = ball

		Object.seal(this)
	}

	get position(): THREE.Vector3 {
		return this.#ball.position3d
	}

	get velocity(): THREE.Vector3 {
		return this.#ball.velocity
	}
}

export class PlayerVision {
	#player: Player
	#rng: Random
	#focus: VisualPlayerMemory | VisualBallMemory | null = null

	// Store relevant player skills/attributes for the vision system
	#vision: number
	#concentration: number		// eslint-disable-line no-unused-private-class-members -- Reserved for vision accuracy calculations
	#att_anticipation: number
	#def_anticipation: number
	#att_awareness: number
	#def_awareness: number
	#creativity: number			// eslint-disable-line no-unused-private-class-members -- Reserved for creative vision decisions

	// The Players' "View" of the world
	readonly players: VisualPlayerMemory[] = []
	readonly ball: VisualBallMemory

	constructor(player: Player, match: Match) {
		this.#player = player
		this.#rng = match.state.rand

		const {
			vision,
			concentration,
			attacking_anticipation,
			defensive_anticipation,
			attacking_awareness,
			defensive_awareness,
			creativity,
		} = this.#player.skills

		this.#vision = vision
		this.#concentration = concentration
		this.#att_anticipation = attacking_anticipation
		this.#def_anticipation = defensive_anticipation
		this.#att_awareness = attacking_awareness
		this.#def_awareness = defensive_awareness
		this.#creativity = creativity

		// Initialize Vision
		this.ball = new VisualBallMemory(player, match.ball)
		this.#focus = this.ball

		const id = this.#player.id
		for (const team of match.teams) {
			const slotPlayers = team.tactics.formation.slotPlayers
			for (const slotPlayer of slotPlayers) {
				const target = slotPlayer.player
				if (target.id === id) continue
				this.players.push(new VisualPlayerMemory(player, target))
			}
		}

		Object.freeze(this)
	}

	get focus() { return this.#focus }

	setFocus(target: VisualPlayerMemory | VisualBallMemory | null) {
		this.#focus = target
	}

	get scanFrequency(): number {
		const isAttacking = this.#player.team.state.inPosession
		const awareness = isAttacking ? this.#att_awareness : this.#def_awareness
		const anticipation = isAttacking ? this.#att_anticipation : this.#def_anticipation

		// Formula: 50% Awareness + 30% Anticipation + 20% Vision
		const score = (0.5 * awareness) + (0.3 * anticipation) + (0.2 * this.#vision)

		// Map score (0-1) to frequency (ms)
		// High score = Low ms (fast scan)
		// e.g. 1.0 -> 300ms, 0.0 -> 1500ms
		return THREE.MathUtils.lerp(1500, 300, score)
	}

	get peripheralNoise(): number {
		const isAttacking = this.#player.team.state.inPosession
		const awareness = isAttacking ? this.#att_anticipation : this.#def_anticipation

		// Formula: 50% Vision + 50% Awareness
		return (0.5 * this.#vision) + (0.5 * awareness)
	}

	// Update vision spatial state (cheap, every frame/tick)
	update(_dt: number, _time: number) {
		// MVP: No updates needed for Radar vision
	}

	// This is a players periodic "scan" opportunity to update focus
	// Called by EventScheduler (reasonably expensive, low frequency) every 300-1500ms depending on attributes
	scan() {
		// Simple MVP Scan:
		// Mostly look at the ball.
		// Sometimes look at a random player to simulate "checking surroundings".

		if (this.#rng.float(0, 1) < 0.8) {
			this.#focus = this.ball
		} else {
			if (this.players.length > 0) {
				const idx = this.#rng.int(0, this.players.length - 1)
				this.#focus = this.players[idx]
			}
		}
	}
}
