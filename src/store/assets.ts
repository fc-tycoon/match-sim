/**
 * FC Tycoon™ 2027 Match Simulator - Assets Store
 *
 * Centralized store for loading and caching 3D assets (GLB models, animations, textures).
 * Supports priority-based background loading and fallback primitives.
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { reactive, App } from 'vue'
import * as THREE from 'three'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import { Primitives, PrimitiveType } from '@/core/3d/Primitives'

// ═══════════════════════════════════════════════════════════════════════════
//                              T Y P E S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Asset categories for organization and loading order.
 */
export type AssetCategory = 'model' | 'animation' | 'texture' | 'prop'

/**
 * Loading priority levels.
 * - critical: Ball, player models - loaded first
 * - high: Animations - loaded after critical
 * - normal: Common props
 * - low: Stadium, decorations - loaded last
 */
export type AssetPriority = 'critical' | 'high' | 'normal' | 'low'

/**
 * Metadata stored with model assets (bone names, etc.)
 */
export interface AssetMetadata {
	headBone?: string
	leftEyeBone?: string
	rightEyeBone?: string
	hipBone?: string
	[key: string]: string | undefined
}

/**
 * Material overrides for loaded models.
 * Applied to MeshStandardMaterial properties.
 */
export interface MaterialOverrides {
	/** Maximum metalness (0-1) */
	maxMetalness?: number
	/** Minimum roughness (0-1) */
	minRoughness?: number
	/** Emissive intensity multiplier (fraction of base color) */
	emissiveMultiplier?: number
	/** Override base color (hex) */
	color?: number
	/** Multiply color RGB by this factor (0-1 darkens, >1 brightens) */
	colorMultiplier?: number
	/** Enable shadows */
	castShadow?: boolean
	/** Receive shadows */
	receiveShadow?: boolean
}

/**
 * Asset definition from manifest.json
 */
export interface AssetDefinition {
	/** Unique identifier for the asset */
	key: string
	/** Path to the GLB file (relative to public/) */
	path: string
	/** Asset category */
	category: AssetCategory
	/** Loading priority */
	priority: AssetPriority
	/** Fallback primitive type if asset hasn't loaded */
	fallback?: PrimitiveType
	/** For animations: which model this animation targets */
	target?: string
	/** Human-readable description of the asset (e.g., animation description) */
	description?: string
	/** Additional metadata (bone names, etc.) */
	metadata?: AssetMetadata
	/** Material overrides to apply when loading */
	materials?: MaterialOverrides
	/** Scale multiplier (default 1.0) */
	scale?: number
	/** Y-axis offset to apply (in model units, before scale) */
	yOffset?: number
	/** Rotation to apply (in degrees) - for fixing axis orientation */
	rotation?: { x?: number; y?: number; z?: number }
}

/**
 * Manifest file structure.
 */
export interface AssetManifest {
	version: string
	/** Base path prefix for all asset paths (e.g., '/3d-assets') */
	basePath?: string
	assets: AssetDefinition[]
}

/**
 * Cached asset data.
 */
export interface CachedAsset {
	definition: AssetDefinition
	/** GLTF data for models/animations/props */
	gltf: GLTF | null
	/** Texture data for texture assets */
	texture: THREE.Texture | null
	animations: Map<string, THREE.AnimationClip>
	loaded: boolean
	loading: boolean
	error: Error | null
}

/**
 * Configuration options for texture loading.
 */
export interface TextureOptions {
	/** Horizontal wrap mode (default: RepeatWrapping) */
	wrapS?: THREE.Wrapping
	/** Vertical wrap mode (default: RepeatWrapping) */
	wrapT?: THREE.Wrapping
	/** Repeat count (default: 1, 1) */
	repeat?: { x: number; y: number }
	/** Magnification filter (default: LinearFilter) */
	magFilter?: THREE.MagnificationTextureFilter
	/** Minification filter (default: LinearMipmapLinearFilter) */
	minFilter?: THREE.MinificationTextureFilter
	/** Anisotropic filtering level (default: 16) */
	anisotropy?: number
	/** Color space (default: SRGBColorSpace) */
	colorSpace?: THREE.ColorSpace
}

/**
 * Loading progress callback.
 */
export type ProgressCallback = (loaded: number, total: number, currentAsset: string) => void

