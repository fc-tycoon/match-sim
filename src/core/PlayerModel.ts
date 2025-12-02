/**
 * FC Tycoon™ 2027 Match Simulator - Player Model
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'
import { CoordinateTransforms } from './CoordinateTransforms'
import { Player } from './Player'
import type { Field } from './Field'

/**
 * Player visual model constants and 3D mesh creation.
 */
export class PlayerModel {
	// ═══════════════════════════════════════════════════════════════════════════
	//                    V I S U A L   C O N S T A N T S
	// ═══════════════════════════════════════════════════════════════════════════

	/** Default player height in meters */
	static readonly PLAYER_HEIGHT = 1.8

	/** Player collision/interaction radius in meters */
	static readonly PLAYER_RADIUS = 0.3

	/** Head radius in meters */
	static readonly HEAD_RADIUS = 0.12

	/** Neck radius in meters */
	static readonly NECK_RADIUS = 0.06

	/** Neck height in meters */
	static readonly NECK_HEIGHT = 0.08

	/** Default skin color (light) */
	static readonly COLOR_SKIN_BASE = 0xffdbac

	/** Dark skin color option */
	static readonly COLOR_SKIN_DARK = 0x8d5524

	/** Eye color (white) */
	static readonly COLOR_EYE = 0xffffff

	/**
	 * Create a 3D mesh group for a player.
	 *
	 * @param player - The player data
	 * @param config - Visual configuration (scale, headColor, skinDarkness)
	 * @param color - Team color for the jersey
	 * @param field - Field object for visual constants (COLOR_CONE)
	 * @returns THREE.Group containing the player mesh
	 */
	static create(player: Player, config: any, color: number, field: Field): THREE.Group {
		const group = new THREE.Group()
		group.userData.playerId = player.id

		// Body Dimensions
		// Leave room for neck at the top
		const torsoHeight = PlayerModel.PLAYER_HEIGHT * 0.7 - PlayerModel.NECK_HEIGHT
		const bodyRadius = 0.25
		const radialSegments = 12

		// Body Mesh (torso)
		const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius, torsoHeight, radialSegments)
		const bodyMat = new THREE.MeshStandardMaterial({
			color,
			roughness: 0.7,
			metalness: 0.1,
		})
		const body = new THREE.Mesh(bodyGeo, bodyMat)
		// Position body so its bottom is at 0
		// Cylinder center is at (0,0,0).
		// We want feet at 0. So center at torsoHeight/2.
		body.position.y = torsoHeight / 2
		body.name = 'body'
		body.castShadow = true
		body.receiveShadow = true
		group.add(body)

		// Shoulders & Arms
		// Relative to Body Center (which is at torsoHeight/2)
		// Top of body is at y = +torsoHeight/2 (local)
		const shoulderRadius = 0.08
		const armLength = torsoHeight * 0.6
		const armRadius = 0.08

		const createArm = (side: number) => {
			const armGroup = new THREE.Group()

			// Shoulder Sphere
			// Position at top of body, offset to side
			const shoulderGeo = new THREE.SphereGeometry(shoulderRadius, 8, 8)
			const shoulder = new THREE.Mesh(shoulderGeo, bodyMat)
			shoulder.name = 'shoulder'
			shoulder.castShadow = true
			shoulder.receiveShadow = true
			armGroup.add(shoulder)

			// Arm Cylinder
			// Hanging down from shoulder
			const armGeo = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 8)
			const arm = new THREE.Mesh(armGeo, bodyMat)
			// Center of arm cylinder is at (0, -armLength/2, 0) relative to shoulder
			arm.position.y = -armLength / 2
			arm.name = 'arm'
			arm.castShadow = true
			arm.receiveShadow = true
			armGroup.add(arm)

			// Position the whole arm group relative to the body center
			// Y: Top of body (torsoHeight/2) - shoulderRadius/2
			// Z: Side * (bodyRadius + shoulderRadius/2) -> Shoulders on Z axis (Left/Right relative to X+ facing)
			armGroup.position.y = torsoHeight / 2 - shoulderRadius
			armGroup.position.z = side * (bodyRadius + 0.05)
			armGroup.position.x = 0

