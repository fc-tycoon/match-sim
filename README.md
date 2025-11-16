# FC Tycoon - Match Simulator

A browser-based football/soccer match engine with deterministic physics, AI-driven players, and comprehensive replay capabilities.

---

## Quick Start

### Prerequisites

- **Node.js 18+** (Node.js 22 recommended) - [Download from nodejs.org](https://nodejs.org/)
- **Modern browser** with WebGPU support (Chrome 113+, Firefox 141+, Edge 113+, Safari 26+)

**New to Node.js?** Node.js is a JavaScript runtime that allows you to run development tools on your computer. Download and install it from [nodejs.org](https://nodejs.org/) - choose the LTS (Long Term Support) version for best stability.

### Installation

**First time setup:**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/fc-tycoon/match-sim.git
   cd match-sim
   ```

2. **Install dependencies** (downloads required libraries):
   ```bash
   npm install
   ```
   This only needs to be done once, or when dependencies change.

3. **Start the development server** (runs the application locally):
   ```bash
   npm start
   ```
   This will automatically open your browser to `http://localhost:5173/`

**Other useful commands:**

```bash
npm run build     # Build optimized production version (outputs to dist/ folder)
npm run lint      # Check code quality and style
```

**Development Server**: `http://localhost:5173/` (Vite default port)

**Troubleshooting:**
- If `npm install` fails, make sure Node.js is installed correctly by running `node --version` in your terminal
- If port 5173 is already in use, Vite will automatically use the next available port
- Press `Ctrl+C` in the terminal to stop the development server

---

## Documentation Index

### Getting Started

1. **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Start here! High-level overview of the entire system
   - System architecture diagram
   - Core concepts (dual coordinates, dynamic event scheduling, AI architecture, viewer separation)
   - Technology stack and data flow
   - Design rationale and performance considerations

### Core Systems (Read in Order)

2. **[COORDINATES.md](./docs/COORDINATES.md)** - Dual coordinate system architecture
   - World space (absolute coordinates for physics/rendering)
   - Team-relative space (tactical coordinates for AI/formations)
   - Transformations between coordinate systems
   - Why -Z is always "forward" for both teams

3. **[EVENT_SCHEDULER.md](./docs/EVENT_SCHEDULER.md)** - Dynamic event scheduling architecture
   - Min-heap priority queue (1ms granularity)
   - Ball physics: 5-20ms dynamic (speed-based, suspended when stopped)
   - Player physics: 10-50ms dynamic (speed-based)
   - Player AI: 30-200ms dynamic (attribute/context-based)
   - Vision: 15-60ms dynamic (NOT RECORDED in replay)
   - Head movement: AI 120-250ms, physics 20-50ms
   - Game engine controls ALL scheduling (components NEVER self-schedule)

4. **[WORKERS.md](./docs/WORKERS.md)** - Per-player AI architecture
   - Per-player AI instances (persistent state, intention-based returns)
   - Main thread handles ball/player physics
   - Configurable AI scripts (team-level + goalkeeper can differ)
   - State updates only on tactical/phase/instruction changes
   - Weight-based tendencies (0.0-1.0 floats): hugsTouchline, findsSpace, etc.
   - Future: Web Workers/Worker Threads for parallelization

5. **[VIEWER.md](./docs/VIEWER.md)** - Viewer/simulation separation
   - One-way communication (simulation → viewer, NO feedback)
   - Variable framerate display (60/144/240 Hz) with variable interval interpolation
   - Interpolation (Lerp positions, Slerp rotations)
   - Camera perspectives (broadcast, tactical, 1st-person)

### Game Components

6. **[BALL.md](./docs/BALL.md)** - Ball physics with mandatory spin and dynamic updates
   - Gravity, drag, Magnus effect (spin-induced curve)
   - Spin is MANDATORY (not optional) - 5-100+ rad/s
   - Ground collision (bounce with restitution and friction)
   - Dynamic updates: 5-20ms intervals (fast shots = 5ms, slow roll = 18ms)
   - Suspension: Ball physics suspended when speed < 0.001 m/s

7. **[FIELD.md](./docs/FIELD.md)** - Field dimensions and markings
   - FIFA regulations (105m × 68m default)
   - Dual units: Yards (source of truth) + Meters (cached for physics)
   - World space coordinates for all markings
   - Boundary collision detection

8. **[PLAYERS.md](./docs/PLAYERS.md)** - Player attributes and weight-based tendencies
   - Limited vision (120° FOV, 50m range, 15-60ms dynamic, NOT RECORDED)
   - Weight-based tendencies (0.0-1.0 floats): hugsTouchline, findsSpace, forwardRunFrequency, etc.
   - Position discipline (0.0-1.0): Controls formation nudge strength (0.0 = free role, 1.0 = rigid)
   - Team instructions (0.0-1.0): tempo, width, pressingIntensity, defensiveLine
   - Goalkeeper instructions: distributeToBack, distributeToFlanks, sweeper, commandsArea
   - Dynamic systems: Physics 10-50ms, AI 30-200ms (per-player instances)

9. **[FORMATIONS.md](./docs/FORMATIONS.md)** - Formation system architecture
   - Normalized team-relative space (-1 to 1 coordinates)
   - -Z = strikers, +Z = defenders, ±X = wingers/fullbacks
   - Position discipline: 0.0 (free role, no nudge) to 1.0 (rigid, always returns to position)
   - Formation transitions (in-possession vs. out-of-possession)

10. **[MATCH.md](./docs/MATCH.md)** - Match flow and team phases
    - Match phases (kickoff, active play, stoppage, half-time, full-time)
    - **Team phases** (Attacking, Defending, Contesting)
    - Phase-based behavior and attribute weights
    - Match clock vs. simulation time
    - Stoppage time calculation

### Advanced Features

11. **[REPLAY.md](./docs/REPLAY.md)** - Visual replay system with delta encoding
    - Delta encoding: Base snapshots (30s) + Highlight snapshots (events) with msOffset chain (UINT8)
    - Ball snapshots: ~1.4 KB/sec (5-20ms variable intervals)
    - Player snapshots: ~17.6 KB/sec (10-50ms variable intervals)
    - Vision NOT RECORDED, AI decisions NOT RECORDED
    - File size: ~130 MB uncompressed, ~65-90 MB compressed for 90-min match
    - Visual reproduction ONLY (NOT deterministic simulation replay)
    - 1st-person perspective playback (limited by vision system capabilities)
    - Heatmaps, pass networks, tactical analysis

12. **[2D_VS_3D.md](./docs/2D_VS_3D.md)** - Rendering modes with variable interval interpolation
    - 2D orthographic view (top-down tactical)
    - 3D perspective view (realistic depth)
    - Interpolation formulas (Lerp/Slerp between snapshots with variable deltas)
    - Display framerate independence (viewer handles variable simulation intervals)

---

## Key Concepts Summary

### Dual Coordinate Systems

- **World Space**: Absolute coordinates (meters), origin at field center, used for physics/rendering
- **Team-Relative Space**: Tactical coordinates, origin at team center of mass, **-Z always = opponent goal**
- **Why**: Eliminates team-specific AI code (both teams use identical logic)

### Dynamic Event Scheduling (Frame-Rate Independent)

| Component | Update Interval | Frequency Range | Scheduling Logic |
|-----------|-----------------|-----------------|------------------|
| Ball Physics | 5-20ms dynamic | ~50-200 Hz | Speed-based: Fast shots = 5ms, slow roll = 18ms, suspended when < 0.001 m/s |
| Player Physics | 10-50ms dynamic | ~20-100 Hz | Speed-based: Sprinting = 10ms, standing = 50ms |
| Player AI | 30-200ms dynamic | ~5-33 Hz | Attribute/context-based: High awareness near ball = 30ms, low awareness far = 200ms |
| Vision | 15-60ms dynamic | ~16.67-67 Hz | Attribute-based (vision + awareness ratings), NOT RECORDED in replay |
| Head AI | 120-250ms | ~4-8 Hz | Awareness-based: High awareness = 120ms, low awareness = 250ms |
| Head Physics | 20-50ms dynamic | ~20-50 Hz | Rotation speed-based interpolation |

**Game Engine Controls ALL Scheduling**: Event scheduler (min-heap priority queue) manages timing, components NEVER self-schedule

### Per-Player AI Architecture

- **Main Thread**: Controls event scheduler, owns match state, handles ball/player physics
- **Per-Player AI**: Individual AI instances with persistent state (attributes, tendencies, team instructions)
- **Intention-Based**: AI returns what player WANTS to do ('run', 'pass', 'shoot', 'tackle'), game engine applies outcomes
- **Configurable AI**: Teams can specify custom AI scripts (team-level + goalkeeper can differ)
- **State Updates**: AI receives updates ONLY when tactics/phase/instructions change
- **Future**: May utilize Web Workers/Worker Threads for parallelization as simulation complexity grows

### Viewer Separation

```
Simulation (Dynamic Intervals) ──Stream──> Viewer (Variable Framerate)
      NO FEEDBACK LOOP                      Variable Interval Interpolation
```

- Same viewer for live simulation AND replay files
- Handles variable snapshot intervals seamlessly (ball 5-20ms, players 10-50ms)
- Multiple perspectives (broadcast, tactical, 1st-person)
- Simulation can run faster than real-time (5×, 10× speed)

### Ball Physics

- **Gravity**: 9.81 m/s² downward
- **Drag**: Quadratic air resistance (Cd × v²)
- **Magnus Effect**: MANDATORY spin-induced curve (F = C_L × (ω × v))
- **Spin**: 5-100+ rad/s (pass, shot, curve shot)
- **Dynamic Updates**: 5-20ms intervals based on speed (30-50% fewer updates vs fixed 10ms timesteps)

### Team Phases

| Phase | Trigger | Behavior | Formation |
|-------|---------|----------|-----------|
| **Attacking** | Team has possession | Push forward, create chances | In-possession (e.g., 4-3-3 Attack) |
| **Defending** | Opponent has possession | Drop back, close spaces | Out-of-possession (e.g., 4-5-1 Defend) |
| **Contesting** | Ball is loose | Compete for possession | Maintain current |

### Replay System (Visual ONLY)

- **File Size**: ~65-90 MB compressed per 90-minute match (~130 MB uncompressed)
- **Delta Encoding**: Base snapshots (30s) + Highlight snapshots (events) with msOffset chain (UINT8)
- **What Gets Recorded**: Ball/player positions, velocities, orientations at variable intervals
- **What Does NOT Get Recorded**: AI decisions, vision snapshots, event scheduler state, update intervals
- **Features**: Time-travel, 1st-person perspective (limited by vision system), heatmaps
- **Visual Reproduction ONLY**: NOT deterministic simulation replay

---

## Technology Stack

### Core Technologies

- **JavaScript (ES6+)** and **TypeScript 5.x**: JavaScript for existing code and Vue components, TypeScript preferred for new modules and utilities
- **Modular Architecture**: Support for future parallelization via Web Workers/Worker Threads
- **Three.js r180 (WebGPU)**: 3D rendering with fallback to WebGL2
- **HTML Canvas 2D**: 2D tactical views
- **Vite 7.1**: Build tool, development server

### UI Framework (Browser Version)

- **Vue.js 3.5** - Frontend framework (Options API only, NOT Composition API)
- **Element Plus 2.11** - UI component library (Dark theme default)
- **Vue Router 4.6** - Client-side routing
- **@element-plus/icons-vue 2.3** - Icon library
- **marked 17.0** - Markdown parsing (for license display)

### Development Tools

- **ESLint**: Code quality, linting (strict coding style)
- **VS Code**: Recommended IDE

---

## Project Structure

```text
match-sim/
├── docs/                    # Documentation (architecture, systems, components)
│   ├── ARCHITECTURE.md      # High-level overview (START HERE)
│   ├── COORDINATES.md       # Dual coordinate system
│   ├── EVENT_SCHEDULER.md   # Dynamic event scheduling (min-heap priority queue)
│   ├── WORKERS.md           # Per-player AI architecture
│   ├── VIEWER.md            # Viewer/simulation separation (variable interval handling)
│   ├── BALL.md              # Ball physics (dynamic 5-20ms updates)
│   ├── FIELD.md             # Field dimensions
│   ├── PLAYERS.md           # Player system (weight-based tendencies, dynamic updates)
│   ├── FORMATIONS.md        # Formation system (position discipline 0.0-1.0)
│   ├── MATCH.md             # Match flow, team phases
│   ├── REPLAY.md            # Visual replay system (delta encoding, dual snapshots)
│   ├── 2D_VS_3D.md          # Rendering modes (variable interval interpolation)
│   ├── GOALKEEPERS.md       # Goalkeeper AI (TBD)
│   ├── OUTFIELD.md          # Outfield player AI (TBD)
│   └── TACTICS.md           # Team tactics (TBD)
│
├── src/                     # Source code (to be implemented)
│   ├── main.js              # Application entry point
│   ├── App.vue              # Root component
│   ├── router/              # Vue Router configuration
│   ├── pages/               # Full-screen pages
│   ├── components/          # Reusable Vue components
│   ├── ai/                  # Per-player AI modules (intention-based)
│   └── modules/             # Non-Vue modules (physics, event scheduler, etc.)
│
├── .github/                 # GitHub configuration
│   └── instructions/        # AI agent instructions
│       └── ai-agent.instructions.md
│
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── eslint.config.mjs        # ESLint configuration
├── package.json             # Dependencies and scripts
├── LICENSE.txt              # Source-available license
└── README.md                # This file
```

---

## Development Status

**Current Phase**: Documentation-only (implementation TBD)

**Completed Documentation** (13/13+ tasks):
- ✅ COORDINATES.md - Dual coordinate system
- ✅ BALL.md - Ball physics with mandatory spin and dynamic updates
- ✅ FIELD.md - Field dimensions and markings
- ✅ EVENT_SCHEDULER.md - Dynamic event scheduling architecture
- ✅ PLAYERS.md - Player system with weight-based tendencies and dynamic updates
- ✅ FORMATIONS.md - Formation system with position discipline (0.0-1.0)
- ✅ REPLAY.md - Visual replay system with delta encoding and dual snapshots
- ✅ WORKERS.md - Per-player AI architecture (intention-based)
- ✅ VIEWER.md - Viewer/simulation separation with variable interval handling
- ✅ MATCH.md - Match flow with team phases
- ✅ 2D_VS_3D.md - Rendering modes with variable interval interpolation
- ✅ ARCHITECTURE.md - High-level overview
- ✅ README.md - This document

**Next Steps** (after documentation approval):
1. Implement core systems (coordinates, event scheduler, AI architecture)
2. Implement ball physics (gravity, drag, Magnus effect, dynamic 5-20ms updates)
3. Implement player movement (collision detection, animations, dynamic 10-50ms updates)
4. Implement player AI system (weight-based tendencies, position discipline, dynamic 30-200ms)
5. Implement formation system (team-relative space, position discipline, transitions)
6. Implement viewer (3D rendering, variable interval interpolation, camera perspectives)
7. Implement replay system (delta encoding, base + highlight snapshots, 1st-person perspective)
8. Testing and refinement

---
- ⏳ Player rendering (Adobe Mixamo models or tube/pill representations)
- ⏳ Match engine simulation with physics
- ⏳ Real-time match statistics
- ⏳ Tactical view controls
- ⏳ Match timeline and events

## Match Engine Architecture

The match simulator uses a modular, plugin-based architecture:

**Core Components:**

- **Ball Entity** (`Ball.js`) - Ball position, velocity, spin, state
- **Ball Physics** (`BallPhysics.js`) - Independent physics simulation (flight, Magnus effect, friction, bounce)
- **Referee** (`Referee.js`) - Match controller (starts/stops play, monitors goals, handles timing)
- **AI Plugins** - Swappable AI implementations:
  - `OutfieldAI.js` - Base class for outfield player AI
  - `GoalkeeperAI.js` - Base class for goalkeeper AI

**Coordinate System:**

- **Units**: Meters for all positions (field dimensions defined in yards, converted internally)
- **3D Space**: XZ plane = field surface, +Y axis = height
- **Ball Constraint**: Y >= 0 (ground level, can compress on bounce)
- **Player Control**: 2D sphere radius check on XZ plane (top-down distance)

**Rendering Modes:**

1. 2D Canvas - Top-down tactical view
2. Three.js Orthographic - 2D projection with 3D objects
3. Three.js Perspective - Full 3D view with camera controls

See `src/modules/match-engine/README.md` for detailed architecture documentation.

## License

This project is source-available under a custom license. See `LICENSE.md` for details.

**TL;DR**: You can view, study, and learn from the code for educational purposes, but you cannot use it commercially or distribute modified versions without explicit permission from Darkwave Studios LLC.

### First-Time Use

On first launch, users must accept the LICENSE.md agreement. Acceptance is stored in browser localStorage with a timestamp.

## Development Notes

### Element Plus Integration

Element Plus uses dark theme by default, activated in `src/main.js`:

```javascript
import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/dark/css-vars.css'

// Activate dark mode
document.documentElement.classList.add('dark')

app.use(ElementPlus)
```

**Component Usage:**

Element Plus components are prefixed with `El` and available globally:

```vue
<template>
	<ElCard>
		<template #header>
			<span>My Card</span>
		</template>
		<ElButton type="primary" @click="handleClick">
			Click Me
		</ElButton>
	</ElCard>
</template>

<script>
export default {
	methods: {
		handleClick() {
			console.log('Button clicked')
		},
	},
}
</script>
```

**Icon Usage:**

Import icons individually from `@element-plus/icons-vue`:

```javascript
import { Edit, Delete, Plus } from '@element-plus/icons-vue'

export default {
	components: {
		Edit,
		Delete,
		Plus,
	},
}
```

### Three.js Integration (Coming Soon)

The match simulator will use:

- **Orthographic Camera** for 2.5D top-down tactical view
- **Perspective Camera** (optional toggle) for 3D ball physics visualization
- **WebGPU Renderer** with WebGL2 fallback

## Contact

**Darkwave Studios LLC**  
Email: <legal@darkwavestudios.com>

## Related Projects

This match simulator is part of the **FC Tycoon™: Club Manager 2027** ecosystem.