// ═══════════════════════════════════════════════════════════════════════════
//                         C O N S T A N T S
// ═══════════════════════════════════════════════════════════════════════════

/** Path to the manifest file (in 3d-assets submodule) */
const MANIFEST_PATH = '/3d-assets/manifest.json'

/** Priority order for loading */
const PRIORITY_ORDER: AssetPriority[] = ['critical', 'high', 'normal', 'low']

/** Default texture options for high quality loading */
const DEFAULT_TEXTURE_OPTIONS: TextureOptions = {
	wrapS: THREE.RepeatWrapping,
	wrapT: THREE.RepeatWrapping,
	magFilter: THREE.LinearFilter,
	minFilter: THREE.LinearMipmapLinearFilter,
	anisotropy: 16,
	colorSpace: THREE.SRGBColorSpace,
}

// ═══════════════════════════════════════════════════════════════════════════
//                      I N T E R N A L   S T A T E
// ═══════════════════════════════════════════════════════════════════════════

/** GLTFLoader instance */
const loader = new GLTFLoader()

/** FBXLoader instance */
const fbxLoader = new FBXLoader()

/** Texture loader instance */
const textureLoader = new THREE.TextureLoader()

/** Parsed manifest */
let manifest: AssetManifest | null = null

/** Base path for all assets (from manifest) */
let basePath: string = ''

/** Cached assets by key */
const cache: Map<string, CachedAsset> = new Map()

/** Cached textures by path */
const textureCache: Map<string, THREE.Texture> = new Map()

/** Promise for the background load operation (allows multiple callers to wait) */
let loadingPromise: Promise<void> | null = null

type MeshLike = THREE.Mesh | THREE.Line | THREE.Points

function isMeshLike(object: THREE.Object3D): object is MeshLike {
	return object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points
}

// ═══════════════════════════════════════════════════════════════════════════
//                      R E A C T I V E   S T A T E
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reactive state for the assets store.
 * Components can watch these properties for UI updates.
 */
const state = reactive({
	/** Whether assets are currently being loaded */
	isLoading: false,

	/** Number of assets loaded */
	loadedCount: 0,

	/** Total number of assets to load */
	totalCount: 0,

	/** Loading progress percentage (0-100) */
	progress: 0,

	/** Whether critical assets are ready */
	criticalReady: false,

	/** Whether all assets are ready */
	allReady: false,

	/** Current asset being loaded */
	currentAsset: '',

	/** Last error that occurred */
	lastError: null as Error | null,

	/**
	 * Reactive set of loaded asset keys.
	 * Watch this or check `loadedAssets.has(key)` for reactive updates.
	 */
	loadedAssets: new Set<string>(),
})

// ═══════════════════════════════════════════════════════════════════════════
//                      I N T E R N A L   H E L P E R S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load a GLB file.
 *
 * @param path - Path to the GLB file
 * @returns Promise resolving to GLTF data
 */
function loadGLTF(path: string): Promise<GLTF> {
	return new Promise((resolve, reject) => {
		loader.load(
			path,
			(gltf) => resolve(gltf),
			undefined,
			(error) => reject(error),
		)
	})
}

/**
 * Load an FBX file.
 *
 * @param path - Path to the FBX file
 * @returns Promise resolving to loaded THREE.Group
 */
function loadFBX(path: string): Promise<THREE.Group> {
	return new Promise((resolve, reject) => {
		fbxLoader.load(
			path,
			(object) => resolve(object),
			undefined,
			(error) => reject(error),
		)
	})
}

/**
 * Load a texture file with high quality settings.
 *
 * @param path - Path to the texture file
 * @param options - Optional texture configuration
 * @returns Promise resolving to loaded texture
 */
function loadTextureAsync(path: string, options?: TextureOptions): Promise<THREE.Texture> {
	return new Promise((resolve, reject) => {
		textureLoader.load(
			path,
			(texture) => {
				const mergedOptions = { ...DEFAULT_TEXTURE_OPTIONS, ...options }
				applyTextureOptions(texture, mergedOptions)
				resolve(texture)
			},
			undefined,
			(error) => reject(error),
		)
	})
}

