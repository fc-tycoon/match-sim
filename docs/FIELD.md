# Field

## Overview

The football field (pitch) is the playing surface where matches occur. The field has standardized dimensions, markings, and zones that define legal play areas and influence tactical positioning.

## Field Dimensions

## Field Dimensions

### FIFA Standard Dimensions

According to FIFA regulations:

- **Length**: 100-110 yards (90-100m) for international matches
- **Width**: 64-75 yards (64-75m) for international matches  
- **Recommended**: 105m × 68m (115 yards × 74 yards) - most common professional size

**CRITICAL**: Field dimensions are stored as **BOTH yards AND meters**:
- **Source of Truth**: Yards (authentic FIFA specifications)
- **Cached Values**: Meters (for physics calculations)
- **Display Format**: "115 yards (105m)" - yards first, meters in brackets

### Match Simulator Defaults

**Default Field Dimensions** (stored in FieldDimensions class):

**Source Values** (Yards - FIFA Authentic):
- `lengthYards`: 115 yards
- `widthYards`: 74 yards (actually 74.4 for 68m)

**Cached Values** (Meters - For Physics):
- `lengthMeters`: 105m (115 yards × 0.9144 = 105.156m ≈ 105m)
- `widthMeters`: 68m (74.4 yards × 0.9144 = 68.0m)

**Display Format**:
- `displayLength`: "115 yards (105m)"
- `displayWidth`: "74 yards (68m)"

**Unit Conversion**: 1 yard = 0.9144 meters

**Internal Calculations**: All physics and coordinate calculations use **meters**

**Display**: User-facing UI shows **yards first** (familiar to football fans) with meters in brackets

### Configurable Sizes

Allow field size variation (both yards and meters stored):

- **Minimum**: 90m × 45m (98 yards × 49 yards) - youth/small fields
- **Maximum**: 120m × 90m (131 yards × 98 yards) - larger fields
- **Aspect Ratio**: Maintain reasonable length:width ratio (1.4-1.6)

**Implementation**: When user changes field size, update BOTH yards and meters values simultaneously.

## Coordinate System

**CRITICAL**: Field boundaries and markings use **world space coordinates** (absolute positions).

### Field Coordinates (World Space)

The field uses a 3D coordinate system (see COORDINATES.md for full details):

- **X-Axis**: Left (-) to Right (+) across field width
  - Range: -34m to +34m (for 68m width field)
  - Left touchline: x = -34m
  - Right touchline: x = +34m
  - Center: x = 0
  
- **Z-Axis**: Down-field depth (Team 2 goal to Team 1 goal)
  - Range: -52.5m to +52.5m (for 105m length field)
  - Team 2 goal: z = -52.5m (Team 2 defends, Team 1 attacks)
  - Team 1 goal: z = +52.5m (Team 1 defends, Team 2 attacks)
  - Halfway line: z = 0m
  
- **Y-Axis**: Height above ground (UP)
  - Range: 0m to ~50m (ground to maximum ball height)
  - Ground level: y = 0m
  - Player height: y = 0m to ~2m (feet to head)
  - Ball height: y = 0m to ~30m (typical maximum for high balls)

### Origin Point (World Space)

- **Center Spot**: (0, 0, 0) in world space
- **Center Circle**: Radius 9.15m (10 yards) around origin
- **Halfway Line**: z = 0 plane (divides field into two halves)

## Field Markings

**All markings specified in world space coordinates.**

### Boundary Lines

- **Goal Lines**: z = ±52.5m (short sides of field, where goals are)
  - Team 2 goal line: z = -52.5m
  - Team 1 goal line: z = +52.5m
- **Touchlines**: x = ±34m (long sides of field)
  - Left touchline: x = -34m
  - Right touchline: x = +34m
- **Line Width**: 0.12m (12cm standard line thickness)

### Center Circle

- **Center Spot**: (0, 0, 0) world space
- **Radius**: 9.15m (10 yards)
- **Purpose**: Opponent players must be outside circle during kickoff

### Penalty Areas

**Team 1 Penalty Area** (defending at z = +52.5m):

- **Width**: 40.32m (44 yards) centered on goal
- **Depth**: 16.5m (18 yards) from goal line
- **World Space Coordinates**:
  - Left edge: x = -20.16m
  - Right edge: x = +20.16m
  - Front edge: z = +36.0m (52.5 - 16.5)
  - Back edge: z = +52.5m (goal line)

**Team 2 Penalty Area** (defending at z = -52.5m):

- **Width**: 40.32m (44 yards) centered on goal
- **Depth**: 16.5m (18 yards) from goal line
- **World Space Coordinates**:
  - Left edge: x = -20.16m
  - Right edge: x = +20.16m
  - Front edge: z = -36.0m (-52.5 + 16.5)
  - Back edge: z = -52.5m (goal line)

