# Architecture Overview

## Introduction

This document provides a high-level overview of the **FC Tycoon Match Simulation** architecture. The match simulator is a browser-based football/soccer match engine with realistic physics, AI-driven players, and deterministic replay capabilities.

**Key Design Goals**:
- **100% Deterministic**: Fully deterministic simulation using seeded PRNG for perfect replay capability
- **Frame-Rate Independent**: Dynamic event scheduling for physics/AI, variable display framerate
- **Scalable**: Modular AI architecture supporting future parallelization
- **Realistic**: Authentic football physics, tactics, and player behavior
- **Replayable**: Perfect match replay by re-running simulation from seed (minimal file size)

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Main Thread                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Event Scheduler (Dynamic Intervals)               │  │
│  │  - Ball Physics: 5-20ms (~50-200 Hz, speed-based)         │  │
│  │  - Player Physics: 10-50ms (~20-100 Hz, speed-based)      │  │
│  │  - Player AI: 30-200ms (~5-33 Hz, attribute/context)      │  │
│  │  - Vision: 15-60ms (~16.67-67 Hz)                         │  │
│  │  - Head AI: 120-250ms (~4-8.33 Hz, awareness-based)       │  │
│  │  - Head Physics: 20-50ms (~20-50 Hz, rotation-based)      │  │
│  │  - Seeded PRNG: Deterministic random number generation    │  │
│  └───────────────────────────────────────────────────────────┘  │
│         │              │              │              │          │
│         │              │              ▼              │          │
│         │              │   ┌─────────────────────┐   │          │
│         │              │   │   22 Per-Player AI  │   │          │
│         │              │   │   (Main Thread)     │   │          │
│         │              │   │  30-200ms dynamic   │   │          │
│         │              │   └─────────────────────┘   │          │
│         │              │              │              │          │
│         └──────────────┴──────────────┴──────────────┘          │
│                        │                                        │
│                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │      Match State (Deterministic, No Recording Needed)     │  │
│  │  - Ball position3d/2d, velocity, spin (physics simulation)│  │
│  │  - Player positions, velocities, orientations             │  │
│  │  - AI decisions based on seeded PRNG                      │  │
│  │  - Match events (goals, fouls, substitutions, etc.)       │  │
│  │  - Replay: Re-run simulation from same seed               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                        │                                        │
│                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Renderer (Real-Time Visualization Only)           │  │
│  │  - Reads current match state each frame                   │  │
│  │  - Interpolates for smooth display at variable FPS        │  │
│  │  - No feedback to simulation (one-way rendering)          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Display (Variable Framerate)                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        Display Loop (Variable Framerate 60-240 Hz)        │  │
│  │  - Read current simulation state                          │  │
│  │  - Interpolate positions/rotations (Lerp/Slerp)           │  │
│  │  - Render 3D scene (Three.js WebGPU)                      │  │
│  │  - Camera perspectives (Broadcast, Tactical, 1st-Person)  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. Dual Coordinate Systems

The match simulation uses TWO coordinate systems:

**World Space** (Absolute):
- Used for physics, rendering, collision detection
- Origin (0, 0) = center of field
- Home team attacks +X direction, Away team attacks -X direction
- X-axis = goal-to-goal, Y-axis = touchline-to-touchline
- Measurements in meters

**Formation Slots** (Tactical):
- Used for AI, formations, tactics
- Origin (0, 0) = team center of mass (dynamic)
- Normalized -1 to 1 coordinates, scaled by tactical width/depth
- Each team has `attackDir` vector: Home = `{x:1, y:0}`, Away = `{x:-1, y:0}`
- AI uses `attackDir` to resolve "forward" direction (eliminates team-specific code)

**See**: [`COORDINATES.md`](./COORDINATES.md) for full details

---

### 2. Dynamic Event Scheduling

**CRITICAL**: Simulation uses **1 tick = 1 millisecond**. There is NO predefined, hard-coded simulation timestep. Every entity updates at VARIABLE intervals based on its current state.

All simulation components update at VARIABLE intervals based on speed/attributes/context:

| Component | Interval (ticks) | Frequency | Description |
|-----------|----------|-----------|-------------|
| **Ball Physics** | 5-20 ticks | ~50-200 Hz | Speed-based (fast shots = 5ms, slow roll = 18ms, suspended when stopped) |
| **Player Physics** | 10-50 ticks | ~20-100 Hz | Speed-based (sprinting = 10ms, standing = 50ms) |
| **Player AI** | 30-200 ticks | ~5-33 Hz | Attribute/context/proximity-based (high awareness near ball = 30ms) |
| **Vision** | 15-60 ticks | ~16.67-67 Hz | Attribute-based (NOT RECORDED - can reconstruct) |
| **Head AI** | 120-250 ticks | ~4-8.33 Hz | Awareness-based (high awareness = 120ms decisions) |
| **Head Physics** | 20-50 ticks | ~20-50 Hz | Rotation speed-based (fast rotation = 20ms) |
| **Viewer Display** | Variable | 60-240+ Hz | Rendering with interpolation (handles variable snapshot intervals) |

