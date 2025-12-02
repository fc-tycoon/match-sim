<template>
	<div class="license-page">
		<ElCard class="license-card">
			<template #header>
				<div class="header">
					<h1>FC Tycoon™ 2027 Match Simulator</h1>
					<p class="subtitle">
						Source-Available License Agreement
					</p>
					<div v-if="previousAcceptance" class="version-info">
						<p class="version-change-notice">
							<strong>License Updated:</strong> You previously accepted version {{ previousAcceptance.version }} on {{ formatDate(previousAcceptance.acceptedDate) }}.
							Please review and accept the updated terms to continue.
						</p>
					</div>
				</div>
			</template>

			<div class="license-content">
				<ElScrollbar height="800px">
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div class="license-text" v-html="licenseText" />
				</ElScrollbar>
			</div>

			<template #footer>
				<div class="footer-buttons">
					<ElButton @click="handleDecline">
						I Decline
					</ElButton>
					<ElButton
						type="success"
						:disabled="!licenseLoaded"
						@click="handleAccept"
					>
						I Accept
					</ElButton>
				</div>
			</template>
		</ElCard>

		<ElDialog
			v-model="showDeclineDialog"
			title="License Required"
			width="450px"
		>
			<p>You must accept the license agreement to use this application.</p>
			<template #footer>
				<ElButton @click="showDeclineDialog = false">
					OK
				</ElButton>
			</template>
		</ElDialog>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import licenseMarkdown from '../../LICENSE.md?raw'
import { marked } from 'marked'

export default defineComponent({
	name: 'LicenseAcceptance',

	data() {
		return {
			licenseText: '',
			licenseVersion: '',
			licenseLoaded: false,
			showDeclineDialog: false,
			previousAcceptance: null as { version: string; acceptedDate: string } | null,
		}
	},

	mounted() {
		this.loadLicense()
		this.checkExistingAcceptance()
	},

	methods: {
		/**
		 * Load LICENSE.md file and convert to HTML
		 *
		 * Imports the license text at build time using Vite's ?raw import,
		 * so it's bundled directly into the application without needing
		 * a separate HTTP request. Uses marked library for markdown parsing.
		 *
		 * Extracts version number from LICENSE.md using regex pattern.
		 * Version must be in format: *Version: X.Y.Z* at bottom of file.
		 *
		 * @returns {Promise<void>}
		 * @throws {Error} If version cannot be extracted from LICENSE.md
		 */
		async loadLicense() {
			try {
				// Extract version from LICENSE.md
				// Pattern matches: *Version: 1.0* or *Version: 1.2.3*
				const versionMatch = licenseMarkdown.match(/\*Version:\s*([\d.]+)\*/)
				if (!versionMatch) {
					throw new Error('Failed to extract version from LICENSE.md. Version must be specified as: *Version: X.Y.Z*')
				}
				this.licenseVersion = versionMatch[1]

				// Configure marked options
				marked.setOptions({
					breaks: false, // Don't convert \\n to <br>
					gfm: true, // GitHub Flavored Markdown
				})

				// Parse markdown to HTML
				const html = await marked.parse(licenseMarkdown)
				this.licenseText = html
				this.licenseLoaded = true
			} catch (error) {
				console.error('Failed to load license:', error)
				this.licenseText = '<p>Error loading license text. Please check LICENSE.md file.</p>'
				this.licenseLoaded = false
				throw error
			}
		},

		/**
		 * Check if user has already accepted current license version
		 *
		 * Loads license acceptance data from localStorage and compares
		 * the accepted version with the current LICENSE.md version.
		 * If versions match, redirects to simulator. If different or
		 * no acceptance found, user must review and accept.
		 *
		 * @returns {void}
		 */
		checkExistingAcceptance() {
			const stored = localStorage.getItem(this.$constants.STORAGE_KEYS.LICENSE_ACCEPTANCE)
			if (stored) {
				try {
					const licenseData = JSON.parse(stored)
					// Check if accepted version matches current version
					if (licenseData.version === this.licenseVersion && licenseData.accepted === true) {
						// Same version already accepted - redirect to simulator
						this.$router.push('/simulator')
					} else {
						// Different version - store previous acceptance for display
						this.previousAcceptance = {
							version: licenseData.version,
							acceptedDate: licenseData.acceptedDate,
						}
					}
				} catch (error) {
					console.error('Failed to parse license data from localStorage:', error)
					// Invalid data - treat as no acceptance
					this.previousAcceptance = null
				}
			}
		},

		/**
		 * Handle license acceptance
		 *
		 * Stores acceptance data in localStorage as JSON object containing
		 * version, acceptance flag, and timestamp. Then redirects to simulator.
		 *
		 * @returns {void}
		 */
		handleAccept() {
			const licenseData = {
				accepted: true,
				version: this.licenseVersion,
				acceptedDate: new Date().toISOString(),
			}
			localStorage.setItem(this.$constants.STORAGE_KEYS.LICENSE_ACCEPTANCE, JSON.stringify(licenseData))
			this.$router.push('/simulator')
		},

		/**
		 * Handle license decline
		 *
		 * @returns {void}
		 */
		handleDecline() {
			this.showDeclineDialog = true
		},

		/**
		 * Format ISO date string to human-readable format
		 *
		 * @param {string} isoDate - ISO 8601 date string
		 * @returns {string} Formatted date string (e.g., "January 15, 2025")
		 */
		formatDate(isoDate: string) {
			if (!isoDate) return 'Unknown date'
			try {
				const date = new Date(isoDate)
				return date.toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				})
			} catch (error) {
				console.error('Failed to format date:', error)
				return 'Unknown date'
			}
		},
	},
})
</script>

