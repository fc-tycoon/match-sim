import { createRouter, createWebHistory } from 'vue-router'
import LicenseAcceptance from '@/pages/LicenseAcceptance.vue'
import MatchSimulator from '@/pages/MatchSimulator.vue'
import { STORAGE_KEYS } from '@/utils/constants.js'

/**
 * Check if license has been accepted
 * @returns {boolean} True if license is accepted
 */
function isLicenseAccepted() {
	const stored = localStorage.getItem(STORAGE_KEYS.LICENSE_ACCEPTANCE)
	if (stored) {
		try {
			const licenseData = JSON.parse(stored)
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

export default router