**Key Principles**: 
- **1 tick = 1ms**: Simulation time granularity is 1 millisecond
- **Dynamic intervals**: Update frequency adapts to entity state (ball speed, player speed, proximity, attributes)
- **Event scheduler controls ALL timing**: Min-heap priority queue, components NEVER self-schedule
- **Entities can suspend**: Ball physics suspends when stopped (<0.001 m/s), resumes when kicked
- **Viewer interpolates**: Handles variable-interval snapshots for smooth display at any refresh rate

**See**: [`EVENT_SCHEDULER.md`](./EVENT_SCHEDULER.md) for implementation details

---

### 3. AI Architecture

22 per-player AI instances handle decision-making for on-field players:

- **Main Thread**: Event scheduler controls timing, owns match state, applies AI intentions
- **22 Per-Player AI**: Persistent state (attributes/tendencies/instructions), return intentions
- **Communication**: Method-based protocol (makeDecision, updateState)
- **Intention-Based**: AI returns what player WANTS to do, game engine applies outcomes using seeded PRNG
- **Configurable AI**: Teams can specify custom AI scripts (team-level + goalkeeper)
- **State Updates**: AI receives updates only when tactics/phase/instructions change
- **Deterministic**: All AI decisions use seeded PRNG for reproducible behavior

**AI Responsibilities**:
- **Per-Player AI** (30-200ms dynamic): Decision-making based on vision, formation, game state
- **Ball Physics** (Main Thread, 5-20ms): Ball trajectory, Magnus effect, collisions
- **Player Physics** (Main Thread, 10-50ms): Movement, acceleration, collision detection
- **Vision System** (Main Thread, 15-60ms): Vision cone calculations
- **Head Movement** (Main Thread, 120-250ms AI + 20-50ms physics): Head orientation

**See**: [`WORKERS.md`](./WORKERS.md) for AI architecture details

**Future Enhancement**: AI computation may utilize Web Workers (browser) or Worker Threads (Node.js) for parallelization and context isolation as 3D simulation complexity evolves.

---

### 4. Renderer/Simulation Separation

Renderer is COMPLETELY separated from simulation:

```
Simulation (Deterministic) ─Read State─> Renderer (Variable Framerate)
      NO FEEDBACK LOOP                    Interpolates for Display
```

**Benefits**:
- Simulation runs deterministically regardless of display framerate
- Renderer simply reads current state without affecting simulation
- Multiple renderers can display same simulation simultaneously (broadcast, tactical, 1st-person)
- Simulation can run faster than real-time (5×, 10× speed) or headless (instant results)
- Replay works by re-running simulation from same seed (no position data storage needed)

---

### 5. Ball Physics with Mandatory Spin

Ball physics includes:
- **Gravity**: 9.81 m/s² downward acceleration
- **Drag**: Quadratic air resistance (Cd × v²)
- **Magnus Effect**: MANDATORY spin-induced curve (F = C_L × (ω × v))
- **Bounce**: Ground collision with restitution and friction
- **Spin Decay**: Spin reduces over time
- **Dynamic Updates**: 5-20ms intervals based on ball speed (fast shots = 5ms, slow roll = 18ms)
- **Suspension**: Ball physics suspended when speed < 0.001 m/s

**Spin Ranges**: 5-100+ rad/s depending on kick type (pass, shot, curve shot)

**See**: [`BALL.md`](./BALL.md) for physics formulas and spin effects

---

### 6. Player AI System

Players have:
- **Limited Vision**: Vision cone (~120° FOV, ~50m range), 15-60ms updates
- **Fuzzy Perception**: Gaussian noise on perceived positions (distance-based)
- **Phase-Based Behavior**: Attacking, Defending, Contesting phases
- **Weight-Based Tendencies**: hugsTouchline, findsSpace, forwardRunFrequency (0.0-1.0 floats)
- **Position Discipline**: 0.0 (free role) to 1.0 (rigid) - controls formation nudge strength
- **Dynamic AI Decisions**: 30-200ms intervals (high awareness near ball = 30ms, low awareness far = 200ms)
- **Deterministic Decisions**: All AI uses seeded PRNG for reproducible behavior

