/**
 * FC Tycoon™ 2027 Match Simulator - 3D Module Index
 *
 * Exports all 3D-related classes for player models and assets.
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 */

// Asset management - re-exported from store for convenience
export { assets } from '@/store/assets'
export type {
	AssetMetadata,
	AssetCategory,
	AssetPriority,
	AssetDefinition,
	AssetManifest,
	CachedAsset,
	MaterialOverrides,
	ProgressCallback,
	TextureOptions,
} from '@/store/assets'

// Primitive fallbacks
export { Primitives, PRIMITIVE_DEFAULTS } from './Primitives'
export type { PrimitiveType, PrimitiveConfig } from './Primitives'

// Player models
export { PlayerModelBase } from './PlayerModelBase'
export type {
	PlayerAnimationName,
	PlayerModelConfig,
	BodyState,
} from './PlayerModelBase'

export { AnimatedPlayerModel } from './AnimatedPlayerModel'
export { PrimitivePlayerModel } from './PrimitivePlayerModel'

// Factory
export { PlayerModelFactory, createBallModel } from './PlayerModelFactory'
export type {
	CreatePlayerModelOptions,
	ModelUpgradeCallback,
} from './PlayerModelFactory'
