# Match Engine Registry

## Overview

The Match Engine Registry is a centralized system for discovering, registering, and selecting different implementation components for the match simulation.

## Registry Purpose

The registry allows modular match engine components to be:

1. **Discovered**: Automatically detected from designated folders
2. **Registered**: Self-declare their capabilities and interfaces
3. **Selected**: Chosen independently for different teams and roles
4. **Configured**: Set up with specific parameters before match start

## Registrable Components

### Component Types

The registry supports registration of the following component types:

#### 1. Outfield AI Engines

- **Interface**: Extends `OutfieldAI` base class
- **Selection Scope**: Per-team (Team 1 and Team 2 can use different engines)
- **Purpose**: Controls all outfield players for a team
- **Registration**: Declares itself as an "Outfield AI" implementation

#### 2. Goalkeeper AI Engines

- **Interface**: Extends `GoalkeeperAI` base class
- **Selection Scope**: Per-goalkeeper (each goalkeeper can use different engine)
- **Purpose**: Controls a single goalkeeper
- **Registration**: Declares itself as a "Goalkeeper AI" implementation

#### 3. Ball Physics Engines

- **Interface**: Extends `BallPhysics` base class
- **Selection Scope**: Match-wide (single engine per match)
- **Purpose**: Simulates ball movement, flight, bounce, spin
- **Registration**: Declares itself as a "Ball Physics" implementation

#### 4. Referee Engines

- **Interface**: Extends `Referee` base class
- **Selection Scope**: Match-wide (single engine per match)
- **Purpose**: Controls match flow, rules enforcement, timing
- **Registration**: Declares itself as a "Referee" implementation

## Match Engine Folders

### Folder Structure

Developers create match engine implementations in designated folders:

**Directory Layout**:
- `/match-engines/` - Root folder for all engine implementations
  - `simple-ai/` - Example: Basic AI engine with outfield + goalkeeper AI
  - `advanced-physics/` - Example: Physics-only engine with ball physics
  - `realistic-referee/` - Example: Referee-only engine
  - `experimental-ai/` - Example: Full engine with all components

Each engine folder contains:
- `manifest.json` - Component declarations and metadata
- Component files (e.g., `OutfieldAI.js`, `GoalkeeperAI.js`, `BallPhysics.js`, `Referee.js`)

### Manifest File

Each match engine folder contains a manifest.json file declaring its components:

**Required Fields**:
- **name**: Engine name (e.g., "Simple AI Engine")
- **version**: Semantic version (e.g., "1.0.0")
- **author**: Developer name
- **description**: Brief description of AI implementation

