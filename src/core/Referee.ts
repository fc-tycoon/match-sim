/**
 * FC Tycoon™ 2027 Match Simulator - Referee Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { Match } from './Match'

export class Referee {
	match: Match

	x: number = 0
	z: number = 0

	constructor(match: Match) {
		this.match = match
	}

	update(_dt: number) {
		// Referee movement and decision making
	}
}
