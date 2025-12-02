/**
 * FC Tycoon™ 2027 Match Simulator - Renderer Store
 *
 * Centralized store for managing 3D renderer resources.
 * Shares ThreeMatchScene and WebGLRenderer between view modes for fast switching.
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { reactive, markRaw, App } from 'vue'
import * as THREE from 'three'
import { ThreeMatchScene } from '@/core/ThreeMatchScene'
import { assets } from '@/store/assets'
import type { Field } from '@/core/Field'
import type { LightingConfig } from '@/core/LightingConfig'

// ═══════════════════════════════════════════════════════════════════════════
//                              T Y P E S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Renderer initialization status.
 */
export type RendererStatus = 'idle' | 'loading-assets' | 'creating-scene' | 'ready' | 'error'

// ═══════════════════════════════════════════════════════════════════════════
//                      I N T E R N A L   S T A T E
// ═══════════════════════════════════════════════════════════════════════════

/** Shared WebGL renderer instance */
let webglRenderer: THREE.WebGLRenderer | null = null

/** Shared THREE.Scene instance */
let threeScene: THREE.Scene | null = null

/** Shared ThreeMatchScene manager */
let sceneManager: ThreeMatchScene | null = null

/** Current field reference (stored for potential scene recreation) */
let _currentField: Field | null = null

/** Current lighting config reference (stored for potential scene recreation) */
let _currentLightingConfig: LightingConfig | undefined = undefined

/** Initialization promise (to prevent duplicate init) */
let initPromise: Promise<void> | null = null

// ═══════════════════════════════════════════════════════════════════════════
//                      R E A C T I V E   S T A T E
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reactive state for UI binding.
 */
const state = reactive({
	/** Current initialization status */
	status: 'idle' as RendererStatus,

	/** Whether assets are loaded */
	assetsReady: false,

	/** Whether the 3D scene is ready */
	sceneReady: false,

	/** Combined ready state - true when everything is initialized */
	isReady: false,

	/** Error message if initialization failed */
	error: null as string | null,

	/** Loading progress message */
	progressMessage: '',
})

// ═══════════════════════════════════════════════════════════════════════════
//                      I N T E R N A L   H E L P E R S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create and configure the shared WebGL renderer.
 *
 * @returns Configured WebGLRenderer instance
 */
function createWebGLRenderer(): THREE.WebGLRenderer {
	const renderer = new THREE.WebGLRenderer({
		antialias: true,
	})

	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap

	// Color management for proper model colors
	renderer.outputColorSpace = THREE.SRGBColorSpace
	renderer.toneMapping = THREE.NeutralToneMapping
	renderer.toneMappingExposure = 1.5

	// Log max anisotropy for debugging texture quality
	const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
	console.log(`[Renderer] Max anisotropy: ${maxAnisotropy}`)

	return renderer
}

/**
 * Update the combined ready state.
 */
