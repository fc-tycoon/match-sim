# Coding Style Guidelines

## General JavaScript and TypeScript Style

- **TypeScript**: Preferred for new modules and utilities; JavaScript allowed for existing code and Vue components
- **Type Safety**: Use TypeScript for complex logic, event schedulers, and core systems
- **JSDoc**: Still useful for JavaScript files and external documentation
- Use tabs for indentation (4 spaces equivalent)
- Single quotes for strings
- No semicolons
- Trailing comma on multi-line objects and arrays
- No tabs or whitespace on blank lines
- No trailing whitespace at the end of lines
- Vue 3.5 with Options API, NOT Composition API
- Template uses tabs for indentation, and double quotes for attribute properties
- CSS framework: Element Plus v2.11

## JavaScript and TypeScript Standards

- **Indentation**: Use tabs consistently across all files, including `.js`, `.ts`, `.vue`, `.json`, `.css`, `.html` etc.
- **Semicolons**: None - use automatic semicolon insertion
- **Quotes**: Single quotes for strings, double quotes only when escaping is needed. Double quotes in `.html` and Vue.js `<template>` section.
- **Imports**: Use ESM import/export syntax
- **Async/Await**: Prefer async/await over Promises
- **Arrow Functions**: Use for callbacks and short functions
- **Destructuring**: Use object and array destructuring when appropriate
- **Trailing Commas**: Required on multi-line objects, arrays, and imports (but NOT function calls or definitions)
- **Whitespace**: No tabs or spaces on blank lines, no trailing whitespace
- **TypeScript Types**: Prefer interfaces over type aliases for object shapes; use type aliases for unions/intersections
- **Type Annotations**: Add explicit return types for public functions; parameter types always required

## Vue Component Structure

```vue
<template>
	<div class="component-name">
		<el-button @click="handleClick">Click me</el-button>
	</div>
</template>

<script>
export default {
	name: 'ComponentName',
	components: {
		// Component imports with trailing commas
		SomeComponent,
		AnotherComponent,
	},
	props: {
		// Props definition with trailing commas
		title: {
			type: String,
			required: true,
		},
		data: {
			type: Object,
			default: () => ({}),
		},
	},
	data() {
		return {
			message: 'hello world',
			items: [
				'item1',
				'item2',
				'item3',
			],
		}
	},
	computed: {
		// Computed properties with trailing commas
		formattedMessage() {
			return this.message.toUpperCase()
		},
		itemCount() {
			return this.items.length
		},
	},
	watch: {
		// Watchers with trailing commas
		message(newVal, oldVal) {
			console.log('Message changed:', newVal)
		},
	},
	mounted() {
		// Lifecycle hooks
		this.initializeComponent()
	},
	methods: {
		handleClick() {
			console.log(this.message)
		},
		initializeComponent() {
			// Setup logic
		},
	},
}
</script>

<style scoped>
/* Component-specific styles */
.component-name {
	/* Use tabs for indentation, no trailing whitespace */
	padding: 20px;
	margin: 0;
}
</style>
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `PlayerCard.vue`)
- **Files**: kebab-case (e.g., `match-engine.js`)
- **Directories**: kebab-case (e.g., `match-simulation/`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PLAYERS`)
- **Functions**: camelCase (e.g., `getPlayerStats`)

## Whitespace and Formatting Standards

### Indentation

- **All Files**: Use tabs for indentation (equivalent to 4 spaces)
- **Consistency**: Never mix tabs and spaces
- **Nested Structures**: Each level increases by one tab

### Line Management

- **Blank Lines**: Must be completely empty with no tabs, spaces, or any whitespace characters
- **Trailing Whitespace**: No trailing whitespace allowed at the end of any line
- **Line Breaks**: Use consistent line breaks between logical sections
- **Long Lines**: Prefer longer single lines over multi-line formatting
- **Function Call Exception**: Only break function calls if they exceed ~180 characters, then break after opening parenthesis with tab indentation

### Trailing Commas

- **Required**: All multi-line structures must have trailing commas (except functions)
- **Objects**: Properties in object literals
- **Arrays**: Elements in array literals
- **Imports**: Named imports when spread across multiple lines
- **Vue Components**: All component options (components, props, data, computed, methods, etc.)
- **Functions**: Keep both definitions and calls on single line, no trailing commas
  - **Exception**: If function call exceeds ~180 characters, break after opening parenthesis with tab indentation