**See**: [`PLAYERS.md`](./PLAYERS.md) for player attributes and AI interface

---

### 7. Formation System

Formations use normalized slot positions in world space:

- **-1 to 1 Coordinates**: X (left/right), Y (touchline-to-touchline)
- **attackDir Vector**: Determines team's forward direction (Home = +X, Away = -X)
- **Position Discipline**: 0.0 (free role, no nudge) to 1.0 (rigid, always returns to position)
- **Formation Nudges**: Discipline controls blend between tactical freedom and formation position
- **Formation Transitions**: In-possession (attacking) vs. Out-of-possession (defending)
- **Identical Logic**: Both teams use same formation definitions (attackDir resolves directions)

**See**: [`FORMATIONS.md`](./FORMATIONS.md) for formation architecture

---

### 8. Replay System with Deterministic Re-Simulation

Match replay achieved by re-running simulation from same seed:

**What Gets Stored**:
- Match seed (PRNG seed for deterministic replay)
- Team data (formations, tactics, player attributes)
- Match events (goals, cards, injuries for display)
- External events (human input only: substitutions, tactical changes, shouts)

**What Does NOT Get Stored**:
- Ball positions/velocities (recalculated during replay)
- Player positions/velocities (recalculated during replay)
- AI decisions (reproduced from same seed)
- Vision snapshots (recalculated during replay)

**Replay Process**:
- Load match seed + team data + events
- Initialize simulation with same seed
- Re-run simulation tick-by-tick (deterministic)
- Apply stored events at exact timestamps
- Render result in real-time or accelerated

**File Size**: < 1 MB per match (seed + metadata + events only)
- Update intervals (variable, not deterministic)

**Replay Philosophy**: Visual replay ONLY - NOT deterministic simulation replay

**See**: [`REPLAY.md`](./REPLAY.md) for encoding details

**File Size Estimates**:
- Ball: ~1.4 KB/sec (5-20ms intervals, ~77 Hz average)
- Players: ~17.6 KB/sec (10-50ms intervals, ~40 Hz average)
- Total: ~19 KB/sec uncompressed
- **~130 MB uncompressed for 90-minute match**
- **~65-90 MB compressed** (zstd/gzip)

**INT16 Precision**: 1cm resolution (sufficient for imperceptible quantization)

**Features**:
- Time-travel playback (seek to any timestamp via base + highlight snapshots)
- 1st-person perspective from any player (reconstructed vision)
- Heatmaps, pass networks, tactical analysis
- Visual reproduction ONLY (NOT deterministic simulation replay)

**See**: [`REPLAY.md`](./REPLAY.md) for file format and playback

---

### 9. Team Phases

Each team operates in one of three phases:

| Phase | Trigger | Behavior | Formation |
|-------|---------|----------|-----------|
| **Attacking** | Team has possession | Push forward, create chances | In-possession (e.g., 4-3-3 Attack) |
| **Defending** | Opponent has possession | Drop back, close spaces, pressure | Out-of-possession (e.g., 4-5-1 Defend) |
| **Contesting** | Ball is loose | Compete for possession | Maintain current (no transition) |

**Phase Transitions**: Instant phase change, gradual formation change (2-5 seconds)

**See**: [`MATCH.md`](./MATCH.md) for team phase system

---

## Technology Stack

### Core Technologies

- **JavaScript (ES6+)**: Primary language (NO TypeScript)
- **Modular AI Architecture**: Player-managed AI with support for future parallelization (Web Workers/Worker Threads)
- **Three.js r180 (WebGPU)**: 3D rendering with fallback to WebGL2
- **HTML Canvas 2D**: 2D tactical views, overlays

### Development Tools

- **Vite**: Build tool, development server
- **ESLint**: Code quality, linting
- **VS Code**: Recommended IDE

### Browser Requirements

- **Modern Browsers**: Chrome 113+, Firefox 113+, Edge 113+
- **WebGPU Support**: Preferred (fallback to WebGL2)
- **JavaScript ES6+**: Required for module support
- **IndexedDB**: For replay storage

---

## Data Flow

### Match Simulation Flow

```
1. Initialize Match
   ↓
2. Event Scheduler (Min-Heap Priority Queue)
   ↓
3. Pop Next Event (Ball/Player Physics/AI/Vision/Head)
   ↓
4. Execute Event:
   - Ball Physics (Main Thread, 5-20ms): Update ball state
   - Player Physics (Main Thread, 10-50ms): Update player state
   - Player AI (Main Thread, 30-200ms): Get intention, apply outcome (uses seeded PRNG)
   - Vision (Main Thread, 15-60ms): Update vision cone
   - Head AI (Main Thread, 120-250ms): Update head target
   - Head Physics (Main Thread, 20-50ms): Rotate head toward target
   ↓
5. Schedule Next Event (Dynamic interval based on speed/attributes/context)
   ↓
6. Update Match State (Deterministic)
   ↓
7. Renderer Reads State (If rendering enabled)
   ↓
8. Renderer Interpolates → Render Frame (60-240 Hz display)
   ↓
9. Repeat (2-8) until match ends
```

