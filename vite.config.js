import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * These constants are defined for FC Tycoon game code compatibility
 * They are used in the codebase to conditionally include/exclude
 * development-only or production-only code.
 * They are hardcoded here because this is a development setup.
 * We try to maintain compatibility between this project and
 * the main FC Tycoon codebase as much as possible.
 */
const __DEV__ = true
const __PROD__ = !__DEV__
const __DEBUG__ = true

// https://vitejs.dev/config/
export default defineConfig({
	define: {
		__DEV__,
		__PROD__,
		__DEBUG__,
	},
	plugins: [
		vue(),
	],
	publicDir: 'assets',
	build: {
		sourcemap: __DEBUG__,
		reportCompressedSize: false,
		chunkSizeWarningLimit: 99999999,
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		open: true,
	},
})
