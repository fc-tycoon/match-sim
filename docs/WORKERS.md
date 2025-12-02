# Player AI Architecture

## Overview

Players manage their own AI computation within the match simulation. The match engine creates **Player objects** that handle decision-making for the 22 on-field players. This document defines the player AI architecture and decision-making protocol.

**CRITICAL Architectural Principles**:
- **Limited World View**: AI only receives sensor data (vision, position, ball), NOT full world state
- **Inspired by RoboCup**: Autonomous agents with limited perception, achieving realistic decision-making
- **Simple AI for Subs/Managers**: Substitutes and managers use lightweight logic
- **Intention-Based**: AI returns intentions/desires (NOT outcomes)
- **Game Engine Applies Outcomes**: Match engine interprets intentions and applies physics/game rules

**Future Implementation Note**: AI computation may utilize Web Workers or Worker Threads for parallelization and context isolation as 3D simulation complexity evolves. Current architecture supports both in-thread and worker-based implementations.

---

## Player AI Decision-Making

### Primary Goal: Context Isolation (AI Agent Sandboxing)

**CRITICAL**: The MAIN architectural goal is **context isolation for AI agents** and realistic decision-making.

**Custom AI Script Sandboxing**:
- **User-Provided AI**: Players can create custom AI scripts (team tactics, playing styles)
- **Security Isolation**: AI cannot access full match state, DOM, or engine internals
- **Limited World Access**: AI only receives explicit sensor data (vision cone, position, stamina)
- **Prevents Cheating**: AI cannot access opponent positions outside vision cone
- **Prevents Crashes**: Errors in custom AI scripts isolated from match engine

**Autonomous Agent Philosophy** (inspired by RoboCup):
- **Sensor-Based Perception**: Players only "see" what their vision cone detects
- **Imperfect Information**: Players have fuzzy, limited view of world (realistic decision-making)
- **Self-Contained Agents**: Each player is autonomous entity with own memory, tendencies, decision logic
- **Emergent Behavior**: Complex team behaviors emerge from individual agent decisions

**Future Parallelization Benefits** (when implemented with Web Workers/Worker Threads):
- **Multi-Core Utilization**: 22 AI instances can run simultaneously on multi-core CPUs
- **Reduced Latency**: AI decisions complete in parallel (not sequential bottleneck)
- **Performance Scaling**: More CPU cores = faster AI processing

### Simplified AI for Non-Players

**Substitutes (Bench Players)**:
- **Simple AI**: Walk up/down sideline, warm up, watch match
- **Lightweight Logic**: Doesn't require complex decision-making
- **No Complex Decisions**: Not making tactical decisions (not in play)

**Managers (Coaches)**:
- **Simple AI**: Make tactical changes, substitutions, shouts
- **Lightweight Logic**: Infrequent decisions (every 30-60 seconds)
- **Full World Access**: Managers CAN see full match state (tactical overview)

**Ball Physics**:
- **Main Thread**: Ball physics executed on main thread (frequent collisions, immediate access to player positions)

---

## Architecture Principles

### Player AI Encapsulation

**Player Class Responsibilities**:
- Player constructor initializes AI state and configuration
- Player handles AI decision-making: `makeDecision()`, `updateTeamInstructions()`, etc.
- Player manages AI lifecycle: `destroy()` method cleans up AI resources

**Match Engine Perspective**:
- Creates Player objects (22 players for on-field)
- Calls player methods (makeDecision, destroy)
- Never directly manages AI implementation details

**Key Benefits**:
- **Encapsulation**: AI lifecycle hidden inside Player class
- **Clean Interface**: Match engine only interacts with Player objects
- **Automatic Cleanup**: AI resources released when players destroyed
- **Implementation Flexibility**: Can switch between in-thread or worker-based AI without changing match engine code

### Event Scheduler Controls Timing

The main thread's event scheduler (see `EVENT_SCHEDULER.md`) controls ALL update timing:

- **Dynamic Scheduling**: AI decisions scheduled at 30-200ms intervals (attribute/context-based)
- **NO Self-Scheduling**: AI NEVER schedules its own updates
- **Event-Driven**: AI invoked when next decision time arrives
- **Suspension Support**: AI can return `null` to pause updates (e.g., unconscious player)
- **Variable Frequencies**: High awareness + near ball = 30ms, low awareness + far from ball = 200ms

