/**
 * FC Tycoon™ 2027 Match Simulator - Project Constants
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

/**
 * Application-wide constants
 *
 * Centralized location for all global constants used throughout the application.
 * Prevents typos and makes it easy to update values in one place.
 */

/**
 * LocalStorage keys used by the application
 */
export const STORAGE_KEYS = {
	LICENSE_ACCEPTANCE: 'fc-tycoon-2027-match-sim-license',
} as const

/**
 * Application metadata
 */
export const APP_INFO = {
	NAME: 'FC Tycoon 2027 Match Simulator',
	SHORT_NAME: 'Match Simulator',
} as const

/**
 * Type exports for TypeScript consumers
 */
export type StorageKeys = typeof STORAGE_KEYS
export type AppInfo = typeof APP_INFO
