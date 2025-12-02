/**
 * FC Tycoon™ 2027 Match Simulator - Three.js Renderer Base Component
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { defineComponent, markRaw } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ThreeMatchScene } from '@/core/ThreeMatchScene'
import type { Player } from '@/core/Player'
import type { Ball } from '@/core/Ball'

// Re-export for use by extending components
export { OrbitControls }

/**
 * Base component for Three.js renderers.
 * Extend this component and implement initThree() and onResize() for specific camera types.
 *
 * Uses shared WebGLRenderer and ThreeMatchScene from the $renderer store.
 * Assets must be loaded before mounting - use v-if="$renderer.state.isReady" on parent.
 */
export default defineComponent({
	name: 'ThreeRendererBase',

	props: {
		showCones: { type: Boolean, default: true },
		playerConfig: { type: Object, default: () => ({}) },
	},

	emits: ['player-click'],

	data() {
		return {
			animId: null as number | null,
			downPos: { x: 0, y: 0 },
			camera: null as THREE.Camera | null,
			controls: null as OrbitControls | null,
			raycaster: markRaw(new THREE.Raycaster()),
			mouse: markRaw(new THREE.Vector2()),
			clock: markRaw(new THREE.Clock()),
		}
	},

	watch: {
		showCones(val: boolean) {
			const sceneManager = this.$renderer.getSceneManager()
			if (sceneManager) sceneManager.setConesVisible(val)
		},

		playerConfig: {
			handler(val: Record<string, unknown>) {
				const sceneManager = this.$renderer.getSceneManager()
				if (sceneManager) sceneManager.playerConfig = { ...sceneManager.playerConfig, ...val }
			},

			deep: true,
		},
	},

	mounted() {
		this.initThree()
		window.addEventListener('resize', this.onResize)
	},

	beforeUnmount() {
		window.removeEventListener('resize', this.onResize)
		if (this.animId !== null) cancelAnimationFrame(this.animId)
		if (this.controls) this.controls.dispose()
		// Note: Don't dispose renderer - it's shared via $renderer store
	},

	methods: {
		/**
		 * Initialize Three.js scene. Must be implemented by extending component.
		 */
		initThree() {
			throw new Error('initThree() must be implemented by extending component')
		},

		/**
		 * Handle window resize. Must be implemented by extending component.
		 */
		onResize() {
			throw new Error('onResize() must be implemented by extending component')
		},

		/**
		 * Get the shared WebGL renderer from the store.
		 * Attaches it to the specified element and resizes.
		 *
		 * @param el - DOM element to attach renderer to
		 * @param w - Renderer width
		 * @param h - Renderer height
		 * @returns Shared WebGLRenderer instance
		 */
		attachRenderer(el: HTMLElement, w: number, h: number): THREE.WebGLRenderer {
			const renderer = this.$renderer.getWebGLRenderer()
			renderer.setSize(w, h)
			el.appendChild(renderer.domElement)
			return renderer
		},

		/**
		 * Get the shared scene manager from the store.
		 * Applies current props (showCones, playerConfig).
		 *
		 * @returns ThreeMatchScene instance
		 */
		getSceneManager(): ThreeMatchScene | null {
			const sceneManager = this.$renderer.getSceneManager()
			if (sceneManager) {
				sceneManager.setConesVisible(this.showCones)
				sceneManager.playerConfig = { ...sceneManager.playerConfig, ...this.playerConfig }
			}
			return sceneManager
		},

		/**
		 * Get the shared THREE.Scene from the store.
		 *
		 * @returns THREE.Scene instance
		 */
		getScene(): THREE.Scene | null {
			return this.$renderer.getScene()
		},

		/**
		 * Update the lighting configuration.
		 *
		 * @param config - New lighting configuration
		 */
		updateLighting(config: unknown) {
			const sceneManager = this.$renderer.getSceneManager()
			if (sceneManager && config) {
				sceneManager.setLightingConfig(config as Parameters<typeof sceneManager.setLightingConfig>[0])
			}
		},

		/**
		 * Update the shadow quality setting.
		 *
		 * @param quality - Shadow quality level
		 */
		updateShadowQuality(quality: unknown) {
			const sceneManager = this.$renderer.getSceneManager()
			if (sceneManager && quality) {
				sceneManager.setShadowQuality(quality as Parameters<typeof sceneManager.setShadowQuality>[0])
			}
		},

		/**
		 * Handle pointer down for drag detection.
		 * @param event - Pointer event
		 */
		onPointerDown(event: PointerEvent) {
			this.downPos = { x: event.clientX, y: event.clientY }
		},

		/**
		 * Handle click events for player selection.
		 *
		 * @param event - Mouse event
		 */
		onClick(event: MouseEvent) {
			const sceneManager = this.$renderer.getSceneManager()
			if (!this.camera || !sceneManager) return
			const el = this.$refs.container as HTMLElement

			const playerId = this.raycastPlayer(event, el)
			if (playerId !== null) {
				const player = (this.$match.players as Player[]).find(p => p.id === playerId)
				if (player) {
					event.stopPropagation()
					event.preventDefault()
					this.$emit('player-click', player, event)
				}
			}
		},

		/**
		 * Raycast to find clicked player.
		 *
		 * @param event - Mouse event
		 * @param container - Container element
		 * @returns Player ID if found, null otherwise
		 */
		raycastPlayer(event: MouseEvent, container: HTMLElement): number | null {
			const sceneManager = this.$renderer.getSceneManager()
			if (!this.camera || !sceneManager) return null

			// Check if this was a drag (pan/rotate)
			const dist = Math.hypot(event.clientX - this.downPos.x, event.clientY - this.downPos.y)
			if (dist > 5) return null

			const rect = container.getBoundingClientRect()
			this.mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1
			this.mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1

			this.raycaster.setFromCamera(this.mouse, this.camera)

			const playerObjects = sceneManager.getPlayerObjects()
			const intersects = this.raycaster.intersectObjects(playerObjects, true)

			if (intersects.length > 0) {
				let obj: THREE.Object3D | null = intersects[0].object
				while (obj) {
					if (obj.userData && obj.userData.playerId !== undefined) {
						return obj.userData.playerId as number
					}
					obj = obj.parent
				}
			}

			return null
		},

		/**
		 * Animation loop.
		 */
		animate() {
			this.animId = requestAnimationFrame(this.animate)

			// Get delta time for animations
			const delta = this.clock.getDelta()

			if (this.controls) this.controls.update()

			const sceneManager = this.$renderer.getSceneManager()
			const renderer = this.$renderer.getWebGLRenderer()
			const scene = this.$renderer.getScene()

			if (this.$match.players && sceneManager) {
				const players = this.$match.players as Player[]
				sceneManager.updatePlayers(players, this.playerConfig)

				// Update Mixamo animation mixers
				sceneManager.updateAnimations(delta)
			}

			if (this.$match.ball && sceneManager) {
				sceneManager.updateBall(this.$match.ball as Ball)
			}

			// Update FormationAABB visualization if enabled
			if (sceneManager && this.$match.engine) {
				const teams = this.$match.engine.match.teams
				const debugConfig = this.$settings.debug
				sceneManager.updateFormationAABBs(
					teams[0],
					teams[1],
					{
						show: debugConfig.showFormationAABB,
						homeColor: debugConfig.homeAABBColor,
						awayColor: debugConfig.awayAABBColor,
						opacity: debugConfig.aabbOpacity,
					},
				)
			}

			if (renderer && scene && this.camera) {
				renderer.render(scene, this.camera)
			}
		},
	},
})