/**
 * Resolve an asset path by prepending the basePath.
 *
 * @param path - Relative path from manifest (e.g., '/models/player.glb')
 * @returns Full path with basePath prefix (e.g., '/3d-assets/models/player.glb')
 */
function resolveAssetPath(path: string): string {
	return basePath + path
}

/**
 * Load the manifest.json file.
 */
async function loadManifest(): Promise<void> {
	const response = await fetch(MANIFEST_PATH)
	if (!response.ok) {
		throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`)
	}
	manifest = await response.json() as AssetManifest
	basePath = manifest.basePath ?? ''
	console.log(`[Assets] Manifest loaded: ${manifest.assets.length} assets defined, basePath="${basePath}"`)
}

/**
 * Load a single asset by key.
 * Handles GLB models, animations, and textures based on category.
 *
 * @param key - Asset key from manifest
 */
async function loadAsset(key: string): Promise<void> {
	const cached = cache.get(key)
	if (!cached) {
		throw new Error(`Unknown asset key: ${key}`)
	}

	if (cached.loaded || cached.loading) {
		return
	}

	cached.loading = true
	state.currentAsset = key

	try {
		// Handle texture assets differently
		if (cached.definition.category === 'texture') {
			const resolvedPath = resolveAssetPath(cached.definition.path)
			const texture = await loadTextureAsync(resolvedPath)
			cached.texture = texture
			// Also add to texture cache for getTexture() access
			textureCache.set(resolvedPath, texture)
			cached.loaded = true
			cached.loading = false
			// Add to reactive set for watchers
			state.loadedAssets.add(key)
			console.log(`[Assets] Loaded: ${key} (texture)`)
			return
		}

		const pathLower = cached.definition.path.toLowerCase()
		const isFBXAnimation = cached.definition.category === 'animation' && pathLower.endsWith('.fbx')

		if (isFBXAnimation) {
			return await loadAnimationFromFBX(cached, key)
		}

		// Load GLB for models, animations, and props
		const gltf = await loadGLTF(resolveAssetPath(cached.definition.path))
		cached.gltf = gltf
		cached.loaded = true
		cached.loading = false

		// Debug: Log what's in the GLB
		if (import.meta.env.DEV) {
			let meshCount = 0
			let skinnedMeshCount = 0
			let boneCount = 0
			const meshNames: string[] = []
			gltf.scene.traverse((child) => {
				if (child.type === 'Mesh') {
					meshCount++
					meshNames.push(child.name || '(unnamed)')
				}
				if (child.type === 'SkinnedMesh') skinnedMeshCount++
				if (child.type === 'Bone') boneCount++
			})
			console.log(`[Assets] ${key} contents: ${meshCount} meshes, ${skinnedMeshCount} skinned meshes, ${boneCount} bones, ${gltf.animations?.length ?? 0} animations`)
			if (meshCount > 0) {
				console.log(`[Assets] ${key} mesh names:`, meshNames)
			}

			// Extra detailed logging for player model
			if (key === 'player') {
				console.log('[Assets] === PLAYER GLB DETAILED DEBUG ===')
				console.log('[Assets] Scene position:', gltf.scene.position.toArray())
				console.log('[Assets] Scene rotation:', gltf.scene.rotation.toArray())
				console.log('[Assets] Scene scale:', gltf.scene.scale.toArray())

				// Log hierarchy
				const logHierarchy = (obj: THREE.Object3D, depth: number = 0) => {
					const indent = '  '.repeat(depth)
					const pos = obj.position.toArray().map(v => v.toFixed(3))
					const scale = obj.scale.toArray().map(v => v.toFixed(3))
					console.log(`[Assets] ${indent}${obj.type}: "${obj.name}" pos=[${pos}] scale=[${scale}] visible=${obj.visible}`)

					if (obj.type === 'SkinnedMesh') {
						const sm = obj as THREE.SkinnedMesh
						const geo = sm.geometry
						const mat = sm.material as THREE.Material

						// Bounding box
						geo.computeBoundingBox()
						const bb = geo.boundingBox
						console.log(`[Assets] ${indent}  └─ BoundingBox: min=[${bb?.min.toArray().map(v => v.toFixed(2))}] max=[${bb?.max.toArray().map(v => v.toFixed(2))}]`)

						// Geometry details
						const posAttr = geo.attributes.position
						console.log(`[Assets] ${indent}  └─ Geometry: ${posAttr?.count ?? 0} vertices, ${geo.index?.count ?? 0} indices`)

						// Material details
						if (mat) {
							const matType = mat.type
							const matName = mat.name || '(unnamed)'
							console.log(`[Assets] ${indent}  └─ Material: ${matType} "${matName}" visible=${mat.visible} side=${mat.side} transparent=${mat.transparent}`)

							if ('map' in mat && mat.map) {
								const tex = mat.map as THREE.Texture
								console.log(`[Assets] ${indent}  └─ Texture: ${tex.image?.width ?? '?'}x${tex.image?.height ?? '?'} src=${tex.source?.data?.src?.slice(-40) ?? 'embedded'}`)
							}
							if ('color' in mat) {
								console.log(`[Assets] ${indent}  └─ Color: #${(mat as THREE.MeshStandardMaterial).color?.getHexString()}`)
							}
						}

						// Skeleton info
						if (sm.skeleton) {
							console.log(`[Assets] ${indent}  └─ Skeleton: ${sm.skeleton.bones.length} bones, root="${sm.skeleton.bones[0]?.name}"`)
						}

						// Bind matrix
						if (sm.bindMatrix) {
							const bindPos = new THREE.Vector3()
							const bindScale = new THREE.Vector3()
							sm.bindMatrix.decompose(bindPos, new THREE.Quaternion(), bindScale)
							console.log(`[Assets] ${indent}  └─ BindMatrix pos=[${bindPos.toArray().map(v => v.toFixed(2))}] scale=[${bindScale.toArray().map(v => v.toFixed(2))}]`)
						}
					}
				}

				gltf.scene.traverse((child) => {
					// Only log top-level children and skinned meshes
					if (child.parent === gltf.scene || child.type === 'SkinnedMesh') {
						const depth = child.parent === gltf.scene ? 0 : 1
						logHierarchy(child, depth)
					}
				})

				console.log('[Assets] === END PLAYER GLB DEBUG ===')
			}
		}

		// Extract animations if present
		if (gltf.animations && gltf.animations.length > 0) {
			for (const clip of gltf.animations) {
				// Use asset key as animation name for animation assets
				// For models, use the clip's original name
				const animName = cached.definition.category === 'animation'
					? cached.definition.key
					: clip.name || cached.definition.key
				cached.animations.set(animName, clip)
			}
		}

		// For animation assets, hide all visual content in the scene
		// (Animation GLBs may contain armature/bone geometry that shouldn't be rendered)
		if (cached.definition.category === 'animation') {
			cleanupAnimationScene(gltf.scene)
			console.log(`[Assets] Animation ${key}: scene cleared to prevent armature rendering`)
		}

		// Add to reactive set for watchers
		state.loadedAssets.add(key)
		console.log(`[Assets] Loaded: ${key} (${cached.definition.category})`)

	} catch (err) {
		cached.loading = false
		cached.error = err instanceof Error ? err : new Error(String(err))
		throw err
	}
}