### Replay Flow

```
1. Load Replay Data (seed + teams + events)
   ↓
2. Validate (match hash verification)
   ↓
3. Initialize Event Scheduler with Same Seed
   ↓
4. Re-Run Simulation Tick-by-Tick (deterministic)
   ↓
5. Apply User Inputs at Stored Timestamps
   ↓
6. Renderer Reads Current State (if rendering)
   ↓
7. Renderer Interpolates → Render Frame
   ↓
8. Repeat (4-7) at playback speed (1×, 5×, 10×, 100×, or instant)
```

---

## File Organization

### Documentation Structure

```
docs/
├── ARCHITECTURE.md        # This file (high-level overview)
├── README.md              # Documentation index (getting started)
│
├── Core Systems/
│   ├── COORDINATES.md     # Coordinate system (world space + attackDir)
│   ├── EVENT_SCHEDULER.md # Dynamic event scheduling (min-heap priority queue)
│   └── WORKERS.md         # 22 per-player AI, deterministic with seeded PRNG
│
├── Game Components/
│   ├── BALL.md            # Ball physics, Magnus effect, spin
│   ├── FIELD.md           # Field dimensions, markings, boundaries
│   ├── PLAYERS.md         # Player attributes, AI interface, vision
│   ├── FORMATIONS.md      # Formation system, slots + attackDir
│   └── MATCH.md           # Match flow, team phases, scoring
│
├── Advanced Features/
│   ├── REPLAY.md          # Deterministic replay system (seed-based)
│   └── AI.md              # AI implementation guide (if exists)
│
└── Reference/
    ├── GLOSSARY.md        # Terms and definitions (if exists)
    └── FAQ.md             # Common questions (if exists)
```

---

## Development Status

**Current Phase**: Documentation-only (implementation TBD)

**Completed Documentation**:
- ✅ COORDINATES.md - Dual coordinate system architecture
- ✅ BALL.md - Ball physics with mandatory spin and dynamic updates
- ✅ FIELD.md - Field dimensions and markings
- ✅ PLAYERS.md - Player system with weight-based tendencies and dynamic updates
- ✅ EVENT_SCHEDULER.md - Dynamic event scheduling with min-heap priority queue
- ✅ FORMATIONS.md - Formation system with position discipline (0.0-1.0)
- ✅ REPLAY.md - Visual replay system with delta encoding and dual snapshots
- ✅ WORKERS.md - Per-player AI architecture (intention-based)
- ✅ VIEWER.md - Viewer/simulation separation with variable interval handling
- ✅ MATCH.md - Match flow with team phases
- ✅ ARCHITECTURE.md - This document

**Next Steps** (after documentation approval):
1. Implement core systems (coordinates, event scheduler, AI)
2. Implement ball physics (gravity, drag, Magnus effect, dynamic 5-20ms updates)
3. Implement player movement (collision detection, animations, dynamic 10-50ms updates)
4. Implement 22 per-player AI (persistent state, intention-based, dynamic 30-200ms)
5. Implement formation system (slots + attackDir, position discipline, transitions)
6. Implement viewer (3D rendering, variable interval interpolation, camera perspectives)
7. Implement replay system (delta encoding, base + highlight snapshots, 1st-person perspective)
8. Testing and refinement

---

## Design Rationale

### Why Dynamic Event Scheduling?

**Problem**: Fixed timesteps waste computation on entities that don't need frequent updates:
- Stationary ball updated every 10ms (unnecessary)
- Far-away players updated as frequently as those near the ball (inefficient)

**Solution**: Dynamic scheduling adjusts update frequency based on state:
- Ball: 5ms (fast shot) to 20ms (slow roll), suspended when stopped
- Players: 10ms (sprinting) to 50ms (standing), fewer updates when far from action
- AI: 30ms (high awareness near ball) to 200ms (low awareness far from ball)
- 30-50% fewer updates than fixed timesteps (performance gain)

**Trade-off**: Visual replay only (NOT deterministic simulation replay)

### Why Team Attack Direction?

**Problem**: Team-specific directions require duplicate AI code:
- Home team attacks +X, Away team attacks -X
- "Move toward opponent goal" means different directions for each team

