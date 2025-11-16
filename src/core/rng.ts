/**
 * FC Tycoon™ 2027 Match Simulator - Random Number Generators
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

/**
 * Seedable random number generators (PRNGs) for deterministic match simulation.
 *
 * This file contains:
 * - Public domain PRNG implementations (lowbias32, splitmix32, sfc32)
 * - Original helper utilities and integration code (Copyright Darkwave Studios LLC)
 *
 * PRNG Implementations (PUBLIC DOMAIN):
 * - splitmix32: 32-bit state, based on MurmurHash3 finalizer, Chris Wellons 2018
 * - lowbias32: 32-bit state, LOWEST BIAS (0.17), Chris Wellons 2018
 * - sfc32: 128-bit state, passes PractRand/BigCrush, Chris Doty-Humphrey
 *
 * Original Work (Copyright Darkwave Studios LLC):
 * - createRNG() function with helper methods (int, range, bool, choice, weighted, shuffle)
 * - createRNGHighQuality() function
 * - Integration with FC Tycoon match engine
 * - Documentation and examples
 *
 * Sources:
 * - https://nullprogram.com/blog/2018/07/31/ (lowbias32, splitmix32)
 * - https://github.com/bryc/code/blob/master/jshash/PRNGs.md (all PRNGs)
 * - http://pracrand.sourceforge.net/ (sfc32)
 */

/**
 * SplitMix32 PRNG - 32-bit state
 *
 * Based on MurmurHash3's fmix32 finalizer. 32-bit variant of Java's SplitMix64.
 * Uses improved constants for better statistical properties.
 *
 * Public domain by Chris Wellons (2018).
 *
 * Sources:
 * - https://nullprogram.com/blog/2018/07/31/
 * - http://marc-b-reynolds.github.io/shf/2017/09/27/LPRNS.html
 * - https://gist.github.com/tommyettinger/46a874533244883189143505d203312c?permalink_comment_id=4854318#gistcomment-4854318
 *
 * @param seed - 32-bit unsigned integer seed
 * @returns Random number generator function (returns 0-1 float)
 */
export function splitmix32(seed: number): () => number {
	return function(): number {
		seed |= 0
		seed = (seed + 0x9e3779b9) | 0
		let t = seed ^ (seed >>> 16)
		t = Math.imul(t, 0x21f0aaad)
		t = t ^ (t >>> 15)
		t = Math.imul(t, 0x735a2d97)
		return ((t ^ (t >>> 15)) >>> 0) / 4294967296
	}
}

/**
 * lowbias32 PRNG - 32-bit state, LOWEST BIAS
 *
 * The least biased 32-bit integer hash function ever devised (bias: 0.17).
 * Even less biased than MurmurHash3 finalizer. Uses multiply-xorshift
 * construction with optimized constants found by hash prospector tool.
 *
 * Public domain by Chris Wellons (2018).
 *
 * Source: https://nullprogram.com/blog/2018/07/31/
 *
 * @param seed - 32-bit unsigned integer seed
 * @returns Random number generator function (returns 0-1 float)
 */
export function lowbias32(seed: number): () => number {
	return function(): number {
		seed |= 0
		seed = (seed + 0x9e3779b9) | 0 // Weyl sequence (golden ratio)
		let t = seed ^ (seed >>> 16)
		t = Math.imul(t, 0x7feb352d)
		t = t ^ (t >>> 15)
		t = Math.imul(t, 0x846ca68b)
		return ((t ^ (t >>> 16)) >>> 0) / 4294967296
	}
}

/**
 * SFC32 (Small Fast Counter) PRNG - 128-bit state
 *
 * Part of PractRand PRNG test suite. Passes PractRand and BigCrush (TestU01).
 * One of the fastest high-quality PRNGs. Chaotic design with counter.
 *
 * Recommended as the best 128-bit state PRNG for JavaScript.
 *
 * Source: http://pracrand.sourceforge.net/
 *
 * @param a - First 32-bit seed value
 * @param b - Second 32-bit seed value
 * @param c - Third 32-bit seed value
 * @param d - Fourth 32-bit seed value (counter start)
 * @returns Random number generator function (returns 0-1 float)
 */