			return armGroup
		}

		const leftArm = createArm(-1) // Left is Z- (North) if facing X+ (East)?
		// If facing X+ (East), Left is Z- (North). Right is Z+ (South).
		// side -1 -> Z-. Correct.
		const rightArm = createArm(1)
		body.add(leftArm)
		body.add(rightArm)

		// Skin Tone Calculation (used for neck and head)
		const baseColor = new THREE.Color(PlayerModel.COLOR_SKIN_BASE)
		const darkColor = new THREE.Color(PlayerModel.COLOR_SKIN_DARK)

		// Deterministic random based on player ID
		const seed = (player.id * 9301 + 49297) % 233280
		const randomFactor = seed / 233280 // 0..1

		// Global darkness setting (0..1)
		const darkness = config.skinDarkness !== undefined ? config.skinDarkness : 0

		// Calculate mix factor
		// We want some variation even at 0 darkness? Maybe not.
		// User said "randomize the skin complexion".
		// Let's say at darkness 0, we have 0..0.1 variation.
		// At darkness 1, we have 0.6..1.0 variation.
		const t = Math.min(1, darkness * (0.7 + randomFactor * 0.6) + randomFactor * 0.1)
		const skinColor = baseColor.clone().lerp(darkColor, t)

		const skinMat = new THREE.MeshStandardMaterial({
			color: skinColor,
			roughness: 0.6,
			metalness: 0.0,
		})

		// Neck - connects body to head
		const neckGeo = new THREE.CylinderGeometry(
			PlayerModel.NECK_RADIUS,
			PlayerModel.NECK_RADIUS,
			PlayerModel.NECK_HEIGHT,
			8,
		)
		const neck = new THREE.Mesh(neckGeo, skinMat)
		// Neck sits on top of torso
		neck.position.y = torsoHeight + PlayerModel.NECK_HEIGHT / 2
		neck.name = 'neck'
		neck.castShadow = true
		neck.receiveShadow = true
		group.add(neck)

		// Head
		const headGeo = new THREE.SphereGeometry(PlayerModel.HEAD_RADIUS, 16, 16)
		const head = new THREE.Mesh(headGeo, skinMat)
		// Head sits on top of neck - slight overlap to eliminate visual gap
		head.position.y = torsoHeight + PlayerModel.NECK_HEIGHT + PlayerModel.HEAD_RADIUS * 0.85
		head.name = 'head'
		head.castShadow = true
		head.receiveShadow = true
		group.add(head)

		// Eyes
		// Direction: We assume 0 rotation = Facing X+ (Right)
		// So eyes should be at X+ relative to head center
		const eyeGeo = new THREE.SphereGeometry(0.03, 8, 8)
		const eyeMat = new THREE.MeshBasicMaterial({ color: PlayerModel.COLOR_EYE })
		const pupilGeo = new THREE.SphereGeometry(0.015, 8, 8)
		const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 })

		// Eyes at front (X+)
		const eyeX = PlayerModel.HEAD_RADIUS * 0.9
		const eyeY = 0.02
		const eyeZ = 0.05 // Spaced apart in Z

		const createEye = (zOffset: number) => {
			const eyeGroup = new THREE.Group()

			// White part
			const eye = new THREE.Mesh(eyeGeo, eyeMat)
			eyeGroup.add(eye)

			// Pupil (slightly forward in X)
			const pupil = new THREE.Mesh(pupilGeo, pupilMat)
			pupil.position.x = 0.025 // Push forward
			eyeGroup.add(pupil)

			eyeGroup.position.set(eyeX, eyeY, zOffset)
			return eyeGroup
		}

		head.add(createEye(-eyeZ)) // Left eye
		head.add(createEye(eyeZ))  // Right eye

		// Vision Cone
		// Facing X+
		const coneLen = 15
		const fov = Math.PI / 3 // 60 degrees

		const coneMat = new THREE.MeshBasicMaterial({
			color: field.COLOR_CONE,
			transparent: true,
			opacity: 0.1,
			side: THREE.DoubleSide,
			depthWrite: false,
		})

		// CircleGeometry starts at X+ (0 radians)
		// We want it centered on X+, spanning -fov/2 to +fov/2
		const wedgeGeo = new THREE.CircleGeometry(coneLen, 32, -fov / 2, fov)
		const wedge = new THREE.Mesh(wedgeGeo, coneMat)

		// Circle is in XY plane. We want it in XZ plane.
		// Rotate -90 around X.
		// Wait, if we rotate -90 X:
		// Original X+ (1,0,0) -> (1,0,0)
		// Original Y+ (0,1,0) -> (0,0,-1) (Z-)
		// So the wedge will be in XZ plane.
		// The arc is from -fov/2 to fov/2 around Z axis (originally).
		// After rotation, it's around Y axis?
		// Let's visualize: CircleGeometry(radius, segments, thetaStart, thetaLength)
		// Vertices are generated in XY plane.
		// Vertex at angle 0 is at (R, 0, 0).
		// Vertex at angle 90 is at (0, R, 0).
		// If we rotate X -90:
		// (R, 0, 0) -> (R, 0, 0)
		// (0, R, 0) -> (0, 0, -R)
		// So 0 degrees is X+. 90 degrees is Z-.
		// This matches standard math (Angle 0 is East/Right).
		// So if we want to face X+, we center around 0.

		wedge.rotation.x = -Math.PI / 2
		wedge.position.y = 0.1 // Just above ground
		wedge.name = 'cone'

		// Add cone to group (not body, so it doesn't tilt with body if body tilts)
		group.add(wedge)

		// Initial Rotation
		// Default to facing Forward (-Z) in Team Space
		// Forward (-Z) corresponds to +PI/2 rotation (since 0 is X+)
		group.rotation.y = Math.PI / 2

		return group
	}

	/**
	 * Update the player model's visual state (rotation, colors, scale).
	 *
	 * The model is a TRUE representation of the PlayerBody state.
	 * Rotation is determined ONLY by bodyDir vector - no fallbacks.
	 *
	 * @param {THREE.Group} group - The Three.js group containing the player model
	 * @param {object} player - Player state including bodyDir
	 * @param {THREE.Vector2} player.bodyDir - Body facing direction as unit vector
	 * @param {object} config - Rendering configuration
	 * @param {boolean} conesVisible - Whether vision cones should be visible
	 * @param {number} color - Team color (hex)
	 */
	static update(group: THREE.Group, player: any, config: any, conesVisible: boolean, color: number) {
		// Update Rotation from bodyDir vector using centralized transform
		if (player.bodyDir) {
			group.rotation.y = CoordinateTransforms.worldDirToThreeYaw(player.bodyDir)
		}

		// Update Colors
		const body = group.getObjectByName('body') as THREE.Mesh
		if (body) {
			;(body.material as THREE.MeshStandardMaterial).color.setHex(color)

			// Update arms/shoulders
			body.traverse((child) => {
				if (child instanceof THREE.Mesh && (child.name === 'arm' || child.name === 'shoulder')) {
					(child.material as THREE.MeshStandardMaterial).color.setHex(color)
				}
			})
		}

		const head = group.getObjectByName('head') as THREE.Mesh
		if (head) {
			(head.material as THREE.MeshStandardMaterial).color.setHex(config.headColor)
		}

		// Update Scale
		// We want to scale the player body/head, BUT NOT the cone.
		// The cone is a child of the group.
		// If we scale the group, the cone scales.
		// So we should scale the body and head independently?
		// Or scale the group and inverse-scale the cone.

		const scale = config.scale || 1.0
		group.scale.set(scale, scale, scale)

		const cone = group.getObjectByName('cone')
		if (cone) {
			cone.visible = conesVisible
			// Inverse scale to keep cone constant size in world
			cone.scale.set(1 / scale, 1 / scale, 1 / scale)
		}
	}
}
