/**
 * FC Tycoon™ 2027 Match Simulator - Field
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { Box2, Vector2 } from 'three'

import { DefendingSide } from '@/core/TeamState'
import type { Team } from '@/core/Team'

// ═══════════════════════════════════════════════════════════════════════════
//                      B O U N D A R Y   T Y P E S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Boundary Exit Type.
 * Indicates how the ball exited the field of play.
 */
export const enum BoundaryExit {
	/** Ball is still in play */
	IN_PLAY = 0,

	/** Ball crossed the touchline (side of field) - throw-in */
	TOUCHLINE = 1,

	/** Ball crossed the goal line but not in goal - goal kick or corner */
	GOAL_LINE = 2,

	/** Ball entered the home goal (at -X) */
	GOAL_HOME = 3,

	/** Ball entered the away goal (at +X) */
	GOAL_AWAY = 4,
}

/**
 * Result of a boundary check.
 * Contains the exit type and the point where the ball crossed the boundary.
 */
export interface BoundaryCheckResult {
	/** How the ball exited (or IN_PLAY if still on field) */
	exit: BoundaryExit

	/** The point where the ball crossed the boundary (null if in play) */
	crossingPoint: Vector2 | null

	/** Which team last touched the ball (for determining restart type) - set by caller */
	lastTouchedBy?: Team
}

const YARDS_TO_METERS = 0.9144
const FEET_TO_METERS = 0.3048

export class Field {
	/** Conversion factor: yards to meters (0.9144) */
	static readonly YARDS_TO_METERS = YARDS_TO_METERS

	/** Conversion factor: feet to meters (0.3048) */
	static readonly FEET_TO_METERS = FEET_TO_METERS

	/** Conversion factor: meters to yards (~1.0936) */
	static readonly METERS_TO_YARDS = 1 / YARDS_TO_METERS

	// ═══════════════════════════════════════════════════════════
	//              F I E L D   S I Z E   ( Y A R D S )
	// ═══════════════════════════════════════════════════════════

	/** Field length in yards (goal-to-goal). Default: 115 yards */
	readonly LENGTH_YARDS: number

	/** Field width in yards (touchline-to-touchline). Default: 74 yards */
	readonly WIDTH_YARDS: number

	/** Half field length in yards. Default: 57.5 yards */
	readonly LENGTH_HALF_YARDS: number

	/** Half field width in yards. Default: 37 yards */
	readonly WIDTH_HALF_YARDS: number

	// ═══════════════════════════════════════════════════════════
	//              F I E L D   S I Z E   ( M E T E R S )
	// ═══════════════════════════════════════════════════════════

	/** Field length in meters (goal-to-goal). Default: ~105.2m */
	readonly LENGTH: number

	/** Field width in meters (touchline-to-touchline). Default: ~67.7m */
	readonly WIDTH: number

	/** Half field length in meters. Default: ~52.6m */
	readonly LENGTH_HALF: number

	/** Half field width in meters. Default: ~33.8m */
	readonly WIDTH_HALF: number

	// ═══════════════════════════════════════════════════════════
	//              G O A L   D I M E N S I O N S   ( Y A R D S )
	// ═══════════════════════════════════════════════════════════

	/** Goal width in yards (between posts). Default: 8 yards */
	readonly GOAL_WIDTH_YARDS: number

	/** Goal height in feet (to crossbar). Default: 8 feet */
	readonly GOAL_HEIGHT_FEET: number

	/** Goal net depth in yards. Default: 2 yards */
	readonly GOAL_DEPTH_YARDS: number

	// ═══════════════════════════════════════════════════════════
	//              G O A L   D I M E N S I O N S  ( M E T E R S )
	// ═══════════════════════════════════════════════════════════

	/** Goal width in meters (between posts). Default: ~7.3m */
	readonly GOAL_WIDTH: number

	/** Goal height in meters (to crossbar). Default: ~2.4m */
	readonly GOAL_HEIGHT: number

	/** Goal net depth in meters. Default: ~1.8m */
	readonly GOAL_DEPTH: number

	// ═══════════════════════════════════════════════════════════
	//              A R E A   D I M E N S I O N S   ( Y A R D S )
	// ═══════════════════════════════════════════════════════════

