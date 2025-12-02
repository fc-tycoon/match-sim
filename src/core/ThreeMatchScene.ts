/**
 * FC Tycoon™ 2027 Match Simulator - 3D Match Engine Scene Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import { PlayerModel } from './PlayerModel'
import { Player } from './Player'
import { Ball } from './Ball'
import { DefendingSide } from './TeamState'
import { CoordinateTransforms } from './CoordinateTransforms'
import {
	assets,
	PlayerModelFactory,
	PlayerModelBase,
	PlayerAnimationName,
	Primitives,
} from './3d'
import {
	type LightingConfig,
	type ShadowQuality,
	SHADOW_MAP_SIZES,
	getDefaultLightingConfig,
	cloneLightingConfig,
} from './LightingConfig'
import type { Field } from './Field'

/**
 * Model type for player rendering.
 */
export type PlayerModelType = 'primitive' | 'animated'

export class ThreeMatchScene {
	scene: THREE.Scene
	field: Field
	homeGroup: THREE.Group
	awayGroup: THREE.Group
	/** Ball 3D object (GLB model or fallback sphere) */
	ballMesh: THREE.Object3D
	conesVisible: boolean = true
	playerConfig: any = {
		scale: 1.0,
		headColor: PlayerModel.COLOR_SKIN_BASE,
		skinDarkness: 0.0,
		modelType: 'primitive' as PlayerModelType,
	}

	/** Factory for creating and managing player models */
	private playerModelFactory: PlayerModelFactory

	/** Stadium model */
	private stadiumModel: THREE.Group | null = null

	/** Skybox texture (equirectangular) */
	private skyboxTexture: THREE.Texture | null = null

	/** Home team AABB visualization (line loop) */
	private homeAABBLine: THREE.Line | null = null

	/** Away team AABB visualization (line loop) */
	private awayAABBLine: THREE.Line | null = null

	/** Debug flag to log player count only once */
	private _playerCountLogged = false

	/** Debug flag to log positions only once */
	private _positionsLogged = false

	// ═══════════════════════════════════════════════════════════════════════
	//                      L I G H T I N G   S Y S T E M
	// ═══════════════════════════════════════════════════════════════════════

	/** Current lighting configuration */
	private lightingConfig: LightingConfig

	/** Ambient light instance */
	private ambientLight: THREE.AmbientLight | null = null

	/** Hemisphere light instance */
	private hemisphereLight: THREE.HemisphereLight | null = null

	/** Directional (sun) light instance */
	private directionalLight: THREE.DirectionalLight | null = null

	/** Stadium spotlights (4 corners) */
	private spotlights: THREE.SpotLight[] = []

	/** Spotlight targets (for aiming) */
	private spotlightTargets: THREE.Object3D[] = []

	/** Current shadow quality setting */
	private shadowQuality: ShadowQuality = 'high'

	/**
	 * Create a new ThreeMatchScene.
	 *
	 * IMPORTANT: Assets must be loaded BEFORE creating this scene.
	 * Use `await assets.startBackgroundLoad()` or `await renderer.loadAssets()` first.
	 *
	 * @param scene - THREE.Scene to populate
	 * @param field - Field configuration
	 * @param initialLighting - Optional lighting configuration
	 */
	constructor(scene: THREE.Scene, field: Field, initialLighting?: LightingConfig) {
		this.scene = scene
		this.field = field

		// Initialize lighting configuration
		this.lightingConfig = initialLighting
			? cloneLightingConfig(initialLighting)
			: getDefaultLightingConfig()

		// Load skybox texture from manifest as equirectangular environment map
		this.skyboxTexture = assets.getTextureByKey('skybox')
		if (this.skyboxTexture) {
			this.skyboxTexture.mapping = THREE.EquirectangularReflectionMapping
			this.scene.background = this.skyboxTexture
		} else {
			// Fallback to solid color if skybox not loaded
			this.scene.background = new THREE.Color(this.lightingConfig.sky.color)
		}

		// Initialize the player model factory
		this.playerModelFactory = new PlayerModelFactory()

		// Initialize lighting system
		this.initLighting()

		// Field dimensions from Field object
		const fieldLength = this.field.LENGTH
		const fieldWidth = this.field.WIDTH

		// 1. Ground (Earth) - Textured grass plane
		// Draw first with depthWrite: false - nothing renders below ground level,
		// so decals above won't z-fight against ground's depth buffer values
		const groundSize = 500
		const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize)