### Examples of Proper Formatting

#### Object Definitions

```javascript
const playerConfig = {
	name: 'Lionel Messi',
	position: 'RW',
	age: 36,
	stats: {
		pace: 85,
		shooting: 92,
		passing: 91,
	},
}
```

#### Array Definitions

```javascript
const positions = [
	'GK',
	'CB',
	'LB',
	'RB',
	'CDM',
	'CM',
	'CAM',
	'LW',
	'RW',
	'ST',
]
```

#### Vue Component Options

```javascript
export default {
	name: 'PlayerCard',
	components: {
		PlayerStats,
		PlayerPhoto,
		ActionButtons,
	},
	props: {
		player: {
			type: Object,
			required: true,
		},
		showStats: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			isExpanded: false,
			selectedTab: 'overview',
		}
	},
	computed: {
		playerAge() {
			return this.calculateAge(this.player.birthDate)
		},
		positionLabel() {
			return this.formatPosition(this.player.position)
		},
	},
	methods: {
		calculateAge(birthDate) {
			// Implementation
		},
		formatPosition(position) {
			// Implementation
		},
		toggleExpanded() {
			this.isExpanded = !this.isExpanded
		},
	},
}
```

#### Function Definitions and Calls

```javascript
// Keep function definitions on single line
async function updatePlayerStats(playerId, matchId, goals, assists, rating) {
	// Implementation
}

// Keep function calls on single line (prefer longer lines over multi-line)
const result = await updatePlayerStats(player.id, match.id, goalsScored, assistsMade, performanceRating)

// Another example with method calls
const playerStats = await this.calculatePlayerStats(playerId, seasonId, includeAdvanced, filterByPosition)

// Only if absolutely necessary (180+ characters), break after opening parenthesis
const veryLongResult = await someVeryLongFunctionNameWithManyParameters(firstParam, secondParam, thirdParam,
	fourthParam, fifthParam, sixthParam, seventhParam)
```

## Code Organization

- **Imports**: Group imports by type (external libraries, internal modules, relative imports)
- **Component Structure**: Follow the order: name, components, props, data, computed, watch, lifecycle hooks, methods
- **Methods**: Group related methods together
- **Comments**: Use JSDoc for function documentation, inline comments for complex logic
- **Trailing Commas**: Always use trailing commas in multi-line structures:
  - Component imports and exports
  - Object properties and method definitions
  - Array elements
  - Import statements when spread across multiple lines
  - Vue component options (props, data, computed, methods, etc.)
  - **NOT for functions**: Keep function definitions and calls on single line
- **Blank Lines**: Keep blank lines clean with no tabs or spaces
- **Line Endings**: No trailing whitespace at the end of any line

## CSS Guidelines

- **Scoped Styles**: Use `scoped` attribute for component-specific styles
- **Class Naming**: Use BEM methodology or similar semantic naming
- **Indentation**: Use tabs consistently, no spaces
- **Properties**: Group related properties together
- **Responsive Design**: Use CSS Grid and Flexbox for layouts
- **Whitespace**: No trailing whitespace, clean blank lines without tabs or spaces
- **Formatting**: Each property on its own line with trailing semicolons

## Error Handling

- **Async Operations**: Always use try-catch for async operations
- **User Feedback**: Provide clear error messages to users
- **Logging**: Use console.log for development, implement proper logging for production
- **Validation**: Validate inputs and provide helpful error messages
- **MessageBox Separation**: Always wrap Element Plus MessageBox/confirmation dialogs in separate try-catch blocks, isolated from business logic
- **MessageBox Pattern**: Use separate try-catch for user confirmation, then separate try-catch for the actual operation

### MessageBox Error Handling Pattern

```javascript
// ❌ Incorrect: Mixing confirmation with business logic
async handleAction() {
	try {
		const result = await ElMessageBox.confirm('Are you sure?', 'Confirm')
		if (result === 'confirm') {
			await this.performOperation()
			ElMessage.success('Success!')
		}
	} catch (error) {
		if (error === 'cancel') return
		ElMessage.error(`Failed: ${error.message}`)
	}
}

// ✅ Correct: Separate confirmation from business logic
async handleAction() {
	// Handle confirmation dialog separately
	try {
		const result = await ElMessageBox.confirm('Are you sure?', 'Confirm')
		if (result !== 'confirm') return
	} catch {
		// User cancelled - just return
		return
	}

	// Handle business logic separately
	try {
		await this.performOperation()
		ElMessage.success('Success!')
	} catch (error) {
		console.error('Failed to perform operation:', error)
		ElMessage.error(`Failed: ${error.message}`)
	}
}
```