**Solution**: Team `attackDir` vector determines forward direction:
- Home: `{x: 1, y: 0}` (toward +X), Away: `{x: -1, y: 0}` (toward -X)
- Single AI implementation uses `attackDir` to resolve directions
- See `COORDINATES.md` Formation Slots for details
- Formation system identical for both teams
- Tactical code has NO team-specific branches

### Why Intention-Based AI?

**Problem**: Need to isolate custom AI scripts (security, cheating prevention)

**Solution**: AI returns intentions (not outcomes) with limited world view:
- **Context Isolation**: AI only receives sensor data (vision cone, position, stamina)
- AI cannot access full match state, DOM, or engine internals
- Prevents cheating (AI cannot see opponents outside vision cone)
- Crash protection (errors in custom AI isolated from match engine)
- RoboCup-inspired autonomous agents with imperfect information

**Future Benefit**: Modular architecture supports parallelization when needed:
- AI instances can run in parallel (Web Workers/Worker Threads)
- Performance scales with CPU core count
- Main thread coordinates timing, AI executes decisions
- Current single-threaded implementation can transition seamlessly

### Why Viewer Separation?

**Problem**: Tight coupling between simulation and display causes issues:
- Can't run simulation faster than display can render
- Can't replay matches (no separation of simulation from display)

**Solution**: One-way communication (simulation → viewer):
- Simulation runs at own pace (1×, 5×, 10× speed)
- Viewer interpolates for smooth display at any framerate
- Same viewer code for live simulation AND replay files

---

## Performance Considerations

### Target Hardware

**Minimum**:
- CPU: Dual-core 2.0 GHz
- RAM: 4 GB
- GPU: Integrated graphics (WebGL2 support)
- Display: 60 Hz

**Recommended**:
- CPU: Quad-core 3.0+ GHz
- RAM: 8 GB
- GPU: Dedicated graphics (WebGPU support)
- Display: 144 Hz

### Performance Targets

| Component | Target Time | Update Interval | Notes |
|-----------|-------------|-----------------|-------|
| Ball Physics | < 2ms | 5-20ms dynamic | Fast shots = 5ms, slow roll = 18ms |
| Player Physics | < 3ms | 10-50ms dynamic | Sprinting = 10ms, standing = 50ms |
| Player AI | < 8ms | 30-200ms dynamic | High awareness = 30ms, low = 200ms |
| Vision System | < 1ms | 15-60ms dynamic | NOT RECORDED in replay |
| Viewer Render | < 8ms | 16.67ms @ 60 Hz | 50% of frame time |
| **Event Scheduler** | **< 0.5ms** | **1ms granularity** | **Min-heap operations** |

### Optimization Strategies

- **Modular AI Architecture**: Supports future parallelization (Web Workers/Worker Threads)
- **Dynamic Scheduling**: 30-50% fewer updates vs fixed timesteps (adaptive intervals)
- **Ball Suspension**: No updates when ball speed < 0.001 m/s (parked ball = 0 updates)
- **LOD**: Reduce player mesh complexity at distance
- **Frustum Culling**: Don't render players outside camera view
- **Instanced Rendering**: Share meshes for identical players
- **Compression**: Deflate/gzip replay files (~40-50% reduction)
- **Delta Encoding**: msOffset chain reduces timestamp storage to UINT8 values

---

## Summary

**FC Tycoon Match Simulation** is a 100% deterministic, frame-rate independent football match engine with:

- **Coordinate System**: World space (physics/rendering) + attackDir (team-relative directions)
- **Dynamic Event Scheduling**: Ball 5-20ms, Players 10-50ms, AI 30-200ms (adaptive intervals)
- **Per-Player AI**: Persistent state, intention-based returns, deterministic with seeded PRNG
- **Renderer Separation**: Simulation (deterministic) → Renderer reads state (no feedback loop)
- **Realistic Physics**: Gravity, drag, Magnus effect (mandatory spin), deterministic outcomes
- **AI System**: Limited vision (15-60ms), weight-based tendencies (0.0-1.0), position discipline (0.0-1.0)
- **Formation System**: Normalized slots in world axes (-1 to 1), attackDir determines forward, position discipline controls formation nudge strength
- **Replay System**: Seed-based deterministic replay (< 20 KB per match, 100% reproducible)
- **Team Phases**: Attacking, Defending, Contesting with formation transitions

**Future Enhancement**: AI computation may utilize Web Workers (browser) or Worker Threads (Node.js) for parallelization and context isolation as 3D simulation complexity evolves.

**Next**: Read [`README.md`](./README.md) for documentation index and getting started guide.