### Game Engine Applies Outcomes

AI returns INTENTIONS, game engine determines OUTCOMES:

- **AI Returns**: `{ intention: 'pass', target: playerId, power: 0.8, vector: {x, y} }`
- **Game Engine Applies**: Checks if pass is possible, applies physics & skill, handles interceptions
- **Physics Validation**: Engine validates actions against game rules and physics constraints
- **Separation of Concerns**: AI decides what to TRY, engine decides what HAPPENS
- **Consistent Game Rules**: All actions filtered through central physics/rules system

---

## Player AI Communication Protocol

### Player AI Decision Flow

**CRITICAL**: Players encapsulate AI lifecycle and decision-making. Match engine calls player methods, players manage AI implementation internally.

**AI Initialization Process**:
- Player constructor initializes AI with configuration
- Player sets up AI state and memory
- Initialize AI with persistent state:
  - Player ID
  - Attributes (pace, passing, shooting, etc.)
  - Tendencies (hugsTouchline, findsSpace, etc.)
  - Team instructions (tempo, width, pressing)
  - Formation data

**AI Decision Request** (dynamic 30-200ms intervals):
- Event scheduler calls player's makeDecision method with tick, vision data, formation data, game state
- Player processes request through AI logic
- AI receives: player state (position, velocity, stamina), limited vision data, formation target, match context

---

## Player AI Communication Protocol

### Player Internal Worker Management

**CRITICAL**: Players encapsulate worker lifecycle and communication. Match engine calls player methods, players communicate with workers internally.

**Worker Initialization Process**:
- Player constructor creates worker from AI script path
- Player sets up message handler for worker responses
- Initialize message sent to worker with persistent state:
  - Player ID
  - Player attributes (ratings 1-99 for pace, acceleration, stamina, passing, vision, etc.)
  - Tendencies (floats 0.0-1.0)
  - Team instructions
  - Formation data

**AI Decision Request** (dynamic 30-200ms intervals):
- Event scheduler calls player's makeDecision method with tick, vision data, formation data, game state
- Player forwards request to internal worker
- Worker receives: player state (position, velocity, stamina), limited vision data, formation target, match context

**Vision Data** (LIMITED world view):
- Only players within vision cone (~120° FOV, ~50m range)
- Ball position/velocity (if visible)
- NO access to players outside vision cone
- **Context Isolation**: AI cannot "see" opponents behind them (prevents cheating)

**AI Decision Response** (intention-based):
- Intention type: move, pass, shoot, tackle, sprint, idle, dribble
- Type-specific parameters (target player ID, power, position, etc.)
- Suggested next interval (30-200ms)
- Game engine validates and applies physics/skill checks

**AI State Updates**:
- Player class manages state changes: updateTeamInstructions, updateFormation, updateTeamPhase
- AI updates internal state accordingly

**AI Suspension**:
- AI can return null intention to suspend updates (unconscious player, off field, etc.)

---

## Substitutes and Managers (Simplified AI)

### Substitute Players (Bench)

**Simplified AI**:
- SubstitutePlayer class with `makeDecision()` method
- Simple sideline behavior: walk, stretch, watch match
- Lightweight logic for 14 bench players

**Why Simplified for Subs**:
- Simple behavior doesn't require complex AI or isolation
- Not in play (not affecting match outcome)
- Can see full match (warming up, observing)

### Manager AI (Coaches)

**Simplified AI**:
- Manager class with `makeDecision()` method
- Tactical decisions: substitutions, formation changes, tempo adjustments
- Full world access (tactical overview)

**Why Simplified for Managers**:
- **Infrequent Decisions**: Managers make decisions every 30-60 seconds (not 30-200ms)
- **Full World Access**: Managers CAN see all players, all positions (tactical overview)
- **Simple Logic**: Conditional rules for tactical changes

---

## PlayerAI Variants (Outfield vs Goalkeeper)

### Outfield Player AI

**CRITICAL**: Outfield players extend `PlayerAI` base class with same interface.

**Pressing Game AI Characteristics**:
- Custom AI class extends PlayerAI base class
- High press weight: Actively pursues ball carrier when team doesn't have possession
- Pressing logic:
  - If player doesn't have ball and ball is visible
  - Calculate distance to ball
  - Calculate pressing intensity from tendency × team instructions
  - If distance < 15m and intensity > 0.6: Sprint toward ball with max effort