export function sfc32(a: number, b: number, c: number, d: number): () => number {
	return function(): number {
		a |= 0
		b |= 0
		c |= 0
		d |= 0
		const t = ((a + b) | 0) + d | 0
		d = (d + 1) | 0
		a = b ^ (b >>> 9)
		b = (c + (c << 3)) | 0
		c = ((c << 21) | (c >>> 11))
		c = (c + t) | 0
		return (t >>> 0) / 4294967296
	}
}

/**
 * Create RNG with single seed (uses splitmix32)
 *
 * Returns an RNG object with helper methods for common game development tasks.
 * Uses splitmix32 as the default algorithm (MurmurHash3-based, well-tested).
 *
 * Note: lowbias32 has lower bias (0.17 vs ~0.20), but splitmix32 is more
 * widely used and battle-tested. Both are excellent for match simulation.
 *
 * @param seed - 32-bit unsigned integer seed
 * @returns RNG object with helper methods
 *
 * @example
 * const rng = createRNG(12345)
 * rng()              // 0-1 float
 * rng.int(1, 6)      // dice roll (1-6 inclusive)
 * rng.choice(['a', 'b', 'c'])  // pick random element
 * rng.weighted([0.5, 0.3, 0.2]) // weighted index (50%, 30%, 20%)
 * rng.shuffle([1, 2, 3])        // Fisher-Yates shuffle (modifies array)
 * rng.bool(0.7)      // true with 70% probability
 * rng.range(10, 20)  // 10-20 float (inclusive)
 */
export function createRNG(seed: number) {
	const base = splitmix32(seed)

	// Main RNG function (0-1 float)
	const rng = () => base()

	/**
	 * Random integer in range [min, max] (inclusive)
	 * @param min - Minimum value (inclusive)
	 * @param max - Maximum value (inclusive)
	 */
	rng.int = (min: number, max: number): number => {
		return Math.floor(base() * (max - min + 1)) + min
	}

	/**
	 * Random float in range [min, max) (inclusive min, exclusive max)
	 * @param min - Minimum value (inclusive)
	 * @param max - Maximum value (exclusive)
	 */
	rng.range = (min: number, max: number): number => {
		return base() * (max - min) + min
	}

	/**
	 * Random boolean with given probability
	 * @param probability - Probability of returning true (0-1, default 0.5)
	 */
	rng.bool = (probability: number = 0.5): boolean => {
		return base() < probability
	}

	/**
	 * Pick random element from array
	 * @param array - Array to choose from
	 * @returns Random element from array, or undefined if array is empty
	 */
	rng.choice = <T>(array: T[]): T | undefined => {
		if (array.length === 0) return undefined
		return array[Math.floor(base() * array.length)]
	}

	/**
	 * Weighted random selection - returns index
	 * @param weights - Array of weights (will be normalized automatically)
	 * @returns Index of selected element, or -1 if weights are invalid
	 * @example
	 * const options = ['common', 'rare', 'legendary']
	 * const index = rng.weighted([0.7, 0.25, 0.05]) // 70%, 25%, 5%
	 * const result = options[index]
	 */
	rng.weighted = (weights: number[]): number => {
		const total = weights.reduce((sum, w) => sum + w, 0)
		if (total <= 0) return -1

		let random = base() * total
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
	rng.shuffle = <T>(array: T[]): T[] => {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(base() * (i + 1))
			;[array[i], array[j]] = [array[j], array[i]]
		}
		return array
	}

	return rng
}

/**
 * Create high-quality RNG with 128-bit state (uses SFC32)
 *
 * For applications requiring the highest quality randomness and longer period.
 * Automatically generates 4 seeds from a single seed value using lowbias32.
 *
 * @param seed - Initial seed value
 * @returns Random number generator function (returns 0-1 float)
 */
export function createRNGHighQuality(seed: number): () => number {
	// Use lowbias32 to generate 4 seeds from one seed
	const seedGen = lowbias32(seed)
	const a = Math.floor(seedGen() * 4294967296)
	const b = Math.floor(seedGen() * 4294967296)
	const c = Math.floor(seedGen() * 4294967296)
	const d = Math.floor(seedGen() * 4294967296)
	return sfc32(a, b, c, d)
}
