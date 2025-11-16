# Architecture Overview

## Introduction

This document provides a high-level overview of the **FC Tycoon Match Simulation** architecture. The match simulator is a browser-based football/soccer match engine with realistic physics, AI-driven players, and comprehensive replay capabilities.

**Key Design Goals**:
- **NOT Deterministic**: Visual replay ONLY (positions/physics), NOT AI decisions/vision (see `REPLAY.md`)
- **Frame-Rate Independent**: Dynamic event scheduling for physics/AI, variable display framerate
- **Scalable**: Modular AI architecture supporting future parallelization
- **Realistic**: Authentic football physics, tactics, and player behavior
- **Replayable**: Visual match replay with 1st-person perspective support (NOT deterministic simulation replay)

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
│  │  - Vision: 15-60ms (~16.67-67 Hz, NOT RECORDED)           │  │
│  │  - Head AI: 120-250ms (~4-8.33 Hz, awareness-based)       │  │
│  │  - Head Physics: 20-50ms (~20-50 Hz, rotation-based)      │  │
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
│  │          Match State History (Replay Data)                │  │
│  │  - Ball snapshots (~50-200 Hz, 5-20ms intervals)          │  │
│  │  - Player snapshots (~20-100 Hz, 10-50ms intervals)       │  │
│  │  - Base snapshots (30s) + Highlight snapshots (events)    │  │
│  │  - Delta encoding (msOffset chain)                        │  │
│  │  - Vision NOT RECORDED (can reconstruct)                  │  │
│  │  - AI Decisions NOT RECORDED (intentions, not outcomes)   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                        │                                        │
│                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │       Snapshot Stream (to Viewer, Variable Intervals)     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Viewer (Display Thread)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        Display Loop (Variable Framerate 60-240 Hz)        │  │
│  │  - Receive snapshots from simulation (variable intervals) │  │
│  │  - Interpolate positions/rotations (Lerp/Slerp)           │  │
│  │  - Handle variable snapshot intervals (ball 5-20ms, etc.) │  │
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
- Origin (0, 0, 0) = center of field
- Team 1 attacks +Z direction, Team 2 attacks -Z direction
- Measurements in meters

**Team-Relative Space** (Tactical):
- Used for AI, formations, tactics
- Origin (0, 0) = team center of mass (dynamic)
- Both teams see -Z as opponent goal (attacking direction)
- Normalized -1 to 1 for formations
- Eliminates team-specific code (identical AI logic for both teams)

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
- **Intention-Based**: AI returns what player WANTS to do, game engine applies outcomes
- **Configurable AI**: Teams can specify custom AI scripts (team-level + goalkeeper)
- **State Updates**: AI receives updates only when tactics/phase/instructions change

**AI Responsibilities**:
- **Per-Player AI** (30-200ms dynamic): Decision-making based on vision, formation, game state
- **Ball Physics** (Main Thread, 5-20ms): Ball trajectory, Magnus effect, collisions
- **Player Physics** (Main Thread, 10-50ms): Movement, acceleration, collision detection
- **Vision System** (Main Thread, 15-60ms): Vision cone calculations (NOT RECORDED in replay)
- **Head Movement** (Main Thread, 120-250ms AI + 20-50ms physics): Head orientation

**See**: [`WORKERS.md`](./WORKERS.md) for AI architecture details

**Future Enhancement**: AI computation may utilize Web Workers (browser) or Worker Threads (Node.js) for parallelization and context isolation as 3D simulation complexity evolves.

---

### 4. Viewer/Simulation Separation

Viewer is COMPLETELY separated from simulation:

```
Simulation (Dynamic Intervals) ──Stream──> Viewer (Variable Framerate)
      NO FEEDBACK LOOP                      Interpolates Variable Intervals
```

**Benefits**:
- Simulation updates at dynamic intervals independent of display framerate
- Same viewer code for live simulation AND replay files
- Multiple viewers can watch same simulation (broadcast, tactical, 1st-person)
- Simulation can run faster than real-time (5×, 10× speed)
- Viewer handles variable snapshot intervals seamlessly (ball 5-20ms, players 10-50ms)

**See**: [`VIEWER.md`](./VIEWER.md) for viewer architecture

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
- **Limited Vision**: Vision cone (~120° FOV, ~50m range), 15-60ms updates (NOT RECORDED)
- **Fuzzy Perception**: Gaussian noise on perceived positions (distance-based)
- **Phase-Based Behavior**: Attacking, Defending, Contesting phases
- **Weight-Based Tendencies**: hugsTouchline, findsSpace, forwardRunFrequency (0.0-1.0 floats)
- **Position Discipline**: 0.0 (free role) to 1.0 (rigid) - controls formation nudge strength
- **Dynamic AI Decisions**: 30-200ms intervals (high awareness near ball = 30ms, low awareness far = 200ms)

**See**: [`PLAYERS.md`](./PLAYERS.md) for player attributes and AI interface

---

### 7. Formation System

Formations use normalized team-relative space:

- **-1 to 1 Coordinates**: X (left/right), Z (defenders/strikers)
- **Position Discipline**: 0.0 (free role, no nudge) to 1.0 (rigid, always returns to position)
- **Formation Nudges**: Discipline controls blend between tactical freedom and formation position
- **Formation Transitions**: In-possession (attacking) vs. Out-of-possession (defending)
- **Identical Logic**: Both teams use same formation definitions (Team 2 flips X/Z)