- Default behavior: Move to formation target position at moderate speed
- Decision frequency: Higher when ball is near, lower when out of range

### Goalkeeper AI

**CRITICAL**: Goalkeepers also extend `PlayerAI` base class but receive goalkeeper-specific data.

**Sweeper-Keeper AI Example**:
- Receives goalkeeper-specific vision data: goal position, danger zones, through balls
- High sweeper instruction (>0.7): Rush out to intercept through balls within 20m
- Default behavior: Stay on goal line at low movement speed
- Max effort sprinting when intercepting dangerous through balls

**Key Differences**:
- **Same Base Class**: Both outfield and goalkeeper AI extend `PlayerAI`
- **Different Data**: Goalkeepers receive goalkeeper-specific vision data (goal position, danger zones, through balls)
- **Different Instructions**: Goalkeepers access `goalkeeperInstructions` instead of `teamInstructions`
- **Same Interface**: Both implement `makeDecision()`, `initialize()`, `updateState()`

---

## Ball Physics (Main Thread)

**CRITICAL**: Ball physics runs in **main thread** for performance and simplicity.

**Rationale**:
- Ball physics is single-threaded computation (no parallelization benefit)
- Frequent collisions require immediate access to player positions
- Ball updates at 5-20ms intervals (very high frequency)

**Implementation**:
- Ball physics executed directly in main thread
- Event scheduler triggers ball updates at dynamic intervals
- Ball state immediately available to all systems

---

## AI Communication Protocol

### PlayerAI Base Class (For AI Developers)

**CRITICAL**: AI developers extend the PlayerAI base class to create custom AI scripts. This provides a common interface and helper functions for both outfield players and goalkeepers.

**Base Class Structure**:
- **constructor**: Initializes state to null (persistent state for attributes, tendencies, team instructions)
- **initialize(playerData)**: Called once at worker creation - AI developers can override to set up custom state
- **makeDecision(tick, player, vision, formation, gameState)**: AI developers MUST implement this method - returns intention based on current game state
- **updateState(updates)**: Optional override to react to tactical changes (team instructions, formation, phase)
- **suggestNextInterval()**: Optional override to customize AI update frequency (30-200ms range based on awareness)
- **Helper Methods**: distanceTo(), angleTo(), isInVisionCone() for geometric calculations

**Interval Calculation**: Base interval calculated from awareness attributes, clamped to 30-200ms range

**Custom AI Implementation**:
- Extend PlayerAI class
- Override makeDecision() to implement custom tactics (e.g., TikiTakaAI, PressingGameAI)
- Access persistent state via this.state properties (attributes, tendencies, teamInstructions)
- Return intention object with type and parameters

**Message Structure**:
- Commands: initialize, makeDecision, updateState
- Responses: result (success/error), intention object, suggested next interval

**Error Handling**:
- Player class handles AI errors internally
- AI errors caught and reported as error responses
- Player falls back to default intention (idle) on error
- Match engine never sees AI exceptions

---

## Player Lifecycle

**Initialization**:
- Match engine creates 22 Player objects (players initialize AI internally)
- Team specifies AI configuration (outfield vs goalkeeper)
- Substitutes and managers created with simplified AI

**Termination**:
- stopSimulation() calls player.destroy() for all players
- Player.destroy() cleans up AI resources

**Persistent State**:
- AI state persists throughout 90+ minutes
- State includes attributes, tendencies, memory
- State updates only when tactics/formation/phase changes
- No recreation overhead

---

## Event Scheduler Integration

**Dynamic AI Decision Scheduling** (see `EVENT_SCHEDULER.md` for complete formulas):

Event scheduler triggers AI decisions at dynamic intervals (30-200ms) based on:
1. **Player Attributes**: Vision + Awareness ratings determine base interval
2. **Ball Proximity**: Closer to ball = more frequent updates
3. **Team Phase**: Attacking phase = more frequent, defending = less frequent
4. **Stamina/Concentration**: Fatigued players think slower

**State Update Operations**:
- **Team Instructions**: Manager changes tactics mid-match, player class forwards to all team AI instances
- **Team Phase**: Attacking/Defending phase change, broadcast to all team players
- **Player Position**: Tactical substitution or formation change, update specific player's formation data