## Performance Considerations

- **Lazy Loading**: Use dynamic imports for code splitting
- **Memoization**: Use computed properties and watchers appropriately
- **Event Handling**: Remove event listeners in beforeDestroy/unmounted
- **Large Lists**: Use virtual scrolling for long lists

## Testing Guidelines

- **General**: Favor NOT writing any tests, as we need faster iteration speeds
- **Unit Tests**: Test individual component methods
- **Integration Tests**: Test component interactions
- **Mock Data**: Use consistent mock data patterns
- **Test Naming**: Use descriptive test names that explain the expected behavior

## Documentation Standards

- **JSDoc**: Use for all public functions and methods
- **README Files**: Include setup instructions and usage examples
- **Code Comments**: Explain complex logic, not obvious code
- **API Documentation**: Document all public interfaces

## Example JSDoc

```javascript
/**
 * Calculates player performance rating for a match
 * @param {number} playerId - The unique identifier of the player
 * @param {number} matchId - The match identifier
 * @param {Object} stats - Match statistics object
 * @param {number} stats.goals - Goals scored
 * @param {number} stats.assists - Assists provided
 * @param {number} stats.passAccuracy - Pass accuracy percentage (0-100)
 * @returns {Promise<number>} Performance rating (0-10)
 * @throws {Error} When player or match data is invalid
 */
async calculatePerformanceRating(playerId, matchId, stats) {
	try {
		// Implementation
		return rating
	} catch (error) {
		console.error('Failed to calculate rating:', error)
		throw new Error(`Unable to calculate rating for player ${playerId}`)
	}
}
```

## Best Practices

- **Readability**: Write code for clarity first, optimization second
- **Maintainability**: Use clear names and avoid magic numbers
- **Consistency**: Follow established patterns in the codebase
- **Refactoring**: Extract complex logic into separate methods
- **Error Boundaries**: Implement proper error handling at component boundaries

Write code for clarity first. Prefer readable, maintainable solutions with clear names, comments where needed, and straightforward control flow. Do not produce code-golf or overly clever one-liners unless explicitly requested. Use high verbosity for writing code and code tools.

Be THOROUGH when gathering information. Make sure you have the FULL picture before replying. Use additional tool calls or clarifying questions as needed.

## Common Formatting Mistakes to Avoid

### ❌ Incorrect Examples

```javascript
// Missing trailing commas
export default {
	name: 'Component',
	components: {
		SomeComponent
	},
	data() {
		return {
			items: ['a', 'b', 'c']
		}
	}
}

// Mixing tabs and spaces
	data() {
		return {              // ← spaces instead of tabs
			message: 'hello'  // ← mixing tabs and spaces
		}
	}

// Trailing whitespace (invisible but problematic)
	const player = 'Messi'    // ← trailing spaces here
	
	// ← tabs or spaces on blank line above

// Multi-line function calls (avoid this - prefer single line)
const result = await someFunction(
	param1,
	param2,
	param3
)
```

### ✅ Correct Examples

```javascript
// Proper trailing commas
export default {
	name: 'Component',
	components: {
		SomeComponent,
	},
	data() {
		return {
			items: ['a', 'b', 'c'],
		}
	},
}

// Consistent tab indentation
	data() {
		return {
			message: 'hello',
		}
	},

// Clean lines with no trailing whitespace
	const player = 'Messi'

	// Clean blank line above (no tabs or spaces)

// Keep function calls on single line (prefer longer lines)
const result = await someFunction(param1, param2, param3)

// If absolutely necessary (180+ characters), break after opening parenthesis
const longResult = await veryLongFunctionName(firstParam, secondParam, thirdParam,
	fourthParam, fifthParam)
```

### Editor Configuration

To maintain these standards, configure your editor:
- **Show whitespace characters** to see trailing spaces and tabs
- **Auto-trim trailing whitespace** on save
- **Insert tabs** instead of spaces for indentation
- **Add trailing commas automatically** for multi-line structures