		// Load grass texture from cache with high quality settings
		// Each tile represents ~10 meters for realistic scale
		const metersPerTile = 10
		const repeatCount = groundSize / metersPerTile
		const grassTexture = assets.getTexture('/3d-assets/textures/grass_m.jpg', {
			wrapS: THREE.RepeatWrapping,
			wrapT: THREE.RepeatWrapping,
			repeat: { x: repeatCount, y: repeatCount },
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearMipmapLinearFilter,
			anisotropy: 16,
			colorSpace: THREE.SRGBColorSpace,
		})

		const groundMat = new THREE.MeshStandardMaterial({
			map: grassTexture,
			roughness: 0.9,
			metalness: 0.0,
			depthWrite: false, // Don't write to depth buffer - eliminates z-fighting with decals
		})
		const ground = new THREE.Mesh(groundGeo, groundMat)
		ground.rotation.x = -Math.PI / 2
		ground.position.y = 0
		ground.receiveShadow = true
		ground.renderOrder = 0 // Ensure drawn first
		this.scene.add(ground)

		// 2. Main Field (Grass Tint) - Decal overlay using polygon offset
		// Uses polygon offset to layer above ground without z-fighting
		const fieldGeo = new THREE.PlaneGeometry(fieldLength, fieldWidth)
		const fieldMat = new THREE.MeshStandardMaterial({
			color: this.field.COLOR_GRASS,
			transparent: true,
			opacity: 0.35,
			roughness: 0.9,
			side: THREE.FrontSide,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -2,
			polygonOffsetUnits: -2,
		})
		const fieldMesh = new THREE.Mesh(fieldGeo, fieldMat)
		fieldMesh.rotation.x = -Math.PI / 2
		fieldMesh.position.y = 0
		fieldMesh.receiveShadow = true
		fieldMesh.renderOrder = 1
		this.scene.add(fieldMesh)

		// 3. Grass Stripes (Lighter tint decals)
		// Stripes run across the width (Z-axis), spaced along X-axis (goal-to-goal)
		const numStripes = 19
		const stripeWidth = fieldLength / numStripes

		for (let i = 0; i < numStripes; i++) {
			if (i % 2 === 0) continue

			const stripeGeo = new THREE.PlaneGeometry(stripeWidth, fieldWidth)
			const stripeMat = new THREE.MeshStandardMaterial({
				color: this.field.COLOR_GRASS_STRIPE,
				transparent: true,
				opacity: 0.25,
				roughness: 0.9,
				side: THREE.FrontSide,
				depthWrite: false,
				polygonOffset: true,
				polygonOffsetFactor: -4,
				polygonOffsetUnits: -4,
			})
			const stripe = new THREE.Mesh(stripeGeo, stripeMat)
			stripe.rotation.x = -Math.PI / 2

			const xPos = -fieldLength / 2 + (i * stripeWidth) + (stripeWidth / 2)
			stripe.position.set(xPos, 0, 0)
			stripe.receiveShadow = true
			stripe.renderOrder = 2
			this.scene.add(stripe)
		}

		// 4. Lines (decals)
		this.createLines()

		// 5. Ball - Load GLB directly (assets are guaranteed ready)
		this.ballMesh = this.createBallMesh()
		this.scene.add(this.ballMesh)

		// 6. Stadium - Load GLB directly (assets are guaranteed ready)
		this.loadStadium()

		this.homeGroup = new THREE.Group()
		this.scene.add(this.homeGroup)

