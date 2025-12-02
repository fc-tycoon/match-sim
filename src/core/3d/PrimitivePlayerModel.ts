/**
 * FC Tycoon™ 2027 Match Simulator - Primitive Player Model
 *
 * Simple capsule-based fallback player model.
 * Used while GLB assets are loading or as permanent fallback.
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 */

import * as THREE from 'three'
import { PlayerModelBase, PlayerAnimationName, PlayerModelConfig } from './PlayerModelBase'
import { Primitives } from './Primitives'

// ═══════════════════════════════════════════════════════════════════════════
//               P R I M I T I V E   P L A Y E R   M O D E L
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Primitive capsule-based player model.
 *
 * Provides a simple fallback representation when:
 * - GLB model is still loading
 * - GLB model failed to load
 * - User prefers primitive mode for performance
 *
 * Animations are no-ops (primitive just holds position).
 * Customization is limited to color changes.
 */
export class PrimitivePlayerModel extends PlayerModelBase {
	// ═══════════════════════════════════════════════════════════════════════
	//                        P R O P E R T I E S
	// ═══════════════════════════════════════════════════════════════════════

	/** Main capsule group containing the mesh */
	private capsuleGroup: THREE.Group

	/** The actual capsule mesh (child of capsuleGroup) */
	private capsuleMesh: THREE.Mesh | null = null

	/** Head indicator sphere */
	private headMesh: THREE.Mesh

	/** Material for the capsule body */
	private bodyMaterial: THREE.MeshStandardMaterial

	/** Material for the head */
	private headMaterial: THREE.MeshStandardMaterial

	// ═══════════════════════════════════════════════════════════════════════
	//                      C O N S T R U C T O R
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Create a primitive capsule player model.
	 *
	 * @param config - Player configuration
	 */
	constructor(config: PlayerModelConfig) {
		super(config)

		// Create body material with team color
		this.bodyMaterial = new THREE.MeshStandardMaterial({
			color: config.teamColor,
			roughness: 0.7,
			metalness: 0.1,
		})

		// Create head material (slightly lighter than body)
		const bodyColor = new THREE.Color(config.teamColor)
		const headColor = bodyColor.clone().lerp(new THREE.Color(0xffffff), 0.3)
		this.headMaterial = new THREE.MeshStandardMaterial({
			color: headColor,
			roughness: 0.5,
			metalness: 0.1,
		})

		// Create capsule body group
		this.capsuleGroup = Primitives.createPlayerPlaceholder(config.teamColor)
		this.object3D.add(this.capsuleGroup)

		// Find and customize the mesh inside the group
		this.capsuleGroup.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				this.capsuleMesh = child
				child.material = this.bodyMaterial
			}
		})

		// Create head sphere on top
		const headGeometry = new THREE.SphereGeometry(0.15, 16, 12)
		this.headMesh = new THREE.Mesh(headGeometry, this.headMaterial)
		this.headMesh.position.y = 1.75 // Top of capsule + offset
		this.headMesh.castShadow = true
		this.object3D.add(this.headMesh)

		// Add facing indicator (small cone pointing forward)
		const indicatorGeometry = new THREE.ConeGeometry(0.05, 0.15, 8)
		const indicatorMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			emissive: 0xffffff,
			emissiveIntensity: 0.3,
		})
		const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
		indicator.rotation.x = -Math.PI / 2 // Point forward
		indicator.position.set(0.2, 1.75, 0) // In front of head
		this.headMesh.add(indicator)

		// Mark as primitive in userData
		this.object3D.userData.isPrimitive = true

		Object.seal(this)
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                       A C C E S S O R S
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 */
	isPlaceholder(): boolean {
		return true
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                      A N I M A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 * Animation is no-op for primitives.
	 */
	setAnimation(name: PlayerAnimationName, _options?: { loop?: boolean; timeScale?: number }): void {
		this._currentAnimation = name
		// Primitives don't animate, just track the state
	}

	/**
	 * @override
	 * @inheritdoc
	 * Crossfade is no-op for primitives.
	 */
	crossFadeTo(
		name: PlayerAnimationName,
		_duration: number,
		_options?: { loop?: boolean; timeScale?: number },
	): void {
		this._currentAnimation = name
		// Primitives don't animate
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	stopAnimation(): void {
		this._currentAnimation = null
	}

	/**
	 * @override
	 * @inheritdoc
	 * Update is no-op for primitives (no animation mixer).
	 */
	update(_deltaTime: number): void {
		// Primitives have no animation to update
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                   H E A D / E Y E   C O N T R O L
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 * Rotate head mesh to simulate looking direction.
	 */
	setHeadDirection(yaw: number, pitch: number): void {
		this.headMesh.rotation.y = yaw
		this.headMesh.rotation.x = pitch
	}

	/**
	 * @override
	 * @inheritdoc
	 * No eyes on primitive model.
	 */
	setEyeDirection(_yaw: number, _pitch: number): void {
		// Primitives don't have eye bones
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                   C U S T O M I Z A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 * Adjust head color for skin tone.
	 */
	setSkinTone(tone: number): void {
		// Interpolate between light skin and dark skin colors
		const lightSkin = new THREE.Color(0xffe0bd)
		const darkSkin = new THREE.Color(0x8d5524)
		this.headMaterial.color.copy(lightSkin).lerp(darkSkin, tone)
	}

	/**
	 * @override
	 * @inheritdoc
	 * No hair on primitive model.
	 */
	setHairStyle(_styleKey: string): void {
		// Primitives don't have hair
	}

	/**
	 * @override
	 * @inheritdoc
	 * Set body color from kit.
	 */
	setKitColors(kit: { shirtColor?: number; shortsColor?: number; socksColor?: number }): void {
		if (kit.shirtColor !== undefined) {
			this.bodyMaterial.color.setHex(kit.shirtColor)
		}
	}

	/**
	 * @override
	 * @inheritdoc
	 * No name display on primitive.
	 */
	setPlayerName(_name: string): void {
		// Primitives don't display names
	}

	/**
	 * @override
	 * @inheritdoc
	 * No number display on primitive.
	 */
	setPlayerNumber(_number: number): void {
		// Primitives don't display numbers
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                      L I F E C Y C L E
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 * This is already a primitive, so nothing to upgrade to.
	 * Use PlayerModelFactory.upgradeToAnimated() instead.
	 */
	upgradeFromPlaceholder(_modelGroup: THREE.Group): void {
		console.warn('PrimitivePlayerModel.upgradeFromPlaceholder: Already a primitive, use factory upgrade')
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	dispose(): void {
		if (this.disposed) {
			return
		}

		// Dispose materials
		this.bodyMaterial.dispose()
		this.headMaterial.dispose()

		// Dispose geometries
		if (this.capsuleMesh) {
			this.capsuleMesh.geometry.dispose()
		}
		this.headMesh.geometry.dispose()

		// Call parent dispose
		super.dispose()
	}
}
