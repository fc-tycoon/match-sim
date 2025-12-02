/**
 * FC Tycoon™ 2027 Match Simulator - Lighting Configuration Module
 *
 * Defines configurable lighting parameters for match scenes including
 * ambient, hemisphere, directional (sun), and stadium spotlight settings.
 * Provides presets for Day, Dusk, and Night conditions.
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

// ═══════════════════════════════════════════════════════════════════════════
//                              T Y P E S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lighting preset identifiers.
 */
export type LightingPreset = 'day' | 'dusk' | 'night' | 'custom'

/**
 * Shadow quality levels with corresponding shadow map sizes.
 */
export type ShadowQuality = 'low' | 'medium' | 'high' | 'ultra'

/**
 * Shadow map sizes for each quality level.
 */
export const SHADOW_MAP_SIZES: Record<ShadowQuality, number> = {
	low: 1024,
	medium: 2048,
	high: 4096,
	ultra: 8192,
}

/**
 * Ambient light configuration.
 */
export interface AmbientLightConfig {
	/** Whether ambient light is enabled */
	enabled: boolean
	/** Light color (hex) */
	color: number
	/** Light intensity (0-2) */
	intensity: number
}

/**
 * Hemisphere light configuration.
 */
export interface HemisphereLightConfig {
	/** Whether hemisphere light is enabled */
	enabled: boolean
	/** Sky color (hex) - light from above */
	skyColor: number
	/** Ground color (hex) - light reflected from below */
	groundColor: number
	/** Light intensity (0-3) */
	intensity: number
}

/**
 * Directional light (sun) configuration.
 */
export interface DirectionalLightConfig {
	/** Whether directional light is enabled */
	enabled: boolean
	/** Light color (hex) */
	color: number
	/** Light intensity (0-3) */
	intensity: number
	/** Position X offset from center */
	positionX: number
	/** Position Y (height) */
	positionY: number
	/** Position Z offset from center */
	positionZ: number
	/** Whether this light casts shadows */
	castShadow: boolean
}

/**
 * Stadium spotlight configuration.
 * Four spotlights positioned at corners of the stadium.
 */
export interface SpotlightConfig {
	/** Whether spotlights are enabled */
	enabled: boolean
	/** Light color (hex) */
	color: number
	/** Light intensity per spotlight (0-5) */
	intensity: number
	/** Spotlight cone angle in radians */
	angle: number
	/** Penumbra softness (0-1) */
	penumbra: number
	/** Light decay rate */
	decay: number
	/** Spotlight height (Y position) */
	height: number
	/** Offset beyond field edge for spotlight position (added to field half-dimensions) */
	distance: number
	/** Whether spotlights cast shadows */
	castShadow: boolean
	/** Target offset from center for crossed lighting effect */
	targetOffset: number
	/** Shadow map quality for spotlights (independent from directional light) */
	shadowQuality: ShadowQuality
}

/**
 * Sky/background configuration.
 */
export interface SkyConfig {
	/** Background color (hex) */
	color: number
}

/**
 * Complete lighting configuration for a match scene.
 */
export interface LightingConfig {
	/** Current preset name */
	preset: LightingPreset
	/** Whether the config has been manually modified from a preset */
	isCustom: boolean
	/** Sky/background settings */
	sky: SkyConfig
	/** Ambient light settings */
	ambient: AmbientLightConfig
	/** Hemisphere light settings */
	hemisphere: HemisphereLightConfig
	/** Directional (sun) light settings */
	directional: DirectionalLightConfig
	/** Stadium spotlight settings */
	spotlights: SpotlightConfig
}

// ═══════════════════════════════════════════════════════════════════════════
//                          P R E S E T S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Day lighting preset.
 * Bright sunlight with subtle ambient fill. Spotlights disabled.
 */
