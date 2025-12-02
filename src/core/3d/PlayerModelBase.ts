/**
 * FC Tycoon™ 2027 Match Simulator - Player Model Base
 *
 * Abstract base class for player 3D representations.
 * Supports both animated GLB models and primitive fallbacks.
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 */

import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════════════════
//                              T Y P E S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Animation names supported by player models.
 */
export type PlayerAnimationName =
	| 'idle'
	| 'breathing-idle'
	| 'jog-forward'
	| 'jog-backward'
	| 'jog-strafe-left'
	| 'jog-strafe-right'
	| 'kick'
	| 'header'
	| 'tackle'
	| 'goalkeeper-idle'
	| 'goalkeeper-dive'

/**
 * Configuration for creating a player model.
 */
export interface PlayerModelConfig {
	/** Unique player identifier */
	playerId: number
	/** Team color (hex) */
	teamColor: number
	/** Whether this is a goalkeeper */
	isGoalkeeper?: boolean
	/** Skin tone (0-1, light to dark) */
	skinTone?: number
	/** Hair style key */
	hairStyle?: string
	/** Kit configuration */
	kit?: {
		shirtColor?: number
		shortsColor?: number
		socksColor?: number
	}
	/** Player name for shirt */
	playerName?: string
	/** Player number for shirt */
	playerNumber?: number
}

/**
 * Body state to sync from PlayerBody/physics.
 */
export interface BodyState {
	/** World position (x, y, z) */
	position: THREE.Vector3
	/** Body facing direction (radians, 0 = +X) */
	bodyDirection: number
	/** Head yaw relative to body (radians) */
	headYaw?: number
	/** Head pitch (radians, positive = looking up) */
	headPitch?: number
	/** Eye direction relative to head (yaw, pitch in radians) */
	eyeYaw?: number
	eyePitch?: number
}

// ═══════════════════════════════════════════════════════════════════════════
//                    P L A Y E R   M O D E L   B A S E
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Abstract base class for player 3D models.
 *
 * Provides common interface for:
 * - Position/rotation syncing from physics/PlayerBody
 * - Animation control (play, crossfade, stop)
 * - Head and eye direction control
 * - Kit customization
 *
 * Subclasses:
 * - AnimatedPlayerModel: Full GLB model with skeletal animation
 * - PrimitivePlayerModel: Simple capsule fallback
 */
export abstract class PlayerModelBase {
	// ═══════════════════════════════════════════════════════════════════════
	//                        P R O P E R T I E S
	// ═══════════════════════════════════════════════════════════════════════

	/** Player configuration */
	protected config: PlayerModelConfig

	/** The THREE.Group containing this player's 3D representation */
	protected object3D: THREE.Group

	/** Current animation name (or null if none) */
	protected _currentAnimation: PlayerAnimationName | null = null

	/** Whether the model has been disposed */
	protected disposed = false

