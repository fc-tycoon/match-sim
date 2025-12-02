/**
 * FC Tycoon™ 2027 Match Simulator - Coordinate Transforms
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import { Field } from './Field'

/**
 * Coordinate Transform Utilities
 *
 * WORLD SPACE (Primary - used by simulation, physics, AI):
 *
 *                     +Y (Top Touchline)
 *                      |
 *                      |
 *     -X (Home Goal) --●-- +X (Away Goal)
 *                      |
 *                      |
 *                     -Y (Bottom Touchline / Camera Side)
 *
 *     ● = Origin (Center Spot)
 *
 * Axis Definitions:
 * - X: Goal-to-goal (-52.5m to +52.5m)
 * - Y: Touchline-to-touchline (-34m to +34m)
 * - Height: Separate property for ball (not part of 2D position)
 *
 * Team Directions:
 * - Home: Defends -X (left), Attacks +X (right), attackDir = { x: 1, y: 0 }
 * - Away: Defends +X (right), Attacks -X (left), attackDir = { x: -1, y: 0 }
 *
 * CANVAS SPACE:
 * - Origin: Top-left corner
 * - +X: Right (maps to World +X)
 * - +Y: Down (maps to World -Y, FLIPPED)
 *
 * THREE.JS SPACE (right-handed):
 * - X: Same as World X (goal-to-goal)
 * - Y: Height above ground
 * - Z: Same as World Y (+Z = top touchline, -Z = bottom/camera)
 */

export class CoordinateTransforms {

	// ═══════════════════════════════════════════════════════════════════════════
	//                      P O S I T I O N   T R A N S F O R M S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Convert World 2D position to Canvas position.
	 * @param worldPos World position { x, y }
	 * @param scale Pixels per meter
	 * @param centerX Canvas center X (pixels)
	 * @param centerY Canvas center Y (pixels)
	 * @returns Canvas position { x, y } in pixels
	 */
	static worldToCanvas(worldPos: THREE.Vector2 | THREE.Vector3, scale: number, centerX: number, centerY: number): THREE.Vector2 {
		// World X → Canvas X (direct)
		// World Y → Canvas Y (flipped, because canvas +Y is down)
		const worldX = worldPos.x
		const worldY = 'z' in worldPos ? (worldPos as THREE.Vector3).z : worldPos.y

		return new THREE.Vector2(
			centerX + worldX * scale,
			centerY - worldY * scale,
		)
	}

	/**
	 * Convert Canvas position to World 2D position.
	 * @param canvasX Canvas X (pixels)
	 * @param canvasY Canvas Y (pixels)
	 * @param scale Pixels per meter
	 * @param centerX Canvas center X (pixels)
	 * @param centerY Canvas center Y (pixels)
	 * @returns World position { x, y }
	 */
	static canvasToWorld(canvasX: number, canvasY: number, scale: number, centerX: number, centerY: number): THREE.Vector2 {
		return new THREE.Vector2(
			(canvasX - centerX) / scale,
			-(canvasY - centerY) / scale,
		)
	}

	/**
	 * Convert World 2D position to Three.js position.
	 * World XY plane → Three.js XZ plane (right-handed)
	 * @param worldPos World position { x, y }
	 * @param height Height above ground (default 0)
	 * @returns Three.js position { x, y, z }
	 */
	static worldToThree(worldPos: THREE.Vector2, height: number = 0): THREE.Vector3 {
		return new THREE.Vector3(
			worldPos.x,		// World X → Three X
			height,			// Height → Three Y
			worldPos.y,		// World Y → Three Z (right-handed, no negation)
		)
	}

	/**
	 * Convert Three.js position to World 2D position.
	 * @param threePos Three.js position { x, y, z }
	 * @returns World position { x, y } and height
	 */
	static threeToWorld(threePos: THREE.Vector3): { pos: THREE.Vector2, height: number } {
		return {
			pos: new THREE.Vector2(threePos.x, threePos.z),  // Direct mapping (right-handed)
			height: threePos.y,
		}
	}

