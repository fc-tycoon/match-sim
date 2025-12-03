<!--
	FC Tycoon™ 2027 Match Simulator - 2D Canvas Renderer Component

	Copyright © 2025 Darkwave Studios LLC. All rights reserved.
	This file is part of FC Tycoon™ 2027 Match Simulator.
	Licensed under the FC Tycoon Match Simulator Source Available License.
	See LICENSE.md in the project root for license terms.
-->

<template>
	<canvas ref="canvas" class="canvas2d-renderer" @click="onClick" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { CoordinateTransforms } from '@/core/CoordinateTransforms'
import type { Team } from '@/core/Team'
import type { Box2 } from 'three'

export default defineComponent({
	name: 'Canvas2DRenderer',

	props: {
		showCones: { type: Boolean, default: true },
		playerConfig: { type: Object, default: () => ({}) },
	},

	emits: [
		'player-click',
	],

	data() {
		return {
			ctx: null as CanvasRenderingContext2D | null,
			scale: 1,
			offsetX: 0,
			offsetY: 0,
			animationFrameId: null as number | null,
		}
	},

	mounted() {
		const canvas = this.$refs.canvas as HTMLCanvasElement
		if (!canvas) return
		canvas.width = canvas.clientWidth
		canvas.height = canvas.clientHeight
		this.ctx = canvas.getContext('2d')
		window.addEventListener('resize', this.onResize)
		this.draw()
	},

	beforeUnmount() {
		window.removeEventListener('resize', this.onResize)
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId)
		}
	},

	methods: {
		onResize() {
			const canvas = this.$refs.canvas as HTMLCanvasElement
			if (!canvas) return
			canvas.width = canvas.clientWidth
			canvas.height = canvas.clientHeight
		},

		/**
		 * Stroke a Box2 as a rectangle on the canvas.
		 * @param box - The Three.js Box2 to draw
		 */
		strokeBox2(box: Box2) {
			const width = box.max.x - box.min.x
			const height = box.max.y - box.min.y
			this.ctx!.strokeRect(box.min.x, box.min.y, width, height)
		},

		/**
		 * Fill a Box2 as a rectangle on the canvas.
		 * @param box - The Three.js Box2 to fill
		 */
		fillBox2(box: Box2) {
			const width = box.max.x - box.min.x
			const height = box.max.y - box.min.y
			this.ctx!.fillRect(box.min.x, box.min.y, width, height)
		},

		draw() {
			if (!this.ctx) return
			const ctx = this.ctx  // Local reference for TypeScript narrowing
			const cvs = this.$refs.canvas as HTMLCanvasElement
			if (!cvs) return
			const w = cvs.width
			const h = cvs.height

			// Get field from match store (required for dimensions)
			const field = this.$match.field
			if (!field) return

			// Extract field properties (uppercase constants and Box2 objects)
			const {
				LENGTH,
				WIDTH,
				CENTER_CIRCLE_RADIUS,
				CORNER_ARC_RADIUS,
				PENALTY_SPOT_DISTANCE,
				COLOR_GRASS,
				COLOR_GRASS_BORDER,
				COLOR_GRASS_STRIPE,
				COLOR_CONE,
				fieldBounds,
				homePenaltyArea,
				homeGoalArea,
				homeGoal,
				awayPenaltyArea,
				awayGoalArea,
				awayGoal,
			} = field

			// Calculate scale and center offsets
			this.scale = CoordinateTransforms.calculateScale(field, w, h, 4)
			this.offsetX = w / 2
			this.offsetY = h / 2

			// Clear canvas and fill with border color
			ctx.fillStyle = '#' + COLOR_GRASS_BORDER.toString(16).padStart(6, '0')
			ctx.fillRect(0, 0, w, h)

			// Save context state
			ctx.save()

			// ═══════════════════════════════════════════════════════════════════════
			// CENTER-TRANSLATED + Y-FLIP CANVAS TRANSFORM
			// ═══════════════════════════════════════════════════════════════════════
			// After this transform:
			// - Origin (0,0) = Center spot of the pitch
			// - +X = Toward Away goal (World +X)
			// - +Y = Toward top touchline (World +Y) - Y is FLIPPED from raw canvas
			// - position2d.x and position2d.y can be used DIRECTLY for drawing!
			//
			// For text: ctx.save(); ctx.scale(1, -1); draw text; ctx.restore()
			// ═══════════════════════════════════════════════════════════════════════

			ctx.translate(this.offsetX, this.offsetY)
			ctx.scale(this.scale, -this.scale)  // Y-flip: scale(s, -s)

			// Now we're in WORLD SPACE! All coordinates are in meters.

			// Field dimensions (from fieldBounds Box2)
			const bounds_min_x = fieldBounds.min.x
			const bounds_min_y = fieldBounds.min.y
			const bounds_max_x = fieldBounds.max.x
			const bounds_max_y = fieldBounds.max.y

			// Dark grass green background for field area
			ctx.fillStyle = '#' + COLOR_GRASS.toString(16).padStart(6, '0')
			this.fillBox2(fieldBounds)

			// Grass stripes (alternating darker stripes, matching 3D renderer)
			const numStripes = 19
			const stripeWidth = LENGTH / numStripes
			ctx.fillStyle = '#' + COLOR_GRASS_STRIPE.toString(16).padStart(6, '0')
			for (let i = 1; i < numStripes; i += 2) {
				const stripeX = bounds_min_x + (i * stripeWidth)
				ctx.fillRect(stripeX, bounds_min_y, stripeWidth, WIDTH)
			}

			// Field lines (white)
			ctx.strokeStyle = '#fff'
			ctx.lineWidth = 1.5 / this.scale  // Maintain visual line width

			// Boundary
			this.strokeBox2(fieldBounds)

			// Halfway line (vertical at X=0)
			ctx.beginPath()
			ctx.moveTo(0, bounds_min_y)
			ctx.lineTo(0, bounds_max_y)
			ctx.stroke()

			// Center circle (at origin)
			ctx.beginPath()
			ctx.arc(0, 0, CENTER_CIRCLE_RADIUS, 0, Math.PI * 2)
			ctx.stroke()

			// Center spot
			ctx.beginPath()
			ctx.arc(0, 0, 0.2, 0, Math.PI * 2)
			ctx.fillStyle = '#fff'
			ctx.fill()

			// ═══════════════════════════════════════════════════════════════════════
			// PENALTY AREAS (using Box2)
			// ═══════════════════════════════════════════════════════════════════════

			// Home penalty area (at -X)
			this.strokeBox2(homePenaltyArea)

			// Home goal area
			this.strokeBox2(homeGoalArea)

			// Home penalty spot
			const homePenaltySpotX = bounds_min_x + PENALTY_SPOT_DISTANCE
			ctx.beginPath()
			ctx.arc(homePenaltySpotX, 0, 0.2, 0, Math.PI * 2)
			ctx.fillStyle = '#fff'
			ctx.fill()

			// Home penalty arc (arc outside the box toward center)
			const arcRadius = CENTER_CIRCLE_RADIUS  // 9.15m
			const homeBoxEdgeX = homePenaltyArea.max.x
			const homeDist = homeBoxEdgeX - homePenaltySpotX
			const homeRatio = Math.min(Math.max(homeDist / arcRadius, -1), 1)
			const homeAngle = Math.acos(homeRatio)
			// Arc opens toward +X (center of pitch)
			ctx.beginPath()
			ctx.arc(homePenaltySpotX, 0, arcRadius, -homeAngle, homeAngle)
			ctx.stroke()

			// Away penalty area (at +X)
			this.strokeBox2(awayPenaltyArea)

			// Away goal area
			this.strokeBox2(awayGoalArea)

			// Away penalty spot
			const awayPenaltySpotX = bounds_max_x - PENALTY_SPOT_DISTANCE
			ctx.beginPath()
			ctx.arc(awayPenaltySpotX, 0, 0.2, 0, Math.PI * 2)
			ctx.fillStyle = '#fff'
			ctx.fill()

			// Away penalty arc (arc outside the box toward center)
			const awayBoxEdgeX = awayPenaltyArea.min.x
			const awayDist = awayPenaltySpotX - awayBoxEdgeX
			const awayRatio = Math.min(Math.max(awayDist / arcRadius, -1), 1)
			const awayAngle = Math.acos(awayRatio)
			// Arc opens toward -X (center of pitch) = PI ± angle
			ctx.beginPath()
			ctx.arc(awayPenaltySpotX, 0, arcRadius, Math.PI - awayAngle, Math.PI + awayAngle)
			ctx.stroke()

			// ═══════════════════════════════════════════════════════════════════════
			// CORNER ARCS
			// ═══════════════════════════════════════════════════════════════════════

			// Corner arcs at each corner flag (using bounds min/max)
			const cornerR = CORNER_ARC_RADIUS

			// Bottom-Left (-X, -Y) - Home side, bottom
			ctx.beginPath()
			ctx.arc(bounds_min_x, bounds_min_y, cornerR, 0, Math.PI / 2)
			ctx.stroke()

			// Top-Left (-X, +Y) - Home side, top
			ctx.beginPath()
			ctx.arc(bounds_min_x, bounds_max_y, cornerR, -Math.PI / 2, 0)
			ctx.stroke()

			// Bottom-Right (+X, -Y) - Away side, bottom
			ctx.beginPath()
			ctx.arc(bounds_max_x, bounds_min_y, cornerR, Math.PI / 2, Math.PI)
			ctx.stroke()

			// Top-Right (+X, +Y) - Away side, top
			ctx.beginPath()
			ctx.arc(bounds_max_x, bounds_max_y, cornerR, Math.PI, -Math.PI / 2)
			ctx.stroke()

			// ═══════════════════════════════════════════════════════════════════════
			// GOALS (using Box2)
			// ═══════════════════════════════════════════════════════════════════════

			ctx.strokeStyle = '#fff'

			// Home Goal (at -X)
			this.strokeBox2(homeGoal)

			// Away Goal (at +X)
			this.strokeBox2(awayGoal)

			// ═══════════════════════════════════════════════════════════════════════
			// FORMATION AABBs (debug visualization)
			// ═══════════════════════════════════════════════════════════════════════

			if (this.$settings.debug.showFormationAABB && this.$match.teams?.length) {
				ctx.save()
				ctx.globalAlpha = 1
				ctx.lineWidth = 2 / this.scale
				ctx.setLineDash([5 / this.scale, 5 / this.scale])

				this.$match.teams.forEach((team, index) => {
					const aabb = team.tactics?.formationAABB
					if (!aabb) return

					// Get color from settings or use default team colors
					const isHome = index === 0
					const settingsColor = isHome
						? this.$settings.debug.homeAABBColor
						: this.$settings.debug.awayAABBColor
					const defaultColor = isHome ? 0x00ff00 : 0xff0000 // Green for home, red for away
					const color = settingsColor ?? defaultColor

					ctx.strokeStyle = '#' + color.toString(16).padStart(6, '0')

					// Draw AABB rectangle using the four edges
					ctx.beginPath()
					ctx.moveTo(aabb.backEdge, aabb.leftEdge)
					ctx.lineTo(aabb.backEdge, aabb.rightEdge)
					ctx.lineTo(aabb.frontEdge, aabb.rightEdge)
					ctx.lineTo(aabb.frontEdge, aabb.leftEdge)
					ctx.closePath()
					ctx.stroke()
				})

				ctx.restore()
			}

			// ═══════════════════════════════════════════════════════════════════════
			// SLOT MARKERS (debug visualization)
			// ═══════════════════════════════════════════════════════════════════════

			if (this.$settings.debug.showSlotMarkers && this.$match.teams?.length) {
				ctx.save()

				// Cast needed due to Vue reactive types not recognizing private class fields
				;(this.$match.teams as unknown as Team[]).forEach((team, index) => {
					const slotPlayers = team.tactics?.formation?.slotPlayers
					if (!slotPlayers) return

					const isHome = index === 0
					const teamColor = team.color ?? (isHome ? 0x00ff00 : 0xff0000)

					for (const sp of slotPlayers) {
						const slot = sp.slot

						// Skip goalkeeper slots - they have separate positioning
						if (slot.code === 'GK') continue

						const worldPos = slot.toWorld2D(team)

						// Draw slot marker (small cross)
						const markerSize = 1.0 // 1m
						ctx.strokeStyle = '#' + teamColor.toString(16).padStart(6, '0')
						ctx.lineWidth = 1.5 / this.scale
						ctx.globalAlpha = 0.6

						// Horizontal line
						ctx.beginPath()
						ctx.moveTo(worldPos.x - markerSize, worldPos.y)
						ctx.lineTo(worldPos.x + markerSize, worldPos.y)
						ctx.stroke()

						// Vertical line
						ctx.beginPath()
						ctx.moveTo(worldPos.x, worldPos.y - markerSize)
						ctx.lineTo(worldPos.x, worldPos.y + markerSize)
						ctx.stroke()

						// Slot code label
						ctx.save()
						ctx.translate(worldPos.x, worldPos.y)
						ctx.scale(1 / this.scale, -1 / this.scale) // Flip Y for text
						ctx.fillStyle = '#' + teamColor.toString(16).padStart(6, '0')
						ctx.font = '8px Arial'
						ctx.textAlign = 'center'
						ctx.textBaseline = 'top'
						ctx.globalAlpha = 0.8
						ctx.fillText(slot.code, 0, 8)
						ctx.restore()
					}
				})

				ctx.restore()
			}

			// ═══════════════════════════════════════════════════════════════════════
			// AI MOVEMENT LINES (debug visualization)
			// ═══════════════════════════════════════════════════════════════════════

			if (this.$settings.debug.showAiMovementLines && this.$match.players?.length) {
				ctx.save()
				ctx.lineWidth = 1 / this.scale
				ctx.setLineDash([3 / this.scale, 3 / this.scale])

				this.$match.players.forEach(player => {
					if (!player.body || !player.context) return

					const intentions = player.context.intentions
					const targetPos = intentions.targetPosition

					// Draw line from player to target position
					if (targetPos) {
						const px = player.body.position.x
						const py = player.body.position.y
						// targetPosition is Vector2
						const tx = targetPos.x
						const ty = targetPos.y

						// Line color based on team
						const teamColor = player.team?.color ?? 0xffffff
						ctx.strokeStyle = '#' + teamColor.toString(16).padStart(6, '0')
						ctx.globalAlpha = 0.5

						ctx.beginPath()
						ctx.moveTo(px, py)
						ctx.lineTo(tx, ty)
						ctx.stroke()

						// Small circle at target
						ctx.beginPath()
						ctx.arc(tx, ty, 0.3, 0, Math.PI * 2)
						ctx.stroke()
					}
				})

				ctx.restore()
			}

			// ═══════════════════════════════════════════════════════════════════════
			// AI FACE DIRECTION (debug visualization)
			// ═══════════════════════════════════════════════════════════════════════

			if (this.$settings.debug.showAiFaceDirection && this.$match.players?.length) {
				ctx.save()
				ctx.lineWidth = 1.5 / this.scale

				this.$match.players.forEach(player => {
					if (!player.body || !player.context) return

					const intentions = player.context.intentions
					const faceTarget = intentions.faceTarget

					// Draw line from player to face target
					if (faceTarget) {
						const px = player.body.position.x
						const py = player.body.position.y
						// faceTarget is Vector2
						const fx = faceTarget.x
						const fy = faceTarget.y

						// Direction to face target (normalize and scale)
						const dx = fx - px
						const dy = fy - py
						const dist = Math.sqrt(dx * dx + dy * dy)
						if (dist > 0.1) {
							// Draw shorter line showing face direction (5m max)
							const lineLen = Math.min(dist, 5)
							const endX = px + (dx / dist) * lineLen
							const endY = py + (dy / dist) * lineLen

							ctx.strokeStyle = '#ffff00' // Yellow for face direction
							ctx.globalAlpha = 0.6

							ctx.beginPath()
							ctx.moveTo(px, py)
							ctx.lineTo(endX, endY)
							ctx.stroke()
						}
					}
				})

				ctx.restore()
			}

			// ═══════════════════════════════════════════════════════════════════════
			// PLAYERS
			// ═══════════════════════════════════════════════════════════════════════

			if (this.$match.players) {
				this.$match.players.forEach(player => {
					if (!player.body) return
					const body = player.body
					const bodyDir = body.bodyDir

					// position2d works DIRECTLY now! (x = World X, y = World Y)
					const px = body.position.x
					const py = body.position.y

					// Vision Cone
					if (this.showCones) {
						ctx.save()
						ctx.translate(px, py)

						// bodyDir is in World space. After Y-flip transform, rotation is inverted,
						// so we negate the angle to maintain correct visual direction.
						const angle = Math.atan2(bodyDir.y, bodyDir.x)
						ctx.rotate(-angle)

						// Draw Cone (Sector)
						const coneRadius = 15  // 15m (world units, no scaling needed)
						const coneAngle = Math.PI / 3  // 60 degrees

						ctx.beginPath()
						ctx.moveTo(0, 0)
						ctx.arc(0, 0, coneRadius, -coneAngle / 2, coneAngle / 2)
						ctx.closePath()

						ctx.fillStyle = '#' + COLOR_CONE.toString(16).padStart(6, '0')
						ctx.globalAlpha = 0.2
						ctx.fill()
						ctx.restore()
					}

					// Player Circle
					const pRadius = 0.6  // 0.6m radius (world units)
					ctx.beginPath()
					ctx.arc(px, py, pRadius, 0, Math.PI * 2)

					// Get team color from player's team
					const color = player.team.color
					ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
					ctx.fill()

					// Stroke
					ctx.strokeStyle = '#fff'
					ctx.lineWidth = 1 / this.scale
					ctx.stroke()

					// Number (needs Y-flip correction for text)
					if (player.shirtNumber) {
						ctx.save()
						ctx.translate(px, py)
						ctx.scale(1 / this.scale, -1 / this.scale)  // Flip Y and reset to pixel coords
						ctx.fillStyle = '#fff'
						ctx.font = 'bold 10px Arial'
						ctx.textAlign = 'center'
						ctx.textBaseline = 'middle'
						ctx.fillText(String(player.shirtNumber), 0, 0)
						ctx.restore()
					}

					// Direction Arrow (Triangle on edge)
					if (this.showCones) {
						const angle = Math.atan2(bodyDir.y, bodyDir.x)
						const arrowDist = pRadius + 2 / this.scale

						// Arrow position uses world coordinates (pre-Y-flip math)
						const ax = px + Math.cos(angle) * arrowDist
						const ay = py + Math.sin(angle) * arrowDist

						ctx.save()
						ctx.translate(ax, ay)
						ctx.rotate(-angle)
						const arrowSize = 3 / this.scale
						ctx.beginPath()
						ctx.moveTo(0, 0)
						ctx.lineTo(-arrowSize, -arrowSize * 0.66)
						ctx.lineTo(-arrowSize, arrowSize * 0.66)
						ctx.closePath()
						ctx.fillStyle = '#fff'
						ctx.fill()
						ctx.restore()
					}
				})
			}

			// ═══════════════════════════════════════════════════════════════════════
			// BALL
			// ═══════════════════════════════════════════════════════════════════════

			if (this.$match.ball) {
				// Use position2d (World X, World Y) for 2D canvas
				const bx = this.$match.ball.position2d.x
				const by = this.$match.ball.position2d.y

				ctx.beginPath()
				ctx.arc(bx, by, 0.3, 0, Math.PI * 2)  // 0.3m radius
				ctx.fillStyle = '#fff'
				ctx.fill()
			}

			ctx.restore()

			this.animationFrameId = requestAnimationFrame(this.draw)
		},

		onClick(event: MouseEvent) {
			if (!this.$match.players) return

			const canvas = this.$refs.canvas as HTMLCanvasElement
			const rect = canvas.getBoundingClientRect()
			const x = event.clientX - rect.left
			const y = event.clientY - rect.top

			// Convert click to World coordinates
			// Since we use ctx.translate(centerX, centerY) then ctx.scale(s, -s):
			// worldX = (canvasX - centerX) / scale
			// worldY = -(canvasY - centerY) / scale = (centerY - canvasY) / scale
			const worldX = (x - this.offsetX) / this.scale
			const worldY = (this.offsetY - y) / this.scale

			// Find clicked player (within 1.5m radius OR within vision cone)
			const clickedPlayer = this.$match.players.find(p => {
				if (!p.body) return false

				// PlayerBody.position is Vector2 with x (goal-to-goal) and y (touchline)
				// Vector from player to click (click - player)
				const dx = worldX - p.body.position.x
				const dy = worldY - p.body.position.y
				const dist = Math.sqrt(dx * dx + dy * dy)

				// 1. Check body click (1.5m radius)
				if (dist < 1.5) return true

				// 2. Check cone click
				if (this.showCones && dist < 15) {
					// Player facing direction in world space
					const playerAngle = Math.atan2(p.body.bodyDir.y, p.body.bodyDir.x)

					// Angle from player to click point
					const clickAngle = Math.atan2(dy, dx)

					// Difference
					let diff = clickAngle - playerAngle
					// Normalize to -PI..PI
					while (diff > Math.PI) diff -= 2 * Math.PI
					while (diff < -Math.PI) diff += 2 * Math.PI

					// Cone is 60 degrees (PI/3), so +/- 30 degrees (PI/6)
					if (Math.abs(diff) < Math.PI / 6) {
						return true
					}
				}

				return false
			})

			if (clickedPlayer) {
				this.$emit('player-click', clickedPlayer, event)
			}
		},
	},
})
</script>

<style scoped>
.canvas2d-renderer {
	width: 100%;
	height: 100%;
	display: block;
}
</style>