**Components**:
- **outfieldAI**: Enabled flag, file path, class name, description
- **goalkeeperAI**: Enabled flag, file path, class name, description
			"file": "GoalkeeperAI.js",
			"class": "SimpleGoalkeeperAI",
			"description": "Basic goalkeeper AI"
		},
		"ballPhysics": {
			"enabled": false
		},
		"referee": {
			"enabled": false
		}
	},

	"configuration": {
		"parameters": [
			{
				"name": "aggressiveness",
	**Optional Configuration Parameters**:
Components can expose configuration parameters:
- **name**: Parameter name
- **type**: Data type (number, boolean, string)
- **min/max**: Value constraints (for numbers)
- **default**: Default value
- **description**: Human-readable description

Example parameter: "aggressiveness" (number, 0-100, default 50, controls AI aggressiveness level)

## Component Selection

### Selection Interface

The match configuration screen allows independent selection of:

#### Team 1 Configuration

- **Outfield AI Engine**: Dropdown list of registered outfield AI engines
- **Goalkeeper AI Engine**: Dropdown list of registered goalkeeper AI engines

#### Team 2 Configuration

- **Outfield AI Engine**: Dropdown list of registered outfield AI engines (independent from Team 1)
- **Goalkeeper AI Engine**: Dropdown list of registered goalkeeper AI engines (independent from Team 1)

#### Match-Wide Configuration

- **Ball Physics Engine**: Dropdown list of registered ball physics engines
- **Referee Engine**: Dropdown list of registered referee engines

### Example Configuration

**Team 1**:
- Outfield AI: "Advanced Tactical AI v2"
- Goalkeeper AI: "Reactive Goalkeeper AI v1"

**Team 2**:
- Outfield AI: "Simple AI Engine v1"
- Goalkeeper AI: "Advanced Goalkeeper AI v3"

**Match Settings**:
- Ball Physics: "Realistic Physics Engine v2"
- Referee: "Standard Referee v1"

This allows asymmetric matches where:
- Team 1 uses advanced AI while Team 2 uses basic AI
- Each goalkeeper uses specialized AI implementations
- Different physics or referee implementations can be tested

## Registry Implementation

### Discovery Process

On application startup:

1. **Scan Folders**: Recursively scan `/match-engines/` directory
2. **Read Manifests**: Parse each `manifest.json` file
3. **Validate Components**: Ensure declared components exist and implement correct interfaces
4. **Register Components**: Add valid components to appropriate registry categories
5. **Build UI Lists**: Populate dropdown selections with available components

### Component Categories

The registry maintains separate lists for each component type:

**Outfield AI Engines**:
- `id`: "simple-ai-outfield"
- `name`: "Simple AI Engine - Outfield"
- `version`: "1.0.0"
- `author`: "Developer Name"
- `description`: "Basic outfield player AI"
- `class`: SimpleOutfieldAI (class reference)
- `config`: Default parameters object

**Goalkeeper AI Engines**:
- `id`: "simple-ai-goalkeeper"
- `name`: "Simple AI Engine - Goalkeeper"
- Similar structure to outfield AI

**Ball Physics Engines**:
- `id`: "realistic-physics"
- `name`: "Realistic Physics Engine"
- Similar structure with physics-specific config
		// ... more physics engines
	],

**Registry Structure**:
Registry organizes engines by category:
- **outfieldAI**: Array of outfield AI engines (each with id, name, metadata)
- **goalkeeperAI**: Array of goalkeeper AI engines
- **ballPhysics**: Array of ball physics engines
- **referee**: Array of referee engines

Each engine entry includes identification, name, version, description, and configuration options.

## Configuration Screens

### Match Configuration Screen

Primary screen for setting up a match:

**Purpose**: Select AI engines, physics, and referee for the match

**Sections**:
1. Team 1 AI Selection
2. Team 2 AI Selection
3. Match Settings (Ball Physics, Referee)
4. Match Duration and Rules
5. Start Match Button

### Player Configuration Screen

Secondary screen for configuring individual players:

**Purpose**: Set attributes, playing styles, and roles for each player

**Access**: "Configure Players" button from Match Configuration Screen

**Initial Focus**: Realistic top-flight game without granular individual attributes

**Future Features**:
- Individual player attribute editing (1-99 scale)
- Playing style assignment
- Playing role assignment
- Formation position tweaking

### Engine Configuration Screen

Per-engine configuration for AI parameters:

**Purpose**: Adjust parameters specific to selected AI engine

**Dynamic UI**: Generated from engine's `manifest.json` configuration parameters

**Examples**:
- Aggressiveness slider (0-100)
- Pressing intensity toggle
- Tactical preset dropdown
- Risk-taking level slider

## Built-in vs. Custom Engines

### Built-in Engines

The application ships with default implementations:

- **Default Outfield AI**: Basic state-machine AI for testing
- **Default Goalkeeper AI**: Simple positioning and shot-stopping AI
- **Default Ball Physics**: Realistic physics with Magnus effect, drag, bounce
- **Default Referee**: Standard FIFA rules implementation

### Custom Engines

Developers can create custom engines by:

1. Creating a folder in `/match-engines/`
2. Implementing required base classes (OutfieldAI, GoalkeeperAI, BallPhysics, Referee)
3. Creating a `manifest.json` file declaring components
4. Reloading the application to register new engines

## Validation and Error Handling

### Component Validation

When registering components, the system validates:

- **File Exists**: Declared component files are present
- **Class Exists**: Exported class matches manifest declaration
- **Interface Compliance**: Class extends appropriate base class
- **Method Signatures**: Required methods are implemented

### Error Handling

If validation fails:

- **Log Warning**: Console warning with specific error
- **Skip Component**: Invalid component not added to registry
- **Continue Loading**: Other valid components still registered
- **UI Feedback**: Show warning icon next to problematic engine in lists

### Runtime Validation

During match initialization:

- **Verify Selection**: Ensure selected engines are still available
- **Fallback to Default**: If engine missing, use built-in default
- **User Notification**: Alert user about fallback with explanation

## Engine Metadata

### Display Information

Each registered engine provides metadata for UI display:

- **Name**: Human-readable name for dropdown lists
- **Version**: Version string for compatibility tracking
- **Author**: Creator attribution
- **Description**: Brief explanation of engine features and approach
- **Icon**: Optional icon for visual identification

### Compatibility

Engines can declare compatibility requirements:

**Compatibility Fields**:
- **minAppVersion**: Minimum supported application version (e.g., "1.0.0")
- **maxAppVersion**: Maximum supported application version (e.g., "2.0.0")
- **requiredFeatures**: Array of required features (e.g., ["webgl2", "workers"])

This prevents incompatible engines from being selected.

## Future Enhancements

### Hot Reload

- Watch `/match-engines/` folder for changes
- Automatically reload modified engines during development
- Preserve configuration when possible

### Engine Marketplace

- Share engines with community
- Download engines from repository
- Rate and review engines
- Automatic updates

### Performance Profiling

- Track engine performance metrics
- Display FPS impact in engine selection
- Recommend engines based on system capabilities

### Engine Variants

- Allow engines to provide multiple presets
- Quick-select tactical variations
- Save custom configurations as presets
