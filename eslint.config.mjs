/**
 * ESLint Configuration (Flat Config - ES Module)
 *
 * Modern ESLint configuration using ES Module syntax and flat config format.
 * Configured for Vue 3 Options API + TypeScript + Electron + Vite project.
 *
 * Get the requirements here:
 * https://eslint.org/docs/latest/use/configure/configuration-files#flat-configuration
 * https://eslint.org/docs/latest/rules/
 * https://eslint.vuejs.org/rules/
 */

import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
	// Recommended base configuration
	js.configs.recommended,

	// Vue 3 recommended configuration
	...pluginVue.configs['flat/recommended'],

	// Global configuration
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				// Browser globals
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
				console: 'readonly',
				setTimeout: 'readonly',
				setInterval: 'readonly',
				clearTimeout: 'readonly',
				clearInterval: 'readonly',
				requestAnimationFrame: 'readonly',
				cancelAnimationFrame: 'readonly',
				performance: 'readonly',

				// Standard Web APIs
				localStorage: 'readonly',
				Image: 'readonly', // Image constructor
				FileReader: 'readonly', // File reading API
				fetch: 'readonly', // Fetch API

				// Encoding/decoding (used in various places) Standard in browsers
				btoa: 'readonly',
				atob: 'readonly',  // Add atob too while we're at it

				// Node.js globals (for backend files)
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',

				// Custom project globals (defined by Vite)
				__DEV__: 'readonly',
				__PROD__: 'readonly',
				__DEBUG__: 'readonly',
			},
		},

		rules: {
			// ═══════════════════════════════════════════════════════════
			//               V U E   S P E C I F I C   R U L E S
			// ═══════════════════════════════════════════════════════════

			// Allow single-word component names (e.g., "App", "NewsHeadline")
			'vue/multi-word-component-names': 'off', // I WILL allow this, eg. Clubs, People, Player etc.

			// Disable PascalCase enforcement for component names in templates
			// (Element Plus uses kebab-case: el-card, el-button, etc.)
			// 'vue/component-name-in-template-casing': 'off',

			// Enforce consistent tab indentation in templates
			'vue/html-indent': ['error', 'tab', {
				attribute: 1,
				baseIndent: 1,
				closeBracket: 0,
				alignAttributesVertically: true,
			}],

			// Enforce max attributes per line (4 on single line, then multiline)
			'vue/max-attributes-per-line': ['error', {
				singleline: 4,      // Allow up to 4 attributes on a single line
				multiline: 1,       // Only 1 attribute per line in multiline declarations
			}],

			// Disable singleline element content newline (too restrictive)
			// 'vue/singleline-html-element-content-newline': 'off', // WRONG! WE **DO** REQUIRE THIS!

			// Disable prop mutation warnings (intentional v-model usage on props)
			// 'vue/no-mutating-props': 'off', // WRONG! WE **DO** REQUIRE THIS!

			// Disable attribute order warnings (too noisy for existing codebase)
			// 'vue/attributes-order': 'off', // WRONG! WE **DO** REQUIRE THIS!

			// Disable component property order (existing code has different conventions)
			// 'vue/order-in-components': 'off', // WRONG! WE **DO** REQUIRE THIS!

			// Disable attribute hyphenation (v-model:selectedDatabase is valid)
			// 'vue/attribute-hyphenation': 'off', // WRONG! WE **DO** REQUIRE THIS!

			// Warn on missing explicit emits (helpful but not critical)
			// 'vue/require-explicit-emits': 'warn', // WRONG! WE **DO** REQUIRE THIS!

			// Allow reserved names for Element Plus globally registered components
			'vue/no-reserved-component-names': 'off',

			// Require v-bind:key with v-for
			'vue/require-v-for-key': 'error',

			// Disallow duplicate keys in components
			'vue/no-duplicate-attributes': 'error',

			// Enforce self-closing on void elements
			'vue/html-self-closing': ['error', {
				html: {
					void: 'always',
					normal: 'always',
					component: 'always',
				},
			}],

			'vue/padding-lines-in-component-definition': ['error', {
				betweenOptions: 'always',
				withinOption: 'always',
				groupSingleLineProperties: true,
			}],

			// ═══════════════════════════════════════════════════════════
			//           G E N E R A L   J A V A S C R I P T
			// ═══════════════════════════════════════════════════════════

			// Warn on unused variables (allow underscore prefix for intentionally unused)
			'no-unused-vars': ['warn', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
			}],

			// Disallow console.log in production (warn in development)
			'no-console': 'off', // Allow console logs (they're stripped in production build)

			// Disallow debugger statements in production
			'no-debugger': 'warn',

			// Require === and !== instead of == and !=
			'eqeqeq': ['error', 'always', { null: 'ignore' }],

			// Disallow unreachable code
			'no-unreachable': 'error',

			// Disallow constant conditions (except in loops)
			'no-constant-condition': ['error', { checkLoops: false }],

			// Warn on empty catch blocks
			'no-empty': ['warn', { allowEmptyCatch: false }],

			// ═══════════════════════════════════════════════════════════
			//                 C O D E   S T Y L E
			// ═══════════════════════════════════════════════════════════

			// Enforce single quotes (except for avoiding escapes)
			'quotes': ['warn', 'single', { avoidEscape: true }],

			// Disallow semicolons (project style)
			'semi': ['error', 'never'],

			// Require trailing commas in multiline (project style)
			'comma-dangle': ['warn', 'always-multiline'],

			// Enforce consistent indentation (tabs)
			'indent': ['warn', 'tab', {
				SwitchCase: 1,
				ignoredNodes: ['TemplateLiteral'],
			}],

			// Enforce consistent spacing
			'space-before-function-paren': ['warn', {
				anonymous: 'never',
				named: 'never',
				asyncArrow: 'always',
			}],

			// Disallow trailing whitespace
			'no-trailing-spaces': 'warn',

			// Require newline at end of file
			'eol-last': ['warn', 'always'],

			// Enforce LF line endings (Unix-style) on all platforms
			'linebreak-style': ['error', 'unix'],

			// Disallow multiple empty lines
			'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 0 }],
		},
	},

	// Ignore patterns (replaces .eslintignore)
	{
		ignores: [
			'**/node_modules/**',
			// Build artifacts
			'**/out/**',
			'**/out-*/**',
			'**/build/**',
			'**/dist/**',
			'**/.vite/**',
			// Other
			'**/coverage/**',
			'**/*.min.js',
			// Ignore backups and copies
			'**/*[bB][aA][cC][kK][uU][pP]*',
			'**/*[cC][oO][pP][yY]*',
			// Ignore "Old" files (case insensitive, whole word only - surrounded by non-alpha)
			'**/*[-_.][oO][lL][dD][-_.].*', // e.g. file-old-version.js
			'**/*[-_.][oO][lL][dD].*',      // e.g. file-old.js
			'**/[oO][lL][dD][-_.].*',       // e.g. old-file.js
			// Ignore files starting with underscore (disabled/WIP files)
			'**/_*',
		],
	},

	// TypeScript files configuration
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			// Disable base ESLint rules that conflict with TypeScript
			'no-unused-vars': 'off',
			'no-undef': 'off',

			// Enable TypeScript-specific rules
			'@typescript-eslint/no-unused-vars': ['warn', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
			}],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',

			// Maintain project style for TypeScript
			'quotes': ['warn', 'single', { avoidEscape: true }],
			'semi': ['error', 'never'],
			'comma-dangle': ['warn', 'always-multiline'],
			'indent': ['warn', 'tab'],
			'no-trailing-spaces': 'warn',
			'eol-last': ['warn', 'always'],
			'linebreak-style': ['error', 'unix'],
		},
	},

	// Vue files with TypeScript (<script lang="ts">)
	{
		files: ['**/*.vue'],
		languageOptions: {
			parserOptions: {
				parser: tsparser,
				ecmaVersion: 2022,
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
		},
		rules: {
			// Disable base ESLint rules that conflict with TypeScript
			'no-unused-vars': 'off',
			'no-undef': 'off',

			// Enable TypeScript-specific rules
			'@typescript-eslint/no-unused-vars': ['warn', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
			}],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
		},
	},
]
