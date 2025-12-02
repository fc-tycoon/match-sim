/**
 * FC Tycoon™ 2027 Match Simulator - AI Brain Registry
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { BrainStem } from '@/core/ai/AiPrimitives'
import { Brain as Brain_v1 } from '@/core/ai/brains/brain_v1'

/**
 * BRAIN REGISTRY
 *
 * A factory system for retrieving specific versions of the AI Brain.
 * This allows for:
 * 1. Deterministic Replays: Loading the exact AI version used in a saved match.
 * 2. A/B Testing: Running different AI versions for Home vs Away teams.
 * 3. Backward Compatibility: Supporting older save files.
 */

const registry: Record<string, BrainStem> = {
	[Brain_v1.version]: Brain_v1,
	'latest': Brain_v1,
}

/**
 * Retrieves a specific version of the AI Brain.
 * @param version - The version string (e.g., "1.0.0").
 * @returns The requested BrainStem, or the "latest" version if not found.
 */
export function getBrainVersion(version: string): BrainStem {
	return registry[version] || registry['latest']
}
