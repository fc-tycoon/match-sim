/**
 * FC Tycoon™ 2027 Match Simulator - Player Model Factory
 *
 * Factory for creating and managing player models.
 * Handles automatic upgrade from primitive to animated when assets load.
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 */

import * as THREE from 'three'
import { assets } from '@/store/assets'
import { PlayerModelBase, PlayerModelConfig } from './PlayerModelBase'
import { AnimatedPlayerModel } from './AnimatedPlayerModel'
import { PrimitivePlayerModel } from './PrimitivePlayerModel'

// ═══════════════════════════════════════════════════════════════════════════
//                              T Y P E S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for creating a player model.
 */
export interface CreatePlayerModelOptions extends PlayerModelConfig {
	/** Force primitive mode (no upgrade) */
	forcePrimitive?: boolean
	/** Asset key for animated model (default: 'player-base' or 'player-goalkeeper') */
	assetKey?: string
}

/**
 * Callback when model is upgraded.
 */
export type ModelUpgradeCallback = (playerId: number, model: PlayerModelBase) => void

// ═══════════════════════════════════════════════════════════════════════════
//                 P L A Y E R   M O D E L   F A C T O R Y
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Factory for creating player models.
 *
 * Automatically creates primitives when GLB not loaded,
 * then upgrades to animated models when assets become available.
 *
 * Usage:
 * ```ts
 * const factory = new PlayerModelFactory()
 *
 * // Create model (may be primitive if asset not loaded)
 * const model = factory.createPlayerModel({
 *   playerId: 1,
 *   teamColor: 0xff0000,
 *   isGoalkeeper: false
 * })
 *
 * // Add to scene
 * scene.add(model.getObject3D())
 *
 * // Factory automatically upgrades when asset loads
 * factory.onModelUpgrade((playerId, upgradedModel) => {
 *   console.log(`Player ${playerId} upgraded to animated model`)
 * })
 * ```
 */
export class PlayerModelFactory {
	// ═══════════════════════════════════════════════════════════════════════
	//                        P R O P E R T I E S
	// ═══════════════════════════════════════════════════════════════════════

	/** Debug ID to track instances */
	private static instanceCounter = 0
	private instanceId: number

	/** Registry of created models by player ID */
	private models: Map<number, PlayerModelBase> = new Map()

	/** Upgrade callbacks */
	private upgradeCallbacks: Set<ModelUpgradeCallback> = new Set()

	/** Pending upgrades (player IDs waiting for specific assets) */
	private pendingUpgrades: Map<string, Set<number>> = new Map()

