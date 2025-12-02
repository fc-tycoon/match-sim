/**
 * Vue Single File Component shims for both relative and alias-based imports.
 */
declare module '*.vue' {
	import type { DefineComponent } from 'vue'
	const component: DefineComponent<Record<string, never>, Record<string, never>, any>
	export default component
}

declare module '@/*.vue' {
	import type { DefineComponent } from 'vue'
	const component: DefineComponent<Record<string, never>, Record<string, never>, any>
	export default component
}

/**
 * Vue global property type augmentation.
 * Provides IntelliSense for global properties registered via app.config.globalProperties.
 */
import type { match } from '@/store/match'
import type { settings } from '@/store/settings'
import type { events } from '@/store/events'
import type { assets } from '@/store/assets'
import type { renderer } from '@/store/renderer'
import type * as constants from '@/constants'

declare module 'vue' {
	interface ComponentCustomProperties {
		/** Reactive match state store */
		$match: typeof match
		/** Reactive settings store */
		$settings: typeof settings
		/** Reactive events/log store */
		$events: typeof events
		/** Assets store - 3D models, animations, textures */
		$assets: typeof assets
		/** Renderer store - shared 3D rendering resources */
		$renderer: typeof renderer
		/** Application constants */
		$constants: typeof constants
	}
}
