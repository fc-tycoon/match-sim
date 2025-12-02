/**
 * FC Tycoon™ 2027 Match Simulator - Ball
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import { BallPhysics } from './BallPhysics'
import type { Field } from './Field'
import { Player } from './Player'

// Kickoffs and passes usually just put the ball into a ROLLING state directly
// Goal kicks, throws, lofted passes, corner kicks usually transition from AIRBORNE, to BOUNCING, then ROLLING state
// HELD is just a special kind of "STATIONARY" state where the ball is not directly subject to it's own physics updates
// Technically, ALL these states can be handled by the same underlying physics engine, but we define these as higher-level states to help drive match logic and AI behavior
export const enum BallState {
	STATIONARY,		// ball is stationary on the ground, we can suspend physics updates until the ball is moved again. The ball can also transition from STATIONARY to HELD when picked up by the goalkeeper or during a set piece (corner kick, throw-in)
	ROLLING,		// ball is rolling on the ground, e.g., from a pass, shot, clearance, etc.
	BOUNCING,		// ball is bouncing near the ground, ball hit the ground but still has vertical velocity, "volley" shots cannot be made while BOUNCING, only half-volleys or ground shots. NOTE: The ball is STILL AIRBORNE while BOUNCING, this is just a sub-state to help with shot type determination.
	AIRBORNE,		// ball is in the air (e.g., from a pass, shot, clearance, cross, goal kick), this is important for determining if players can "volley" the ball, head the ball, chest it down, etc.
	HELD,			// e.g., by goalkeeper, during a set piece (corner kick), or throw-in. No physics updates directly from the ball.
}

// In-play ball/contest actions (contact + keeper + misc)
export const enum ActionType {
	// player–ball contacts
	KICK,
	VOLLEY,
	HEADER,
	CHEST,
	DEFLECT,			// unintended touch/ricochet
	BLOCK,				// shot/pass block
	INTERCEPT,
	TACKLE,
	DRIBBLE,			// controlled carry touch
	PASS,
	SHOT,
	CLEARANCE,
	PLACE,				// intentional placement on ground, eg. free-kick, corner kick, kickoff etc, can also be used by goalkeeper when placing ball for a goal kick
	CARRY,				// Carry the ball while running ... actually, I wanted "CARRY" to be for "carrying the ball in hands"
	HOLD,				// maintain possession while stationary
	PICK_UP_BALL,		// ANY player can pick up the ball (eg. after a foul, out of play, etc.)
	THROW_IN,			// throw-in action, this is actually the "launch" action, after the player has picked up the ball, moved to position, optionally taken a short run-up, then thrown the ball back into play. This action launches a ball in a direction, but from above the players head.

	// goalkeeper-specific
	GK_CATCH,			// hold
	GK_DROP,			// accidental/controlled drop
	GK_PARRY,			// deflect away with hands
	GK_PUNCH,
	GK_THROW,			// distribution by overarm throw
	GK_ROLL,			// distribution by roll
}

// Restarts / set-pieces (administrative events)
export const RestartType = Object.freeze({
	KICK_OFF: 100,
	THROW_IN: 101,
	CORNER_KICK: 102,
	GOAL_KICK: 103,
	FREE_KICK_DIRECT: 104,
	FREE_KICK_INDIRECT: 105,
	PENALTY_KICK: 106,
	REFEREE_DROP: 107,
})

// Optional: tiny helpers for readable logs/UI without hardcoding strings in logic
export const ActionLabel = Object.freeze({
	[ActionType.KICK]: 'kick',
	[ActionType.VOLLEY]: 'volley',
	[ActionType.HEADER]: 'header',
	[ActionType.CHEST]: 'chest',
	[ActionType.DEFLECT]: 'deflect',
	[ActionType.BLOCK]: 'block',
	[ActionType.INTERCEPT]: 'intercept',
	[ActionType.TACKLE]: 'tackle',
	[ActionType.DRIBBLE]: 'dribble',
	[ActionType.PASS]: 'pass',
	[ActionType.SHOT]: 'shot',
	[ActionType.CLEARANCE]: 'clearance',
	[ActionType.GK_CATCH]: 'catch',
	[ActionType.GK_DROP]: 'drop',
	[ActionType.GK_PARRY]: 'parry',
	[ActionType.GK_PUNCH]: 'punch',
	[ActionType.GK_THROW]: 'keeper throw',
	[ActionType.GK_ROLL]: 'keeper roll',
})

export const RestartLabel = Object.freeze({
	[RestartType.KICK_OFF]: 'kick-off',
	[RestartType.THROW_IN]: 'throw-in',
	[RestartType.CORNER_KICK]: 'corner',
	[RestartType.GOAL_KICK]: 'goal kick',
	[RestartType.FREE_KICK_DIRECT]: 'free kick (direct)',
	[RestartType.FREE_KICK_INDIRECT]: 'free kick (indirect)',
	[RestartType.PENALTY_KICK]: 'penalty',
	[RestartType.REFEREE_DROP]: 'referee drop',
})

/**
 * Ball - High-level ball state and metadata management.
 *
 * ARCHITECTURE & DESIGN INTENT:
 * =============================
 * This class manages game-level ball state, player interactions, and metadata.
 * It wraps BallPhysics internally for a clean separation of concerns:
 *
 * • Ball class (THIS):
 *   - Game state flags (onGround, isStopped, isHeld)
 *   - Player ownership tracking (heldBy)
 *   - Action history (kicks, headers, goalkeeper interactions)
 *   - High-level queries (distanceTo, speed accessors)
 *   - Utility methods (reposition, dropKick)
 *
 * • BallPhysics class (INTERNAL):
 *   - Pure physics simulation (position, velocity, spin)
 *   - Force calculations (gravity, drag, magnus effect)
 *   - Ground collision detection and bounce physics
 *   - Goal structure collisions (posts, crossbar)
 *   - Boundary wall rebounds
 *
 * • Referee class (EXTERNAL):
 *   - Out-of-play detection (goal line, sideline)
 *   - Goal scoring logic
 *   - Foul detection and rule enforcement
 *   - Match flow control (kickoffs, restarts)
 *
 * SINGLE RESPONSIBILITY PRINCIPLE:
 * ================================
 * BallPhysics has NO knowledge of:
 * - Players or teams
 * - Match state or score
 * - Rules or fouls
 * - When ball is "out of play"
 * - Goal/no-goal decisions
 *
 * Ball class has NO knowledge of:
 * - Force calculations or integration
 * - Detailed collision math
 * - Physical constants (drag, friction)
 *
 * Referee class determines:
 * - Whether physics results constitute goals
 * - When play should stop (fouls, out of bounds)
 * - What restart type to award
 *
 * Ball (High-Level)          BallPhysics (Physics)      Referee (Rules)
 * ─────────────────          ─────────────────────      ───────────────
 * ✓ onGround flag            ✓ position (Vec3)          ✓ Out of play
 * ✓ isStopped flag           ✓ velocity (Vec3)          ✓ Goal detection
 * ✓ isHeld tracking          ✓ spin (Vec3)              ✓ Foul detection
 * ✓ heldBy                   ✓ Gravity force            ✓ Match flow
 * ✓ Action history           ✓ Air drag (dynamic Cd)    ✓ Restart type
 * ✓ distanceTo() helper      ✓ Magnus effect            ✓ Rule enforcement
 * ✓ reposition/dropKick      ✓ Ground collision
 *                            ✓ Post/crossbar bounce
 *                            ✓ Wall rebounds
 *
 * COORDINATE SYSTEM (see docs/COORDINATES.md):
 * =============================================
 * World 2D (XY plane):
 * • X axis: Goal-to-Goal (+X toward Away goal, Home attacks +X)
 * • Y axis: Touchline-to-Touchline (+Y toward top touchline)
 *
 * Three.js 3D mapping:
 * • Three.js X = World X (goal-to-goal)
 * • Three.js Y = Height (vertical, UP)
 * • Three.js Z = World Y (touchline-to-touchline)
 *
 * Ground level: Three.js Y = 0 (the XZ plane)
 *
 * @example
 * // Create ball with custom physics and field dimensions
 * const ball = new Ball({
 *     field: field,                       // For collision detection
 *     radius: 0.11,                       // Standard size
 *     mass: 0.43,                         // FIFA regulation
 *     temperature: 25,                    // Warm day (affects air density)
 * })
 *
 * @example
 * // Track ball possession
 * ball.isHeld = true
 * ball.heldBy = goalkeeper.id
 *
 * @example
 * // Game loop integration
 * function gameLoop(dt) {
 *     if (!ball.isHeld) {
 *         ball.update(dt)  // Physics only when not held
 *     }
 *
 *     // Referee checks if ball is in goal (not Ball's responsibility)
 *     if (referee.checkGoal(ball)) {
 *         match.awardGoal()
 *     }
 * }
 *
 * @example
 * // Restart positioning
 * ball.reposition(0, 0.11, 0)		// Kickoff at center circle
 * ball.reposition(0, 0.11, -50)	// Goal kick
 */
