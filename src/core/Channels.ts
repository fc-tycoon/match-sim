/**
 * FC Tycoon™ 2027 Match Simulator - Running Channels
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

/**
 * Channel mapping for position slots (horizontal field positioning).
 * Maps numeric channel values to friendly names for UI display.
 * This is commonly used in drop down lists, or UI descriptions.
 */
export const channels = new Map([
	[-2, 'Left'],
	[-1, 'Left Half-space'],
	[0, 'Center'],
	[1, 'Right Half-space'],
	[2, 'Right'],
])

export const LEFT_CHANNEL = -2
export const LEFT_HALF_CHANNEL = -1
export const CENTER_CHANNEL = 0
export const RIGHT_HALF_CHANNEL = 1
export const RIGHT_CHANNEL = 2

export const enum Channel {
	LEFT = LEFT_CHANNEL,
	LEFT_HALF = LEFT_HALF_CHANNEL,
	CENTER = CENTER_CHANNEL,
	RIGHT_HALF = RIGHT_HALF_CHANNEL,
	RIGHT = RIGHT_CHANNEL,
}
