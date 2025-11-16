# Players

## Overview

Players are the primary entities on the field during a match simulation. They are divided into two distinct types with independent AI interfaces and behavioral patterns; Outfield players and Goalkeepers.

**Class Architecture**: All player types extend from a common `Player` base class containing shared functionality (coordinate transformations, distance calculations, vision checks, etc.). Outfield players and Goalkeepers extend this base class with specialized behavior.

**CRITICAL**: Players create and manage their own **Web Workers internally** for AI computation. Web Workers are an internal implementation detail of the Player class - the match engine only interacts with Player objects.

**Player Class Hierarchy**:

**Base Player Class** (shared functionality):
- Common properties: ID, team ID, position (world space), velocity, facing angle (radians)
- Internal Web Worker: Created in constructor, terminated in destroy()
- Common methods: `worldToTeamRelative()`, `teamToWorld()`, `headingAngle()`, `distanceTo()`, `isInVisionCone()`, `makeDecision()`, `destroy()`

**OutfieldPlayer** (extends Player):
- Formation position: Normalized -1..1 in team-relative space
- Formation-specific AI interface
- Inherits worker management from base Player class

**Goalkeeper** (extends Player):
- Goalkeeper-specific AI interface
- NOT part of formation or center of mass
- Inherits worker management from base Player class

## Player Types

### Outfield Players

Outfield players form the majority of the team and participate in the formation structure. Their behavior is governed by:

- **Formation Position**: Their designated position within the tactical formation
- **Team Center of Mass**: Their relationship to the collective positioning of the team
- **Playing Style**: Individual behavioral tendencies and preferences
- **Playing Role**: Specific tactical responsibilities within the formation
- **Weights and Biases**: Internal parameters that influence decision-making

Outfield players use a unified AI interface, though individual AI implementations may choose to further specialize behavior based on formation position, tactical role, or other internal logic. This specialization is an internal implementation detail of the AI engine.

### Goalkeepers

Goalkeepers operate independently from the outfield player system:

- **No Formation Participation**: Goalkeepers are not part of formation positioning calculations
- **No Center of Mass**: Excluded from team center of mass calculations
- **Independent AI Interface**: Use a separate AI interface designed specifically for goalkeeper behaviors
- **Isolated Decision Making**: Make decisions based on goal defense rather than team formation

## Limited Vision System

Players do not have omniscient knowledge of all entities on the field. Their perception is limited and realistic.

### Vision Mechanism

- **Limited Field of View**: Players only perceive a subset of players and the ball
- **Attribute-Driven**: Vision and awareness attributes determine what players can perceive
- **Match Engine Controlled**: The match engine determines visible entities based on:
  - **Vision** (1-99): General visual acuity and field awareness
  - **Attacking Awareness** (1-99): Perception during offensive phases
  - **Defending Awareness** (1-99): Perception during defensive phases

### Perception Updates

**CRITICAL**: Player updates use **FIVE independent systems** with different dynamic frequencies (see `EVENT_SCHEDULER.md`):

1. **Body Physics** (10-50ms dynamic) - Player position, velocity, collision detection (speed-based)
2. **AI Decisions** (30-200ms dynamic) - Action selection, decision-making logic (attribute/context-based)
3. **Vision Perception** (15-60ms dynamic) - World snapshot, vision cone, visible objects (attribute-based)
4. **Head Movement AI** (120-250ms dynamic) - Head orientation decisions/targets (awareness-based)
5. **Head Movement Physics** (20-50ms dynamic) - Head rotation interpolation toward targets (rotation speed-based)

**Vision Perception** (15-60ms, attribute-based):

**CRITICAL**: Vision system enables **1st-person "through their eyes" replay**!