export const PRESET_DAY: LightingConfig = {
	preset: 'day',
	isCustom: false,
	sky: {
		color: 0x87ceeb,		// Light sky blue
	},
	ambient: {
		enabled: true,
		color: 0xffffff,
		intensity: 0.4,
	},
	hemisphere: {
		enabled: true,
		skyColor: 0xffffff,
		groundColor: 0x888888,
		intensity: 1.2,
	},
	directional: {
		enabled: true,
		color: 0xffffff,
		intensity: 1.5,
		positionX: 50,
		positionY: 200,
		positionZ: 100,
		castShadow: true,
	},
	spotlights: {
		enabled: false,
		color: 0xffffee,
		intensity: 0,
		angle: Math.PI / 6,
		penumbra: 0.3,
		decay: 1.5,
		height: 45,
		distance: 25,			// Offset beyond field edge
		castShadow: false,
		targetOffset: 20,
		shadowQuality: 'high',
	},
}

/**
 * Dusk lighting preset.
 * Twilight transition between day and night. Moderate natural light with spotlights.
 */
export const PRESET_DUSK: LightingConfig = {
	preset: 'dusk',
	isCustom: false,
	sky: {
		color: 0x5a6a7a,		// Blue-grey twilight
	},
	ambient: {
		enabled: true,
		color: 0xdde0e8,		// Cool white ambient
		intensity: 0.35,
	},
	hemisphere: {
		enabled: true,
		skyColor: 0x8899aa,		// Muted blue-grey sky
		groundColor: 0x556666,	// Cool ground
		intensity: 0.9,
	},
	directional: {
		enabled: true,
		color: 0xeeddcc,		// Warm white (low sun)
		intensity: 0.6,
		positionX: -100,
		positionY: 50,
		positionZ: 50,
		castShadow: true,
	},
	spotlights: {
		enabled: true,
		color: 0xfff8e8,
		intensity: 25.0,		// Moderate intensity for dusk
		angle: Math.PI / 3,		// Wider cone angle
		penumbra: 0.1,
		decay: 0.5,				// Lower decay for longer reach
		height: 45,
		distance: 25,			// Offset beyond field edge
		castShadow: true,
		targetOffset: 20,		// Offset toward opposite side
		shadowQuality: 'high',
	},
}

/**
 * Night lighting preset.
 * Dark sky with stadium floodlights as primary illumination.
 */
export const PRESET_NIGHT: LightingConfig = {
	preset: 'night',
	isCustom: false,
	sky: {
		color: 0x0a0a1a,		// Very dark blue-black
	},
	ambient: {
		enabled: true,
		color: 0x334455,		// Cool dark ambient
		intensity: 0.4,
	},
	hemisphere: {
		enabled: true,
		skyColor: 0x222233,
		groundColor: 0x333333,
		intensity: 0.5,
	},
	directional: {
		enabled: false,			// No sun at night
		color: 0x8888ff,		// Moonlight (if enabled)
		intensity: 0.1,
		positionX: 50,
		positionY: 200,
		positionZ: 50,
		castShadow: false,
	},
	spotlights: {
		enabled: true,
		color: 0xfff8e8,		// Warm white floodlights
		intensity: 50.0,		// Very high intensity for stadium lights
		angle: Math.PI / 3,		// Wider cone angle (60 degrees)
		penumbra: 0.3,			// Softer edges
		decay: 0.5,				// Lower decay for longer reach
		height: 45,				// Stadium floodlight height
		distance: 25,			// Offset beyond field edge
		castShadow: true,
		targetOffset: 20,		// Offset toward opposite side for crossed lighting
		shadowQuality: 'high',
	},
}

/**
 * All presets indexed by name.
 */
export const LIGHTING_PRESETS: Record<Exclude<LightingPreset, 'custom'>, LightingConfig> = {
	day: PRESET_DAY,
	dusk: PRESET_DUSK,
	night: PRESET_NIGHT,
}

// ═══════════════════════════════════════════════════════════════════════════
//                          H E L P E R S
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a deep copy of a lighting configuration.
 *
 * @param config - Source configuration
 * @returns Deep copy of the configuration
 */
export function cloneLightingConfig(config: LightingConfig): LightingConfig {
	return {
		preset: config.preset,
		isCustom: config.isCustom,
		sky: { ...config.sky },
		ambient: { ...config.ambient },
		hemisphere: { ...config.hemisphere },
		directional: { ...config.directional },
		spotlights: { ...config.spotlights },
	}
}

