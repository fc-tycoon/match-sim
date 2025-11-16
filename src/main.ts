/**
 * FC Tycoon™ 2027 Match Simulator - Application Entry Point
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * Licensed under FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import * as constants from '@/utils/constants'

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

// Use Element Plus
app.use(ElementPlus)

// Register all Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
	app.component(key, component)
}

// Use router
app.use(router)

// Mount app
app.mount('#app')