	// ═══════════════════════════════════════════════════════════════════════
	//                      C O N S T R U C T O R
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Create a new player model factory.
	 */
	constructor() {
		this.instanceId = ++PlayerModelFactory.instanceCounter
		console.log(`[PlayerModelFactory #${this.instanceId}] Created`)

		Object.seal(this)
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                    M O D E L   U P G R A D E S
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Check for and process any pending model upgrades.
	 * Call this periodically (e.g., each frame) to upgrade primitives to animated models.
	 *
	 * Uses reactive `assets.state.loadedAssets` to check which assets are ready.
	 */
	processPendingUpgrades(): void {
		if (this.pendingUpgrades.size === 0) return

		// Check each pending asset
		for (const [assetKey, playerIds] of this.pendingUpgrades) {
			if (assets.isLoaded(assetKey)) {
				// Asset is now loaded - upgrade all waiting players
				for (const playerId of playerIds) {
					this.upgradeModel(playerId, assetKey)
				}
				this.pendingUpgrades.delete(assetKey)
			}
		}
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                    M O D E L   C R E A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Create a player model.
	 *
	 * If the GLB asset is loaded, creates an AnimatedPlayerModel.
	 * Otherwise, creates a PrimitivePlayerModel and schedules upgrade.
	 *
	 * @param options - Creation options
	 * @returns The created model
	 */
	createPlayerModel(options: CreatePlayerModelOptions): PlayerModelBase {
		const { forcePrimitive = false, assetKey, ...config } = options

		// Determine which asset to use
		// Default to 'player' for all players (single model for now)
		const modelAssetKey = assetKey ?? 'player'

		// Check if we already have a model for this player
		const existing = this.models.get(config.playerId)
		if (existing) {
			console.warn(`PlayerModelFactory: Model for player ${config.playerId} already exists, disposing old`)
			existing.dispose()
			this.models.delete(config.playerId)
		}

		let model: PlayerModelBase

		// Try to create animated model if asset is loaded
		if (!forcePrimitive && assets.isLoaded(modelAssetKey)) {
			if (import.meta.env.DEV) {
				console.log(`[PlayerModelFactory #${this.instanceId}] Creating animated model for player ${config.playerId}`)
			}
			model = this.createAnimatedModel(config, modelAssetKey)
		} else {
			// Create primitive and schedule upgrade
			if (import.meta.env.DEV) {
				console.log(`[PlayerModelFactory #${this.instanceId}] Creating primitive for player ${config.playerId}, asset '${modelAssetKey}' loaded: ${assets.isLoaded(modelAssetKey)}`)
			}
			model = new PrimitivePlayerModel(config)

			if (!forcePrimitive) {
				this.schedulePendingUpgrade(config.playerId, modelAssetKey, config)
			}
		}

		this.models.set(config.playerId, model)
		return model
	}

	/**
	 * Create an animated model from a loaded asset.
	 *
	 * @param config - Player configuration
	 * @param assetKey - Asset key
	 * @returns The animated model
	 */
	private createAnimatedModel(config: PlayerModelConfig, assetKey: string): AnimatedPlayerModel {
		const model = new AnimatedPlayerModel(config, assetKey)

		// Clone the model from assets store
		const modelGroup = assets.cloneModel(assetKey)
		if (modelGroup) {
			model.initializeWithModel(modelGroup)
		} else {
			console.error(`PlayerModelFactory: Failed to clone model '${assetKey}'`)
		}

		return model
	}

	/**
	 * Schedule a model for upgrade when asset loads.
	 *
	 * @param playerId - Player ID
	 * @param assetKey - Asset to wait for
	 * @param config - Player configuration (stored for upgrade)
	 */
	private schedulePendingUpgrade(playerId: number, assetKey: string, config: PlayerModelConfig): void {
		if (import.meta.env.DEV) {
			console.log(`[PlayerModelFactory #${this.instanceId}] Scheduling upgrade for player ${playerId} -> ${assetKey}`)
		}
		let pending = this.pendingUpgrades.get(assetKey)
		if (!pending) {
			pending = new Set()
			this.pendingUpgrades.set(assetKey, pending)
		}
		pending.add(playerId)

		// Store config in the model's userData for upgrade
		const model = this.models.get(playerId)
		if (model) {
			model.getObject3D().userData.upgradeConfig = config
			model.getObject3D().userData.upgradeAssetKey = assetKey
		}
	}

	/**
	 * Upgrade a primitive model to animated.
	 *
	 * @param playerId - Player ID
	 * @param assetKey - Asset key
	 */
	private upgradeModel(playerId: number, assetKey: string): void {
		const currentModel = this.models.get(playerId)
		if (!currentModel) {
			return
		}

		// Get stored config
		const config = currentModel.getObject3D().userData.upgradeConfig as PlayerModelConfig | undefined
		if (!config) {
			console.warn(`PlayerModelFactory: No config stored for player ${playerId} upgrade`)
			return
		}

		// Clone the new model
		const modelGroup = assets.cloneModel(assetKey)
		if (!modelGroup) {
			console.error(`PlayerModelFactory: Failed to clone model '${assetKey}' for upgrade`)
			return
		}

		// If current is primitive, create new animated model
		if (currentModel instanceof PrimitivePlayerModel) {
			// Create new animated model
			const newModel = new AnimatedPlayerModel(config, assetKey)

			// Preserve position and rotation
			newModel.getObject3D().position.copy(currentModel.getObject3D().position)
			newModel.getObject3D().rotation.copy(currentModel.getObject3D().rotation)

			// Initialize with loaded model
			newModel.initializeWithModel(modelGroup)

			// Preserve current animation state
			const currentAnim = currentModel.currentAnimation
			if (currentAnim) {
				newModel.setAnimation(currentAnim)
			}

			// Replace in parent scene
			const parent = currentModel.getObject3D().parent
			if (parent) {
				parent.remove(currentModel.getObject3D())
				parent.add(newModel.getObject3D())
			}

			// Dispose old primitive
			currentModel.dispose()

			// Update registry
			this.models.set(playerId, newModel)

			// Notify callbacks
			for (const callback of this.upgradeCallbacks) {
				callback(playerId, newModel)
			}
		} else if (currentModel instanceof AnimatedPlayerModel) {
			// Already animated, just upgrade the model
			currentModel.upgradeFromPlaceholder(modelGroup)

			// Notify callbacks
			for (const callback of this.upgradeCallbacks) {
				callback(playerId, currentModel)
			}
		}
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                      M O D E L   A C C E S S
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Get a model by player ID.
	 *
	 * @param playerId - Player ID
	 * @returns The model or undefined
	 */
	getModel(playerId: number): PlayerModelBase | undefined {
		return this.models.get(playerId)
	}

	/**
	 * Get all models.
	 *
	 * @returns Iterator of all models
	 */
	getAllModels(): IterableIterator<PlayerModelBase> {
		return this.models.values()
	}

	/**
	 * Get count of models.
	 */
	get modelCount(): number {
		return this.models.size
	}

	/**
	 * Check if a player has a model.
	 *
	 * @param playerId - Player ID
	 * @returns True if model exists
	 */
	hasModel(playerId: number): boolean {
		return this.models.has(playerId)
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                          E V E N T S
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Register callback for when a model is upgraded from primitive to animated.
	 *
	 * @param callback - Callback function
	 * @returns Unsubscribe function
	 */
	onModelUpgrade(callback: ModelUpgradeCallback): () => void {
		this.upgradeCallbacks.add(callback)
		return () => this.upgradeCallbacks.delete(callback)
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                      L I F E C Y C L E
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Remove a player model.
	 *
	 * @param playerId - Player ID
	 */
	removeModel(playerId: number): void {
		const model = this.models.get(playerId)
		if (model) {
			model.dispose()
			this.models.delete(playerId)
		}

		// Remove from pending upgrades
		for (const pending of this.pendingUpgrades.values()) {
			pending.delete(playerId)
		}
	}

	/**
	 * Dispose all models.
	 */
	dispose(): void {
		for (const model of this.models.values()) {
			model.dispose()
		}
		this.models.clear()
		this.pendingUpgrades.clear()
		this.upgradeCallbacks.clear()
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//                    B A L L   M O D E L   H E L P E R
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a ball model from the registry or fallback to primitive.
 *
 * @param assetKey - Asset key (default: 'ball')
 * @returns Ball mesh
 */
export function createBallModel(assetKey: string = 'ball'): THREE.Object3D {
	if (assets.isLoaded(assetKey)) {
		const model = assets.cloneModel(assetKey)
		if (model) {
			return model
		}
	}

	// Fallback to primitive sphere
	const { Primitives } = require('./Primitives')
	return Primitives.createBallPlaceholder()
}