export class Ball {
	#physicsEngine: BallPhysics
	#onGround: boolean = true
	#isStopped: boolean = true
	#isHeld: boolean = false
	#heldBy: Player | null = null
	#lastKickedBy: Player | null = null // eslint-disable-line no-unused-private-class-members -- Reserved for future possession tracking

	// ═══════════════════════════════════════════════════════════
	//                P H Y S I C A L   S T A T E
	// ═══════════════════════════════════════════════════════════

	/**
	 * 3D position for physics simulation (Three.js coordinate system).
	 * - position3d.x = World X (goal-to-goal, -52.5m to +52.5m)
	 * - position3d.y = Height above ground (vertical UP)
	 * - position3d.z = World Y (touchline-to-touchline, -34m to +34m)
	 *
	 * Used for: Physics calculations, 3D rendering, collision detection.
	 * @type {THREE.Vector3}
	 */
	readonly position3d: THREE.Vector3 = new THREE.Vector3(0, 0.11, 0)

	/**
	 * 2D position for gameplay logic (World 2D coordinate system).
	 * - position2d.x = World X (goal-to-goal, -52.5m to +52.5m)
	 * - position2d.y = World Y (touchline-to-touchline, -34m to +34m)
	 *
	 * Used for: Bounds checking, AI decisions, tactical calculations.
	 * Derived from position3d: position2d.x = position3d.x, position2d.y = position3d.z
	 * @type {THREE.Vector2}
	 */
	readonly position2d: THREE.Vector2 = new THREE.Vector2(0, 0)

