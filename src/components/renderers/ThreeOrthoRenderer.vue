<!--
	FC Tycoon™ 2027 Match Simulator - 3D Orthographic Renderer Component

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
import { CoordinateTransforms } from '@/core/CoordinateTransforms'
import ThreeRendererBase, { OrbitControls } from './ThreeRendererBase'

export default defineComponent({
	name: 'ThreeOrthoRenderer',
	extends: ThreeRendererBase,

	methods: {
		/**
		 * Initialize Three.js scene with orthographic camera.
		 */
		initThree() {
			const el = this.$refs.container as HTMLElement
			const w = el.clientWidth
			const h = el.clientHeight

			// Get field from match store (required for dimensions)
			const field = this.$match.field
			if (!field) throw new Error('ThreeOrthoRenderer: No field available from $match')

			// Orthographic camera viewing from above
			// Use shared metrics calculation to ensure consistency with 2D view (4m margin)
			const scale = CoordinateTransforms.calculateScale(field, w, h, 4)
			const viewSize = h / scale
			const aspect = w / h

			const camera = markRaw(new THREE.OrthographicCamera(
				(-viewSize * aspect) / 2,
				(viewSize * aspect) / 2,
				viewSize / 2,
				-viewSize / 2,
				0.1,
				2000,
			))
			this.camera = camera
			// Position camera above field looking down
			// up.set(0, 0, -1) flips the view so: Screen RIGHT = World +X, Screen UP = World +Z
			// This matches the 2D canvas orientation where +X is right (toward Away goal)
			camera.position.set(0, 100, 0)
			camera.up.set(0, 0, -1)
			camera.lookAt(0, 0, 0)

			// Get shared renderer and scene from store
			const renderer = this.attachRenderer(el, w, h)

			// OrbitControls for Pan/Zoom only
			this.controls = markRaw(new OrbitControls(camera, renderer.domElement))
			this.controls.enableRotate = false
			this.controls.enableZoom = true
			this.controls.enablePan = true
			this.controls.enableDamping = true
			this.controls.dampingFactor = 0.05
			this.controls.minZoom = 0.5
			this.controls.maxZoom = 5

			// Apply current props to scene manager
			this.getSceneManager()

			this.animate()
		},

		/**
		 * Handle window resize for orthographic camera.
		 */
		onResize() {
			const renderer = this.$renderer.getWebGLRenderer()
			if (!this.camera || !renderer || !this.$refs.container) return
			const el = this.$refs.container as HTMLElement
			const w = el.clientWidth
			const h = el.clientHeight

			const field = this.$match.field
			if (!field) return

			const scale = CoordinateTransforms.calculateScale(field, w, h, 4)
			const viewSize = h / scale
			const aspect = w / h

			const cam = this.camera as THREE.OrthographicCamera
			cam.left = (-viewSize * aspect) / 2
			cam.right = (viewSize * aspect) / 2
			cam.top = viewSize / 2
			cam.bottom = -viewSize / 2
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