**Penalty Spots**:
- **Team 1 Penalty Spot**: (0, 0, +41.5) - 11m from Team 1 goal
- **Team 2 Penalty Spot**: (0, 0, -41.5) - 11m from Team 2 goal
- **Distance from Goal**: 11m (12 yards)

**Penalty Arcs**:
- **Radius**: 9.15m (10 yards) from penalty spot
- **Arc**: Extends outside penalty area
- **Purpose**: Players must be outside arc during penalty kicks

### Goal Areas (Six-Yard Box)

Each goal area:

- **Width**: 18.32m (20 yards) centered on goal
- **Depth**: 5.5m (6 yards) from goal line
- **Coordinates** (Team 1 defending z = -52.5):
  - Left edge: x = -9.16
  - Right edge: x = +9.16
  - Top edge: z = -47.0

**Purpose**: Goal kicks must be taken from within goal area

### Corner Arcs

Four corner arcs at field corners:

- **Radius**: 1m (1 yard)
- **Positions**:
  - Bottom-left: (-34, 0, -52.5)
  - Bottom-right: (+34, 0, -52.5)
  - Top-left: (-34, 0, +52.5)
  - Top-right: (+34, 0, +52.5)
- **Purpose**: Corner kicks taken from within arc

## Goals

### Goal Dimensions

Standard goal size:

- **Width**: 7.32m (8 yards) between posts
- **Height**: 2.44m (8 feet) from ground to crossbar
- **Depth**: 2m (typical goal net depth, not regulated)

### Goal Positioning

Goals positioned at center of each goal line:

**Team 1 Goal** (z = -52.5m):
- Left post: (-3.66, 0, -52.5)
- Right post: (+3.66, 0, -52.5)
- Crossbar height: y = 2.44
- Net extends to: z = -54.5

**Team 2 Goal** (z = +52.5m):
- Left post: (-3.66, 0, +52.5)
- Right post: (+3.66, 0, +52.5)
- Crossbar height: y = 2.44
- Net extends to: z = +54.5

### Goal Detection Zones

Goal scored when ball fully crosses goal line:

- **X Range**: -3.66m < x < +3.66m (between posts)
- **Y Range**: 0m < y < 2.44m (below crossbar, above ground)
- **Z Check**: Ball center + radius crosses goal line (z < -52.5 or z > +52.5)

## Field Zones

### Defensive Third

The area closest to team's own goal:

**Team 1 Defensive Third**:
- X Range: -34m to +34m (full width)
- Z Range: -52.5m to -17.5m (35m depth)

**Team 2 Defensive Third**:
- X Range: -34m to +34m (full width)
- Z Range: +17.5m to +52.5m (35m depth)

### Middle Third

The central area of the field:

- X Range: -34m to +34m (full width)
- Z Range: -17.5m to +17.5m (35m depth)

### Attacking Third

The area closest to opponent's goal:

**Team 1 Attacking Third**:
- X Range: -34m to +34m (full width)
- Z Range: +17.5m to +52.5m (35m depth)

**Team 2 Attacking Third**:
- X Range: -34m to +34m (full width)
- Z Range: -52.5m to -17.5m (35m depth)

### Wide Areas (Flanks)

Left and right channels:

**Left Flank**:
- X Range: -34m to -22.67m (outer third of width)
- Z Range: Full field length

**Center Channel**:
- X Range: -22.67m to +22.67m (middle third of width)
- Z Range: Full field length

**Right Flank**:
- X Range: +22.67m to +34m (outer third of width)
- Z Range: Full field length

## Field Surface

### Surface Type

Common field surfaces:

- **Natural Grass**: Most common professional surface
- **Artificial Turf**: Synthetic surface (common in some climates)
- **Hybrid**: Mix of natural and synthetic fibers

### Surface Effects on Gameplay

Surface influences ball physics:

- **Friction**: Affects ball roll speed and stopping distance
- **Bounce**: Affects ball restitution (natural grass lower, turf higher)
- **Irregularities**: Random micro-variations in ball movement
- **Weather Effects**: Wet grass slows ball, dry grass faster roll

### Visual Representation

Field rendered with:

- **Grass Texture**: Tiled grass texture with variation
- **Mowing Pattern**: Alternating light/dark stripes
- **Line Markings**: White lines painted on surface
- **Wear Patterns**: Optional visual wear in high-traffic areas (penalty areas, center circle)

## Field Boundary Collision

### Out of Bounds Detection

Ball is out of bounds when:

- **Touchline**: abs(x) > 34m
- **Goal Line**: abs(z) > 52.5m (and not in goal)

### Boundary Response

When ball crosses boundary:

