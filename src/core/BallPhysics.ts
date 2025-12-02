/**
 * FC Tycoon™ 2027 Match Simulator - Ball Physics
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import type { Ball } from './Ball'
import type { Field } from './Field'

/**
 * BallPhysics - Pure physics simulation for football/soccer ball.
 *
 * Handles position, velocity, spin state and applies:
 * - Gravity (9.81 m/s² downward along -Y axis)
 * - Air drag (quadratic drag opposing velocity)
 * - Ground collision with restitution
 * - Ground friction (sliding and rolling resistance) (TODO: Add both)
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
 * INITIAL BALL POSITION:
 * =====================
 * Ball starts at position.y = radius (0.11m above ground).
 *
 * WHY? Because in physics, a sphere "rests" on a surface when its CENTER
 * is at distance R (radius) above the surface. The bottom of the sphere
 * touches the ground (y=0), but the center is at y=R.
 *
 *     ___
 *    /   \     ← Center at y = 0.11m (radius)
 *   |  •  |    ← Radius = 0.11m
 *    \___/     ← Bottom tangent point at y = 0 (ground)
 * ═══════════  ← Ground plane (y = 0)
 *
 * This is consistent with collision detection: when position.y <= radius,
 * the ball has contacted the ground.
 *
 * NOTES:
 * Footballers typically shoot a penalty kick at speeds of around 70 mph (112 km/h) or 31.111.. m/s, with some powerful shots reaching up to 80 mph (128 km/h) or 35.555... m/s.
 */
export class BallPhysics {
	// ═══════════════════════════════════════════════════════════
	//                P H Y S I C A L   S T A T E
	// ═══════════════════════════════════════════════════════════

	ball: Ball

	readonly position: THREE.Vector3
	readonly velocity: THREE.Vector3
	readonly spin: THREE.Vector3

	// ═══════════════════════════════════════════════════════════
	//           P H Y S I C S   C O N S T A N T S
	// ═══════════════════════════════════════════════════════════

	/** @type {number} Gravity acceleration in m/s² */
	#gravity: number = 9.81

	/** @type {number} Coefficient of restitution for ground bounce (0=no bounce, 1=perfect) */
	#restitution: number = 0.7

	/** @type {number} Ground friction coefficient (kinetic friction on grass) */
	#groundFriction: number = 0.3

	/** @type {number} Air density in kg/m³ at sea level, 20°C */
	#airDensity: number = 1.2041

	/** @type {number} Dynamic viscosity of air in Pa·s (at 20°C) */
	#airViscosity: number = 1.81e-5

	// ═══════════════════════════════════════════════════════════
	//              P H Y S I C A L   P R O P E R T I E S
	// ═══════════════════════════════════════════════════════════

	/** @type {number} Ball radius in meters */
	#radius: number = 0.11

	/** @type {number} Ball mass in kilograms */
	#mass: number = 0.43

	/** @type {number} Ball cross-sectional area in m² (πr²) */
	#crossSectionalArea: number = 0

	constructor(
		ball: Ball,
		field: Field,					// Field instance (REQUIRED)
		radius: number = 0.11,			// Ball radius in meters (22cm diameter / 2)
		mass: number = 0.43,			// Ball mass in kilograms (FIFA standard)
		temperature: number = 20,		// Ambient temperature in °C (affects air density)
	) {
		if (!field) throw new Error('BallPhysics requires field parameters')

		this.ball = ball
		this.position = ball.position3d
		this.velocity = ball.velocity
		this.spin = ball.spin

		this.#radius = radius
		this.#mass = mass

		// Recalculate derived constants
		this.#crossSectionalArea = Math.PI * radius * radius

		// Calculate air density based on temperature
		// ρ = ρ₀ * (T₀ / T) where T is in Kelvin
		// ρ₀ = 1.2041 kg/m³ at T₀ = 293.15K (20°C)
		const tempKelvin = temperature + 273.15
		this.#airDensity = 1.2041 * (293.15 / tempKelvin)

		Object.seal(this)
	}

