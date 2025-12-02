/**
 * Global build-time constants injected by Vite during compilation.
 *
 * These constants are defined in `build-config.mjs` and replaced at build time
 * via Vite's `define` configuration in `vite.main.config.mjs` and `vite.renderer.config.mjs`.
 *
 * Values are determined by the active build profile:
 * - Development builds: __DEV__=true, __PROD__=false, __DEBUG__=true
 * - Production builds: __DEV__=false, __PROD__=true, __DEBUG__=false
 *
 * @example
 * // Conditional logic based on build environment
 * if (__DEV__) {
 *   console.log('Running in development mode')
 * }
 *
 * if (__DEBUG__) {
 *   // Include verbose logging or debugging features
 * }
 */

/**
 * Development mode flag.
 * True when running in development (npm start), false in production builds.
 */
declare const __DEV__: boolean

/**
 * Production mode flag.
 * True when building for production (npm run make), false in development.
 */
declare const __PROD__: boolean

/**
 * Debug mode flag.
 * True when debugging features should be enabled (console logs, verbose output, etc.).
 */
declare const __DEBUG__: boolean