**See**: [`FORMATIONS.md`](./FORMATIONS.md) for formation architecture

---

### 8. Replay System with Delta Encoding

Visual match replay recorded for playback:

**What Gets Recorded**:
- Ball positions/velocities (5-20ms variable intervals, ~50-200 Hz)
- Player positions/velocities (10-50ms variable intervals, ~20-100 Hz)
- Base snapshots (every 30 seconds, configurable)
- Highlight snapshots (goals, shots, dangerous attacks)
- Delta encoding with msOffset chain (UINT8, 0-255ms)

**What Does NOT Get Recorded**:
- AI decisions (intentions, not recorded in replay)
- Vision snapshots (can reconstruct from player positions)
- Event scheduler state (not needed for visual replay)
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
   - Player AI (Main Thread, 30-200ms): Get intention, apply outcome
   - Vision (Main Thread, 15-60ms): Update vision cone (NOT RECORDED)
   - Head AI (Main Thread, 120-250ms): Update head target
   - Head Physics (Main Thread, 20-50ms): Rotate head toward target
   ↓
5. Schedule Next Event (Dynamic interval based on speed/attributes/context)
   ↓
6. Record Snapshot (Variable intervals)
   ↓
7. Stream to Viewer (Variable intervals)
   ↓
8. Record Snapshots → Match History (Variable intervals, base + highlight)
   ↓
9. Send Snapshot Stream → Viewer (Variable intervals)
   ↓
10. Viewer Interpolates → Render Frame (60-240 Hz display)
   ↓
11. Repeat (2-10) until match ends
```

### Replay Flow

```
1. Load Replay File (.fctr)
   ↓
2. Validate (CRC32 checksum)
   ↓
3. Find Base Snapshot (30s intervals) + Delta msOffset Chain
   ↓
4. Reconstruct Absolute Timestamps (sum msOffset values)
   ↓
5. Get Snapshots (ball, players - NO vision/AI)
   ↓
6. Viewer Interpolates → Render Frame (handles variable intervals)
   ↓
7. Repeat (3-6) at playback speed (1×, 2×, 5×, etc.)
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
│   ├── COORDINATES.md     # Dual coordinate system (world + team-relative)
│   ├── EVENT_SCHEDULER.md # Dynamic event scheduling (min-heap priority queue)
│   ├── WORKERS.md         # 22 per-player AI workers, intention-based
│   └── VIEWER.md          # Viewer/simulation separation, variable interval interpolation
│
├── Game Components/
│   ├── BALL.md            # Ball physics, Magnus effect, spin
│   ├── FIELD.md           # Field dimensions, markings, boundaries
│   ├── PLAYERS.md         # Player attributes, AI interface, vision
│   ├── FORMATIONS.md      # Formation system, team-relative space
│   └── MATCH.md           # Match flow, team phases, scoring
│
├── Advanced Features/
│   ├── REPLAY.md          # Replay system, INT16 serialization
│   ├── 2D_VS_3D.md        # Rendering modes, interpolation
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
- ✅ 2D_VS_3D.md - Rendering modes with variable interval interpolation
- ✅ ARCHITECTURE.md - This document

**Next Steps** (after documentation approval):
1. Implement core systems (coordinates, event scheduler, AI)
2. Implement ball physics (gravity, drag, Magnus effect, dynamic 5-20ms updates)
3. Implement player movement (collision detection, animations, dynamic 10-50ms updates)
4. Implement 22 per-player AI (persistent state, intention-based, dynamic 30-200ms)
5. Implement formation system (team-relative space, position discipline, transitions)
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

### Why Team-Relative Space?

**Problem**: Team-specific coordinate systems require duplicate AI code:
- Team 1 attacks +Z, Team 2 attacks -Z
- "Move toward opponent goal" means different directions for each team

**Solution**: Team-relative space where -Z ALWAYS means opponent goal:
- Single AI implementation works for both teams
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

**FC Tycoon Match Simulation** is a visual replay-only, frame-rate independent football match engine with:

- **Dual Coordinate Systems**: World space (physics) + Team-relative space (tactics)
- **Dynamic Event Scheduling**: Ball 5-20ms, Players 10-50ms, AI 30-200ms (adaptive intervals)
- **Per-Player AI**: Persistent state, intention-based returns, configurable scripts
- **Viewer Separation**: Simulation → Stream → Viewer (no feedback loop, handles variable intervals)
- **Realistic Physics**: Gravity, drag, Magnus effect (mandatory spin), dynamic updates
- **AI System**: Limited vision (15-60ms, NOT RECORDED), weight-based tendencies (0.0-1.0), position discipline (0.0-1.0)
- **Formation System**: Normalized team-relative space (-1 to 1), position discipline controls formation nudge strength
- **Replay System**: Delta encoding with dual snapshots (base 30s + event highlights), visual ONLY (~65-90 MB compressed per match)
- **Team Phases**: Attacking, Defending, Contesting with formation transitions

**Future Enhancement**: AI computation may utilize Web Workers (browser) or Worker Threads (Node.js) for parallelization and context isolation as 3D simulation complexity evolves.

**Next**: Read [`README.md`](./README.md) for documentation index and getting started guide.