	/**
	 * Calculate the scale factor (pixels per meter) for rendering.
	 * @param field Field instance for dimensions
	 * @param canvasWidth Canvas width in pixels
	 * @param canvasHeight Canvas height in pixels
	 * @param margin Margin in meters (default 4)
	 * @returns Scale factor (pixels per meter)
	 */
	static calculateScale(field: Field, canvasWidth: number, canvasHeight: number, margin: number = 4): number {
		const totalLength = field.LENGTH + margin * 2
		const totalWidth = field.WIDTH + margin * 2

		return Math.min(canvasWidth / totalLength, canvasHeight / totalWidth)
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                      D I R E C T I O N   T R A N S F O R M S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Convert World direction vector to Canvas direction vector.
	 * @param worldDir World direction { x, y } (unit vector)
	 * @returns Canvas direction { x, y }
	 */
	static worldDirToCanvas(worldDir: THREE.Vector2): THREE.Vector2 {
		// World X → Canvas X (same)
		// World Y → Canvas Y (flipped)
		return new THREE.Vector2(worldDir.x, -worldDir.y)
	}

	/**
	 * Get Three.js lookAt target from World position and direction.
	 * @param worldPos World position { x, y }
	 * @param worldDir World direction { x, y } (unit vector)
	 * @param height Height above ground
	 * @param distance Distance to target (default 1)
	 * @returns Three.js target position for lookAt()
	 */
	static worldDirToThreeTarget(worldPos: THREE.Vector2, worldDir: THREE.Vector2, height: number = 0, distance: number = 1): THREE.Vector3 {
		return new THREE.Vector3(
			worldPos.x + worldDir.x * distance,
			height,
			worldPos.y + worldDir.y * distance,  // Direct mapping (right-handed)
		)
	}

	/**
	 * Convert World direction to Three.js rotation.y (yaw angle).
	 * Use this when you can't use lookAt() (e.g., for rotation interpolation).
	 *
	 * Model assumption: At rotation.y = 0, the model faces +X (local).
	 *
	 * @param worldDir World direction { x, y } (unit vector)
	 * @returns Rotation angle in radians for Three.js rotation.y
	 */
	static worldDirToThreeYaw(worldDir: THREE.Vector2): number {
		// World X maps to Three.js X, World Y maps to Three.js Z
		// Three.js rotation.y: counter-clockwise from above, 0 = facing +X
		// For bodyDir = (1, 0): want rotation.y = 0 (face +X)
		// For bodyDir = (0, 1): want rotation.y = -π/2 (face +Z)
		return -Math.atan2(worldDir.y, worldDir.x)
	}

	/**
	 * Convert World direction to Canvas arc() angle.
	 * @param worldDir World direction { x, y } (unit vector)
	 * @returns Canvas angle in radians (0 = right, positive = clockwise)
	 */
	static worldDirToCanvasAngle(worldDir: THREE.Vector2): number {
		// Canvas: 0 = right (+X), positive = clockwise (toward +Y which is down)
		// World: 0 = right (+X), positive = counter-clockwise (toward +Y which is up)
		// So we negate the Y component
		return Math.atan2(-worldDir.y, worldDir.x)
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                      S L O T / F O R M A T I O N   T R A N S F O R M S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Convert Slot Coordinates (Normalized -1 to +1) to World Coordinates.
	 *
	 * Slot space:
	 * - X: -1 (left flank) to +1 (right flank)
	 * - Y: -1 (defensive/back) to +1 (attacking/forward)
	 *
	 * @param slotX Normalized X (-1 to +1)
	 * @param slotY Normalized Y (-1 to +1)
	 * @param attackDir Team's attack direction vector { x, y }
	 * @param centerOfMass Team's center of mass in world coords
	 * @param width Tactical width in meters
	 * @param depth Tactical depth in meters
	 * @returns World position { x, y }
	 */
	static slotToWorld(
		slotX: number,
		slotY: number,
		attackDir: THREE.Vector2,
		centerOfMass: THREE.Vector2,
		width: number,
		depth: number,
	): THREE.Vector2 {
		// Scale slot to meters
		const localForward = slotY * (depth / 2)		// Forward/back along attack direction
		const localRight = slotX * (width / 2)		// Left/right perpendicular to attack

		// Get perpendicular direction (90° clockwise from attack direction)
		const perpDir = new THREE.Vector2(attackDir.y, -attackDir.x)

		// World position = COM + forward along attackDir + right along perpDir
		return new THREE.Vector2(
			centerOfMass.x + localForward * attackDir.x + localRight * perpDir.x,
			centerOfMass.y + localForward * attackDir.y + localRight * perpDir.y,
		)
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//                      V E C T O R   U T I L I T I E S
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * Normalize a vector to unit length.
	 * @param v Vector to normalize
	 * @returns Unit vector (or zero vector if input is zero)
	 */
	static normalize(v: THREE.Vector2): THREE.Vector2 {
		const len = v.length()
		if (len < 0.0001) return new THREE.Vector2(0, 0)
		return new THREE.Vector2(v.x / len, v.y / len)
	}

	/**
	 * Get direction from point A to point B.
	 * @param from Starting position
	 * @param to Target position
	 * @returns Unit direction vector (or zero if same position)
	 */
	static directionTo(from: THREE.Vector2, to: THREE.Vector2): THREE.Vector2 {
		const dx = to.x - from.x
		const dy = to.y - from.y
		const len = Math.sqrt(dx * dx + dy * dy)
		if (len < 0.0001) return new THREE.Vector2(0, 0)
		return new THREE.Vector2(dx / len, dy / len)
	}

	/**
	 * Dot product of two vectors.
	 * @param a First vector
	 * @param b Second vector
	 * @returns Dot product (cosine of angle if both are unit vectors)
	 */
	static dot(a: THREE.Vector2, b: THREE.Vector2): number {
		return a.x * b.x + a.y * b.y
	}

	/**
	 * 2D cross product (returns scalar).
	 * Positive = b is counter-clockwise from a
	 * Negative = b is clockwise from a
	 * @param a First vector
	 * @param b Second vector
	 * @returns Cross product scalar
	 */
	static cross(a: THREE.Vector2, b: THREE.Vector2): number {
		return a.x * b.y - a.y * b.x
	}

	/**
	 * Rotate a vector 90° counter-clockwise.
	 * @param v Vector to rotate
	 * @returns Rotated vector
	 */
	static rotate90CCW(v: THREE.Vector2): THREE.Vector2 {
		return new THREE.Vector2(-v.y, v.x)
	}

	/**
	 * Rotate a vector 90° clockwise.
	 * @param v Vector to rotate
	 * @returns Rotated vector
	 */
	static rotate90CW(v: THREE.Vector2): THREE.Vector2 {
		return new THREE.Vector2(v.y, -v.x)
	}

	/**
	 * Rotate a vector by an arbitrary angle.
	 * @param v Vector to rotate
	 * @param angle Angle in radians (positive = counter-clockwise)
	 * @returns Rotated vector
	 */
	static rotate(v: THREE.Vector2, angle: number): THREE.Vector2 {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		return new THREE.Vector2(
			v.x * cos - v.y * sin,
			v.x * sin + v.y * cos,
		)
	}

	// ═══════════════════════════════════════════════════════════════════════════
	//            D E P R E C A T E D   ( B A C K W A R D   C O M P A T )
	// ═══════════════════════════════════════════════════════════════════════════

	/**
	 * @deprecated Use worldDirToCanvasAngle() with direction vectors instead.
	 * Convert bodyDirection angle to Canvas rotation angle.
	 */
	static bodyDirectionToCanvas(bodyDirection: number): number {
		// Old convention: 0 = +X, positive = counter-clockwise
		// Canvas: 0 = +X, positive = clockwise
		return -bodyDirection
	}

	/**
	 * @deprecated Use worldDirToThreeYaw() with direction vectors instead.
	 * Convert bodyDirection angle to Three.js rotation.y.
	 */
	static bodyDirectionToThreeJS(bodyDirection: number): number {
		return bodyDirection
	}
}
