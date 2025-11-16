/**
 * FC Tycoon™ 2027 Match Simulator - Vue Router Configuration
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * Licensed under FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { createRouter, createWebHistory, type Router } from 'vue-router'
import LicenseAcceptance from '@/pages/LicenseAcceptance.vue'
import MatchSimulator from '@/pages/MatchSimulator.vue'
import { STORAGE_KEYS } from '@/utils/constants'

/**
 * License acceptance data structure
 */
interface LicenseData {
	accepted: boolean
	version: string
	acceptedDate: string
}

/**
 * Check if license has been accepted
 * @returns True if license is accepted
 */
function isLicenseAccepted(): boolean {
	const stored = localStorage.getItem(STORAGE_KEYS.LICENSE_ACCEPTANCE)
	if (stored) {
		try {
			const licenseData = JSON.parse(stored) as LicenseData
			return licenseData.accepted === true
		} catch (error) {
			console.error('Failed to parse license data:', error)
		}
	}
	return false
}

const routes = [
	{
		path: '/',
		name: 'LicenseAcceptance',
		component: LicenseAcceptance,
	},
	{
		path: '/simulator',
		name: 'MatchSimulator',
		component: MatchSimulator,
	},
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

// Global navigation guard - check license on every route
router.beforeEach((to, from, next) => {
	// Allow access to license page without acceptance
	if (to.path === '/') {
		next()
		return
	}

	// All other pages require license acceptance
	if (!isLicenseAccepted()) {
		next('/')
		return
	}

	next()
})

export default router as Router