	/** Penalty area depth in yards (from goal line). Default: 18 yards */
	readonly PENALTY_AREA_LENGTH_YARDS: number

	/** Penalty area width in yards (centered on goal). Default: 44 yards */
	readonly PENALTY_AREA_WIDTH_YARDS: number

	/** Goal area depth in yards (6-yard box). Default: 6 yards */
	readonly GOAL_AREA_LENGTH_YARDS: number

	/** Goal area width in yards (centered on goal). Default: 20 yards */
	readonly GOAL_AREA_WIDTH_YARDS: number

	// ═══════════════════════════════════════════════════════════
	//              A R E A   D I M E N S I O N S  ( M E T E R S )
	// ═══════════════════════════════════════════════════════════

	/** Penalty area depth in meters (from goal line). Default: ~16.5m */
	readonly PENALTY_AREA_LENGTH: number

	/** Penalty area width in meters (centered on goal). Default: ~40.2m */
	readonly PENALTY_AREA_WIDTH: number

	/** Goal area depth in meters (6-yard box). Default: ~5.5m */
	readonly GOAL_AREA_LENGTH: number

	/** Goal area width in meters (centered on goal). Default: ~18.3m */
	readonly GOAL_AREA_WIDTH: number

	// ═══════════════════════════════════════════════════════════
	//              M A R K I N G S   ( Y A R D S )
	// ═══════════════════════════════════════════════════════════

	/** Center circle radius in yards. Default: 10 yards */
	readonly CENTER_CIRCLE_RADIUS_YARDS: number

	/** Distance from goal line to penalty spot in yards. Default: 12 yards */
	readonly PENALTY_SPOT_DISTANCE_YARDS: number

	/** Penalty arc radius in yards (same as center circle). Default: 10 yards */
	readonly PENALTY_ARC_RADIUS_YARDS: number

	/** Corner arc radius in yards. Default: 1 yard */
	readonly CORNER_ARC_RADIUS_YARDS: number

	// ═══════════════════════════════════════════════════════════
	//              M A R K I N G S   ( M E T E R S )
	// ═══════════════════════════════════════════════════════════

	/** Center circle radius in meters. Default: ~9.15m */
	readonly CENTER_CIRCLE_RADIUS: number

	/** Distance from goal line to penalty spot in meters. Default: ~11m */
	readonly PENALTY_SPOT_DISTANCE: number

	/** Penalty arc radius in meters (same as center circle). Default: ~9.15m */
	readonly PENALTY_ARC_RADIUS: number

	/** Corner arc radius in meters. Default: ~0.91m */
	readonly CORNER_ARC_RADIUS: number

	// ═══════════════════════════════════════════════════════════
	//     P E R I M E T E R   B U F F E R S   ( M E T E R S )
	// ═══════════════════════════════════════════════════════════

	/** Buffer zone along touchlines in meters (for player positioning). Default: 3m */
	readonly TOUCHLINE_BUFFER_METERS: number

	/** Buffer zone behind goal lines in meters (for player positioning). Default: 4m */
	readonly GOAL_LINE_BUFFER_METERS: number

	/** Runoff area width along touchlines in meters. Default: 5m */
	readonly TOUCHLINE_PERIMETER_METERS: number

	/** Runoff area depth behind goal lines in meters. Default: 6m */
	readonly GOAL_LINE_PERIMETER_METERS: number

	// ═══════════════════════════════════════════════════════════
	//              V I S U A L   P R O P E R T I E S
	// ═══════════════════════════════════════════════════════════

	/** Line thickness for field markings in meters */
	readonly LINE_THICKNESS: number

	/** Primary grass color (hex) - default: 0x2d5a3d (dark green) */
	readonly COLOR_GRASS: number

	/** Grass stripe color for cut pattern (hex) - default: 0x2a5338 (slightly darker) */
	readonly COLOR_GRASS_STRIPE: number

	/** Grass border/runoff area color (hex) - default: 0x1a472a (darkest) */
	readonly COLOR_GRASS_BORDER: number

	/** Field line marking color (hex) - default: 0xffffff (white) */
	readonly COLOR_LINE: number

	/** Sky/background color (hex) - default: 0x6bb6ff (light blue) */
	readonly COLOR_SKY: number

	/** Training cone/marker color (hex) - default: 0xffff00 (yellow) */
	readonly COLOR_CONE: number