**Vision Update Frequency** (dynamic scheduling - see `EVENT_SCHEDULER.md` for formula):
- **High Perception** (Vision 90+ Awareness 90+): 15ms updates (~67 Hz)
- **Average Perception** (Vision 70 Awareness 70): 38ms updates (~26 Hz)
- **Low Perception** (Vision 50 Awareness 50): 60ms updates (~16.67 Hz)
- **Formula**: `interval = 60 - ((visionRating * 0.6 + awarenessRating * 0.4 - 50) / 49) * 45`
- **NOT RECORDED IN REPLAY**: Too large, can reconstruct from player positions during playback

**Head Movement AI** (30-200ms, awareness-based):

**Head AI Update Frequency** (dynamic scheduling - see `EVENT_SCHEDULER.md` for formula):
- **High Awareness** (90+): 30ms decisions (~33 Hz)
- **Average Awareness** (70): 130ms decisions (~7.7 Hz)
- **Low Awareness** (50): 200ms decisions (5 Hz)
- **Formula**: `interval = 200 - ((awarenessRating - 50) / 49) * 170`
- **Default Implementation**: Player class provides sensible head tracking (track ball if visible)
- **AI Override**: Outfield/Goalkeeper AI can override for custom head movement

**Head Movement Physics** (20-50ms, rotation speed-based):

**Head Physics Update Frequency** (dynamic scheduling):
- **Fast Rotation** (>2.0 rad/s): 20ms updates (50 Hz)
- **Slow Rotation** (<2.0 rad/s): 50ms updates (20 Hz)
- **Smooth Interpolation**: Rotates head smoothly toward AI-decided targets

**Interactive Features**:
- **Click Player**: Highlight and show stats, their vision cone, and the players they see
- **Double-Click Player**: Enter 1st-person view, travel with player through match
- **Ghost View**: Show both real positions and player's perceived positions simultaneously

**Vision Recording Data**:

**CRITICAL**: Eyes are **LOCAL to player** - they move automatically with the player!

**Player Local Transform Structure**:
- **Player Origin**: At feet (ground level, center of player)
- **Player Position**: World space coordinates (feet on ground)
- **Eye Offset**: Local offset from player origin (e.g., `{x: 0, y: 1.75, z: 0}`)
- **Eyes move with player automatically** (standard game engine pattern)

**What We Record** (Vision Snapshot Data):
- **Player Position** (world space, feet): For calculating eye position at runtime
- **Player Height**: To compute eye offset (97% of height)
- **Body Facing**: Player body rotation (world space, radians)
- **Head Yaw**: Head rotation LEFT/RIGHT **relative to body** (radians)
- **Head Pitch**: Head rotation UP/DOWN **relative to body** (radians, positive = looking down)
- **Vision Cone**: Field of view (~120° horizontal, ~90° vertical)
- **Vision Range**: Maximum perception distance (~50 meters)
- **Visible Objects**: List of players and ball within FOV and range THIS FRAME
- **Recording Frequency**: 15-60ms dynamic intervals (~16.67-67 Hz), attribute-adjusted, NOT STORED IN REPLAY

**NOTE**: Head **roll** is NOT recorded - players don't roll their heads (yaw/pitch sufficient).

**Head Orientation is Relative to Body**:
- Head yaw/pitch/roll are **offsets** from body facing direction
- Player can turn head left/right while body runs forward
- Player can look up to track high ball or down at ground
- Example: Body facing π (forward), head yaw +0.3 rad (turned ~17° right from body)

**Eye Position Calculation** (at runtime):

Eye position calculated from player feet position + height offset. Formula: `eyePos.y = playerPos.y + (playerHeight * 0.97)` where eyes are at ~97% of player height (~1.75m for 1.80m tall player).

**1st-Person Camera Replay**:

User can enter 1st-person mode by selecting player at specific timestamp. Camera follows player's exact eye position and head orientation (interpolated between snapshots for smooth 60/144 FPS display). Two modes available:
1. **Real World View**: Shows actual match state (what really happened)
2. **Perceived View**: Shows only what player perceived (fuzzy positions, invisible players hidden)

**Debug Ghost View**:

During paused state, clicking player shows dual view: Real player positions (solid), perceived positions overlaid (ghosted, transparent cyan), hidden players marked (red), and vision cone visualization.