Each operation uses player class methods (updateTeamInstructions, updateTeamPhase, updateFormation) which handle AI communication internally.

---

## Intention-Based AI System

### Intentions vs Outcomes

**Critical Design Principle**: AI returns INTENTIONS (what player wants), game engine determines OUTCOMES (what actually happens).

**Pass Intention Example**:

**AI Returns**:
- Intention type: `pass`
- Target player ID: 5
- Power: 0.7 (70% power)

**Game Engine Validates**:
- Check player has ball possession
- Check target player exists and is teammate
- Check pass is physically possible

**Game Engine Applies Outcome**:
- Calculate pass trajectory based on distance, power, direction
- Add accuracy noise based on passing attribute (lower rating = more error)
- Apply velocity to ball with arc trajectory
- Imperfect execution reflects player skill (Gaussian noise proportional to skill gap)
- Player loses possession
- Log pass event for match statistics

**Why Separation Matters**:
- **Consistent Physics**: All ball movement through central physics system
- **Imperfect Execution**: Player attributes affect accuracy (passing, shooting, tackling)
- **Game Rules Validation**: Engine enforces rules (can't pass without ball, can't tackle teammate)
- **Interceptions**: Other players can intercept passes (engine decides, not AI)
- **Emergent Behavior**: Outcomes emerge from physics + rules, not AI scripts

### Intention Types

**Movement Intention**:
- **type**: 'move'
- **targetPosition**: World space coordinates (x, y)
- **moveSpeed**: 0.0-1.0 fraction of max speed

**Pass Intention**:
- **type**: 'pass'
- **targetPlayerId**: Target player ID
- **power**: 0.0-1.0 (engine converts to m/s based on distance)

**Shot Intention**:
- **type**: 'shoot'
- **targetGoalPosition**: Where in goal (x, y coordinates)
- **power**: 0.0-1.0

**Tackle Intention**:
- **type**: 'tackle'
- **targetPlayerId**: Player to tackle
- **aggressive**: 0.0 = safe tackle, 1.0 = sliding tackle

**Dribble Intention**:
- **type**: 'dribble'
- **direction**: Unit vector (x, y)
- **speed**: 0.0-1.0

**Sprint Intention**:
- **type**: 'sprint'
- **targetPosition**: World space coordinates (x, y)
- **maxEffort**: true (drain stamina faster)

**Idle Intention**:
- **type**: 'idle'
- **conserveStamina**: true (recover stamina faster)

---

## Tendencies and Position Discipline

**Tendencies** (0.0-1.0 floats):
- All player tendencies are probabilistic weights, NOT booleans or fixed roles
- Examples: hugs_touchline, finds_space, forward_run_frequency, presses_highly, drives_forward
- AI uses tendencies to make weighted decisions
- Combined with team instructions for final behavior
- See `TENDENCIES.md` for complete tendency documentation

**Position Discipline** (0.0-1.0 float):
- Controls how strongly formation nudges player toward assigned position
- 0.0 = Free role (roaming playmaker, no formation constraint)
- 0.5 = Balanced (50% formation, 50% tactical freedom)
- 1.0 = Rigid (always returns to formation position)
- AI blends formation target with tactical target based on discipline value

---

## Future: Parallel Execution (Web Workers/Worker Threads)

**Potential Future Implementation**:
When 3D simulation complexity grows, AI computation may utilize Web Workers (browser) or Worker Threads (Node.js) for:

**Multi-Core Utilization**:
- All 22 per-player AI instances could execute in parallel on multi-core CPUs
- Event scheduler triggers AI decisions for multiple players simultaneously
- AI completes in parallel, intentions applied sequentially to avoid race conditions

**Benefits**:
- Multi-core utilization (22 AI instances can run on separate CPU cores)
- Reduced latency (all AI decisions complete simultaneously)
- Scalability (more CPU cores = faster AI processing)
- Context isolation (custom AI scripts sandboxed from match engine)

**Considerations**:
- Non-deterministic execution order (AI completes in unpredictable order)
- Deterministic outcomes (applying intentions sequentially ensures consistent results)
- Memory overhead (22 separate execution contexts consume more memory)
- Communication overhead (message passing between threads)