	// ═══════════════════════════════════════════════════════════
	//              B O U N D I N G   B O X E S   ( B o x 2 )
	// ═══════════════════════════════════════════════════════════
	// World Coordinates (see COORDINATES.md):
	// - X: Goal-to-goal axis (-LENGTH_HALF to +LENGTH_HALF)
	// - Y: Touchline-to-touchline axis (-WIDTH_HALF to +WIDTH_HALF)
	//
	// Box2 Summary (default 115×74 yard field ≈ 105.2m × 67.7m):
	// ┌─────────────────────┬──────────────────────────┬──────────────────────────┐
	// │ Box2                │ Min (lower-left)         │ Max (upper-right)        │
	// ├─────────────────────┼──────────────────────────┼──────────────────────────┤
	// │ fieldBounds         │ (-52.6, -33.8)           │ (52.6, 33.8)             │
	// │ homePenaltyArea     │ (-52.6, -20.1)           │ (-36.1, 20.1)            │
	// │ awayPenaltyArea     │ (36.1, -20.1)            │ (52.6, 20.1)             │
	// │ homeGoalArea        │ (-52.6, -9.1)            │ (-47.1, 9.1)             │
	// │ awayGoalArea        │ (47.1, -9.1)             │ (52.6, 9.1)              │
	// │ homeGoal            │ (-54.4, -3.7)            │ (-52.6, 3.7)             │
	// │ awayGoal            │ (52.6, -3.7)             │ (54.4, 3.7)              │
	// └─────────────────────┴──────────────────────────┴──────────────────────────┘

	/**
	 * Bounding box for the entire playing field (touchlines and goal lines).
	 * Default: min(-52.6, -33.8), max(52.6, 33.8)
	 */
	readonly fieldBounds: Box2

	/**
	 * Bounding box for the home team's penalty area (at -X).
	 * Default: min(-52.6, -20.1), max(-36.1, 20.1)
	 */
	readonly homePenaltyArea: Box2

	/**
	 * Bounding box for the away team's penalty area (at +X).
	 * Default: min(36.1, -20.1), max(52.6, 20.1)
	 */
	readonly awayPenaltyArea: Box2

	/**
	 * Bounding box for the home team's goal area / 6-yard box (at -X).
	 * Default: min(-52.6, -9.1), max(-47.1, 9.1)
	 */
	readonly homeGoalArea: Box2

	/**
	 * Bounding box for the away team's goal area / 6-yard box (at +X).
	 * Default: min(47.1, -9.1), max(52.6, 9.1)
	 */
	readonly awayGoalArea: Box2

	/**
	 * Bounding box for the home team's goal (behind the goal line at -X).
	 * Default: min(-54.4, -3.7), max(-52.6, 3.7)
	 */
	readonly homeGoal: Box2

	/**
	 * Bounding box for the away team's goal (behind the goal line at +X).
	 * Default: min(52.6, -3.7), max(54.4, 3.7)
	 */
	readonly awayGoal: Box2

