/**
 * FC Tycoon™ 2027 Match Simulator - Random Number Generator Module
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

/**
 * Seedable Pseudo-Random Number Generator (PRNG)
 *
 * Uses SplitMix32 algorithm for deterministic random number generation.
 * This allows for reproducible match simulations when using the same seed.
 */

/**
 * Random Number Generator class with utility methods.
 *
 * CORE ALGORITHM:
 * The `next()` method implements the SplitMix32 algorithm, which is dedicated
 * to the Public Domain by Chris Wellons (2018).
 *
 * PROPRIETARY EXTENSIONS:
 * The class structure, TypeScript adaptation, and utility methods (int, float,
 * gaussian, choice, weighted, shuffle) are original works by Darkwave Studios.
 *
 * Algorithm Details:
 * - SplitMix32 (32-bit state)
 * - Based on MurmurHash3's fmix32 finalizer
 * - Uses improved constants for better statistical properties
 *
 * Sources:
 * - https://nullprogram.com/blog/2018/07/31/
 * - http://marc-b-reynolds.github.io/shf/2017/09/27/LPRNS.html
 */
export class Random {
	private seed: number

	/**
	 * Create a new Random instance
	 *
	 * @param seed - Seed value for deterministic generation
	 */
	constructor(seed: number) {
		this.seed = seed

		// ═══════════════════════════════════════════════════════════
		//                  S E A L   I N S T A N C E
		// ═══════════════════════════════════════════════════════════

		Object.seal(this)
	}

	/**
	 * Get next random value in range [0, 1)
	 * SplitMix32 algorithm
	 */
	next(): number {
		this.seed |= 0
		this.seed = (this.seed + 0x9e3779b9) | 0
		let t = this.seed ^ (this.seed >>> 16)
		t = Math.imul(t, 0x21f0aaad)
		t = t ^ (t >>> 15)
		t = Math.imul(t, 0x735a2d97)
		return ((t ^ (t >>> 15)) >>> 0) / 4294967296
	}

	/**
	 * Generate random integer in range [min, max]
	 */
	int(min: number, max: number): number {
		return Math.floor(this.next() * (max - min + 1)) + min
	}

	/**
	 * Generate random float in range [min, max)
	 */
	float(min: number, max: number): number {
		return this.next() * (max - min) + min
	}

	/**
	 * Generate random value with Gaussian (normal) distribution
	 * Uses Box-Muller transform
	 */
	gaussian(mean: number, stdDev: number): number {
		let u = 0, v = 0
		while (u === 0) u = this.next() // Converting [0,1) to (0,1)
		while (v === 0) v = this.next()
		const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
		return num * stdDev + mean
	}

	/**
	 * Return true with given probability
	 */
	chance(probability: number): boolean {
		return this.next() < probability
	}

	/**
	 * Pick a random element from an array
	 */
	choice<T>(array: T[]): T {
		return array[this.int(0, array.length - 1)]
	}

	/**
	 * Weighted random selection - returns index
	 * @param weights - Array of weights (will be normalized automatically)
	 * @returns Index of selected element, or -1 if weights are invalid
	 */
	weighted(weights: number[]): number {
		const total = weights.reduce((sum, w) => sum + w, 0)
		if (total <= 0) return -1

		let random = this.next() * total
		for (let i = 0; i < weights.length; i++) {
			random -= weights[i]
			if (random < 0) return i
		}
		return weights.length - 1
	}

	/**
	 * Fisher-Yates shuffle (modifies array in-place)
	 * @param array - Array to shuffle
	 * @returns The same array, shuffled
	 */
	shuffle<T>(array: T[]): T[] {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(this.next() * (i + 1))
			;[array[i], array[j]] = [array[j], array[i]]
		}
		return array
	}
}