	/**
	 * Reposition ball to specified coordinates (WebGL/OpenGL coordinate system).
	 *
	 * Resets position, velocity, and spin. If y (height) not provided,
	 * ball is placed on ground (y = radius).
	 *
	 * @param {number} [x=0] - X coordinate in meters (horizontal, left-right)
	 * @param {number} [y] - Y coordinate in meters (vertical, UP), defaults to radius (on ground)
	 * @param {number} [z=0] - Z coordinate in meters (depth, forward-backward)
	 * @returns {BallPhysics} This instance (for chaining)
	 *
	 * @example
	 * // Place ball at center of pitch, resting on ground
	 * ball.reposition(0, undefined, 0)  // Position: (0, 0.11, 0)
	 *
	 * @example
	 * // Drop ball from 2 meters high
	 * ball.reposition(0, 2, 0)  // Position: (0, 2, 0)
	 */
	reposition(x: number = 0, y?: number, z: number = 0): BallPhysics {
		const height = y === undefined ? this.#radius : y
		this.position.set(x, height, z)
		this.velocity.set(0, 0, 0)
		this.spin.set(0, 0, 0)
		this.ball.speed = 0
		return this
	}

	// ═══════════════════════════════════════════════════════════
	//                      G E T T E R S
	// ═══════════════════════════════════════════════════════════

	/**
	 * Get ball radius.
	 * @returns {number} Ball radius in meters
	 */
	get radius(): number {
		return this.#radius
	}

	/**
	 * Get ball mass.
	 * @returns {number} Ball mass in kilograms
	 */
	get mass(): number {
		return this.#mass
	}