	constructor(config: {
		LENGTH_YARDS?: number
		WIDTH_YARDS?: number
		GOAL_WIDTH_YARDS?: number
		GOAL_HEIGHT_FEET?: number
		GOAL_DEPTH_YARDS?: number
		PENALTY_AREA_LENGTH_YARDS?: number
		PENALTY_AREA_WIDTH_YARDS?: number
		GOAL_AREA_LENGTH_YARDS?: number
		GOAL_AREA_WIDTH_YARDS?: number
		CENTER_CIRCLE_RADIUS_YARDS?: number
		PENALTY_SPOT_DISTANCE_YARDS?: number
		CORNER_ARC_RADIUS_YARDS?: number
		TOUCHLINE_BUFFER_METERS?: number
		GOAL_LINE_BUFFER_METERS?: number
		TOUCHLINE_PERIMETER_METERS?: number
		GOAL_LINE_PERIMETER_METERS?: number
		LINE_THICKNESS?: number
		COLOR_GRASS?: number
		COLOR_GRASS_STRIPE?: number
		COLOR_GRASS_BORDER?: number
		COLOR_LINE?: number
		COLOR_SKY?: number
		COLOR_CONE?: number
	} = {}) {
		const {
			LENGTH_YARDS = 115,
			WIDTH_YARDS = 74,
			GOAL_WIDTH_YARDS = 8,
			GOAL_HEIGHT_FEET = 8,
			GOAL_DEPTH_YARDS = 2,
			PENALTY_AREA_LENGTH_YARDS = 18,
			PENALTY_AREA_WIDTH_YARDS = 44,
			GOAL_AREA_LENGTH_YARDS = 6,
			GOAL_AREA_WIDTH_YARDS = 20,
			CENTER_CIRCLE_RADIUS_YARDS = 10,
			PENALTY_SPOT_DISTANCE_YARDS = 12,
			CORNER_ARC_RADIUS_YARDS = 1,
			TOUCHLINE_BUFFER_METERS = 3,
			GOAL_LINE_BUFFER_METERS = 4,
			TOUCHLINE_PERIMETER_METERS = 5,
			GOAL_LINE_PERIMETER_METERS = 6,
			LINE_THICKNESS = 0.12,
			COLOR_GRASS = 0x2d5a3d,
			COLOR_GRASS_STRIPE = 0x2a5338,
			COLOR_GRASS_BORDER = 0x1a472a,
			COLOR_LINE = 0xffffff,
			COLOR_SKY = 0x6bb6ff,
			COLOR_CONE = 0xffff00,
		} = config

		this.LENGTH_YARDS = LENGTH_YARDS
		this.WIDTH_YARDS = WIDTH_YARDS

		this.LENGTH = this.LENGTH_YARDS * YARDS_TO_METERS
		this.WIDTH = this.WIDTH_YARDS * YARDS_TO_METERS

		this.LENGTH_HALF_YARDS = this.LENGTH_YARDS / 2
		this.WIDTH_HALF_YARDS = this.WIDTH_YARDS / 2

		this.LENGTH_HALF = this.LENGTH / 2
		this.WIDTH_HALF = this.WIDTH / 2

		this.GOAL_WIDTH_YARDS = GOAL_WIDTH_YARDS
		this.GOAL_HEIGHT_FEET = GOAL_HEIGHT_FEET
		this.GOAL_DEPTH_YARDS = GOAL_DEPTH_YARDS

		this.GOAL_WIDTH = this.GOAL_WIDTH_YARDS * YARDS_TO_METERS
		this.GOAL_HEIGHT = this.GOAL_HEIGHT_FEET * FEET_TO_METERS
		this.GOAL_DEPTH = this.GOAL_DEPTH_YARDS * YARDS_TO_METERS

		this.PENALTY_AREA_LENGTH_YARDS = PENALTY_AREA_LENGTH_YARDS
		this.PENALTY_AREA_WIDTH_YARDS = PENALTY_AREA_WIDTH_YARDS

		this.GOAL_AREA_LENGTH_YARDS = GOAL_AREA_LENGTH_YARDS
		this.GOAL_AREA_WIDTH_YARDS = GOAL_AREA_WIDTH_YARDS

		this.PENALTY_AREA_LENGTH = this.PENALTY_AREA_LENGTH_YARDS * YARDS_TO_METERS
		this.PENALTY_AREA_WIDTH = this.PENALTY_AREA_WIDTH_YARDS * YARDS_TO_METERS

		this.GOAL_AREA_LENGTH = this.GOAL_AREA_LENGTH_YARDS * YARDS_TO_METERS
		this.GOAL_AREA_WIDTH = this.GOAL_AREA_WIDTH_YARDS * YARDS_TO_METERS

		this.CENTER_CIRCLE_RADIUS_YARDS = CENTER_CIRCLE_RADIUS_YARDS
		this.PENALTY_SPOT_DISTANCE_YARDS = PENALTY_SPOT_DISTANCE_YARDS
		this.PENALTY_ARC_RADIUS_YARDS = CENTER_CIRCLE_RADIUS_YARDS
		this.CORNER_ARC_RADIUS_YARDS = CORNER_ARC_RADIUS_YARDS

		this.CENTER_CIRCLE_RADIUS = this.CENTER_CIRCLE_RADIUS_YARDS * YARDS_TO_METERS
		this.PENALTY_SPOT_DISTANCE = this.PENALTY_SPOT_DISTANCE_YARDS * YARDS_TO_METERS
		this.PENALTY_ARC_RADIUS = this.PENALTY_ARC_RADIUS_YARDS * YARDS_TO_METERS
		this.CORNER_ARC_RADIUS = this.CORNER_ARC_RADIUS_YARDS * YARDS_TO_METERS

		this.TOUCHLINE_BUFFER_METERS = TOUCHLINE_BUFFER_METERS
		this.GOAL_LINE_BUFFER_METERS = GOAL_LINE_BUFFER_METERS

		this.TOUCHLINE_PERIMETER_METERS = TOUCHLINE_PERIMETER_METERS
		this.GOAL_LINE_PERIMETER_METERS = GOAL_LINE_PERIMETER_METERS

		this.LINE_THICKNESS = LINE_THICKNESS
		this.COLOR_GRASS = COLOR_GRASS
		this.COLOR_GRASS_STRIPE = COLOR_GRASS_STRIPE
		this.COLOR_GRASS_BORDER = COLOR_GRASS_BORDER
		this.COLOR_LINE = COLOR_LINE
		this.COLOR_SKY = COLOR_SKY
		this.COLOR_CONE = COLOR_CONE

		// ───────────────────────────────────────────────────────
		// Initialize Bounding Boxes (Box2)
		// World Coordinates: X = goal-to-goal, Y = touchline
		// ───────────────────────────────────────────────────────

		// Field bounds: entire playing surface
		this.fieldBounds = new Box2(
			new Vector2(-this.LENGTH_HALF, -this.WIDTH_HALF),
			new Vector2(this.LENGTH_HALF, this.WIDTH_HALF),
		)

		// Home penalty area (at -X, centered on Y=0)
		const penaltyHalfWidth = this.PENALTY_AREA_WIDTH / 2
		this.homePenaltyArea = new Box2(
			new Vector2(-this.LENGTH_HALF, -penaltyHalfWidth),
			new Vector2(-this.LENGTH_HALF + this.PENALTY_AREA_LENGTH, penaltyHalfWidth),
		)

		// Away penalty area (at +X, centered on Y=0)
		this.awayPenaltyArea = new Box2(
			new Vector2(this.LENGTH_HALF - this.PENALTY_AREA_LENGTH, -penaltyHalfWidth),
			new Vector2(this.LENGTH_HALF, penaltyHalfWidth),
		)

		// Home goal area / 6-yard box (at -X, centered on Y=0)
		const goalAreaHalfWidth = this.GOAL_AREA_WIDTH / 2
		this.homeGoalArea = new Box2(
			new Vector2(-this.LENGTH_HALF, -goalAreaHalfWidth),
			new Vector2(-this.LENGTH_HALF + this.GOAL_AREA_LENGTH, goalAreaHalfWidth),
		)

		// Away goal area / 6-yard box (at +X, centered on Y=0)
		this.awayGoalArea = new Box2(
			new Vector2(this.LENGTH_HALF - this.GOAL_AREA_LENGTH, -goalAreaHalfWidth),
			new Vector2(this.LENGTH_HALF, goalAreaHalfWidth),
		)

		// Home goal (behind the goal line at -X)
		const goalHalfWidth = this.GOAL_WIDTH / 2
		this.homeGoal = new Box2(
			new Vector2(-this.LENGTH_HALF - this.GOAL_DEPTH, -goalHalfWidth),
			new Vector2(-this.LENGTH_HALF, goalHalfWidth),
		)

		// Away goal (behind the goal line at +X)
		this.awayGoal = new Box2(
			new Vector2(this.LENGTH_HALF, -goalHalfWidth),
			new Vector2(this.LENGTH_HALF + this.GOAL_DEPTH, goalHalfWidth),
		)

		Object.freeze(this)
	}

