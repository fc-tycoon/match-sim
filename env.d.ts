/**
 * FC Tycoon™ 2027 Match Simulator - TypeScript Environment Declarations
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * Licensed under FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

/// <reference types="vite/client" />

/**
 * Declare markdown file imports as raw strings (Vite ?raw suffix)
 */
declare module '*.md?raw' {
	const content: string
	export default content
}

/**
 * Extend Vue's global properties with custom plugins
 */
import 'vue'
import type * as constants from '@/constants'

declare module 'vue' {
	interface ComponentCustomProperties {
		$constants: typeof constants
	}
}