1. **Stop Ball Physics**: Freeze ball movement
2. **Determine Last Touch**: Which team touched ball last
3. **Determine Restart Type**:
   - Touchline → Throw-in
   - Goal line (attacker last touch) → Goal kick
   - Goal line (defender last touch) → Corner kick
4. **Position Ball**: Place at restart position
5. **Award to Team**: Opposite team takes throw/kick (except goal kick)

## Tactical Zones

### High Press Zone

Area where teams apply high pressing:

- Typically opponent's defensive third
- Z Range: Opponent's half, often deeper (e.g., z > 30m when Team 1 attacks)

### Build-Up Zone

Area where teams build attacks from back:

- Typically own defensive third and middle third
- Z Range: Own half and slightly forward (e.g., -52.5m < z < 10m for Team 1)

### Transition Zones

Areas critical for counter-attacks:

- Middle third (rapid transition between defense and attack)
- Wide areas (exploit space on flanks)

## Field Data Structure

### Field Configuration

**Field Configuration Object**:

**Dimensions**:
- `length`: 105 meters
- `width`: 68 meters

**Goals**:
- `goalWidth`: 7.32 meters
- `goalHeight`: 2.44 meters
- `goalDepth`: 2.0 meters

**Markings**:
- `penaltyAreaWidth`: 40.32 meters
- `penaltyAreaDepth`: 16.5 meters
- `goalAreaWidth`: 18.32 meters
- `goalAreaDepth`: 5.5 meters
- `centerCircleRadius`: 9.15 meters
- `cornerArcRadius`: 1.0 meters

**Physics**:
- `surfaceType`: 'grass' | 'turf' | 'hybrid'
- `friction`: 0.8 (range: 0.0-1.0)
- `restitution`: 0.6 (bounce coefficient, 0.0-1.0)

**Environmental**:
- `weatherCondition`: 'clear' | 'rain' | 'snow'
- `timeOfDay`: 'day' | 'night' | 'dusk'

### Boundary Helpers

**In Bounds Check**:
- Formula: `|x| ≤ fieldWidth / 2 && |z| ≤ fieldLength / 2`
- Returns true if position is inside field boundaries

**Penalty Area Check**:
- Team 1 penalty area: `|x| ≤ penaltyAreaWidth / 2 && z > -fieldLength / 2 && z < -fieldLength / 2 + penaltyAreaDepth`
- Team 2 penalty area: `|x| ≤ penaltyAreaWidth / 2 && z < fieldLength / 2 && z > fieldLength / 2 - penaltyAreaDepth`

**Goal Check**:
- Team 1 goal (z = -fieldLength / 2): `|x| ≤ goalWidth / 2 && y > 0 && y < goalHeight && z < goalZ`
- Team 2 goal (z = fieldLength / 2): `|x| ≤ goalWidth / 2 && y > 0 && y < goalHeight && z > goalZ`

## Stadium Environment

### Surrounding Area

Beyond field boundaries:

- **Running Track**: Optional athletics track around field (not part of play area)
- **Advertising Boards**: Visual elements along touchlines
- **Dugouts**: Team benches on sideline
- **Stands**: Spectator seating (visual only, no gameplay effect)

### Camera Positioning

Common camera views:

- **Broadcast View**: Elevated side view, follows play
- **Behind Goal**: View from behind one goal (attacking perspective)
- **Tactical View**: Top-down orthographic (2D view)
- **Player Cam**: Follow specific player

## Weather and Time Effects

### Weather Conditions

Weather affects field conditions:

- **Clear**: No effects
- **Rain**: Increased surface friction (slippery), reduced ball bounce, wet ball harder to control
- **Snow**: Significantly increased friction, reduced visibility, snow accumulation
- **Wind**: Affects ball trajectory (side wind, head/tail wind)

### Time of Day

Lighting conditions:

- **Day**: Full brightness, clear shadows
- **Dusk**: Reduced brightness, long shadows
- **Night**: Floodlights, high contrast, less shadow detail

### Visual Effects

Environmental visuals:

- **Rain**: Particle effects, puddles, wet surface shine
- **Snow**: Falling snow, accumulated snow on field
- **Wind**: Grass bending, flags waving
- **Shadows**: Dynamic shadows based on time of day

## Customization Options

### Field Variations

Allow customization:

- **Size**: Adjust length/width within FIFA limits
- **Surface**: Choose grass, turf, or hybrid
- **Condition**: Pristine, worn, muddy
- **Markings**: Standard, custom colors, club branding
- **Environment**: Stadium type, weather, time of day

### Visual Themes

Different visual styles:

- **Realistic**: Photo-realistic grass, accurate markings
- **Stylized**: Cartoon/artistic rendering
- **Retro**: Old-school pixelated or simplified graphics
- **Minimal**: Clean, flat colors, simple lines (tactical view)