	/**
	 * Check if a point is inside the field boundaries (touchlines and goal lines).
	 *
	 * World Coordinates (see COORDINATES.md):
	 * - X: Goal-to-goal axis (-LENGTH_HALF to +LENGTH_HALF)
	 * - Y: Touchline-to-touchline axis (-WIDTH_HALF to +WIDTH_HALF)
	 *
	 * @param x World X coordinate (goal-to-goal)
	 * @param y World Y coordinate (touchline-to-touchline)
	 */
	containsPoint(x: number, y: number): boolean {
		return x <= this.LENGTH_HALF && x >= -this.LENGTH_HALF && y <= this.WIDTH_HALF && y >= -this.WIDTH_HALF
	}

	/**
	 * Get the center position of the goal that the team is DEFENDING.
	 *
	 * World Coordinates (see COORDINATES.md):
	 * - DefendingSide.LEFT (-1): Goal at -X (Home team default)
	 * - DefendingSide.RIGHT (1): Goal at +X (Away team default)
	 *
	 * @param team The team whose defending goal position to return
	 * @returns World position of the goal center
	 */
	getDefendingGoalPosition(team: Team): { x: number, y: number } {
		return {
			x: team.state.defendingSide === DefendingSide.LEFT ? -this.LENGTH_HALF : this.LENGTH_HALF,
			y: 0,
		}
	}

