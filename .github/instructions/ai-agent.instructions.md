---
applyTo: '**'
---

# FC Tycoon 2027 Match Simulator - AI Agent Instructions

**Match Simulator Project** - Browser-based football/soccer match engine for testing and development.

---


## Project Overview

**FC Tycoon Match Simulator** is a browser-based football/soccer match engine with:
- Deterministic physics simulation
- AI-driven player behavior
- Real-time and headless execution modes
- Comprehensive replay system
- 3D visualization with Three.js WebGPU

**Purpose**: Community testing and development environment for match engine AI and physics.

---

## Technology Stack

**Core Technologies**:
- **JavaScript ES6+** and **TypeScript 5.x** - TypeScript preferred for new modules, JavaScript for existing code and Vue components
- **Vue.js 3.5** - Options API only (NOT Composition API)
- **Element Plus 2.11** - UI component library (Dark theme)
- **Three.js r180** - 3D rendering with WebGPU (fallback to WebGL2)
- **Vite 7.x** - Build tool and development server
- **marked 17.0** - Markdown parsing

**Development Tools**:
- **ESLint 9.x** - Code quality and linting
- **Stylelint** - CSS/Vue style linting
- **VS Code** - Recommended IDE

---

## Project Structure

```
match-sim/
├── docs/                    # Documentation (architecture, systems, requirements)
├── src/                     # Source code
│   ├── main.ts              # Application entry point
│   ├── App.vue              # Root component
│   ├── router.ts            # Vue Router configuration
│   ├── globals.d.ts         # Global TypeScript declarations
│   ├── pages/               # Full-screen pages (Vue components)
│   ├── components/          # Reusable Vue components
│   ├── core/                # Core systems (Match, EventScheduler, Ball, etc.)
│   │   └── ai/              # Player AI systems (behaviors, brains, vision)
│   ├── store/               # Vue stores (match, settings, events, database)
│   ├── modules/             # Feature modules (match-engine, etc.)
│   ├── roles/               # Player role definitions (JSON)
│   ├── exports/             # Exported data (formations, positions, slots)
│   └── utils/               # Utility functions
├── .github/                 # GitHub configuration
│   ├── instructions/        # AI agent instructions
│   └── CODING_STYLE.md      # Detailed coding style guidelines
├── licenses/                # Third-party license files
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── eslint.config.mjs        # ESLint configuration
├── stylelint.config.mjs     # Stylelint configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
├── robots.txt               # AI crawler restrictions
└── LICENSE.md               # Source-available license (v1.1)
```

---

## Development Workflow

### Commands
```bash
npm install       # Install dependencies
npm start         # Start development server with hot reload
npm run build     # Build for production
npm run lint      # Check code quality
```

### Workflow Rules
1. **Default Mode**: Vite hot module reload runs in background
2. **After Large Edits**: Run `npm run build` to verify (new files, routes, major refactoring)
3. **Only When Requested**: Run `npm start` for testing with debug logs
4. **ESLint Validation** (REQUIRED): Run `npm run lint` after:
   - Multiple files modified
   - Any change requiring more than one line edit
   - New files created
   - New Vue component functionality
   - Refactoring functions or methods
   - Changes to component props, emits, or data structure
5. **Auto-Fix Linting**: Run `npm run lint:fix` after making edits to automatically fix formatting issues (indentation, spacing, etc.).

---

## Coding Standards

### Language & Style
- **TypeScript**: Preferred for new modules, utilities, and core systems
- **JavaScript**: Supported for existing code and Vue components
- **Vue.js**: Options API only - NOT Composition API
- **Indentation**: Tabs (4 spaces equivalent)
- **Quotes**: Single quotes (double only when escaping)
- **Semicolons**: NO semicolons
- **Trailing Commas**: Required on multi-line objects/arrays (NOT functions)
- **JSDoc**: Comprehensive documentation required for ALL functions

### File Naming
- **Components**: PascalCase (e.g., `PlayerCard.vue`)
- **Files**: kebab-case (e.g., `match-engine.js`)
- **Directories**: kebab-case (e.g., `match-simulation/`)

### Class Structure & Performance
- **Immutability**: Use `Object.freeze(this)` or `Object.seal(this)` at the end of constructors.
  - **Purpose**: Prevents adding new properties after construction, enforcing explicit structure and aiding V8 JIT optimization.
  - **Scope**: Recommended for all classes, especially `readonly` data structures.
  - **Note**: This is a shallow operation (does not deep-freeze arrays or child objects).

---

## AI Agent Responsibilities

The AI Agent will:
* Ask clarifying questions when requirements are ambiguous
* Document requirements ONLY WHEN ASKED (in `ai-tasks/` folder)
* Implement in small, manageable increments
* ALWAYS respect manual changes (prompt before overriding)
* Provide comprehensive JSDoc documentation
* Clean up debug logs before considering task "done"
* ALWAYS suggest Next Steps after tasks
* WAIT for user approval before proceeding with suggestions

### CRITICAL: Documentation Synchronization Rule

**When changing code logic, function names, method signatures, or APIs, the AI Agent MUST:**

1. **MANDATORY SEARCH**: Search for ALL references in `/docs/` and source files to the old code
2. **UPDATE ALL MATCHES**: Change every reference in documentation files to match new implementation
3. **FILES TO CHECK**:
   - All `.md` files in `/docs/`
   - JSDoc comments in source files
   - Code examples in documentation
   - Architecture diagrams or descriptions
   - Header comments in all affected files
4. **VERIFICATION**: Search again after changes to confirm no old references remain
5. **NO EXCEPTIONS**: This applies to ALL code changes, including:
   - Function/method renames
   - Parameter changes
   - Return type changes
   - API endpoint changes
   - Class/interface renames
   - Module/file renames

**Failure to update documentation is considered an incomplete task.**

---

## Next Steps Protocol

After EVERY task, the AI Agent MUST:
1. Provide specific, actionable "Next Steps" suggestions
2. Include: enhancements, new features, refactoring, follow-ups
3. WAIT for user approval before proceeding
4. NOT assume the task is "complete" or "done"

---

For detailed coding style guidelines, see `CODING_STYLE.md` in the `.github/` directory.