**Vision Snapshot Content**:
- Player position/height (for eye position calculation)
- Body facing and head orientation (yaw, pitch, roll)
- Visible player IDs (within vision cone)
- Perceived positions (with awareness-based error)
- Ball visibility and perceived position

**Eye Position Calculation** (runtime, not stored):
- Formula: eye position Y = player position Y + (player height × 0.97)
- Example: Player at 1.80m height → eye Y = 1.746m

**Serialization** (for replay file - see REPLAY.md):
- Player position: INT16 (1cm resolution, 6 bytes)
- Player height: UINT8 (1cm resolution, 1 byte, range 0-255cm)
- Body facing: INT16 (0.001 rad resolution, 2 bytes)
- Head orientation (yaw/pitch/roll): INT16 (0.001 rad resolution, 6 bytes)
- Visible player IDs: UINT8 array (1 byte per ID, variable length)
- Perceived positions: INT16 delta from real position (2 bytes per axis per player)
- **Total**: ~20-60 bytes per snapshot (depending on visible player count)

### Fuzzy Vision

Player perception is intentionally imprecise to simulate realistic human limitations:

- **Position Uncertainty**: Perceived positions of players and ball are not perfectly accurate
- **Gaussian Distribution**: Applied to perceived positions based on vision attributes
- **Distance Factor**: Accuracy decreases with distance from the player
- **Attribute Scaling**: Higher vision/awareness attributes reduce uncertainty

Lower-rated players will have more imprecise perception, while elite players will have more accurate awareness of their surroundings.

## Decision Making

### Action Frequency

Not all players act on every tick. The match engine uses attribute-based probability:

- **Attacking Decision Making** (1-99): Probability of acting during offensive phases
- **Defending Decision Making** (1-99): Probability of acting during defensive phases
- **Conversion to Probability**: Attribute value ÷ 99 = probability (0.0 to 1.0)
- **Phase-Dependent**: Different probabilities based on current phase of play

This creates realistic variation where elite decision-makers act more frequently and consistently, while lower-rated players may miss opportunities or react slower.

### AI Execution Model

Player AI runs in an isolated execution environment:

- **Isolated State**: Each AI execution receives only the information available to that player
- **Stateless Preference**: AI implementations should avoid storing state between ticks
- **Action Response**: When queried, AI returns an action decision (kick, run, move, etc.)
- **Optional State Return**: AI can return state data with the action for continuity
- **Randomized Execution**: Player processing order may be randomized to discourage state dependency

## Player Attributes

All player attributes use a unified 1-99 scale:

### Physical Attributes

- Speed, acceleration, agility, strength, stamina, etc.

### Technical Attributes

- Passing, shooting, dribbling, ball control, etc.

### Mental Attributes

- **Vision** (1-99): Field awareness and perception range
- **Attacking Awareness** (1-99): Recognition of offensive opportunities
- **Defending Awareness** (1-99): Recognition of defensive situations
- **Attacking Decision Making** (1-99): Quality and frequency of offensive decisions
- **Defending Decision Making** (1-99): Quality and frequency of defensive decisions

### Goalkeeper Attributes

- Handling, reflexes, positioning, distribution, etc.

## Tendencies

**CRITICAL**: All tendencies are **weight-based floats (0.0-1.0)**, NOT booleans or fixed roles!

Tendencies control the tactical identity and behavioral patterns of players. All values stored in snake_case format from database.

### Outfield Player Tendencies

**Movement & Positioning**:
- **`hugs_touchline`**: 0.0 = always cuts inside, 1.0 = always stays wide
- **`finds_space`**: 0.0 = holds position, 1.0 = constantly moves into space
- **`ball_carrying`**: 0.0 = rarely runs forward, 1.0 = constantly carries the ball forwards
- **`forward_run_frequency`**: 0.0 = rarely runs forward, 1.0 = constantly makes forward runs
- **`holds_back`**: 0.0 = pushes up aggressively, 1.0 = stays deep/defensive
- **`arrives_late`**: 0.0 = early runs into box, 1.0 = late arriving runs
- **`penalty_box_player`**: 0.0 = stays outside box, 1.0 = always in box