	// ═══════════════════════════════════════════════════════════════════════
	//                      C O N S T R U C T O R
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Create a new player model.
	 *
	 * @param config - Player configuration
	 */
	constructor(config: PlayerModelConfig) {
		this.config = config
		this.object3D = new THREE.Group()
		this.object3D.userData.playerId = config.playerId
		this.object3D.userData.modelType = this.constructor.name
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                       A C C E S S O R S
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Get the THREE.Group for adding to scene.
	 */
	getObject3D(): THREE.Group {
		return this.object3D
	}

	/**
	 * Get player ID.
	 */
	getPlayerId(): number {
		return this.config.playerId
	}

	/**
	 * Get current animation name.
	 */
	get currentAnimation(): PlayerAnimationName | null {
		return this._currentAnimation
	}

	/**
	 * Check if this is a placeholder/primitive model.
	 */
	abstract isPlaceholder(): boolean

	// ═══════════════════════════════════════════════════════════════════════
	//                     P O S I T I O N   S Y N C
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Sync model position and rotation from body state.
	 * Called each frame from physics/steering update.
	 *
	 * @param state - Body state from PlayerBody
	 */
	syncFromBody(state: BodyState): void {
		// Position
		this.object3D.position.copy(state.position)

		// Body rotation (around Y axis)
		this.object3D.rotation.y = state.bodyDirection

		// Head and eye direction (subclass implements actual bone manipulation)
		if (state.headYaw !== undefined || state.headPitch !== undefined) {
			this.setHeadDirection(state.headYaw ?? 0, state.headPitch ?? 0)
		}
		if (state.eyeYaw !== undefined || state.eyePitch !== undefined) {
			this.setEyeDirection(state.eyeYaw ?? 0, state.eyePitch ?? 0)
		}
	}

	/**
	 * Set position directly.
	 *
	 * @param x - X coordinate
	 * @param y - Y coordinate
	 * @param z - Z coordinate
	 */
	setPosition(x: number, y: number, z: number): void {
		this.object3D.position.set(x, y, z)
	}

	/**
	 * Set body rotation (facing direction).
	 *
	 * @param radians - Rotation around Y axis (0 = +X direction)
	 */
	setRotation(radians: number): void {
		this.object3D.rotation.y = radians
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                      A N I M A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Set the current animation.
	 * Immediately switches to the animation (no crossfade).
	 *
	 * @param name - Animation name to play
	 * @param options - Playback options
	 */
	abstract setAnimation(
		name: PlayerAnimationName,
		options?: {
			loop?: boolean
			timeScale?: number
		}
	): void

	/**
	 * Crossfade to a new animation over a duration.
	 *
	 * @param name - Animation name to transition to
	 * @param duration - Crossfade duration in seconds
	 * @param options - Playback options for new animation
	 */
	abstract crossFadeTo(
		name: PlayerAnimationName,
		duration: number,
		options?: {
			loop?: boolean
			timeScale?: number
		}
	): void

	/**
	 * Stop all animations.
	 */
	abstract stopAnimation(): void

	/**
	 * Update animation state. Call each frame.
	 *
	 * @param deltaTime - Time since last frame in seconds
	 */
	abstract update(deltaTime: number): void

	// ═══════════════════════════════════════════════════════════════════════
	//                   H E A D / E Y E   C O N T R O L
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Set head direction relative to body.
	 *
	 * @param yaw - Horizontal rotation (radians, positive = left)
	 * @param pitch - Vertical rotation (radians, positive = up)
	 */
	abstract setHeadDirection(yaw: number, pitch: number): void

	/**
	 * Set eye direction relative to head.
	 *
	 * @param yaw - Horizontal rotation (radians)
	 * @param pitch - Vertical rotation (radians)
	 */
	abstract setEyeDirection(yaw: number, pitch: number): void

	// ═══════════════════════════════════════════════════════════════════════
	//                   C U S T O M I Z A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Set player skin tone.
	 *
	 * @param tone - Skin tone value (0-1, light to dark)
	 */
	abstract setSkinTone(tone: number): void

	/**
	 * Set hair style.
	 *
	 * @param styleKey - Hair style identifier
	 */
	abstract setHairStyle(styleKey: string): void

	/**
	 * Set kit colors.
	 *
	 * @param kit - Kit color configuration
	 */
	abstract setKitColors(kit: {
		shirtColor?: number
		shortsColor?: number
		socksColor?: number
	}): void

	/**
	 * Set player name on shirt.
	 *
	 * @param name - Player name
	 */
	abstract setPlayerName(name: string): void

	/**
	 * Set player number on shirt.
	 *
	 * @param number - Player number
	 */
	abstract setPlayerNumber(number: number): void

	// ═══════════════════════════════════════════════════════════════════════
	//                      L I F E C Y C L E
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Upgrade from placeholder to full model.
	 * Called when GLB asset finishes loading.
	 *
	 * @param modelGroup - The loaded model group to swap in
	 */
	abstract upgradeFromPlaceholder(modelGroup: THREE.Group): void

	/**
	 * Dispose of resources.
	 */
	dispose(): void {
		if (this.disposed) {
			return
		}
		this.disposed = true

		// Remove from parent
		if (this.object3D.parent) {
			this.object3D.parent.remove(this.object3D)
		}

		// Dispose geometries and materials
		this.object3D.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.geometry?.dispose()
				if (Array.isArray(child.material)) {
					child.material.forEach(m => m.dispose())
				} else {
					child.material?.dispose()
				}
			}
		})
	}
}