		this.awayGroup = new THREE.Group()
		this.scene.add(this.awayGroup)
	}

	/**
	 * Create the ball mesh from GLB or fallback to primitive.
	 *
	 * @returns Ball Object3D
	 */
	private createBallMesh(): THREE.Object3D {
		if (assets.isLoaded('ball')) {
			const ballModel = assets.cloneModel('ball')
			if (ballModel) {
				console.log('[ThreeMatchScene] Ball GLB loaded')
				return ballModel
			}
		}
		// Fallback to primitive
		console.log('[ThreeMatchScene] Using primitive ball (GLB not loaded)')
		return Primitives.createBallPlaceholder()
	}

	/**
	 * Load the stadium model if available.
	 */
	private loadStadium(): void {
		if (assets.isLoaded('stadium')) {
			const stadium = assets.cloneModel('stadium')
			if (stadium) {
				stadium.position.set(0, 0, 0)
				this.stadiumModel = stadium
				this.scene.add(this.stadiumModel)
				console.log('[ThreeMatchScene] Stadium GLB loaded')
			}
		}
	}

	createLines() {
		// Line material - transparent bucket (opacity 1) so renderOrder > stripes works reliably
		const lineMaterial = new THREE.MeshBasicMaterial({
			color: this.field.COLOR_LINE,
			transparent: true,
			opacity: 1,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -6,
			polygonOffsetUnits: -6,
		})

		// Line render order - must be higher than stripes (renderOrder: 2)
		const lineRenderOrder = 5

		// Extract all field constants via destructuring
		const {
			LENGTH,
			WIDTH,
			LENGTH_HALF,
			LINE_THICKNESS,
			CENTER_CIRCLE_RADIUS,
			PENALTY_AREA_LENGTH,
			PENALTY_AREA_WIDTH,
			GOAL_AREA_LENGTH,
			GOAL_AREA_WIDTH,
			PENALTY_SPOT_DISTANCE,
		} = this.field

		// Helper to create a rectangular line
		// w = size along X, h = size along Z
		const createRectLine = (w: number, h: number, x: number, z: number) => {
			const geo = new THREE.PlaneGeometry(w, h)
			const mesh = new THREE.Mesh(geo, lineMaterial)
			mesh.rotation.x = -Math.PI / 2
			mesh.position.set(x, 0, z)
			mesh.renderOrder = lineRenderOrder
			this.scene.add(mesh)
		}

		// Helper to create a hollow rectangle (4 lines)
		// w = extent along X, h = extent along Z
		const createHollowRect = (w: number, h: number, x: number, z: number) => {
			// Top (Z-) touchline side
			createRectLine(w, LINE_THICKNESS, x, z - h / 2 + LINE_THICKNESS / 2)
			// Bottom (Z+) touchline side
			createRectLine(w, LINE_THICKNESS, x, z + h / 2 - LINE_THICKNESS / 2)
			// Left (X-) goal line side
			createRectLine(LINE_THICKNESS, h, x - w / 2 + LINE_THICKNESS / 2, z)
			// Right (X+) goal line side
			createRectLine(LINE_THICKNESS, h, x + w / 2 - LINE_THICKNESS / 2, z)
		}

		// Boundary (LENGTH along X, WIDTH along Z)
		createHollowRect(LENGTH, WIDTH, 0, 0)

		// Field border strips - extend directly outward from the touch/goal lines
		// Using darker grass color for the border area to imply worn sidelines
		const borderWidth = 10 // meters from field edge
		const borderMaterial = new THREE.MeshStandardMaterial({
			color: 0x2d5a1e, // Darker green for border
			transparent: true,
			opacity: 0.5,
			roughness: 0.9,
			side: THREE.FrontSide,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -3,
			polygonOffsetUnits: -3,
		})

		// Sideline strips (along Z axis, on X+ and X- sides)
		// Extended by borderWidth on each end to cover corners
		const sideStripLength = WIDTH + borderWidth * 2
		const sideStripGeo = new THREE.PlaneGeometry(borderWidth, sideStripLength)

		// Left sideline (X-)
		const leftSide = new THREE.Mesh(sideStripGeo, borderMaterial)
		leftSide.rotation.x = -Math.PI / 2
		leftSide.position.set(-LENGTH / 2 - borderWidth / 2, 0, 0)
		leftSide.renderOrder = 3
		this.scene.add(leftSide)

		// Right sideline (X+)
		const rightSide = new THREE.Mesh(sideStripGeo, borderMaterial)
		rightSide.rotation.x = -Math.PI / 2
		rightSide.position.set(LENGTH / 2 + borderWidth / 2, 0, 0)
		rightSide.renderOrder = 3
		this.scene.add(rightSide)

		// Goal line strips (along X axis, on Z+ and Z- sides)
		// Only field length - sidelines cover the corners
		const goalStripLength = LENGTH
		const goalStripGeo = new THREE.PlaneGeometry(goalStripLength, borderWidth)

		// Top goal line (Z-)
		const topGoal = new THREE.Mesh(goalStripGeo, borderMaterial)
		topGoal.rotation.x = -Math.PI / 2
		topGoal.position.set(0, 0, -WIDTH / 2 - borderWidth / 2)
		topGoal.renderOrder = 3
		this.scene.add(topGoal)

		// Bottom goal line (Z+)
		const bottomGoal = new THREE.Mesh(goalStripGeo, borderMaterial)
		bottomGoal.rotation.x = -Math.PI / 2
		bottomGoal.position.set(0, 0, WIDTH / 2 + borderWidth / 2)
		bottomGoal.renderOrder = 3
		this.scene.add(bottomGoal)

		// Halfway Line (runs along Z axis at X=0)
		createRectLine(LINE_THICKNESS, WIDTH, 0, 0)

		// Center Circle
		const circleGeo = new THREE.RingGeometry(CENTER_CIRCLE_RADIUS - LINE_THICKNESS, CENTER_CIRCLE_RADIUS, 64)
		const circle = new THREE.Mesh(circleGeo, lineMaterial)
		circle.rotation.x = -Math.PI / 2
		circle.position.y = 0
		circle.renderOrder = lineRenderOrder
		this.scene.add(circle)

		// Center Spot
		const spotGeo = new THREE.CircleGeometry(LINE_THICKNESS * 2, 16)
		const spot = new THREE.Mesh(spotGeo, lineMaterial)
		spot.rotation.x = -Math.PI / 2
		spot.position.y = 0
		spot.renderOrder = lineRenderOrder
		this.scene.add(spot)

		// Penalty Areas & Goal Areas
		// sign: +1 for X+ (Away goal), -1 for X- (Home goal)
		const createArea = (sign: number) => {
			// Penalty Area: PENALTY_AREA_LENGTH extends inward from goal line along X
			// PENALTY_AREA_WIDTH extends along Z
			const xOffset = sign * (LENGTH_HALF - PENALTY_AREA_LENGTH / 2)
			createHollowRect(PENALTY_AREA_LENGTH, PENALTY_AREA_WIDTH, xOffset, 0)

			// Goal Area
			const gxOffset = sign * (LENGTH_HALF - GOAL_AREA_LENGTH / 2)
			createHollowRect(GOAL_AREA_LENGTH, GOAL_AREA_WIDTH, gxOffset, 0)

			// Penalty Spot
			const spotX = sign * (LENGTH_HALF - PENALTY_SPOT_DISTANCE)
			const pSpot = new THREE.Mesh(spotGeo, lineMaterial)
			pSpot.rotation.x = -Math.PI / 2
			pSpot.position.set(spotX, 0, 0)
			pSpot.renderOrder = lineRenderOrder
			this.scene.add(pSpot)

			// Penalty Arc
			// The arc is centered at the penalty spot.
			// It intersects the penalty box line at x = sign * (LENGTH_HALF - PENALTY_AREA_LENGTH)
			// Distance from spot to box line = PENALTY_AREA_LENGTH - PENALTY_SPOT_DISTANCE
			const distToBox = PENALTY_AREA_LENGTH - PENALTY_SPOT_DISTANCE

			// Angle from the X-axis (goal-to-goal direction)
			const angle = Math.acos(distToBox / CENTER_CIRCLE_RADIUS)

			// RingGeometry(inner, outer, segments, thetaStart, thetaLength)
			// After rotation.x = -PI/2, thetaStart=0 is +X, PI/2 is +Z
			const arcGeo = new THREE.RingGeometry(
				CENTER_CIRCLE_RADIUS - LINE_THICKNESS,
				CENTER_CIRCLE_RADIUS,
				32,
				1,
				-angle,		// Start (centered on X-axis)
				2 * angle,	// Length
			)
			const arc = new THREE.Mesh(arcGeo, lineMaterial)
			arc.rotation.x = -Math.PI / 2

			// sign=1 (X+, Away goal): Arc points toward -X (center of field)
			// sign=-1 (X-, Home goal): Arc points toward +X (center of field)
			if (sign === 1) {
				// Away goal (X+). Arc points toward -X.
				arc.rotation.z = Math.PI // Rotate 180 to point toward center
			} else {
				// Home goal (X-). Arc points toward +X.
				arc.rotation.z = 0 // Already pointing +X
			}

			arc.position.set(spotX, 0, 0)
			arc.renderOrder = lineRenderOrder
			this.scene.add(arc)
		}

		createArea(1)  // Away goal (X+)
		createArea(-1) // Home goal (X-)
	}

	updatePlayers(players: Player[], config: any) {
		// Debug: Log player count once
		if (!this._playerCountLogged) {
			console.log('[ThreeMatchScene] ========== PLAYER DEBUG ==========')
			console.log(`[ThreeMatchScene] updatePlayers called with ${players.length} players`)
			console.log(`[ThreeMatchScene] modelCount in factory: ${this.playerModelFactory.modelCount}`)
			this._playerCountLogged = true
		}

		this.playerConfig = { ...this.playerConfig, ...config }

		// Normalize modelType: 'mixamo' is treated as 'animated'
		const normalizedModelType: PlayerModelType | undefined =
			config.modelType === 'mixamo' ? 'animated' :
				config.modelType === 'primitive' ? 'primitive' :
					undefined

		// Check if model type changed - need to rebuild all players
		const modelTypeChanged = normalizedModelType !== undefined &&
			this.playerModelFactory.modelCount > 0 &&
			this.getFirstPlayerModelType() !== normalizedModelType

		// Filter players who are in the active formation slots
		const activePlayers = players.filter(p => {
			return p.team.tactics.formation.slotPlayers.some(slot => slot.player === p)
		})
		const currentIds = new Set(activePlayers.map(p => p.id))

		// Collect IDs to remove first (avoid mutating iterator during iteration)
		const idsToRemove: number[] = []
		for (const model of this.playerModelFactory.getAllModels()) {
			const playerId = model.getPlayerId()
			if (!currentIds.has(playerId) || modelTypeChanged) {
				idsToRemove.push(playerId)
			}
		}

		// Now remove the collected models
		for (const playerId of idsToRemove) {
			this.playerModelFactory.removeModel(playerId)
		}

		// Debug: Track created models
		let createdCount = 0
		let updatedCount = 0
		let noBodyCount = 0

		// Update or create players
		activePlayers.forEach((player, index) => {
			// Get team color directly from player's team
			const color = player.team.color

			// Determine home/away side for group assignment
			const isHomeSide = player.team.state.defendingSide === DefendingSide.LEFT
			const targetGroup = isHomeSide ? this.homeGroup : this.awayGroup

			// Check if player model exists
			let model = this.playerModelFactory.getModel(player.id)

			if (!model) {
				// Create new model using factory
				// Note: 'mixamo' is treated as animated (not primitive)
				const forcePrimitive = this.playerConfig.modelType === 'primitive'
				model = this.playerModelFactory.createPlayerModel({
					playerId: player.id,
					teamColor: color,
					isGoalkeeper: player.slot?.code === 'GK',
					forcePrimitive,
					kit: {
						shirtColor: color,
						shortsColor: color,
						socksColor: color,
					},
				})

				// Add to scene
				const group = model.getObject3D()
				targetGroup.add(group)

				// Set initial animation
				model.setAnimation('breathing-idle')

				createdCount++

				// Debug: Log first few created players
				if (createdCount <= 3) {
					console.log(`[ThreeMatchScene] Created player ${player.id} (${player.name}), team ${player.team.id}, isHome: ${isHomeSide}`)
				}
			} else {
				updatedCount++
			}

			// Ensure correct parent group
			const group = model.getObject3D()
			if (group.parent !== targetGroup) {
				targetGroup.add(group)
			}

			// Get player body for position and orientation
			if (!player.body) {
				noBodyCount++
				return
			}

			const body = player.body

			// Update position and rotation using BodyState sync
			const threePos = CoordinateTransforms.worldToThree(body.position, 0)
			const angle = Math.atan2(body.bodyDir.y, body.bodyDir.x)

			model.syncFromBody({
				position: threePos,
				bodyDirection: -angle, // Negate for Three.js Y-axis rotation
			})
		})
	}

	/**
	 * Get the model type of the first player.
	 * Used to detect model type changes.
	 */
	private getFirstPlayerModelType(): PlayerModelType {
		const firstModel = this.playerModelFactory.getAllModels().next().value as PlayerModelBase | undefined
		if (firstModel) {
			return firstModel.isPlaceholder() ? 'primitive' : 'animated'
		}
		return 'primitive'
	}

	/**
	 * Update all player model animations.
	 * Call this from the animation loop with delta time.
	 *
	 * @param delta - Time elapsed since last frame (in seconds)
	 */
	updateAnimations(delta: number): void {
		// Check for pending model upgrades (for players created before assets were ready)
		this.playerModelFactory.processPendingUpgrades()

		// Update animation mixers
		for (const model of this.playerModelFactory.getAllModels()) {
			model.update(delta)
		}
	}

	/**
	 * Set animation for a specific player.
	 *
	 * @param playerId - Player ID
	 * @param animationName - Animation to play
	 */
	setPlayerAnimation(playerId: number, animationName: PlayerAnimationName): void {
		const model = this.playerModelFactory.getModel(playerId)
		if (model) {
			model.setAnimation(animationName)
		}
	}

	/**
	 * Crossfade a player to a new animation.
	 *
	 * @param playerId - Player ID
	 * @param animationName - Animation to transition to
	 * @param duration - Crossfade duration in seconds
	 */
	crossFadePlayerAnimation(playerId: number, animationName: PlayerAnimationName, duration: number = 0.25): void {
		const model = this.playerModelFactory.getModel(playerId)
		if (model) {
			model.crossFadeTo(animationName, duration)
		}
	}

	/**
	 * Get all player Object3D instances for raycasting.
	 * Use this instead of the deprecated playerMeshes map.
	 *
	 * @returns Array of Object3D instances representing players
	 */
	getPlayerObjects(): THREE.Object3D[] {
		const objects: THREE.Object3D[] = []
		for (const model of this.playerModelFactory.getAllModels()) {
			objects.push(model.getObject3D())
		}
		return objects
	}

	updateBall(ball: Ball) {
		if (!ball) return
		this.ballMesh.position.copy(ball.position3d)
	}

	setConesVisible(visible: boolean) {
		this.conesVisible = visible
		// Note: Cones are only used with primitive player models
		// The factory handles visibility internally
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                  L I G H T I N G   M E T H O D S
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Calculate spotlight corner positions and targets.
	 * Positions are based on actual field dimensions (rectangular, not square).
	 * Spotlights sit at the corners of the field plus an offset for the stadium.
	 *
	 * @returns Array of corner configurations
	 */
	private getSpotlightCorners(): Array<{ x: number; z: number; tx: number; tz: number }> {
		const config = this.lightingConfig.spotlights
		const stadiumOffset = config.distance // Offset beyond field edge for stadium position
		const targetOffset = config.targetOffset

		// Use actual field dimensions (rectangular: ~105m x ~68m)
		// X = goal-to-goal (LENGTH), Z = touchline-to-touchline (WIDTH)
		const xDist = this.field.LENGTH_HALF + stadiumOffset  // ~52.6m + offset
		const zDist = this.field.WIDTH_HALF + stadiumOffset   // ~33.8m + offset

		// Corner positions: NE, NW, SE, SW
		// Each spotlight points toward the OPPOSITE side (crosses the field)
		return [
			{ x: xDist, z: zDist, tx: -targetOffset, tz: -targetOffset },    // NE corner, targets SW
			{ x: -xDist, z: zDist, tx: targetOffset, tz: -targetOffset },    // NW corner, targets SE
			{ x: xDist, z: -zDist, tx: -targetOffset, tz: targetOffset },    // SE corner, targets NW
			{ x: -xDist, z: -zDist, tx: targetOffset, tz: targetOffset },    // SW corner, targets NE
		]
	}

	/**
	 * Initialize the lighting system.
	 * Creates light objects with default values, then applies configuration.
	 */
	private initLighting(): void {
		// Create ambient light
		this.ambientLight = new THREE.AmbientLight(0xffffff, 0)
		this.scene.add(this.ambientLight)

		// Create hemisphere light
		this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0)
		this.hemisphereLight.position.set(0, 200, 0)
		this.scene.add(this.hemisphereLight)

		// Create directional light (sun)
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 0)
		this.directionalLight.shadow.camera.top = 180
		this.directionalLight.shadow.camera.bottom = -100
		this.directionalLight.shadow.camera.left = -120
		this.directionalLight.shadow.camera.right = 120
		this.scene.add(this.directionalLight)

		// Create stadium spotlights (4 corners)
		this.createSpotlights()

		// Apply initial configuration to all lights
		this.applyLightingConfig()
	}

	/**
	 * Create the four stadium spotlight objects.
	 * Does not set properties - those are applied via applyLightingConfig().
	 */
	private createSpotlights(): void {
		for (let i = 0; i < 4; i++) {
			// Create target for spotlight aiming
			const target = new THREE.Object3D()
			this.scene.add(target)
			this.spotlightTargets.push(target)

			// Create spotlight with default values
			const spotlight = new THREE.SpotLight(0xffffff, 0)
			spotlight.target = target
			spotlight.shadow.camera.near = 10
			spotlight.shadow.camera.far = 200

			this.scene.add(spotlight)
			this.spotlights.push(spotlight)
		}
	}

	/**
	 * Get the current lighting configuration.
	 *
	 * @returns Copy of the current lighting configuration
	 */
	getLightingConfig(): LightingConfig {
		return cloneLightingConfig(this.lightingConfig)
	}

	/**
	 * Apply a new lighting configuration.
	 *
	 * @param config - New lighting configuration to apply
	 */
	setLightingConfig(config: LightingConfig): void {
		this.lightingConfig = cloneLightingConfig(config)
		this.applyLightingConfig()
	}

	/**
	 * Apply the current lighting configuration to all lights.
	 * This is the single source of truth for light properties.
	 */
	private applyLightingConfig(): void {
		const config = this.lightingConfig

		// Update sky/background only if no skybox texture is set
		if (!this.skyboxTexture) {
			this.scene.background = new THREE.Color(config.sky.color)
		}

		// Update ambient light
		if (this.ambientLight) {
			this.ambientLight.color.setHex(config.ambient.color)
			this.ambientLight.intensity = config.ambient.enabled ? config.ambient.intensity : 0
		}

		// Update hemisphere light
		if (this.hemisphereLight) {
			this.hemisphereLight.color.setHex(config.hemisphere.skyColor)
			this.hemisphereLight.groundColor.setHex(config.hemisphere.groundColor)
			this.hemisphereLight.intensity = config.hemisphere.enabled ? config.hemisphere.intensity : 0
		}

		// Update directional light
		if (this.directionalLight) {
			this.directionalLight.color.setHex(config.directional.color)
			this.directionalLight.intensity = config.directional.enabled ? config.directional.intensity : 0
			this.directionalLight.position.set(
				config.directional.positionX,
				config.directional.positionY,
				config.directional.positionZ,
			)
			this.directionalLight.castShadow = config.directional.castShadow && config.directional.enabled

			// Apply shadow quality
			const shadowSize = SHADOW_MAP_SIZES[this.shadowQuality]
			if (this.directionalLight.shadow.mapSize.width !== shadowSize) {
				if (this.directionalLight.shadow.map) {
					this.directionalLight.shadow.map.dispose()
					this.directionalLight.shadow.map = null as unknown as THREE.WebGLRenderTarget
				}
				this.directionalLight.shadow.mapSize.width = shadowSize
				this.directionalLight.shadow.mapSize.height = shadowSize
			}
		}

		// Update spotlights
		this.applySpotlightConfig()
	}

	/**
	 * Apply spotlight configuration to all spotlight objects.
	 */
	private applySpotlightConfig(): void {
		const config = this.lightingConfig.spotlights
		const corners = this.getSpotlightCorners()
		const height = config.height
		const spotlightShadowSize = SHADOW_MAP_SIZES[config.shadowQuality]

		for (let i = 0; i < this.spotlights.length; i++) {
			const spotlight = this.spotlights[i]
			const target = this.spotlightTargets[i]
			const corner = corners[i]

			// Update spotlight properties
			spotlight.color.setHex(config.color)
			spotlight.intensity = config.enabled ? config.intensity : 0
			spotlight.angle = config.angle
			spotlight.penumbra = config.penumbra
			spotlight.decay = config.decay
			spotlight.position.set(corner.x, height, corner.z)
			spotlight.castShadow = config.castShadow && config.enabled

			// Update target position
			if (target) {
				target.position.set(corner.tx, 0, corner.tz)
			}

			// Apply shadow quality
			if (spotlight.shadow.mapSize.width !== spotlightShadowSize) {
				if (spotlight.shadow.map) {
					spotlight.shadow.map.dispose()
					spotlight.shadow.map = null as unknown as THREE.WebGLRenderTarget
				}
				spotlight.shadow.mapSize.width = spotlightShadowSize
				spotlight.shadow.mapSize.height = spotlightShadowSize
			}
		}
	}

	/**
	 * Set the shadow quality level.
	 *
	 * @param quality - Shadow quality level ('low', 'medium', 'high', 'ultra')
	 */
	setShadowQuality(quality: ShadowQuality): void {
		if (this.shadowQuality === quality) return
		this.shadowQuality = quality
		// Re-apply config to update shadow maps
		this.applyLightingConfig()
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                  F O R M A T I O N   A A B B   V I S U A L I Z A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Update AABB visualization for both teams.
	 *
	 * @param homeTeam - Home team object with tactics.formationAABB
	 * @param awayTeam - Away team object with tactics.formationAABB
	 * @param config - Debug visualization config { show, homeColor, awayColor, opacity }
	 */
	updateFormationAABBs(
		homeTeam: { tactics: { formationAABB: import('./FormationAABB').FormationAABB }, color: number },
		awayTeam: { tactics: { formationAABB: import('./FormationAABB').FormationAABB }, color: number },
		config: { show: boolean, homeColor: number | null, awayColor: number | null, opacity: number },
	): void {
		// Remove existing lines if not showing
		if (!config.show) {
			if (this.homeAABBLine) {
				this.scene.remove(this.homeAABBLine)
				this.homeAABBLine.geometry.dispose()
				;(this.homeAABBLine.material as THREE.Material).dispose()
				this.homeAABBLine = null
			}
			if (this.awayAABBLine) {
				this.scene.remove(this.awayAABBLine)
				this.awayAABBLine.geometry.dispose()
				;(this.awayAABBLine.material as THREE.Material).dispose()
				this.awayAABBLine = null
			}
			return
		}

		// Update or create home AABB line
		const homeColor = config.homeColor ?? homeTeam.color
		this.homeAABBLine = this.updateAABBLine(
			this.homeAABBLine,
			homeTeam.tactics.formationAABB,
			homeColor,
			config.opacity,
		)

		// Update or create away AABB line
		const awayColor = config.awayColor ?? awayTeam.color
		this.awayAABBLine = this.updateAABBLine(
			this.awayAABBLine,
			awayTeam.tactics.formationAABB,
			awayColor,
			config.opacity,
		)
	}

	/**
	 * Update or create a single AABB line visualization.
	 *
	 * @param existingLine - Existing line to update, or null to create new
	 * @param aabb - FormationAABB to visualize
	 * @param color - Line color (hex)
	 * @param opacity - Line opacity (0-1)
	 * @returns Updated or new line
	 */
	private updateAABBLine(
		existingLine: THREE.Line | null,
		aabb: import('./FormationAABB').FormationAABB,
		color: number,
		opacity: number,
	): THREE.Line {
		// Get corners from AABB (world 2D coordinates)
		const corners = aabb.getCorners()

		// Convert to Three.js coordinates (close the loop with 5 points)
		const points: THREE.Vector3[] = []
		for (const corner of corners) {
			// World 2D: x = goal-to-goal, y = touchline
			// Three.js: X = goal-to-goal, Y = height (0.1 to float above ground), Z = touchline
			points.push(new THREE.Vector3(corner.x, 0.15, corner.y))
		}
		// Close the loop
		points.push(points[0].clone())

		if (existingLine) {
			// Update existing geometry
			const positions = existingLine.geometry.attributes.position as THREE.BufferAttribute
			for (let i = 0; i < points.length; i++) {
				positions.setXYZ(i, points[i].x, points[i].y, points[i].z)
			}
			positions.needsUpdate = true

			// Update material color/opacity
			const mat = existingLine.material as THREE.LineBasicMaterial
			mat.color.setHex(color)
			mat.opacity = opacity

			return existingLine
		} else {
			// Create new line
			const geometry = new THREE.BufferGeometry().setFromPoints(points)
			const material = new THREE.LineBasicMaterial({
				color,
				opacity,
				transparent: opacity < 1,
				linewidth: 2, // Note: may not work on all platforms
				depthTest: true,
				depthWrite: false,
			})
			const line = new THREE.Line(geometry, material)
			line.renderOrder = 100 // Render on top
			this.scene.add(line)
			return line
		}
	}

	/**
	 * Dispose of all resources.
	 */
	dispose(): void {
		this.playerModelFactory.dispose()

		// Dispose AABB lines
		if (this.homeAABBLine) {
			this.scene.remove(this.homeAABBLine)
			this.homeAABBLine.geometry.dispose()
			;(this.homeAABBLine.material as THREE.Material).dispose()
			this.homeAABBLine = null
		}
		if (this.awayAABBLine) {
			this.scene.remove(this.awayAABBLine)
			this.awayAABBLine.geometry.dispose()
			;(this.awayAABBLine.material as THREE.Material).dispose()
			this.awayAABBLine = null
		}

		// Dispose lighting
		if (this.ambientLight) {
			this.scene.remove(this.ambientLight)
			this.ambientLight = null
		}
		if (this.hemisphereLight) {
			this.scene.remove(this.hemisphereLight)
			this.hemisphereLight = null
		}
		if (this.directionalLight) {
			this.scene.remove(this.directionalLight)
			this.directionalLight = null
		}
		for (const spotlight of this.spotlights) {
			this.scene.remove(spotlight)
		}
		this.spotlights = []
		for (const target of this.spotlightTargets) {
			this.scene.remove(target)
		}
		this.spotlightTargets = []
	}
}
