/**
 * Stylelint Configuration
 *
 * Standard configuration for CSS and Vue files.
 * Targets Chrome 142 compatibility.
 */

/** @type {import('stylelint').Config} */
export default {
	// Base config for standard CSS
	extends: [
		'stylelint-config-standard',
	],

	rules: {
		// FC Tycoon specific overrides
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: ['forward', 'use', 'mixin', 'include', 'extend'],
			},
		],
		'selector-class-pattern': null, // Allow BEM and other patterns
		'no-descending-specificity': null, // Allow overrides
		'font-family-no-missing-generic-family-keyword': null, // Allow specific fonts
	},

	// Specific configuration for Vue files
	overrides: [
		{
			files: ['**/*.{vue,html}'],
			extends: ['stylelint-config-recommended-vue'],
		},
	],
}