**Ball Skills & Tactics**:
- **`holds_up_ball`**: 0.0 = releases quickly, 1.0 = shields ball/holds possession
- **`drives_forward`**: 0.0 = safe passes only, 1.0 = dribbles forward frequently
- **`presses_highly`**: 0.0 = stays compact/passive, 1.0 = aggressive high press
- **`tracks_back`**: 0.0 = stays forward, 1.0 = tracks runners defensively

### Team Instructions (Shared Across Team)

**Tactical Setup**:
- **`tempo`**: 0.0 = slow methodical build-up, 1.0 = fast transitions/counter-attacks
- **`width`**: 0.0 = narrow compact shape, 1.0 = wide stretched formation
- **`pressing_intensity`**: 0.0 = low block/passive, 1.0 = gegenpressing/aggressive
- **`defensive_line`**: 0.0 = deep defensive line, 1.0 = high line/offside trap

### Goalkeeper Instructions

**Distribution & Positioning**:
- **`distribute_to_back`**: 0.0 = always long kicks, 1.0 = always short to defenders
- **`distribute_to_flanks`**: 0.0 = central distribution, 1.0 = wide to wingers
- **`sweeper`**: 0.0 = stays on goal line, 1.0 = sweeper-keeper (rushes out)
- **`commands_area`**: 0.0 = passive/quiet, 1.0 = dominates box/vocal

### Position Discipline (Formation Adherence)

**`position_discipline`** (0.0-1.0 float):
- **0.0**: Free role - roaming playmaker, NO formation constraint
- **0.2**: Very low - creative midfielder, wide freedom
- **0.5**: Medium - balanced, some tactical freedom
- **0.8**: High - most positions, tight structure
- **1.0**: Maximum - rigid, always returns to formation position

Controls blend between formation target and tactical freedom. AI calculates: `finalPosition = formationPosition × discipline + tacticalPosition × (1 - discipline)`

### How Tendencies Work

**Probabilistic Weights**:
- Tendencies **bias** decisions, NOT dictate them
- Example: `forward_run_frequency = 0.6` means 60% probability of making forward run
- However, their attacking mentality and commitment could potentially increase this percentage
- NO fixed roles - behavior emerges from weighted probabilities

**Blending with Team Instructions**:
- Individual tendencies combined with team instructions
- Typical blend: 60% individual tendency, 40% team instruction
- Phase multipliers applied (e.g., less pressing when defending)

**Emergent Behavior**:
- Complex team behaviors emerge from simple individual tendencies
- Same player adapts to different tactical setups
- No hard-coded position labels (e.g., "Center Back", "Striker")

---

## Player Attributes

All player attributes use a unified 1-99 scale:

### Physical Attributes

- Speed, acceleration, agility, strength, stamina, etc.

### Technical Attributes

- Passing, shooting, dribbling, ball control, etc.

### Mental Attributes

- **Vision** (1-99): Field awareness and perception range
- **Attacking Awareness** (1-99): Recognition of offensive opportunities
- **Defending Awareness** (1-99): Recognition of defensive situations
- **Attacking Decision Making** (1-99): Quality and frequency of offensive decisions
- **Defending Decision Making** (1-99): Quality and frequency of defensive decisions

### Goalkeeper Attributes

- Handling, reflexes, positioning, distribution, etc.

---

## Playing Styles and Roles

Players do not have rigid preset positions (e.g., "Center Back", "Right Back", "Striker"). Instead, their behavior emerges from:

### Playing Style

Individual behavioral tendencies:
- Aggressive vs. passive
- Direct vs. intricate
- Risk-taking vs. conservative
- High-press vs. deep-lying

### Playing Role

Tactical responsibilities within the formation:
- Ball-winning focus
- Playmaking focus
- Goal-scoring focus
- Defensive screening
- Support running

### Emergent Positioning