/**
 * Load animation clips from an FBX file and store them in cache.
 *
 * @param cached - Cached asset entry
 * @param key - Asset key
 */
async function loadAnimationFromFBX(cached: CachedAsset, key: string): Promise<void> {
	const fbx = await loadFBX(resolveAssetPath(cached.definition.path))
	const clips = fbx.animations ?? []

	if (clips.length === 0) {
		console.warn(`[Assets] FBX animation '${key}' contains no clips`)
	}

	for (const clip of clips) {
		const animName = cached.definition.key
		cached.animations.set(animName, clip)
	}

	cleanupAnimationScene(fbx)

	cached.loaded = true
	cached.loading = false
	state.loadedAssets.add(key)
	console.log(`[Assets] Loaded: ${key} (animation/fbx)`)
}

/**
 * Dispose geometries/materials for animation scenes we never render.
 *
 * @param root - Root Scene/Group to clean up
 */
function cleanupAnimationScene(root: THREE.Object3D): void {
	root.traverse((child) => {
		if (isMeshLike(child)) {
			if (child.geometry) {
				child.geometry.dispose()
			}
			const materials = Array.isArray(child.material)
				? child.material
				: [child.material]
			materials.forEach((mat) => mat?.dispose())
		}
	})
	root.clear()
}

/**
 * Apply material overrides to a model's meshes.
 *
 * @param model - The model group to modify
 * @param overrides - Material override settings
 */
