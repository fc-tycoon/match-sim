<!--
	FC Tycoon™ 2027 Match Simulator - 3D Perspective Renderer Component

	Copyright © 2025 Darkwave Studios LLC. All rights reserved.
	This file is part of FC Tycoon™ 2027 Match Simulator.
	Licensed under the FC Tycoon Match Simulator Source Available License.
	See LICENSE.md in the project root for license terms.
-->

<template>
	<div ref="container" class="three-renderer" @pointerdown="onPointerDown" @click="onClick" />
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue'
import * as THREE from 'three'
import ThreeRendererBase, { OrbitControls } from './ThreeRendererBase'

export default defineComponent({
	name: 'ThreePerspectiveRenderer',
	extends: ThreeRendererBase,

	methods: {
		/**
		 * Initialize Three.js scene with perspective camera.
		 */
		initThree() {
			const el = this.$refs.container as HTMLElement
			const w = el.clientWidth
			const h = el.clientHeight

			// Get field from match store (required for dimensions)
			const field = this.$match.field
			if (!field) throw new Error('ThreePerspectiveRenderer: No field available from $match')

			// Perspective camera for angled view
			const camera = markRaw(new THREE.PerspectiveCamera(55, w / h, 0.1, 1000))
			this.camera = camera

			// Restore camera position from settings if available
			const savedCam = this.$settings?.camera?.perspective
			if (savedCam) {
				camera.position.set(savedCam.position.x, savedCam.position.y, savedCam.position.z)
				camera.lookAt(savedCam.target.x, savedCam.target.y, savedCam.target.z)
			} else {
				// Default to Broadcast View (Side) - Camera at -Z looking toward +Z
				// NEW COORDINATE SYSTEM: X = goal-to-goal, Z = touchline-to-touchline
				// Camera positioned along -Z (bottom touchline) looking at center
				camera.position.set(0, 50, -60)
				camera.lookAt(0, 0, 0)
			}

			// Get shared renderer from store
			const renderer = this.attachRenderer(el, w, h)

			// OrbitControls
			this.controls = markRaw(new OrbitControls(camera, renderer.domElement))
			this.controls.enableDamping = true
			this.controls.dampingFactor = 0.05
			this.controls.maxPolarAngle = Math.PI / 2 - 0.1
			this.controls.minDistance = 2
			this.controls.maxDistance = 200

			if (savedCam) {
				this.controls.target.set(savedCam.target.x, savedCam.target.y, savedCam.target.z)
			}

			// Save camera position on change
			this.controls.addEventListener('change', () => {
				if (this.$settings && this.camera && this.controls) {
					this.$settings.camera.perspective.position = {
						x: this.camera.position.x,
						y: this.camera.position.y,
						z: this.camera.position.z,
					}
					this.$settings.camera.perspective.target = {
						x: this.controls.target.x,
						y: this.controls.target.y,
						z: this.controls.target.z,
					}
				}
			})

			// Apply current props to scene manager
			this.getSceneManager()

			this.animate()
		},

		/**
		 * Handle window resize for perspective camera.
		 */
		onResize() {
			const renderer = this.$renderer.getWebGLRenderer()
			if (!this.camera || !renderer || !this.$refs.container) return
			const el = this.$refs.container as HTMLElement
			const w = el.clientWidth
			const h = el.clientHeight

			const cam = this.camera as THREE.PerspectiveCamera
			cam.aspect = w / h
			cam.updateProjectionMatrix()
			renderer.setSize(w, h)
		},
	},
})
</script>

<style scoped>
.three-renderer {
	width: 100%;
	height: 100%;
	position: relative;
}
</style>
