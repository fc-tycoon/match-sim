/**
 * FC Tycoon™ 2027 Match Simulator - Animated Player Model
 *
 * Full GLB-based player model with skeletal animation.
 * Supports bone manipulation for head/eye tracking.
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 */

import * as THREE from 'three'
import { PlayerModelBase, PlayerAnimationName, PlayerModelConfig } from './PlayerModelBase'
import { assets, type AssetMetadata } from '@/store/assets'

// ═══════════════════════════════════════════════════════════════════════════
//                              T Y P E S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Bone references for manipulation.
 */
interface BoneReferences {
	head: THREE.Bone | null
	leftEye: THREE.Bone | null
	rightEye: THREE.Bone | null
	hips: THREE.Bone | null
}

/**
 * Initial bone rotations (to restore to).
 */
interface BoneRestPose {
	head: THREE.Euler | null
	leftEye: THREE.Euler | null
	rightEye: THREE.Euler | null
}

// ═══════════════════════════════════════════════════════════════════════════
//                A N I M A T E D   P L A Y E R   M O D E L
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Animated GLB-based player model.
 *
 * Provides:
 * - Full skeletal animation via AnimationMixer
 * - Bone manipulation for head/eye direction
 * - Kit customization via material modification
 * - Smooth animation crossfades
 */
export class AnimatedPlayerModel extends PlayerModelBase {
	// ═══════════════════════════════════════════════════════════════════════
	//                        P R O P E R T I E S
	// ═══════════════════════════════════════════════════════════════════════

	/** The loaded GLB model */
	private modelGroup: THREE.Group | null = null

	/** Animation mixer */
	private mixer: THREE.AnimationMixer | null = null

	/** Loaded animation clips keyed by name */
	private animationClips: Map<PlayerAnimationName, THREE.AnimationClip> = new Map()

	/** Currently playing animation actions */
	private animationActions: Map<PlayerAnimationName, THREE.AnimationAction> = new Map()

	/** Active animation action */
	private activeAction: THREE.AnimationAction | null = null

	/** Bone references for manipulation */
	private bones: BoneReferences = {
		head: null,
		leftEye: null,
		rightEye: null,
		hips: null,
	}

	/** Original bone rotations */
	private boneRestPose: BoneRestPose = {
		head: null,
		leftEye: null,
		rightEye: null,
	}

	/** Asset key used to load this model */
	private assetKey: string

	/** Asset metadata (bone names, etc.) */
	private metadata: AssetMetadata | null = null

	/** Materials that can be customized (shirt, shorts, etc.) */
	private kitMaterials: {
		shirt: THREE.Material | null
		shorts: THREE.Material | null
		socks: THREE.Material | null
	} = {
			shirt: null,
			shorts: null,
			socks: null,
		}

	/** Cached skin materials for quick tint updates */
	private skinMaterials: THREE.MeshStandardMaterial[] = []

	/** Cached hair materials for transparency/roughness fixes */
	private hairMaterials: THREE.MeshStandardMaterial[] = []

	/** Cached eyelash materials (need alpha transparency) */
	private eyelashMaterials: THREE.MeshStandardMaterial[] = []

	/** Whether we already normalized material settings */
	private materialStandardsApplied = false

	/** Default tone applied when config doesn’t specify one */
	private static readonly DEFAULT_SKIN_TONE = 0.25