	/**
	 * Get the center position of the goal that the team is ATTACKING.
	 *
	 * World Coordinates (see COORDINATES.md):
	 * - DefendingSide.LEFT (-1): Attacking goal at +X
	 * - DefendingSide.RIGHT (1): Attacking goal at -X
	 *
	 * @param team The team whose attacking goal position to return
	 * @returns World position of the goal center
	 */
	getAttackingGoalPosition(team: Team): { x: number, y: number } {
		return {
			x: team.state.defendingSide === DefendingSide.LEFT ? this.LENGTH_HALF : -this.LENGTH_HALF,
			y: 0,
		}
	}

	/**
	 * Get the penalty area Box2 that the team is DEFENDING.
	 *
	 * @param team The team whose defending penalty area to return
	 * @returns Box2 of the team's own penalty area
	 */
	getDefendingPenaltyArea(team: Team): Box2 {
		return team.state.defendingSide === DefendingSide.LEFT
			? this.homePenaltyArea
			: this.awayPenaltyArea
	}

	/**
	 * Get the penalty area Box2 that the team is ATTACKING.
	 *
	 * @param team The team whose attacking (opponent's) penalty area to return
	 * @returns Box2 of the opponent's penalty area
	 */
	getAttackingPenaltyArea(team: Team): Box2 {
		return team.state.defendingSide === DefendingSide.LEFT
			? this.awayPenaltyArea
			: this.homePenaltyArea
	}

	/**
	 * Get the goal Box2 that the team is DEFENDING.
	 *
	 * @param team The team whose defending goal to return
	 * @returns Box2 of the team's own goal
	 */
	getDefendingGoal(team: Team): Box2 {
		return team.state.defendingSide === DefendingSide.LEFT
			? this.homeGoal
			: this.awayGoal
	}

	/**
	 * Get the goal Box2 that the team is ATTACKING.
	 *
	 * @param team The team whose attacking (opponent's) goal to return
	 * @returns Box2 of the opponent's goal
	 */
	getAttackingGoal(team: Team): Box2 {
		return team.state.defendingSide === DefendingSide.LEFT
			? this.awayGoal
			: this.homeGoal
	}

	/**
	 * Check if a point is inside the DEFENDING penalty area of a specific team.
	 *
	 * World Coordinates (see COORDINATES.md):
	 * - X: Goal-to-goal axis (DefendingSide.LEFT at -X, DefendingSide.RIGHT at +X)
	 * - Y: Touchline-to-touchline axis (centered at 0)
	 *
	 * @param x World X coordinate (goal-to-goal)
	 * @param y World Y coordinate (touchline-to-touchline)
	 * @param team The team whose defending penalty area we are checking
	 * @returns True if the point is inside the team's own penalty area
	 */
	isInDefendingPenaltyArea(x: number, y: number, team: Team): boolean {
		const penaltyArea = this.getDefendingPenaltyArea(team)
		return penaltyArea.containsPoint(new Vector2(x, y))
	}

	/**
	 * Check if a point is inside the ATTACKING penalty area of a specific team.
	 * (i.e., the opponent's penalty area)
	 *
	 * @param x World X coordinate (goal-to-goal)
	 * @param y World Y coordinate (touchline-to-touchline)
	 * @param team The team whose attacking (opponent's) penalty area we are checking
	 * @returns True if the point is inside the opponent's penalty area
	 */
	isInAttackingPenaltyArea(x: number, y: number, team: Team): boolean {
		const penaltyArea = this.getAttackingPenaltyArea(team)
		return penaltyArea.containsPoint(new Vector2(x, y))
	}

