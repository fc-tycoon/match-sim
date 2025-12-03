/**
 * FC Tycoon™ 2027 Match Simulator - Settings Store
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { reactive, App } from 'vue'
import {
	type LightingConfig,
	type ShadowQuality,
	getDefaultLightingConfig,
} from '@/core/LightingConfig'
import { STORAGE_KEYS } from '@/constants'

/**
 * Load shadow quality from localStorage, with fallback to default.
 *
 * @returns Saved shadow quality or 'high' as default
 */
function loadShadowQuality(): ShadowQuality {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.SHADOW_QUALITY)
		if (stored && ['low', 'medium', 'high', 'ultra'].includes(stored)) {
			return stored as ShadowQuality
		}
	} catch (e) {
		console.warn('[Settings] Failed to load shadow quality from localStorage:', e)
	}
	return 'high'
}

/**
 * Load spotlight shadow quality from localStorage, with fallback to default.
 *
 * @returns Saved spotlight shadow quality or 'high' as default
 */
function loadSpotlightShadowQuality(): ShadowQuality {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.SPOTLIGHT_SHADOW_QUALITY)
		if (stored && ['low', 'medium', 'high', 'ultra'].includes(stored)) {
			return stored as ShadowQuality
		}
	} catch (e) {
		console.warn('[Settings] Failed to load spotlight shadow quality from localStorage:', e)
	}
	return 'high'
}

export const settings = reactive({
	// Camera settings
	camera: {
		perspective: {
			position: { x: 0, y: 60, z: 80 },
			target: { x: 0, y: 0, z: 0 },
		},
		orthographic: {
			zoom: 1,
			position: { x: 0, y: 100, z: 0 },
			target: { x: 0, y: 0, z: 0 },
		},
	},

	// Match Simulation Settings
	match: {
		speed: 1.0,
		showCones: true,
		playerConfig: {
			homeColor: 0xff0000,
			awayColor: 0x0000ff,
			headColor: 0xffccaa,
			scale: 1.0,
		},
	},

	// Debug Visualization Settings
	debug: {
		/** Show team formation AABBs */
		showFormationAABB: false,

		/** Home team AABB color (default: team color) */
		homeAABBColor: null as number | null,

		/** Away team AABB color (default: team color) */
		awayAABBColor: null as number | null,

		/** AABB line opacity (0-1) */
		aabbOpacity: 0.6,

		/** Show formation slot markers (target positions for each player) */
		showSlotMarkers: true,

		/** Show AI movement lines (from player to their target position) */
		showAiMovementLines: true,

		/** Show AI face direction (where player is trying to look) */
		showAiFaceDirection: true,
	},

	// Shadow Quality Setting (loaded from localStorage)
	shadowQuality: loadShadowQuality(),

	// Lighting Settings (apply saved spotlight shadow quality)
	lighting: (() => {
		const config = getDefaultLightingConfig()
		config.spotlights.shadowQuality = loadSpotlightShadowQuality()
		return config
	})() as LightingConfig,
})

export default {
	install(app: App) {
		app.config.globalProperties.$settings = settings
	},
}
