/**
 * FC Tycoon™ 2027 Match Simulator - Position Role Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

/**
 * Position Role
 */
export class PositionRole {
	readonly id: number
	readonly name: string
	readonly tooltip: string
	readonly description: string
	readonly key_traits: string
	readonly differences: string
	readonly archetypes: string

	readonly attacking_mentality: number
	readonly defending_mentality: number

	constructor(
		id: number,
		name: string,
		tooltip: string,
		description: string,
		key_traits: string,
		differences: string,
		archetypes: string,

		attacking_mentality: number,
		defending_mentality: number,
	) {
		this.id = id
		this.name = name
		this.tooltip = tooltip
		this.description = description
		this.key_traits = key_traits
		this.differences = differences
		this.archetypes = archetypes

		this.attacking_mentality = attacking_mentality
		this.defending_mentality = defending_mentality

		// ═══════════════════════════════════════════════════════════
		//                F R E E Z E   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.freeze(this)
	}
}