/**
 * Get the default lighting configuration (Day preset).
 *
 * @returns Copy of the Day preset
 */
export function getDefaultLightingConfig(): LightingConfig {
	return cloneLightingConfig(PRESET_DAY)
}

/**
 * Get a lighting preset by name.
 *
 * @param preset - Preset name
 * @returns Copy of the preset configuration, or Day if not found
 */
export function getLightingPreset(preset: LightingPreset): LightingConfig {
	if (preset === 'custom') {
		return cloneLightingConfig(PRESET_DAY)
	}
	return cloneLightingConfig(LIGHTING_PRESETS[preset])
}

/**
 * Determine which preset a configuration matches, if any.
 *
 * @param config - Configuration to check
 * @returns Matching preset name or 'custom'
 */
export function detectLightingPreset(config: LightingConfig): LightingPreset {
	for (const [name, preset] of Object.entries(LIGHTING_PRESETS)) {
		if (configsMatch(config, preset)) {
			return name as LightingPreset
		}
	}
	return 'custom'
}

/**
 * Compare two lighting configurations for equality.
 *
 * @param a - First configuration
 * @param b - Second configuration
 * @returns True if configurations match (ignoring preset field)
 */
function configsMatch(a: LightingConfig, b: LightingConfig): boolean {
	// Compare sky
	if (a.sky.color !== b.sky.color) return false

	// Compare ambient
	if (a.ambient.enabled !== b.ambient.enabled) return false
	if (a.ambient.enabled && (
		a.ambient.color !== b.ambient.color ||
		a.ambient.intensity !== b.ambient.intensity
	)) return false

	// Compare hemisphere
	if (a.hemisphere.enabled !== b.hemisphere.enabled) return false
	if (a.hemisphere.enabled && (
		a.hemisphere.skyColor !== b.hemisphere.skyColor ||
		a.hemisphere.groundColor !== b.hemisphere.groundColor ||
		a.hemisphere.intensity !== b.hemisphere.intensity
	)) return false

	// Compare directional
	if (a.directional.enabled !== b.directional.enabled) return false
	if (a.directional.enabled && (
		a.directional.color !== b.directional.color ||
		a.directional.intensity !== b.directional.intensity ||
		a.directional.positionX !== b.directional.positionX ||
		a.directional.positionY !== b.directional.positionY ||
		a.directional.positionZ !== b.directional.positionZ ||
		a.directional.castShadow !== b.directional.castShadow
	)) return false

	// Compare spotlights
	if (a.spotlights.enabled !== b.spotlights.enabled) return false
	if (a.spotlights.enabled && (
		a.spotlights.color !== b.spotlights.color ||
		a.spotlights.intensity !== b.spotlights.intensity ||
		a.spotlights.angle !== b.spotlights.angle ||
		a.spotlights.penumbra !== b.spotlights.penumbra ||
		a.spotlights.decay !== b.spotlights.decay ||
		a.spotlights.height !== b.spotlights.height ||
		a.spotlights.distance !== b.spotlights.distance ||
		a.spotlights.castShadow !== b.spotlights.castShadow ||
		a.spotlights.targetOffset !== b.spotlights.targetOffset
	)) return false

	return true
}

/**
 * Determine lighting preset from a kickoff time.
 * Uses local hour to select appropriate preset.
 *
 * @param kickoffTime - Date/time of match kickoff
 * @returns Appropriate lighting preset
 */
export function getLightingPresetFromTime(kickoffTime: Date): LightingPreset {
	const hour = kickoffTime.getHours()

	// Night: 20:00 - 05:59
	if (hour >= 20 || hour < 6) {
		return 'night'
	}

	// Dusk: 17:00 - 19:59 or 06:00 - 07:59 (dawn treated as dusk-like)
	if (hour >= 17 || hour < 8) {
		return 'dusk'
	}

	// Day: 08:00 - 16:59
	return 'day'
}