	/**
	 * Get current Reynolds number based on ball speed.
	 *
	 * Reynolds number: Re = (ρ × v × D) / μ
	 *
	 * Used for diagnostics and to understand drag behavior.
	 * Critical Reynolds number for drag crisis: ~2×10⁵ (15-25 m/s)
	 *
	 * @returns {number} Reynolds number (dimensionless)
	 */
	get reynoldsNumber(): number {
		const speed = Math.sqrt(
			this.velocity.x * this.velocity.x +
			this.velocity.y * this.velocity.y +
			this.velocity.z * this.velocity.z,
		)
		const diameter = this.#radius * 2
		return (this.#airDensity * speed * diameter) / this.#airViscosity
	}

	/**
	 * Get current drag coefficient based on ball speed.
	 *
	 * Returns velocity-dependent drag coefficient accounting for drag crisis.
	 * Range: 0.20 (supercritical) to 0.47 (subcritical)
	 *
	 * @returns {number} Drag coefficient (dimensionless)
	 */
	get dragCoefficient(): number {
		const speed = Math.sqrt(
			this.velocity.x * this.velocity.x +
			this.velocity.y * this.velocity.y +
			this.velocity.z * this.velocity.z,
		)
		return this.#getDragCoefficient(speed)
	}

	// ═══════════════════════════════════════════════════════════
	//                   P H Y S I C S   M E T H O D S
	// ═══════════════════════════════════════════════════════════

	/**
	 * Calculate drag coefficient based on Reynolds number.
	 *
	 * Models the "drag crisis" phenomenon where Cd drops from ~0.47 (subcritical,
	 * laminar boundary layer) to ~0.20 (supercritical, turbulent boundary layer)
	 * at Reynolds numbers around 2×10⁵ (roughly 15-25 m/s for a soccer ball).
	 *
	 * Uses a smooth hyperbolic tangent (tanh) transition function to avoid
	 * discontinuities in the drag force.
	 *
	 * Reynolds Number: Re = (ρ × v × D) / μ
	 * Where:
	 *   ρ = air density (kg/m³)
	 *   v = velocity (m/s)
	 *   D = diameter (m)
	 *   μ = dynamic viscosity (Pa·s)
	 *
	 * Drag coefficient ranges:
	 *   - Subcritical (Re < 10⁵): Cd ≈ 0.47 (smooth sphere, laminar separation)
	 *   - Transition (10⁵ < Re < 4×10⁵): Cd drops rapidly (drag crisis)
	 *   - Supercritical (Re > 4×10⁵): Cd ≈ 0.20 (turbulent boundary layer)
	 *
	 * @param {number} speed - Current ball speed in m/s
	 * @returns {number} Drag coefficient (dimensionless, typically 0.20-0.47)
	 *
	 * @see https://en.wikipedia.org/wiki/Drag_crisis
	 * @see https://en.wikipedia.org/wiki/Drag_coefficient
	 */
	#getDragCoefficient(speed: number): number {
		// Calculate Reynolds number: Re = ρvD/μ
		const diameter = this.#radius * 2
		const reynolds = (this.#airDensity * speed * diameter) / this.#airViscosity

		// Drag coefficient values
		const cdSubcritical = 0.47  // Smooth sphere, laminar flow (Re < 10⁵)
		const cdSupercritical = 0.20 // Turbulent boundary layer (Re > 4×10⁵)

		// Transition parameters
		const reCritical = 2e5      // Critical Reynolds number (center of transition)
		const reWidth = 1.5e5       // Transition width (controls smoothness)

		// Smooth transition using tanh function
		// tanh maps: -∞→-1, 0→0, +∞→+1
		// When Re << reCritical: tanh → -1, blend → 0, Cd → cdSubcritical
		// When Re >> reCritical: tanh → +1, blend → 1, Cd → cdSupercritical
		const blend = 0.5 * (1 + Math.tanh((reynolds - reCritical) / reWidth))
		const cd = cdSubcritical + blend * (cdSupercritical - cdSubcritical)

		return cd
	}

	/**
	 * Update ball physics for one time step.
	 *
	 * Applies:
	 * 1. Gravity (downward acceleration - ALWAYS applied)
	 * 2. Air drag (quadratic drag force opposing velocity, with Reynolds-dependent Cd)
	 * 3. Velocity integration (position += velocity * dt)
	 * 4. Ground collision (bounce with restitution)
	 * 5. Ground friction (deceleration when on ground)
	 *
	 * @param {number} dt - Time step in seconds (typically 0.01 for 100 FPS)
	 * @returns {void}
	 */
	update(dt: number): void {
		// ═══════════════════════════════════════════════════════════
		//           P H Y S I C S   I N T E G R A T I O N
		// ═══════════════════════════════════════════════════════════

		// Apply gravity (unconditional - gravity always acts downward along -Y axis)
		this.velocity.y -= this.#gravity * dt

		// ═══════════════════════════════════════════════════════════
		//                    A I R   D R A G
		// ═══════════════════════════════════════════════════════════

		// Calculate current speed
		const speed = Math.sqrt(
			this.velocity.x * this.velocity.x +
			this.velocity.y * this.velocity.y +
			this.velocity.z * this.velocity.z,
		)

		if (speed > 0.01) {
			// Drag force: F_drag = 0.5 * ρ * Cd * A * v²
			// Where:
			//   ρ (rho) = air density (kg/m³)
			//   Cd = drag coefficient (velocity-dependent, accounts for drag crisis)
			//   A = cross-sectional area (m²)
			//   v = speed (m/s)
			//
			// Drag acceleration: a = F / m
			// Direction: opposite to velocity

			// Get velocity-dependent drag coefficient (models drag crisis)
			const dragCoefficient = this.#getDragCoefficient(speed)

			const dragMagnitude = 0.5 * this.#airDensity * dragCoefficient *
			                      this.#crossSectionalArea * speed * speed
			const dragAccel = dragMagnitude / this.#mass

			// Apply drag in direction opposite to velocity
			// Normalize velocity vector and scale by drag acceleration
			const dragX = -(this.velocity.x / speed) * dragAccel * dt
			const dragY = -(this.velocity.y / speed) * dragAccel * dt
			const dragZ = -(this.velocity.z / speed) * dragAccel * dt

			// Prevent drag from reversing velocity direction
			// (drag should only slow down, never speed up in opposite direction)
			if (Math.abs(dragX) < Math.abs(this.velocity.x)) {
				this.velocity.x += dragX
			} else {
				this.velocity.x = 0
			}

			if (Math.abs(dragY) < Math.abs(this.velocity.y)) {
				this.velocity.y += dragY
			} else {
				this.velocity.y = 0
			}

			if (Math.abs(dragZ) < Math.abs(this.velocity.z)) {
				this.velocity.z += dragZ
			} else {
				this.velocity.z = 0
			}
		}

		// Integrate position
		this.position.x += this.velocity.x * dt
		this.position.y += this.velocity.y * dt
		this.position.z += this.velocity.z * dt

		// Update speed cache
		this.ball.speed = Math.sqrt(
			this.velocity.x * this.velocity.x +
			this.velocity.y * this.velocity.y +
			this.velocity.z * this.velocity.z,
		)

		// ═══════════════════════════════════════════════════════════
		//           G R O U N D   C O L L I S I O N
		// ═══════════════════════════════════════════════════════════

		if (this.position.y <= this.#radius) {
			// Clamp to ground level (ball center at radius height)
			this.position.y = this.#radius

			// Bounce (vertical component with restitution)
			if (Math.abs(this.velocity.y) < 0.1) {
				// Stop bouncing at low vertical speeds
				this.velocity.y = 0
			} else if (this.velocity.y < 0) {
				// Bounce with energy loss (reverse vertical velocity, scale by restitution)
				this.velocity.y = -this.velocity.y * this.#restitution
			}

			// Ground friction (horizontal deceleration on XZ plane)
			const vx = this.velocity.x
			const vz = this.velocity.z
			const horizontalSpeed = Math.sqrt(vx * vx + vz * vz)

			if (horizontalSpeed > 0.001) {
				// Apply friction force: F = μ * m * g
				// Resulting deceleration: a = μ * g
				const frictionDecel = this.#groundFriction * this.#gravity
				const speedReduction = frictionDecel * dt

				if (speedReduction >= horizontalSpeed) {
					// Friction would stop the ball completely
					this.velocity.x = 0
					this.velocity.z = 0
				} else {
					// Reduce speed proportionally in direction of motion
					const factor = (horizontalSpeed - speedReduction) / horizontalSpeed
					this.velocity.x *= factor
					this.velocity.z *= factor
				}
			}
		}

		// Update speed cache (only once at end)
		this.ball.speed = Math.sqrt(
			this.velocity.x * this.velocity.x +
			this.velocity.y * this.velocity.y +
			this.velocity.z * this.velocity.z,
		)

		// Stop completely at very low speeds (avoid numerical drift)
		if (this.ball.speed < 0.05) {
			this.velocity.x = 0
			this.velocity.y = 0
			this.velocity.z = 0
			this.ball.speed = 0
		}
	}

	/**
	 * Serialize physics state to JSON.
	 * @returns {object} JSON representation
	 */
	toJSON() {
		return {
			position: this.position.toArray(),
			velocity: this.velocity.toArray(),
			speed: this.ball.speed,
			spin: this.spin.toArray(),
		}
	}

	/**
	 * Restore physics state from JSON.
	 * @param {object} data - JSON representation
	 * @returns {BallPhysics} This instance (for chaining)
	 */
	fromJSON(data: any) {
		this.position.fromArray(data.position)
		this.velocity.fromArray(data.velocity)
		this.ball.speed = this.velocity.length()
		this.spin.fromArray(data.spin)
		return this
	}
}