function applyMaterialOverrides(model: THREE.Group, overrides: MaterialOverrides): void {
	model.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			// Apply shadow settings
			if (overrides.castShadow !== undefined) {
				child.castShadow = overrides.castShadow
			}
			if (overrides.receiveShadow !== undefined) {
				child.receiveShadow = overrides.receiveShadow
			}

			// Apply material property overrides
			const materials = Array.isArray(child.material) ? child.material : [child.material]
			for (const mat of materials) {
				if (mat instanceof THREE.MeshStandardMaterial) {
					// Cap metalness
					if (overrides.maxMetalness !== undefined) {
						mat.metalness = Math.min(mat.metalness, overrides.maxMetalness)
					}
					// Floor roughness
					if (overrides.minRoughness !== undefined) {
						mat.roughness = Math.max(mat.roughness, overrides.minRoughness)
					}
					// Add emissive based on base color
					if (overrides.emissiveMultiplier !== undefined && overrides.emissiveMultiplier > 0) {
						mat.emissive = mat.color.clone().multiplyScalar(overrides.emissiveMultiplier)
						mat.emissiveIntensity = 1.0
					}
					// Multiply color (darken or brighten)
					if (overrides.colorMultiplier !== undefined) {
						mat.color.multiplyScalar(overrides.colorMultiplier)
					}
					// Override base color
					if (overrides.color !== undefined) {
						mat.color.setHex(overrides.color)
					}
					mat.needsUpdate = true
				}
			}
		}
	})
}

/**
 * Apply configuration options to a texture.
 *
 * @param texture - Target texture
 * @param options - Options to apply
 */
function applyTextureOptions(texture: THREE.Texture, options: TextureOptions): void {
	if (options.wrapS !== undefined) texture.wrapS = options.wrapS
	if (options.wrapT !== undefined) texture.wrapT = options.wrapT
	if (options.repeat) texture.repeat.set(options.repeat.x, options.repeat.y)
	if (options.magFilter !== undefined) texture.magFilter = options.magFilter
	if (options.minFilter !== undefined) texture.minFilter = options.minFilter
	if (options.anisotropy !== undefined) texture.anisotropy = options.anisotropy
	if (options.colorSpace !== undefined) texture.colorSpace = options.colorSpace
}

/**
 * Update reactive progress state.
 */
function updateProgress(): void {
	let loaded = 0
	let total = 0

	for (const [, cached] of cache) {
		total++
		if (cached.loaded) {
			loaded++
		}
	}

	state.loadedCount = loaded
	state.totalCount = total
	state.progress = total > 0 ? (loaded / total) * 100 : 0
}

/**
 * Check and update critical assets ready state.
 */
function checkCriticalReady(): void {
	for (const [, cached] of cache) {
		if (cached.definition.priority === 'critical' && !cached.loaded) {
			state.criticalReady = false
			return
		}
	}
	state.criticalReady = true
}

// ═══════════════════════════════════════════════════════════════════════════
//                         A S S E T S   S T O R E
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Assets store - centralized asset management for the application.
 *
 * Provides:
 * - Reactive loading state for UI updates
 * - GLB model loading and caching
 * - Animation clip management
 * - Texture loading and caching
 * - Fallback primitives for unloaded assets
 */
