/**
 * FC Tycoon™ 2027 Match Simulator - Primitives Helper
 *
 * Provides static methods for creating placeholder 3D primitives
 * (box, sphere, capsule) used as fallbacks while GLB assets load.
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 */

import * as THREE from 'three'

/**
 * Fallback primitive types for assets that haven't loaded yet.
 */
export type PrimitiveType = 'box' | 'sphere' | 'capsule' | 'none'

/**
 * Configuration for primitive creation.
 */
export interface PrimitiveConfig {
	/** Color of the primitive material */
	color?: number
	/** Width (X) for box, diameter for sphere/capsule */
	width?: number
	/** Height (Y) */
	height?: number
	/** Depth (Z) for box */
	depth?: number
	/** Whether the primitive casts shadows */
	castShadow?: boolean
	/** Whether the primitive receives shadows */
	receiveShadow?: boolean
}

/**
 * Default primitive dimensions for common use cases.
 */
export const PRIMITIVE_DEFAULTS = {
	/** Player capsule dimensions (meters) */
	player: {
		radius: 0.3,
		height: 1.8,
		color: 0x888888,
	},
	/** Ball sphere dimensions (meters) */
	ball: {
		radius: 0.11,
		color: 0xffffff,
	},
	/** Generic box dimensions */
	box: {
		width: 1,
		height: 1,
		depth: 1,
		color: 0x666666,
	},
} as const

/**
 * Static helper class for creating primitive 3D shapes.
 * Used as placeholders while GLB assets load in the background.
 */
export class Primitives {
	/**
	 * Create a primitive based on type string.
	 *
	 * @param type - The primitive type to create
	 * @param config - Optional configuration overrides
	 * @returns THREE.Group containing the primitive, or empty group for 'none'
	 */
	static create(type: PrimitiveType, config: PrimitiveConfig = {}): THREE.Group {
		switch (type) {
		case 'box':
			return Primitives.createBox(config)
		case 'sphere':
			return Primitives.createSphere(config)
		case 'capsule':
			return Primitives.createCapsule(config)
		case 'none':
		default:
			return new THREE.Group()
		}
	}

	/**
	 * Create a box primitive.
	 *
	 * @param config - Configuration for the box
	 * @returns THREE.Group containing the box mesh
	 */
	static createBox(config: PrimitiveConfig = {}): THREE.Group {
		const {
			width = PRIMITIVE_DEFAULTS.box.width,
			height = PRIMITIVE_DEFAULTS.box.height,
			depth = PRIMITIVE_DEFAULTS.box.depth,
			color = PRIMITIVE_DEFAULTS.box.color,
			castShadow = true,
			receiveShadow = true,
		} = config

		const geometry = new THREE.BoxGeometry(width, height, depth)
		const material = new THREE.MeshStandardMaterial({ color })
		const mesh = new THREE.Mesh(geometry, material)

		mesh.castShadow = castShadow
		mesh.receiveShadow = receiveShadow
		mesh.position.y = height / 2 // Position so bottom is at y=0

		const group = new THREE.Group()
		group.add(mesh)
		group.userData.primitiveType = 'box'

		return group
	}

	/**
	 * Create a sphere primitive.
	 *
	 * @param config - Configuration for the sphere
	 * @returns THREE.Group containing the sphere mesh
	 */
	static createSphere(config: PrimitiveConfig = {}): THREE.Group {
		const {
			width = PRIMITIVE_DEFAULTS.ball.radius * 2,
			color = PRIMITIVE_DEFAULTS.ball.color,
			castShadow = true,
			receiveShadow = true,
		} = config

		const radius = width / 2
		const geometry = new THREE.SphereGeometry(radius, 16, 12)
		const material = new THREE.MeshStandardMaterial({ color })
		const mesh = new THREE.Mesh(geometry, material)

		mesh.castShadow = castShadow
		mesh.receiveShadow = receiveShadow
		mesh.position.y = radius // Position so bottom is at y=0

		const group = new THREE.Group()
		group.add(mesh)
		group.userData.primitiveType = 'sphere'

		return group
	}

	/**
	 * Create a capsule primitive (cylinder with hemisphere caps).
	 * Used as player placeholder.
	 *
	 * @param config - Configuration for the capsule
	 * @returns THREE.Group containing the capsule mesh
	 */
	static createCapsule(config: PrimitiveConfig = {}): THREE.Group {
		const {
			width = PRIMITIVE_DEFAULTS.player.radius * 2,
			height = PRIMITIVE_DEFAULTS.player.height,
			color = PRIMITIVE_DEFAULTS.player.color,
			castShadow = true,
			receiveShadow = true,
		} = config

		const radius = width / 2
		const cylinderHeight = Math.max(0, height - radius * 2)

		// Three.js CapsuleGeometry: (radius, length, capSegments, radialSegments)
		const geometry = new THREE.CapsuleGeometry(radius, cylinderHeight, 4, 8)
		const material = new THREE.MeshStandardMaterial({ color })
		const mesh = new THREE.Mesh(geometry, material)

		mesh.castShadow = castShadow
		mesh.receiveShadow = receiveShadow
		mesh.position.y = height / 2 // Position so bottom is at y=0

		const group = new THREE.Group()
		group.add(mesh)
		group.userData.primitiveType = 'capsule'

		return group
	}

	/**
	 * Create a player placeholder capsule with team color.
	 *
	 * @param teamColor - Team color as hex number
	 * @returns THREE.Group containing the player capsule
	 */
	static createPlayerPlaceholder(teamColor: number = 0x888888): THREE.Group {
		return Primitives.createCapsule({
			width: PRIMITIVE_DEFAULTS.player.radius * 2,
			height: PRIMITIVE_DEFAULTS.player.height,
			color: teamColor,
		})
	}

	/**
	 * Create a ball placeholder sphere.
	 *
	 * @returns THREE.Group containing the ball sphere
	 */
	static createBallPlaceholder(): THREE.Group {
		return Primitives.createSphere({
			width: PRIMITIVE_DEFAULTS.ball.radius * 2,
			color: PRIMITIVE_DEFAULTS.ball.color,
		})
	}
}