function updateReadyState(): void {
	state.isReady = state.assetsReady && state.sceneReady
	if (state.isReady) {
		state.status = 'ready'
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//                      R E N D E R E R   S T O R E
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Renderer store - manages shared 3D rendering resources.
 *
 * Usage:
 * ```ts
 * // Start loading assets immediately on app startup
 * renderer.loadAssets()
 *
 * // Later, when match is ready, create the scene
 * await renderer.createScene(field, lightingConfig)
 *
 * // Get shared resources for rendering
 * const webgl = renderer.getWebGLRenderer()
 * const scene = renderer.getScene()
 * const manager = renderer.getSceneManager()
 * ```
 */
export const renderer = {
	// ═══════════════════════════════════════════════════════════════════════
	//                      R E A C T I V E   S T A T E
	// ═══════════════════════════════════════════════════════════════════════

	/** Reactive state for UI binding */
	state,

	// ═══════════════════════════════════════════════════════════════════════
	//                      I N I T I A L I Z A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Start loading assets in the background.
	 * Safe to call multiple times - only loads once.
	 *
	 * @returns Promise that resolves when assets are loaded
	 */
	async loadAssets(): Promise<void> {
		if (state.assetsReady) return

		state.status = 'loading-assets'
		state.progressMessage = 'Loading 3D assets...'

		try {
			await assets.startBackgroundLoad((loaded, total, current) => {
				state.progressMessage = `Loading ${current}... (${loaded}/${total})`
			})

			state.assetsReady = true
			updateReadyState()
			console.log('[Renderer] Assets loaded')

		} catch (err) {
			state.status = 'error'
			state.error = err instanceof Error ? err.message : String(err)
			console.error('[Renderer] Failed to load assets:', err)
			throw err
		}
	},

	/**
	 * Create the shared 3D scene.
	 * Waits for assets to be loaded first.
	 *
	 * @param field - Field configuration from match
	 * @param lightingConfig - Optional lighting configuration
	 * @returns Promise that resolves when scene is ready
	 */
	async createScene(field: Field, lightingConfig?: LightingConfig): Promise<void> {
		// Store references for potential recreation
		_currentField = field
		_currentLightingConfig = lightingConfig

		// If already creating, wait for that to finish
		if (initPromise) {
			return initPromise
		}

		// If already ready with same field, skip
		if (state.sceneReady && sceneManager) {
			return
		}

		initPromise = (async () => {
			try {
				// Wait for assets first
				if (!state.assetsReady) {
					await this.loadAssets()
				}

				state.status = 'creating-scene'
				state.progressMessage = 'Creating 3D scene...'

				// Create WebGL renderer if needed
				if (!webglRenderer) {
					webglRenderer = markRaw(createWebGLRenderer())
					console.log('[Renderer] WebGL renderer created')
				}

				// Create THREE.Scene
				threeScene = markRaw(new THREE.Scene())

				// Create ThreeMatchScene manager
				sceneManager = markRaw(new ThreeMatchScene(threeScene, field, lightingConfig))
				console.log('[Renderer] Scene manager created')

				state.sceneReady = true
				state.progressMessage = ''
				updateReadyState()

			} catch (err) {
				state.status = 'error'
				state.error = err instanceof Error ? err.message : String(err)
				console.error('[Renderer] Failed to create scene:', err)
				throw err

			} finally {
				initPromise = null
			}
		})()

		return initPromise
	},

	// ═══════════════════════════════════════════════════════════════════════
	//                      A C C E S S O R S
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Get the shared WebGL renderer.
	 * Creates one if it doesn't exist.
	 *
	 * @returns WebGLRenderer instance
	 */
	getWebGLRenderer(): THREE.WebGLRenderer {
		if (!webglRenderer) {
			webglRenderer = markRaw(createWebGLRenderer())
		}
		return webglRenderer
	},

	/**
	 * Get the shared THREE.Scene.
	 *
	 * @returns THREE.Scene or null if not created
	 */
	getScene(): THREE.Scene | null {
		return threeScene
	},

	/**
	 * Get the shared ThreeMatchScene manager.
	 *
	 * @returns ThreeMatchScene or null if not created
	 */
	getSceneManager(): ThreeMatchScene | null {
		return sceneManager
	},

	/**
	 * Check if everything is ready for rendering.
	 *
	 * @returns True if assets and scene are ready
	 */
	isReady(): boolean {
		return state.isReady
	},

	// ═══════════════════════════════════════════════════════════════════════
	//                      L I F E C Y C L E
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Recreate the scene (e.g., when match changes).
	 *
	 * @param field - New field configuration
	 * @param lightingConfig - Optional new lighting configuration
	 */
	async recreateScene(field: Field, lightingConfig?: LightingConfig): Promise<void> {
		// Dispose old scene manager
		if (sceneManager) {
			sceneManager.dispose()
			sceneManager = null
		}

		// Clear old scene
		if (threeScene) {
			// Remove all objects from scene
			while (threeScene.children.length > 0) {
				threeScene.remove(threeScene.children[0])
			}
			threeScene = null
		}

		state.sceneReady = false
		state.isReady = false

		// Create new scene
		await this.createScene(field, lightingConfig)
	},

	/**
	 * Dispose all renderer resources.
	 * Call this on app shutdown or HMR.
	 */
	dispose(): void {
		console.log('[Renderer] Disposing resources...')

		// Dispose scene manager
		if (sceneManager) {
			sceneManager.dispose()
			sceneManager = null
		}

		// Clear scene
		if (threeScene) {
			while (threeScene.children.length > 0) {
				threeScene.remove(threeScene.children[0])
			}
			threeScene = null
		}

		// Dispose WebGL renderer
		if (webglRenderer) {
			webglRenderer.dispose()
			webglRenderer = null
		}

		// Reset state
		state.status = 'idle'
		state.assetsReady = false
		state.sceneReady = false
		state.isReady = false
		state.error = null
		state.progressMessage = ''

		// Clear references
		_currentField = null
		_currentLightingConfig = undefined
		initPromise = null
	},

	/**
	 * Reset for HMR (Hot Module Replacement).
	 * Disposes resources so they can be recreated cleanly.
	 */
	resetForHMR(): void {
		this.dispose()
	},
}

// ═══════════════════════════════════════════════════════════════════════════
//                          H M R   S U P P O R T
// ═══════════════════════════════════════════════════════════════════════════

// Handle Vite HMR
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		renderer.resetForHMR()
	})
}

// ═══════════════════════════════════════════════════════════════════════════
//                          V U E   P L U G I N
// ═══════════════════════════════════════════════════════════════════════════

export default {
	install(app: App) {
		app.config.globalProperties.$renderer = renderer
	},
}