export const assets = {
	// ═══════════════════════════════════════════════════════════════════════
	//                      R E A C T I V E   S T A T E
	// ═══════════════════════════════════════════════════════════════════════

	/** Reactive state - watch these for UI updates */
	state,

	// ═══════════════════════════════════════════════════════════════════════
	//                        L O A D I N G
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Start background loading of all assets.
	 * Safe to call multiple times - will only load once.
	 *
	 * All asset loads are initiated immediately in priority order (critical first,
	 * then high, normal, low). This allows maximum parallelism on fast machines
	 * while ensuring important assets are queued first on slower machines.
	 *
	 * Assets are added to `state.loadedAssets` reactively as they complete.
	 *
	 * @param onProgress - Optional progress callback
	 */
	async startBackgroundLoad(onProgress?: ProgressCallback): Promise<void> {
		// If already loading or loaded, return the existing promise
		if (loadingPromise) {
			return loadingPromise
		}

		// Create and store the loading promise so multiple callers can wait
		loadingPromise = (async () => {
			state.isLoading = true

			try {
				// Load manifest first
				await loadManifest()

				if (!manifest) {
					throw new Error('Failed to load asset manifest')
				}

				// Initialize cache entries
				for (const def of manifest.assets) {
					cache.set(def.key, {
						definition: def,
						gltf: null,
						texture: null,
						animations: new Map(),
						loaded: false,
						loading: false,
						error: null,
					})
				}

				updateProgress()

				const totalAssets = manifest.assets.length
				let loadedCount = 0

				// Sort assets by priority order (critical first, then high, normal, low)
				const sortedAssets = [...manifest.assets].sort((a, b) => {
					return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
				})

				// Initiate ALL loads immediately, ordered by priority
				// On fast machines, everything loads in parallel
				// On slower machines, critical assets get queued first
				const allLoadPromises = sortedAssets.map(async (assetDef) => {
					try {
						state.currentAsset = assetDef.key
						await loadAsset(assetDef.key)
						loadedCount++
						updateProgress()
						checkCriticalReady()
						onProgress?.(loadedCount, totalAssets, assetDef.key)
						return { key: assetDef.key, success: true }
					} catch (err) {
						console.error(`[Assets] Failed to load ${assetDef.key}:`, err)
						state.lastError = err instanceof Error ? err : new Error(String(err))
						return { key: assetDef.key, success: false, error: err }
					}
				})

				// Wait for ALL assets to complete (but they're all loading in parallel)
				await Promise.all(allLoadPromises)

				state.isLoading = false
				state.allReady = true
				state.currentAsset = ''
				console.log(`[Assets] All assets loaded (${totalAssets} total)`)

			} catch (err) {
				state.isLoading = false
				state.lastError = err instanceof Error ? err : new Error(String(err))
				console.error('[Assets] Background load failed:', err)
				throw err
			}
		})()

		return loadingPromise
	},

	// ═══════════════════════════════════════════════════════════════════════
	//                      M O D E L   A C C E S S O R S
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Check if an asset is loaded.
	 *
	 * @param key - Asset key
	 * @returns True if asset is loaded and available
	 */
	isLoaded(key: string): boolean {
		return cache.get(key)?.loaded ?? false
	},

	/**
	 * Get asset definition by key.
	 *
	 * @param key - Asset key
	 * @returns Asset definition or undefined
	 */
	getDefinition(key: string): AssetDefinition | undefined {
		return cache.get(key)?.definition
	},

	/**
	 * Get raw GLTF data for an asset.
	 *
	 * @param key - Asset key
	 * @returns GLTF data or null if not loaded
	 */
	getGLTF(key: string): GLTF | null {
		return cache.get(key)?.gltf ?? null
	},

	/**
	 * Get a texture asset by key.
	 * Returns the texture loaded from the manifest.
	 *
	 * @param key - Asset key (e.g., 'skybox', 'grass-texture')
	 * @returns THREE.Texture or null if not loaded
	 */
	getTextureByKey(key: string): THREE.Texture | null {
		return cache.get(key)?.texture ?? null
	},

	/**
	 * Get a clone of a model asset's scene.
	 * If the asset hasn't loaded, returns a fallback primitive.
	 *
	 * @param key - Asset key
	 * @param fallbackColor - Color for fallback primitive
	 * @returns THREE.Group (either cloned model or primitive fallback)
	 */
	cloneModel(key: string, fallbackColor?: number): THREE.Group {
		const cached = cache.get(key)

		if (cached?.loaded && cached.gltf) {
			// Clone the loaded model using SkeletonUtils for proper skeletal mesh cloning
			const clone = SkeletonUtils.clone(cached.gltf.scene) as THREE.Group
			clone.userData.assetKey = key
			clone.userData.isPlaceholder = false

			// Fix skinned mesh rendering issues and hide bone visualizations
			clone.traverse((child) => {
				// 1. Handle SkinnedMeshes (The actual player model)
				if (child.type === 'SkinnedMesh') {
					const sm = child as THREE.SkinnedMesh
					sm.frustumCulled = false // Prevent culling issues
					sm.castShadow = true
					sm.receiveShadow = true
					sm.visible = true // Force visible

					// Ensure material is visible
					if (Array.isArray(sm.material)) {
						sm.material.forEach(m => m.visible = true)
					} else if (sm.material) {
						sm.material.visible = true
					}
				}

				// 2. AGGRESSIVELY hide debug lines/skeletons
				// Blender exports bone visualizations as Line/LineSegments
				if (child.type === 'Line' || child.type === 'LineSegments' || child.type === 'Points') {
					child.visible = false
					child.userData.hiddenByLogic = true
				}

				// 3. Hide meshes that are likely bone shapes (often named "BoneShape", "Wireframe", etc)
				// or if they are direct children of the root named "Armature" but are just static meshes
				const name = child.name.toLowerCase()
				if (name.includes('shape') || name.includes('debug') || name.includes('wireframe')) {
					if (child.type === 'Mesh') {
						child.visible = false
					}
				}
			})

			// Debug: Log clone contents
			if (import.meta.env.DEV) {
				console.group(`[Assets] cloneModel "${key}" Analysis`)

				// Calculate bounding box to check scale
				const box = new THREE.Box3().setFromObject(clone)
				const size = new THREE.Vector3()
				box.getSize(size)
				console.log(`Dimensions: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`)

				// Log hierarchy
				const logHierarchy = (obj: THREE.Object3D, depth: number = 0) => {
					const indent = '  '.repeat(depth)
					const type = obj.type
					const name = obj.name || '<unnamed>'
					const visible = obj.visible ? 'visible' : 'hidden'
					let extra = ''

					if (type === 'SkinnedMesh') {
						const sm = obj as THREE.SkinnedMesh
						extra = `(Skeleton: ${sm.skeleton?.bones?.length ?? 0} bones)`
					} else if (type === 'Mesh') {
						const m = obj as THREE.Mesh
						const geo = m.geometry
						extra = `(Geo: ${geo.type})`
					}

					console.log(`${indent}${name} [${type}] ${visible} ${extra}`)

					obj.children.forEach(child => logHierarchy(child, depth + 1))
				}
				logHierarchy(clone)
				console.groupEnd()
			}

			// Apply rotation from manifest (for axis conversion, e.g., Z-up to Y-up)
			// Applied FIRST before scale/position so orientation is correct
			const rotation = cached.definition.rotation
			if (rotation) {
				const degToRad = Math.PI / 180
				if (rotation.x) clone.rotation.x = rotation.x * degToRad
				if (rotation.y) clone.rotation.y = rotation.y * degToRad
				if (rotation.z) clone.rotation.z = rotation.z * degToRad
			}

			// Apply scale from manifest
			const scale = cached.definition.scale ?? 1.0
			if (scale !== 1.0) {
				clone.scale.setScalar(scale)
			}

			// Apply Y offset from manifest (to fix models with origin not at feet)
			const yOffset = cached.definition.yOffset ?? 0
			if (yOffset !== 0) {
				clone.position.y = yOffset * scale
			}

			// Apply material overrides from manifest
			const materialOverrides = cached.definition.materials
			if (materialOverrides) {
				applyMaterialOverrides(clone, materialOverrides)
			}

			return clone
		}

		// Return fallback primitive
		const fallbackType = cached?.definition.fallback ?? 'box'
		const primitive = Primitives.create(fallbackType, { color: fallbackColor })
		primitive.userData.assetKey = key
		primitive.userData.isPlaceholder = true
		return primitive
	},

	/**
	 * Get an animation clip by key.
	 *
	 * @param key - Animation asset key (e.g., 'anim-breathing-idle')
	 * @returns Animation clip or undefined
	 */
	getAnimation(key: string): THREE.AnimationClip | undefined {
		const cached = cache.get(key)
		if (cached?.loaded) {
			return cached.animations.get(key)
		}
		return undefined
	},

	/**
	 * Get all animations for a model.
	 *
	 * @param modelKey - Model asset key (e.g., 'player-base')
	 * @returns Map of animation name to clip
	 */
	getAnimationsForModel(modelKey: string): Map<string, THREE.AnimationClip> {
		const result = new Map<string, THREE.AnimationClip>()

		// Find all animation assets that target this model
		for (const [_key, cached] of cache) {
			if (cached.definition.category === 'animation' &&
				cached.definition.target === modelKey &&
				cached.loaded) {
				for (const [name, clip] of cached.animations) {
					result.set(name, clip)
				}
			}
		}

		return result
	},

	/**
	 * Get asset metadata (bone names, etc.)
	 *
	 * @param key - Asset key
	 * @returns Metadata object or undefined
	 */
	getMetadata(key: string): AssetMetadata | undefined {
		return cache.get(key)?.definition.metadata
	},

	/**
	 * Get all asset keys by category.
	 *
	 * @param category - Asset category
	 * @returns Array of asset keys
	 */
	getKeysByCategory(category: AssetCategory): string[] {
		const keys: string[] = []
		for (const [key, cached] of cache) {
			if (cached.definition.category === category) {
				keys.push(key)
			}
		}
		return keys
	},

	/**
	 * Check if all critical assets are loaded.
	 */
	areCriticalAssetsLoaded(): boolean {
		for (const [, cached] of cache) {
			if (cached.definition.priority === 'critical' && !cached.loaded) {
				return false
			}
		}
		return true
	},

	/**
	 * Check if all assets are loaded.
	 */
	areAllAssetsLoaded(): boolean {
		for (const [, cached] of cache) {
			if (!cached.loaded) {
				return false
			}
		}
		return true
	},

	/**
	 * Get loading progress.
	 *
	 * @returns Object with loaded count, total count, and percentage
	 */
	getProgress(): { loaded: number; total: number; percent: number } {
		return {
			loaded: state.loadedCount,
			total: state.totalCount,
			percent: state.progress,
		}
	},

	// ═══════════════════════════════════════════════════════════════════════
	//                      T E X T U R E   C A C H E
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Load or retrieve a cached texture.
	 * Textures are cached by path and reused across scene recreations.
	 *
	 * @param path - Path to the texture file (relative to public/)
	 * @param options - Optional texture configuration
	 * @returns The loaded texture (may still be loading async)
	 */
	getTexture(path: string, options?: TextureOptions): THREE.Texture {
		// Check cache first
		const cached = textureCache.get(path)
		if (cached) {
			// Apply any new options to the cached texture
			if (options) {
				applyTextureOptions(cached, options)
			}
			return cached
		}

		// Load new texture synchronously (Three.js handles async internally)
		const texture = textureLoader.load(path)

		// Apply merged options
		const mergedOptions = { ...DEFAULT_TEXTURE_OPTIONS, ...options }
		applyTextureOptions(texture, mergedOptions)

		// Cache for future use
		textureCache.set(path, texture)

		return texture
	},

	/**
	 * Check if a texture is cached.
	 *
	 * @param path - Texture path to check
	 * @returns True if texture is in cache
	 */
	hasTexture(path: string): boolean {
		return textureCache.has(path)
	},

	/**
	 * Preload a texture without immediately using it.
	 * Uses the shared async texture loader for proper Promise handling.
	 *
	 * @param path - Path to the texture file
	 * @param options - Optional texture configuration
	 * @returns Promise that resolves when texture is loaded
	 */
	async preloadTexture(path: string, options?: TextureOptions): Promise<THREE.Texture> {
		// Check cache first
		if (textureCache.has(path)) {
			return textureCache.get(path)!
		}

		const texture = await loadTextureAsync(path, options)
		textureCache.set(path, texture)
		return texture
	},

	/**
	 * Update anisotropy on all cached textures to match renderer capabilities.
	 * Call this after the WebGL renderer is created.
	 *
	 * @param maxAnisotropy - Maximum anisotropy supported by the renderer
	 */
	updateTextureAnisotropy(maxAnisotropy: number): void {
		for (const [, texture] of textureCache) {
			texture.anisotropy = maxAnisotropy
		}
	},

	/**
	 * Clear texture cache and dispose textures.
	 * Call this when textures are no longer needed.
	 */
	disposeTextures(): void {
		for (const [, texture] of textureCache) {
			texture.dispose()
		}
		textureCache.clear()
	},
}

// ═══════════════════════════════════════════════════════════════════════════
//                          V U E   P L U G I N
// ═══════════════════════════════════════════════════════════════════════════

export default {
	install(app: App) {
		app.config.globalProperties.$assets = assets
	},
}