<style scoped>
.license-page {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100vh;
	padding: 20px;
	background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
}

.license-card {
	width: 100%;
	max-width: 1200px;
}

.header {
	text-align: center;
	padding: 20px 20px 10px;
}

.header h1 {
	font-size: 2em;
	margin: 0 0 10px;
	color: var(--el-color-primary);
}

.subtitle {
	font-size: 1.2em;
	margin: 0;
	color: var(--el-text-color-secondary);
}

.version-info {
	margin-top: 15px;
	padding-top: 15px;
	border-top: 1px solid var(--el-border-color);
}

.version-change-notice {
	font-size: 0.85em;
	color: var(--el-color-warning);
	background-color: var(--el-fill-color-darker);
	padding: 10px;
	border-radius: 4px;
	margin: 10px 0 0;
	border-left: 3px solid var(--el-color-warning);
}

.version-change-notice strong {
	color: var(--el-color-warning-light-3);
}

.license-content {
	padding: 0 20px 20px;
}

.license-text {
	font-size: 1.2em;
	line-height: 1.8;
	color: var(--el-text-color-primary);
	padding: 0 20px 10px;
	overflow-wrap: break-word;
	white-space: normal;
}

/* Styles for dynamically injected v-html content need :deep() to penetrate scoped styles */

/* Hide the first h1 since card header already shows the title */
.license-text :deep(h1:first-child) {
	display: none;
}

.license-text :deep(h1) {
	margin-top: 40px;
	margin-bottom: 20px;
	color: var(--el-color-primary);
	font-size: 1.8em;
	border-bottom: 2px solid var(--el-color-primary);
	padding-bottom: 10px;
}

.license-text :deep(h2) {
	margin-top: 40px;
	margin-bottom: 20px;
	color: var(--el-text-color-primary);
	font-size: 1.5em;
	border-bottom: 1px solid var(--el-border-color);
	padding-bottom: 8px;
}

.license-text :deep(h3) {
	margin-top: 30px;
	margin-bottom: 15px;
	color: var(--el-text-color-primary);
	font-size: 1.2em;
}

.license-text :deep(h1:first-child),
.license-text :deep(h2:first-child),
.license-text :deep(h3:first-child) {
	margin-top: 0;
}

.license-text :deep(p) {
	margin-bottom: 20px;
}

.license-text :deep(p:empty) {
	height: 10px;
	margin: 0;
}

.license-text :deep(ul),
.license-text :deep(ol) {
	margin: 20px 0;
	padding-left: 30px;
}

.license-text :deep(li) {
	margin-bottom: 12px;
}

/* Add spacing after list sections */
.license-text :deep(ul + p),
.license-text :deep(ol + p),
.license-text :deep(ul + h2),
.license-text :deep(ol + h2),
.license-text :deep(ul + h3),
.license-text :deep(ol + h3) {
	margin-top: 25px;
}

.license-text :deep(code) {
	background-color: var(--el-fill-color-dark);
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 0.9em;
}

.license-text :deep(pre) {
	background-color: var(--el-fill-color-dark);
	padding: 15px;
	border-radius: 5px;
	overflow-x: auto;
	margin: 10px 0;
}

.license-text :deep(pre code) {
	background-color: transparent;
	padding: 0;
}

.license-text :deep(blockquote) {
	border-left: 4px solid var(--el-border-color);
	padding-left: 15px;
	margin: 15px 0;
	color: var(--el-text-color-secondary);
	font-style: italic;
}

.license-text :deep(a) {
	color: var(--el-color-primary);
	text-decoration: none;
}

.license-text :deep(a:hover) {
	text-decoration: underline;
}

.license-text :deep(strong) {
	font-weight: bold;
}

.license-text :deep(em) {
	font-style: italic;
}

.license-text :deep(hr) {
	border: none;
	border-top: 1px solid var(--el-border-color);
	margin: 20px 0;
}

.footer-buttons {
	display: flex;
	justify-content: space-between;
	gap: 10px;
	padding: 10px 20px;
}
</style>