	/**
	 * Constrain a position to be outside the DEFENDING penalty area and penalty arc of a specific team.
	 * Used for positioning players during penalty kicks.
	 *
	 * @param x World X coordinate (goal-to-goal)
	 * @param y World Y coordinate (touchline-to-touchline)
	 * @param team The team whose defending penalty area to avoid
	 * @returns New position {x, y} outside the restricted area
	 */
	constrainOutsideDefendingPenaltyArea(x: number, y: number, team: Team): { x: number, y: number } {
		const defendsLeft = team.state.defendingSide === DefendingSide.LEFT

		// 1. Check if inside Penalty Box
		if (this.isInDefendingPenaltyArea(x, y, team)) {
			// Move to the edge of the box (towards center field)
			// DefendingSide.LEFT (-X) -> Box Edge is at (-LENGTH_HALF + PENALTY_AREA_LENGTH)
			// DefendingSide.RIGHT (+X) -> Box Edge is at (LENGTH_HALF - PENALTY_AREA_LENGTH)

			if (defendsLeft) {
				x = -this.LENGTH_HALF + this.PENALTY_AREA_LENGTH + 0.1 // Small buffer
			} else {
				x = this.LENGTH_HALF - this.PENALTY_AREA_LENGTH - 0.1
			}
		}

		// 2. Check if inside Penalty Arc (D-shape)
		// The arc is a circle centered at the penalty spot with radius 9.15m (10 yards)
		// We only care if the player is "inside" this circle AND on the field side of the penalty spot

		const spotX = defendsLeft
			? -this.LENGTH_HALF + this.PENALTY_SPOT_DISTANCE
			: this.LENGTH_HALF - this.PENALTY_SPOT_DISTANCE

		const dx = x - spotX
		const dy = y
		const distSq = dx * dx + dy * dy
		const radiusSq = this.PENALTY_ARC_RADIUS * this.PENALTY_ARC_RADIUS

		if (distSq < radiusSq) {
			// Player is inside the circle. Push them out along the radius vector.
			const dist = Math.sqrt(distSq)
			const pushFactor = (this.PENALTY_ARC_RADIUS + 0.1) / dist // +0.1 buffer

			// New position relative to spot
			const newDx = dx * pushFactor
			const newDy = dy * pushFactor

			x = spotX + newDx
			y = newDy
		}

		return { x, y }
	}

	/**
	 * Constrain a position to be outside the center circle.
	 * Used for kickoffs.
	 *
	 * @param x World X coordinate (goal-to-goal)
	 * @param y World Y coordinate (touchline-to-touchline)
	 * @returns New position {x, y} outside the center circle
	 */
	constrainOutsideCenterCircle(x: number, y: number): { x: number, y: number } {
		const distSq = x * x + y * y
		const radiusSq = this.CENTER_CIRCLE_RADIUS * this.CENTER_CIRCLE_RADIUS

		if (distSq < radiusSq) {
			const dist = Math.sqrt(distSq)
			// Avoid division by zero if exactly at center
			if (dist < 0.01) {
				return { x: this.CENTER_CIRCLE_RADIUS + 0.1, y: 0 }
			}

			const pushFactor = (this.CENTER_CIRCLE_RADIUS + 0.1) / dist
			x *= pushFactor
			y *= pushFactor
		}

		return { x, y }
	}

	toJSON() {
		return {
			LENGTH_YARDS: this.LENGTH_YARDS,
			WIDTH_YARDS: this.WIDTH_YARDS,
			GOAL_WIDTH_YARDS: this.GOAL_WIDTH_YARDS,
			GOAL_HEIGHT_FEET: this.GOAL_HEIGHT_FEET,
			PENALTY_AREA_LENGTH_YARDS: this.PENALTY_AREA_LENGTH_YARDS,
			PENALTY_AREA_WIDTH_YARDS: this.PENALTY_AREA_WIDTH_YARDS,
			GOAL_AREA_LENGTH_YARDS: this.GOAL_AREA_LENGTH_YARDS,
			GOAL_AREA_WIDTH_YARDS: this.GOAL_AREA_WIDTH_YARDS,
			PENALTY_SPOT_DISTANCE_YARDS: this.PENALTY_SPOT_DISTANCE_YARDS,
		}
	}
}
