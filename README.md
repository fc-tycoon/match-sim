# FC Tycoon 2027 - Match Simulator

A browser-based football/soccer match engine with fully deterministic physics, AI-driven players, and perfect replay capabilities using seeded PRNG.

---

## Quick Start

### Prerequisites

- **Node.js 18+** (Node.js 22 recommended) - [Download from nodejs.org](https://nodejs.org/)
- **Git** with **Git LFS** installed - [Download Git LFS](https://git-lfs.com/)
- **Modern browser** with WebGPU support (Chrome 113+, Firefox 141+, Edge 113+, Safari 26+)

**New to Node.js?** Node.js is a JavaScript runtime that allows you to run development tools on your computer. Download and install it from [nodejs.org](https://nodejs.org/) - choose the LTS (Long Term Support) version for best stability.

### Installation

**First time setup:**

1. **Install Git LFS** (required for 3D assets):
   ```bash
   git lfs install
   ```
   This only needs to be done once per machine.

2. **Clone the repository with submodules**:
   ```bash
   git clone --recurse-submodules https://github.com/fc-tycoon/match-sim.git
   cd match-sim
   ```
   The `--recurse-submodules` flag automatically clones the 3D assets submodule.

3. **Install dependencies** (downloads required libraries):
   ```bash
   npm install
   ```
   This only needs to be done once, or when dependencies change.

4. **Start the development server** (runs the application locally):
   ```bash
   npm start
   ```
   This will automatically open your browser to `http://localhost:5173/`

**Already cloned without submodules?** Initialize them manually:
```bash
git submodule update --init --recursive
```

**Updating an existing clone:**
```bash
git pull
git submodule update --recursive
npm install  # Only if package.json changed
```

**Other useful commands:**

```bash
npm run build     # Build optimized production version (outputs to dist/ folder)
npm run lint      # Check code quality and style
```

**Development Server**: `http://localhost:5173/` (Vite default port)

**Troubleshooting:**
- If `npm install` fails, make sure Node.js is installed correctly by running `node --version` in your terminal
- If 3D models appear as placeholders, ensure Git LFS is installed and run `git lfs pull`
- If port 5173 is already in use, Vite will automatically use the next available port
- Press `Ctrl+C` in the terminal to stop the development server

---

## 3D Assets (Submodule)

The 3D assets (models, animations, textures) are stored in a separate Git repository and included as a **Git submodule** at `assets/3d-assets/`.

**Repository**: [fc-tycoon/match-sim-assets](https://github.com/fc-tycoon/match-sim-assets)

**Structure**:
```
assets/3d-assets/
├── manifest.json       # Asset registry with metadata
├── models/             # GLB models (player, ball, stadium)
├── animations/         # FBX animations (Mixamo format)
├── textures/           # Textures (grass, skybox)
└── skybox/             # Environment maps
```

**Why a submodule?**
- Large binary files (GLB, FBX) are stored with Git LFS
- Keeps main repository lightweight
- Assets can be versioned independently
- Designers can work on assets without affecting code

See [ASSETS.md](./docs/ASSETS.md) for detailed documentation on the asset system.

---

## Documentation Index

### Getting Started

1. **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Start here! High-level overview of the entire system
   - System architecture diagram
   - Core concepts (dual coordinates, dynamic event scheduling, AI architecture, viewer separation)
   - Technology stack and data flow
   - Design rationale and performance considerations

### Core Systems (Read in Order)

2. **[COORDINATES.md](./docs/COORDINATES.md)** - Coordinate system architecture
   - World space (2D simulation space)
   - Canvas 2D and Three.js transforms
   - Direction vectors and team attack directions

3. **[EVENT_SCHEDULER.md](./docs/EVENT_SCHEDULER.md)** - Dynamic event scheduling architecture
   - Min-heap priority queue (1ms granularity)
   - Ball physics: 5-20ms dynamic (speed-based, suspended when stopped)
   - Player physics: 10-50ms dynamic (speed-based)
   - Player AI: 30-200ms dynamic (attribute/context-based)
   - Game engine controls ALL scheduling (components NEVER self-schedule)

4. **[WORKERS.md](./docs/WORKERS.md)** - Per-player AI architecture
   - Per-player AI instances (persistent state, intention-based returns)
   - Seeded PRNG for deterministic AI decisions
   - Intention-based protocol (AI returns intentions, engine applies outcomes)

5. **[AI_ARCHITECTURE.md](./docs/AI_ARCHITECTURE.md)** - Hybrid AI system
   - HFSM (high-level state management)
   - Utility AI (fuzzy decision-making)
   - Behavior Trees (action execution)

### Game Components

6. **[BALL.md](./docs/BALL.md)** - Ball physics with mandatory spin and dynamic updates
   - Gravity, drag, Magnus effect (spin-induced curve)
   - Dynamic updates: 5-20ms intervals based on ball speed
   - Suspension: Ball physics suspended when speed < 0.001 m/s

7. **[FIELD.md](./docs/FIELD.md)** - Field dimensions and markings
   - FIFA regulations (105m × 68m default)
   - World space coordinates for all markings

8. **[PLAYERS.md](./docs/PLAYERS.md)** - Player attributes and weight-based tendencies
   - Limited vision (120° FOV, 50m range)
   - Weight-based tendencies (0.0-1.0 floats)
   - Position discipline and team instructions

9. **[FORMATIONS.md](./docs/FORMATIONS.md)** - Formation system architecture
   - Normalized slot positions (-1 to 1 coordinates)
   - Position discipline (0.0-1.0)
   - Formation transitions

10. **[MATCH.md](./docs/MATCH.md)** - Match flow and team phases
    - Match phases (kickoff, active play, stoppage)
    - Team phases (Attacking, Defending, Contesting)

### Assets & Rendering

11. **[ASSETS.md](./docs/ASSETS.md)** - Asset system documentation
    - Submodule structure and Git LFS
    - Asset manifest and loading priorities
    - Caching and fallback system
    - Animation system

12. **[MODELS.md](./docs/MODELS.md)** - 3D model specifications
    - Player model (GLB format)
    - Animation requirements (FBX/Mixamo)
    - Material and bone naming conventions

### Advanced Features

13. **[REPLAY.md](./docs/REPLAY.md)** - Deterministic replay system
    - Perfect replay by re-running simulation from same seed
    - Stores: Match seed, team data, match events, user inputs
    - File size: < 1 MB per match

14. **[HEADLESS_MODE.md](./docs/HEADLESS_MODE.md)** - Headless simulation
    - Running matches without rendering
    - Batch simulation capabilities

---

## Key Concepts Summary

### Coordinate System

- **World Space**: 2D coordinates (meters), origin at field center
- **X-axis**: Goal-to-goal (-52.5m to +52.5m)
- **Y-axis**: Touchline-to-touchline (-34m to +34m)
- **Home team**: Attacks +X direction
- **Away team**: Attacks -X direction

### Dynamic Event Scheduling (Frame-Rate Independent)

| Component | Update Interval | Frequency Range | Scheduling Logic |
|-----------|-----------------|-----------------|------------------|
| Ball Physics | 5-20ms dynamic | ~50-200 Hz | Speed-based: Fast shots = 5ms, slow roll = 18ms |
| Player Physics | 10-50ms dynamic | ~20-100 Hz | Speed-based: Sprinting = 10ms, standing = 50ms |
| Player AI | 30-200ms dynamic | ~5-33 Hz | Attribute/context-based |

**Game Engine Controls ALL Scheduling**: Event scheduler (min-heap priority queue) manages timing

### Hybrid AI Architecture

- **HFSM**: High-level state management (Attacking/Defending/Contesting)
- **Utility AI**: Fuzzy decision-making (pass vs. shoot vs. dribble)
- **Behavior Trees**: Action execution sequences
- **Intention-Based**: AI returns intentions, engine applies outcomes

### Renderer Separation

```
Simulation (Deterministic) ─Read State─> Renderer (Variable Framerate)
      NO FEEDBACK LOOP                    Interpolates for Display
```

- Renderer reads current simulation state without affecting it
- Simulation runs deterministically regardless of display framerate
- Simulation can run faster than real-time or headless

### Asset Loading

- **Submodule**: 3D assets in `assets/3d-assets/` (Git LFS)
- **Manifest**: `manifest.json` defines all assets with priorities
- **Priority Loading**: critical → high → normal → low
- **Fallback Primitives**: Capsule/sphere placeholders while loading
- **Animation System**: FBX animations mapped to player states

---

## Technology Stack

### Core Technologies

- **TypeScript 5.x** / **JavaScript (ES6+)**: TypeScript for new modules, JavaScript for Vue components
- **Seeded PRNG**: Deterministic random number generation for reproducible simulations
- **Three.js r180 (WebGPU)**: 3D rendering with fallback to WebGL2
- **HTML Canvas 2D**: 2D tactical views
- **Vite 7.x**: Build tool, development server

### UI Framework

- **Vue.js 3.5** - Frontend framework (Options API only)
- **Element Plus 2.11** - UI component library (Dark theme)
- **Vue Router 4.6** - Client-side routing
- **marked 17.0** - Markdown parsing

### 3D Assets

- **GLB format**: Models (player, ball, stadium)
- **FBX format**: Animations (Mixamo-compatible)
- **Git LFS**: Large file storage for binary assets
- **Submodule**: `assets/3d-assets/` ([match-sim-assets](https://github.com/fc-tycoon/match-sim-assets))

### Development Tools

- **ESLint 9.x**: Code quality and linting
- **Stylelint**: CSS/Vue style linting
- **VS Code**: Recommended IDE

---

## Project Structure

```text
match-sim/
├── assets/
│   └── 3d-assets/           # Git submodule (match-sim-assets)
│       ├── manifest.json    # Asset registry
│       ├── models/          # GLB models
│       ├── animations/      # FBX animations
│       ├── textures/        # Image textures
│       └── skybox/          # Environment maps
│
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # High-level overview (START HERE)
│   ├── ASSETS.md            # Asset system documentation
│   ├── COORDINATES.md       # Coordinate system
│   ├── EVENT_SCHEDULER.md   # Dynamic event scheduling
│   ├── AI_ARCHITECTURE.md   # Hybrid AI system
│   ├── BALL.md              # Ball physics
│   ├── FIELD.md             # Field dimensions
│   ├── PLAYERS.md           # Player system
│   ├── FORMATIONS.md        # Formation system
│   ├── MATCH.md             # Match flow
│   ├── REPLAY.md            # Replay system
│   └── ...                  # Additional docs
│
├── src/
│   ├── main.ts              # Application entry point
│   ├── App.vue              # Root Vue component
│   ├── router.ts            # Vue Router configuration
│   ├── styles.css           # Global styles
│   ├── core/                # Core systems
│   │   ├── Ball.ts          # Ball entity
│   │   ├── BallPhysics.ts   # Ball physics simulation
│   │   ├── Player.ts        # Player entity
│   │   ├── Match.ts         # Match state
│   │   ├── MatchEngine.ts   # Simulation engine
│   │   ├── EventScheduler.ts # Event scheduling
│   │   ├── Field.ts         # Field configuration
│   │   ├── Formation.ts     # Formation definitions
│   │   ├── ai/              # AI systems
│   │   └── 3d/              # 3D rendering
│   ├── store/               # Vue stores
│   │   ├── assets.ts        # Asset loading/caching
│   │   ├── match.ts         # Match state
│   │   └── renderer.ts      # Renderer state
│   ├── pages/               # Full-screen pages
│   ├── components/          # Reusable Vue components
│   ├── roles/               # Player role definitions (JSON)
│   └── exports/             # Exported data (formations, positions)
│
├── public/                  # Static assets (legacy location)
├── licenses/                # Third-party license files
├── .github/                 # GitHub configuration
│   └── instructions/        # AI agent instructions
│
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── eslint.config.mjs        # ESLint configuration
├── stylelint.config.mjs     # Stylelint configuration
├── package.json             # Dependencies and scripts
├── LICENSE.md               # Source-available license
└── README.md                # This file
```

---

## Development Status

**Current Phase**: Alpha (v27.0.0-alpha.3)

**Implemented**:
- ✅ Core simulation engine (Ball, Player, Match, EventScheduler)
- ✅ 3D rendering with Three.js WebGPU
- ✅ Asset loading system with priority-based background loading
- ✅ Player animations (walking, idle, transitions)
- ✅ Formation system with position slots
- ✅ Hybrid AI architecture (HFSM + Utility AI + Behavior Trees)
- ✅ Canvas 2D tactical view
- ✅ Match state management

**In Progress**:
- 🔄 Player AI decision-making
- 🔄 Ball physics refinement
- 🔄 Match events (goals, fouls, etc.)

**Planned**:
- ⏳ Goalkeeper AI
- ⏳ Replay system
- ⏳ Headless mode for batch simulation
- ⏳ Match statistics and analytics

---

## License

This project is source-available under a custom license. See [LICENSE.md](LICENSE.md) for details.

**TL;DR**: You can view, study, and learn from the code for educational purposes, but you cannot use it commercially or distribute modified versions without explicit permission from Darkwave Studios LLC.

### First-Time Use

On first launch, users must accept the LICENSE.md agreement. Acceptance is stored in browser localStorage with a timestamp.

---

## Contact

**Darkwave Studios LLC**  
Email: <legal@darkwavestudios.com>

## Related Projects

- **[match-sim-assets](https://github.com/fc-tycoon/match-sim-assets)** - 3D assets submodule
- **FC Tycoon™: Club Manager 2027** - Parent project (this match simulator is a component)