	// ═══════════════════════════════════════════════════════════════════════
	//                      C O N S T R U C T O R
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Create an animated player model.
	 *
	 * @param config - Player configuration
	 * @param assetKey - Asset registry key for the model (e.g., 'player-base', 'player-goalkeeper')
	 */
	constructor(config: PlayerModelConfig, assetKey: string = 'player-base') {
		super(config)
		this.assetKey = assetKey

		// Get metadata from registry (convert undefined to null)
		this.metadata = assets.getMetadata(assetKey) ?? null

		Object.seal(this)
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                   I N I T I A L I Z A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * Initialize the model with a loaded GLB.
	 *
	 * @param modelGroup - The cloned model from assets store
	 */
	initializeWithModel(modelGroup: THREE.Group): void {
		if (this.modelGroup) {
			console.warn('AnimatedPlayerModel: Already initialized, disposing old model')
			this.disposeModel()
		}

		this.modelGroup = modelGroup
		this.object3D.add(modelGroup)

		// Debug: Log what we're adding
		if (import.meta.env.DEV) {
			console.log(`[AnimatedPlayerModel ${this.config.playerId}] Initializing with model:`)
			console.log('  modelGroup.position:', modelGroup.position.toArray())
			console.log('  modelGroup.scale:', modelGroup.scale.toArray())
			console.log('  modelGroup.visible:', modelGroup.visible)
			console.log('  object3D.position:', this.object3D.position.toArray())
			console.log('  object3D.scale:', this.object3D.scale.toArray())

			// Check world transform after adding
			const worldPos = new THREE.Vector3()
			const worldScale = new THREE.Vector3()
			modelGroup.getWorldPosition(worldPos)
			modelGroup.getWorldScale(worldScale)
			console.log('  modelGroup worldPosition:', worldPos.toArray())
			console.log('  modelGroup worldScale:', worldScale.toArray())

			// Count what's in the model
			let skinnedCount = 0
			modelGroup.traverse((child) => {
				if (child.type === 'SkinnedMesh') {
					skinnedCount++
					const sm = child as THREE.SkinnedMesh
					sm.matrixWorld.decompose(worldPos, new THREE.Quaternion(), worldScale)
					console.log(`  SkinnedMesh "${sm.name}" worldScale:`, worldScale.toArray())
				}
			})
			console.log(`  Total skinned meshes in model: ${skinnedCount}`)
		}

		// Create animation mixer
		this.mixer = new THREE.AnimationMixer(modelGroup)

		// Find bones
		this.findBones()

		// Store rest pose
		this.storeRestPose()

		// Load animations from registry
		this.loadAnimations()

		// Apply initial kit colors
		this.findKitMaterials()
		this.cacheBodyMaterials()
		this.applyMaterialStandards()
		if (this.config.kit) {
			this.setKitColors(this.config.kit)
		}
		const tone = this.config.skinTone ?? AnimatedPlayerModel.DEFAULT_SKIN_TONE
		this.setSkinTone(tone)
	}

	/**
	 * Find and cache bone references.
	 */
	private findBones(): void {
		if (!this.modelGroup || !this.metadata) {
			return
		}

		const { headBone, leftEyeBone, rightEyeBone, hipBone } = this.metadata

		this.modelGroup.traverse((child) => {
			if (child instanceof THREE.Bone) {
				if (headBone && child.name === headBone) {
					this.bones.head = child
				}
				if (leftEyeBone && child.name === leftEyeBone) {
					this.bones.leftEye = child
				}
				if (rightEyeBone && child.name === rightEyeBone) {
					this.bones.rightEye = child
				}
				if (hipBone && child.name === hipBone) {
					this.bones.hips = child
				}
			}
		})

		// Log what we found (dev mode)
		if (import.meta.env.DEV) {
			console.log(`AnimatedPlayerModel[${this.config.playerId}] bones found:`, {
				head: this.bones.head?.name ?? null,
				leftEye: this.bones.leftEye?.name ?? null,
				rightEye: this.bones.rightEye?.name ?? null,
				hips: this.bones.hips?.name ?? null,
			})
		}
	}

	/**
	 * Store bone rest poses for restoration.
	 */
	private storeRestPose(): void {
		if (this.bones.head) {
			this.boneRestPose.head = this.bones.head.rotation.clone()
		}
		if (this.bones.leftEye) {
			this.boneRestPose.leftEye = this.bones.leftEye.rotation.clone()
		}
		if (this.bones.rightEye) {
			this.boneRestPose.rightEye = this.bones.rightEye.rotation.clone()
		}
	}

	/**
	 * Load animations from the asset registry.
	 */
	private loadAnimations(): void {
		// Map asset keys to internal animation names
		const animationMappings: Array<[string, PlayerAnimationName]> = [
			['anim-idle', 'idle'],
			['anim-breathing-idle', 'breathing-idle'],
			['anim-walking', 'walking'],
			['anim-standard-walk', 'standard-walk'],
			['anim-jog-forward', 'jog-forward'],
			['anim-jog-backward', 'jog-backward'],
			['anim-jog-strafe-left', 'jog-strafe-left'],
			['anim-jog-strafe-right', 'jog-strafe-right'],
			['anim-kick', 'kick'],
			['anim-header', 'header'],
			['anim-tackle', 'tackle'],
			['anim-goalkeeper-idle', 'goalkeeper-idle'],
			['anim-goalkeeper-dive', 'goalkeeper-dive'],
		]

		for (const [assetKey, animName] of animationMappings) {
			const clip = assets.getAnimation(assetKey)
			if (clip) {
				clip.name = animName
				this.animationClips.set(animName, clip)
			}
		}
	}

	/**
	 * Resolve an animation name to a clip, using fallbacks if needed.
	 * Returns the clip and the actual animation name used.
	 *
	 * @param name - Requested animation name
	 * @returns Tuple of [clip, actualName] or [null, name] if not found
	 */
	private resolveAnimation(name: PlayerAnimationName): [THREE.AnimationClip | null, PlayerAnimationName] {
		// Try direct lookup
		const clip = this.animationClips.get(name)
		if (clip) {
			return [clip, name]
		}

		// Fallback chains for specific animations
		const fallbackChains: Partial<Record<PlayerAnimationName, PlayerAnimationName[]>> = {
			'walking': ['standard-walk', 'jog-forward', 'breathing-idle'],
			'standard-walk': ['walking', 'jog-forward', 'breathing-idle'],
			'idle': ['breathing-idle'],
		}

		const fallbacks = fallbackChains[name]
		if (fallbacks) {
			for (const fallback of fallbacks) {
				const fallbackClip = this.animationClips.get(fallback)
				if (fallbackClip) {
					return [fallbackClip, fallback]
				}
			}
		}

		return [null, name]
	}

	/**
	 * Get or create an animation action for a clip.
	 *
	 * @param name - Animation name (for caching)
	 * @param clip - Animation clip
	 * @param options - Action options
	 * @returns The animation action
	 */
	private getOrCreateAction(
		name: PlayerAnimationName,
		clip: THREE.AnimationClip,
		options: { loop?: boolean; timeScale?: number } = {},
	): THREE.AnimationAction {
		let action = this.animationActions.get(name)
		if (!action) {
			action = this.mixer!.clipAction(clip)
			this.animationActions.set(name, action)
		}

		// Configure action
		action.loop = options.loop !== false ? THREE.LoopRepeat : THREE.LoopOnce
		action.clampWhenFinished = options.loop === false
		action.timeScale = options.timeScale ?? 1

		return action
	}

	/**
	 * Find kit materials for customization.
	 */
	private findKitMaterials(): void {
		if (!this.modelGroup) {
			return
		}

		// These material names should match what's exported from Blender
		const materialNames = {
			shirt: ['shirt', 'jersey', 'top', 'Kit_Top'],
			shorts: ['shorts', 'pants', 'Kit_Bottom'],
			socks: ['socks', 'stockings', 'Kit_Socks'],
		}

		this.modelGroup.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				const materials = Array.isArray(child.material) ? child.material : [child.material]
				for (const mat of materials) {
					const name = mat.name.toLowerCase()
					for (const category of Object.keys(materialNames) as Array<keyof typeof materialNames>) {
						if (materialNames[category].some(n => name.includes(n.toLowerCase()))) {
							this.kitMaterials[category] = mat
						}
					}
				}
			}
		})
	}

	/**
	 * Cache body material references for later adjustments.
	 * Detects materials by mesh name and material name.
	 *
	 * Material naming convention (from Blender):
	 * - Skin material should be named 'skin' or contain 'skin' (e.g., 'Ch38_skin')
	 * - Hair material should contain 'hair'
	 * - Eyelash material should contain 'eyelash' or 'lash'
	 */
	private cacheBodyMaterials(): void {
		this.skinMaterials = []
		this.hairMaterials = []
		this.eyelashMaterials = []

		if (!this.modelGroup) {
			return
		}

		const pushUnique = (list: THREE.MeshStandardMaterial[], mat: THREE.MeshStandardMaterial) => {
			if (!list.includes(mat)) {
				list.push(mat)
			}
		}

		this.modelGroup.traverse((child) => {
			if (!(child instanceof THREE.Mesh)) {
				return
			}

			const meshName = child.name.toLowerCase()
			const materials = Array.isArray(child.material) ? child.material : [child.material]

			for (const mat of materials) {
				if (!(mat instanceof THREE.MeshStandardMaterial)) {
					continue
				}

				const matName = mat.name.toLowerCase()

				// Eyelashes - need alpha transparency (check by mesh name)
				if (meshName.includes('eyelash') || meshName.includes('lash')) {
					pushUnique(this.eyelashMaterials, mat)
					continue
				}

				// Hair - includes eyebrows but NOT eyelashes (check by mesh name)
				if (meshName.includes('hair') || meshName.includes('brow')) {
					pushUnique(this.hairMaterials, mat)
					continue
				}

				// Skin - detect by MATERIAL NAME (must be named 'skin' or contain 'skin')
				// This requires the Blender model to have a separate skin material
				if (matName.includes('skin')) {
					pushUnique(this.skinMaterials, mat)
				}
			}
		})

		if (import.meta.env.DEV) {
			console.log(`AnimatedPlayerModel[${this.config.playerId}] cached materials:`, {
				skin: this.skinMaterials.map(m => m.name),
				hair: this.hairMaterials.map(m => m.name),
				eyelash: this.eyelashMaterials.map(m => m.name),
			})
		}
	}

	/**
	 * Normalize all materials for consistent, non-shiny appearance.
	 * Applies roughness/metalness fixes universally to reduce glossiness.
	 */
	private applyMaterialStandards(): void {
		if (this.materialStandardsApplied) {
			return
		}
		this.materialStandardsApplied = true

		// Hair - opaque with alpha test for strand edges
		for (const hair of this.hairMaterials) {
			this.configureHairMaterial(hair)
		}

		// Eyelashes - need proper transparency
		for (const lash of this.eyelashMaterials) {
			this.configureEyelashMaterial(lash)
		}

		// Apply universal material fixes to ALL meshes to reduce shininess
		this.applyUniversalMaterialFixes()
	}

	/**
	 * Configure hair material: opaque with alpha test for clean edges.
	 */
	private configureHairMaterial(mat: THREE.MeshStandardMaterial): void {
		mat.transparent = false
		mat.alphaTest = 0.5
		mat.depthWrite = true
		mat.metalness = 0
		mat.roughness = Math.max(mat.roughness, 0.85)
		mat.needsUpdate = true
	}

	/**
	 * Configure eyelash material: needs alpha transparency to look correct.
	 */
	private configureEyelashMaterial(mat: THREE.MeshStandardMaterial): void {
		// Eyelashes need transparency for the gaps between lashes
		mat.transparent = true
		mat.alphaTest = 0.1 // Low threshold to keep thin strands
		mat.depthWrite = true
		mat.side = THREE.DoubleSide // Visible from both sides
		mat.metalness = 0
		mat.roughness = 0.9
		mat.needsUpdate = true
	}

	/**
	 * Apply universal material fixes to ALL meshes to reduce shininess.
	 * Sets metalness to 0 and increases roughness for a matte appearance.
	 */
	private applyUniversalMaterialFixes(): void {
		if (!this.modelGroup) {
			return
		}

		const processedMaterials = new Set<THREE.Material>()

		this.modelGroup.traverse((child) => {
			if (!(child instanceof THREE.Mesh)) {
				return
			}

			const materials = Array.isArray(child.material) ? child.material : [child.material]

			for (const mat of materials) {
				// Skip already processed (materials can be shared)
				if (processedMaterials.has(mat)) {
					continue
				}
				processedMaterials.add(mat)

				// Skip hair and eyelash materials (handled separately)
				if (this.hairMaterials.includes(mat as THREE.MeshStandardMaterial) ||
					this.eyelashMaterials.includes(mat as THREE.MeshStandardMaterial)) {
					continue
				}

				if (mat instanceof THREE.MeshStandardMaterial) {
					// Remove metalness entirely - skin and fabric are not metallic
					mat.metalness = 0
					// Increase roughness for matte appearance (higher = less shiny)
					mat.roughness = Math.max(mat.roughness, 0.7)
					mat.needsUpdate = true
				}
			}
		})

		if (import.meta.env.DEV) {
			console.log(`AnimatedPlayerModel[${this.config.playerId}] applied material fixes to ${processedMaterials.size} materials`)
		}
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                       A C C E S S O R S
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 */
	isPlaceholder(): boolean {
		return this.modelGroup === null
	}

	/**
	 * Check if an animation is available.
	 */
	hasAnimation(name: PlayerAnimationName): boolean {
		return this.animationClips.has(name)
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                      A N I M A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 */
	setAnimation(
		name: PlayerAnimationName,
		options: { loop?: boolean; timeScale?: number } = {},
	): void {
		if (!this.mixer) {
			this._currentAnimation = name
			return
		}

		const [clip, actualName] = this.resolveAnimation(name)
		if (!clip) {
			console.warn(`AnimatedPlayerModel: Animation '${name}' not found`)
			return
		}

		// Stop current animation
		if (this.activeAction) {
			this.activeAction.stop()
		}

		// Play new animation
		const action = this.getOrCreateAction(actualName, clip, options)
		action.reset().play()
		this.activeAction = action
		this._currentAnimation = actualName
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	crossFadeTo(
		name: PlayerAnimationName,
		duration: number,
		options: { loop?: boolean; timeScale?: number } = {},
	): void {
		if (!this.mixer) {
			this._currentAnimation = name
			return
		}

		const [clip, actualName] = this.resolveAnimation(name)
		if (!clip) {
			console.warn(`AnimatedPlayerModel: Animation '${name}' not found for crossfade`)
			return
		}

		const newAction = this.getOrCreateAction(actualName, clip, options)

		// Crossfade from current to new action
		if (this.activeAction && this.activeAction !== newAction) {
			newAction.reset()
			newAction.setEffectiveWeight(1)
			newAction.play()
			this.activeAction.crossFadeTo(newAction, duration, true)
		} else {
			newAction.reset().play()
		}

		this.activeAction = newAction
		this._currentAnimation = actualName
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	stopAnimation(): void {
		if (this.mixer) {
			this.mixer.stopAllAction()
		}
		this.activeAction = null
		this._currentAnimation = null
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	update(deltaTime: number): void {
		if (this.mixer) {
			this.mixer.update(deltaTime)
		}
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                   H E A D / E Y E   C O N T R O L
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 */
	setHeadDirection(yaw: number, pitch: number): void {
		if (!this.bones.head) {
			return
		}

		// Apply rotation relative to rest pose
		if (this.boneRestPose.head) {
			this.bones.head.rotation.copy(this.boneRestPose.head)
		}

		// Add look direction (local space)
		// Clamp to reasonable range
		const clampedYaw = THREE.MathUtils.clamp(yaw, -Math.PI / 3, Math.PI / 3)
		const clampedPitch = THREE.MathUtils.clamp(pitch, -Math.PI / 4, Math.PI / 4)

		this.bones.head.rotation.y += clampedYaw
		this.bones.head.rotation.x += clampedPitch
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	setEyeDirection(yaw: number, pitch: number): void {
		// Clamp eye movement to smaller range than head
		const clampedYaw = THREE.MathUtils.clamp(yaw, -Math.PI / 6, Math.PI / 6)
		const clampedPitch = THREE.MathUtils.clamp(pitch, -Math.PI / 8, Math.PI / 8)

		if (this.bones.leftEye && this.boneRestPose.leftEye) {
			this.bones.leftEye.rotation.copy(this.boneRestPose.leftEye)
			this.bones.leftEye.rotation.y += clampedYaw
			this.bones.leftEye.rotation.x += clampedPitch
		}

		if (this.bones.rightEye && this.boneRestPose.rightEye) {
			this.bones.rightEye.rotation.copy(this.boneRestPose.rightEye)
			this.bones.rightEye.rotation.y += clampedYaw
			this.bones.rightEye.rotation.x += clampedPitch
		}
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                   C U S T O M I Z A T I O N
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 *
	 * Applies skin tone tinting to materials named 'skin' (e.g., 'Ch38_skin').
	 * Requires the Blender model to have a separate skin material.
	 *
	 * If no skin materials are detected, this method does nothing.
	 * Check console logs in dev mode to verify skin material detection.
	 *
	 * @param tone - Skin tone value (0-1, light to dark)
	 */
	setSkinTone(tone: number): void {
		if (!this.modelGroup) {
			return
		}

		// Ensure materials are cached
		if (this.skinMaterials.length === 0 && !this.materialStandardsApplied) {
			this.cacheBodyMaterials()
		}

		// If still no skin materials found, log warning and skip
		if (this.skinMaterials.length === 0) {
			if (import.meta.env.DEV) {
				console.warn(
					`AnimatedPlayerModel[${this.config.playerId}]: No skin materials found. ` +
					'Ensure Blender model has a material named "skin" or containing "skin".',
				)
			}
			return
		}

		// Interpolate between light and dark skin tones
		const lightSkin = new THREE.Color(0xffe0bd) // Light peachy skin
		const darkSkin = new THREE.Color(0x8d5524)  // Dark brown skin

		for (const mat of this.skinMaterials) {
			mat.color.copy(lightSkin).lerp(darkSkin, tone)
			mat.needsUpdate = true
		}
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	setHairStyle(styleKey: string): void {
		// Hair styles would require additional mesh loading
		// For now, just store the preference
		if (import.meta.env.DEV) {
			console.log(`AnimatedPlayerModel[${this.config.playerId}]: setHairStyle('${styleKey}') - not yet implemented`)
		}
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	setKitColors(kit: { shirtColor?: number; shortsColor?: number; socksColor?: number }): void {
		if (kit.shirtColor !== undefined && this.kitMaterials.shirt instanceof THREE.MeshStandardMaterial) {
			this.kitMaterials.shirt.color.setHex(kit.shirtColor)
		}
		if (kit.shortsColor !== undefined && this.kitMaterials.shorts instanceof THREE.MeshStandardMaterial) {
			this.kitMaterials.shorts.color.setHex(kit.shortsColor)
		}
		if (kit.socksColor !== undefined && this.kitMaterials.socks instanceof THREE.MeshStandardMaterial) {
			this.kitMaterials.socks.color.setHex(kit.socksColor)
		}
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	setPlayerName(name: string): void {
		// Would require dynamic texture or decal
		if (import.meta.env.DEV) {
			console.log(`AnimatedPlayerModel[${this.config.playerId}]: setPlayerName('${name}') - not yet implemented`)
		}
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	setPlayerNumber(number: number): void {
		// Would require dynamic texture or decal
		if (import.meta.env.DEV) {
			console.log(`AnimatedPlayerModel[${this.config.playerId}]: setPlayerNumber(${number}) - not yet implemented`)
		}
	}

	// ═══════════════════════════════════════════════════════════════════════
	//                      L I F E C Y C L E
	// ═══════════════════════════════════════════════════════════════════════

	/**
	 * @override
	 * @inheritdoc
	 */
	upgradeFromPlaceholder(modelGroup: THREE.Group): void {
		// Remove any existing children (primitives)
		while (this.object3D.children.length > 0) {
			const child = this.object3D.children[0]
			this.object3D.remove(child)
			// Dispose if it's a mesh
			if (child instanceof THREE.Mesh) {
				child.geometry?.dispose()
				if (Array.isArray(child.material)) {
					child.material.forEach(m => m.dispose())
				} else {
					child.material?.dispose()
				}
			}
		}

		// Initialize with new model
		this.initializeWithModel(modelGroup)

		// Restore current animation if one was set
		if (this._currentAnimation) {
			this.setAnimation(this._currentAnimation)
		}
	}

	/**
	 * Dispose of the current model but keep the base object.
	 */
	private disposeModel(): void {
		if (this.mixer) {
			this.mixer.stopAllAction()
			this.mixer = null
		}

		this.animationActions.clear()
		this.animationClips.clear()

		if (this.modelGroup && this.object3D.children.includes(this.modelGroup)) {
			this.object3D.remove(this.modelGroup)
		}

		this.modelGroup = null
		this.bones = { head: null, leftEye: null, rightEye: null, hips: null }
		this.boneRestPose = { head: null, leftEye: null, rightEye: null }
		this.kitMaterials = { shirt: null, shorts: null, socks: null }
	}

	/**
	 * @override
	 * @inheritdoc
	 */
	dispose(): void {
		if (this.disposed) {
			return
		}

		this.disposeModel()
		super.dispose()
	}
}
