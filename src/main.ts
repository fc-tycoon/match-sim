/**
 * FC Tycoon™ 2027 Match Simulator - Application Entry Point
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import * as constants from '@/constants'

// Store Plugins
import settingsPlugin from '@/store/settings'
import eventsPlugin from '@/store/events'
import matchPlugin from '@/store/match'
import assetsPlugin, { assets } from '@/store/assets'
import rendererPlugin, { renderer } from '@/store/renderer'

// Element Plus imports
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Create Vue app
const app = createApp(App)

// Enable Element Plus dark mode
document.documentElement.classList.add('dark')

// Register global constants plugin
app.config.globalProperties.$constants = constants

// Register plugins
app.use(settingsPlugin)
app.use(eventsPlugin)
app.use(matchPlugin)
app.use(assetsPlugin)
app.use(rendererPlugin)

// Use Element Plus
app.use(ElementPlus)

// Register all Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
	app.component(key, component)
}

// Use router
app.use(router)

// Start loading assets immediately (non-blocking)
// This runs in the background while the app mounts
assets.startBackgroundLoad().catch(err => {
	console.error('[Main] Failed to start asset loading:', err)
})

// Also start renderer asset loading (same thing, but via renderer store)
renderer.loadAssets().catch(err => {
	console.error('[Main] Failed to load renderer assets:', err)
})

// Mount app
app.mount('#app')