	/** @type {THREE.Vector3} Velocity in meters per second (3D physics space) */
	readonly velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0)

	/** @type {number} Speed cache (magnitude/length of velocity) */
	speed: number = 0

	/** @type {THREE.Vector3} Angular velocity (spin) in radians per second */
	readonly spin: THREE.Vector3 = new THREE.Vector3(0, 0, 0)

	constructor(config: {
		field: Field,				// Field instance (REQUIRED) for collision detection
		radius?: number,			// Ball radius in meters (22cm diameter / 2)
		mass?: number,				// Ball mass in kilograms (default: 0.43kg, FIFA standard) (410-450g regulation)
		temperature?: number,		// Ambient temperature in °C for air density calculation
	}) {
		const {
			field,
			radius = 0.11,
			mass = 0.43,
			temperature = 20,
		} = config || {}

		// Initialize position based on radius (ball rests on ground at center)
		this.position3d.y = radius
		this.position2d.set(0, 0)

		this.#physicsEngine = new BallPhysics(
			this,
			field,
			radius,
			mass,
			temperature,
		)

		// ═══════════════════════════════════════════════════════════
		//                    S T A T E   F L A G S
		// ═══════════════════════════════════════════════════════════

		/** @type {boolean} Whether ball is currently on the ground */
		this.#onGround = true

		/** @type {boolean} Whether ball is effectively stopped */
		this.#isStopped = true

		/**
		 * Flag indicating whether ball is currently controlled by a player (e.g. goalkeeper catch).
		 * @type {boolean}
		 */
		this.#isHeld = false

		/**
		 * Player ID currently holding the ball.
		 * @type {number|null}
		 */
		this.#heldBy = null

		// ═══════════════════════════════════════════════════════════
		//                  P R E V E N T   E X T E N S I O N
		// ═══════════════════════════════════════════════════════════

		Object.seal(this)   // no new props ... included in Object.freeze()
	}

	/**
	 * Whether ball is currently controlled by a player (e.g. goalkeeper catch).
	 *
	 * @type {boolean}
	 */
	get onGround(): boolean {
		return this.#onGround
	}

	/**
	 * Check if ball is currently in the air.
	 *
	 * @type {boolean}
	 */
	get isInAir(): boolean {
		return !this.#onGround
	}

	/**
	 * Whether ball is currently stopped (not moving).
	 *
	 * @type {boolean}
	 */
	get isStopped(): boolean {
		return this.#isStopped
	}

	/**
	 * Whether ball is currently held by a player (e.g. goalkeeper).
	 *
	 * @type {boolean}
	 */
	get isHeld(): boolean {
		return this.#isHeld
	}

	/**
	 * Player ID currently holding the ball. We might need more than the ID in future (eg. reference to player object) so we can "move" the ball with the player.
	 *
	 * @type {Player|null}
	 */
	get heldBy(): Player | null {
		return this.#heldBy
	}

	/**
	 * Calculate 3D distance to another position.
	 *
	 * @param {THREE.Vector3} otherPos - Position to measure distance to (3D)
	 * @returns {number} Distance in meters
	 */
	distanceTo(otherPos: THREE.Vector3): number {
		return this.position3d.distanceTo(otherPos)
	}

	/**
	 * Calculate 2D distance to another position (ignores height).
	 *
	 * @param {THREE.Vector2} otherPos - Position to measure distance to (2D)
	 * @returns {number} Distance in meters
	 */
	distanceTo2d(otherPos: THREE.Vector2): number {
		return this.position2d.distanceTo(otherPos)
	}

	/**
	 * Reposition ball to specified coordinates and reset all state.
	 *
	 * Sets ball at rest on ground at given XYZ coordinates, clearing velocity,
	 * spin, and held status. Useful for kickoffs, corners, free kicks, and restarts.
	 *
	 * @param {number} [x=0] - World X coordinate in meters (goal-to-goal)
	 * @param {number} [y=0] - World Y coordinate in meters (touchline-to-touchline)
	 * @param {number} [height] - Height above ground (default: ball radius = resting on ground)
	 * @returns {Ball} This ball instance (for chaining)
	 *
	 * @example
	 * // Position ball at center for kickoff (resting on ground)
	 * ball.reposition(0, 0)  // Center of pitch, on ground
	 *
	 * @example
	 * // Position ball for corner kick
	 * ball.reposition(52.5, 34)  // Corner flag
	 */
	reposition(x: number = 0, y: number = 0, height?: number): Ball {
		const h = height ?? this.#physicsEngine.radius
		// position3d: Three.js space (x=WorldX, y=height, z=WorldY)
		this.position3d.set(x, h, y)
		// position2d: World 2D space (x=WorldX, y=WorldY)
		this.position2d.set(x, y)

		this.velocity.set(0, 0, 0)
		this.spin.set(0, 0, 0)

		this.#onGround = true
		this.#isStopped = true
		this.#isHeld = false
		this.#heldBy = null
		return this
	}

	/**
	 * Position ball for goalkeeper drop kick.
	 *
	 * Places ball at specified coordinates with initial height (ball starts
	 * airborne), clearing velocity and held status. Used for goalkeeper
	 * distribution where ball is dropped then kicked.
	 *
	 * @param {number} [x=0] - X coordinate in meters
	 * @param {number} [y=0] - Y coordinate in meters
	 * @param {number} [initialHeight=1.5] - Starting height in meters
	 * @returns {Ball} This ball instance (for chaining)
	 *
	 * @example
	 * // Goalkeeper drop kick from 6-yard box
	 * ball.dropKick(0, 5.5, 1.5)
	 */
	dropKick(x = 0, y = 0, initialHeight = 1.5) {
		this.#physicsEngine.reposition(x, y, initialHeight)
		this.#onGround = false
		this.#isStopped = false
		this.#isHeld = false
		this.#heldBy = null
		return this
	}

	getMaxShotVelocity(player: Player) {
		// On average, top-tier professional soccer players can kick a ball at speeds ranging from 60 (96km = 26.666 m/s) to 80 miles (128km = 35.5555 m/s) per hour (mph).
		// Elite players possess a combination of exceptional technique, strength, and timing, allowing them to generate immense power behind their kicks.
		// 25 m/s = Shot Power 10?
		// 35 m/s = Shot Power 85
		// 10 / 75 = 0.13333333333333333333333333333333
		// eg. 60 * (10 / 75) = 8 + 25 = 33
		// eg. 100 * (10 / 75) = 13.3333 + 25 = 38.3333
		return player.skills.shot_power * (10 / 75) + 25 // What about technique? What if this is a long shot?
	}

	/**
	 * Update ball physics and state.
	 *
	 * Advances physics simulation by one time step and updates derived state flags
	 * (onGround, isStopped) based on current position and velocity.
	 * Also syncs position2d from position3d for gameplay logic.
	 *
	 * @param {number} dt - Time step in seconds (typically 1/60 for 60fps)
	 *
	 * @example
	 * // Update at 60 FPS
	 * ball.update(1/60)
	 */
	update(dt: number) {
		this.#physicsEngine.update(dt)

		// Sync position2d from position3d (position3d.x → position2d.x, position3d.z → position2d.y)
		this.position2d.set(this.position3d.x, this.position3d.z)

		// Update onGround flag based on height above ground (Y is UP in WebGL coordinates)
		this.#onGround = this.position3d.y <= this.#physicsEngine.radius + 0.01 // small epsilon

		// Update isStopped flag based on velocity magnitude
		this.#isStopped = this.speed < 0.1 // threshold speed in m/s
	}

	/**
	 * Serialize ball state to JSON.
	 *
	 * @returns {object} JSON representation of ball state
	 */
	toJSON() {
		return {
			position3d: this.position3d.toArray(),
			position2d: this.position2d.toArray(),
			velocity: this.velocity.toArray(),
			spin: this.spin.toArray(),
			onGround: this.#onGround,
			isStopped: this.#isStopped,
			isHeld: this.#isHeld,
			heldBy: this.#heldBy,
		}
	}

	/**
	 * Restore ball state from JSON.
	 *
	 * @param {object} data - JSON representation of ball state
	 * @returns {Ball} This ball instance (for chaining)
	 */
	fromJSON(data: any) {
		this.#physicsEngine.fromJSON(data)

		// Sync position2d from position3d after physics restore
		this.position2d.set(this.position3d.x, this.position3d.z)

		this.#onGround = data.onGround
		this.#isStopped = data.isStopped
		this.#isHeld = data.isHeld
		this.#heldBy = data.heldBy
		return this
	}
}