Actual on-field positioning emerges from:
- Formation structure
- Playing role weights
- Team center of mass
- Match situation
- AI interpretation of tactical instructions

This flexible system allows the same player to adapt their positioning and behavior based on tactical setup, rather than being locked into a specific position label.

---

## AI Interface Contract

### Input to Player AI

When queried for an action, player AI receives:

**Player's Own State**:
- Position (world space coordinates x, y, z)
- Velocity vector
- Stamina (0.0-1.0)
- Has ball possession (boolean)
- Head orientation (yaw, pitch in radians)
- Eye position for vision cone calculations

**Visible Players** (limited by vision cone and awareness):
- Player ID, position (fuzzy/imprecise with Gaussian noise), team (1 or 2)
- Velocity (may be estimated), distance from this player (meters)
- Only players within FOV (~120° horizontal) and range (~50m)
- Limited information based on vision system

**Ball State** (if visible within vision cone):
- Position (fuzzy/imprecise with Gaussian noise)
- Velocity (may be estimated)
- Distance from player in meters
- In-play status

**AI Input Structure**:
Player AI receives comprehensive input including:
- Player state: Position, velocity, stamina, body/head orientation, eye position
- Visible players: ID, distance, perceived position, visibility flags
- Ball: Position, velocity, visibility
- Formation/tactical context: Center of mass, assigned position, role, style, tendencies (team-relative coordinates)

**Key Vision System Features**:
- **headYaw/headPitch**: Where player is currently looking
- **eyePosition**: 3D position of eyes for 1st-person camera
- **visiblePlayers**: Only includes players within vision cone (~120° FOV) and range (~50m)
- **ball visibility**: Ball only visible if within vision cone
- **distance**: Added to visible objects for AI decision-making

### Output from Player AI

Player AI returns an action decision and optionally updates head orientation:

**Action Types**: 'move' | 'kick' | 'tackle' | 'sprint' | 'idle'

**Action-Specific Parameters**:
- **move**: Target position (x, z), movement speed
- **kick**: Power, direction, curl/spin
- **tackle**: Direction of tackle attempt

**Optional Head Movement** (for vision system):
- `headTarget`: Target yaw (radians), target pitch (radians)
- Head smoothly rotates toward target over time (not instant)

**Optional State Preservation**:
- AI-specific state data between ticks (discouraged, prefer stateless AI)

**Head Movement Notes**:
- **Optional**: AI can update `headTarget` to control where player looks
- **Smooth Transition**: Head rotates smoothly toward target (not instant)
- **Independent**: Head movement independent of body orientation
- **Vision Recording**: Head orientation determines vision cone for replay
- **Default Behavior**: If not specified, head follows ball or movement direction

## Class Hierarchy

### Base Player Class

All players inherit from a base `Player` class with common properties (position, velocity, attributes) and methods (move, kick, tackle).

### Outfield Player

OutfieldPlayer extends Player with formation-specific properties and additional methods for formation positioning.

**Player Class Types**:

**Base Player**: Common properties (ID, team ID, position, velocity, facing), internal Web Worker management

**OutfieldPlayer** (extends Player): Formation position, formation-specific AI interface

**Goalkeeper** (extends Player): Goalkeeper-specific properties, additional methods (dive, catch, distribute)

**AI Implementations**: Custom AI scripts extend base AI classes (CustomOutfieldAI extends OutfieldAI, CustomGoalkeeperAI extends GoalkeeperAI) with custom `update()` logic

## Team Assignment

Players belong to one of two teams:

- **Team 1**: Typically the home team
- **Team 2**: Typically the away team

Each team can use:
- **Independent Outfield AI**: Team 1 and Team 2 can use different outfield AI engines
- **Independent Goalkeeper AI**: Each goalkeeper can use a different AI engine
- **Shared AI**: Both teams can use the same AI engine if desired

This allows for:
- Testing different AI implementations against each other
- Asymmetric difficulty (stronger AI vs. weaker AI)
- Mixed AI strategies in the same match
