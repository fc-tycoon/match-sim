# Coordinates

## Overview

The coordinate system defines how positions, velocities, and orientations are represented in the match simulation. A consistent, well-defined coordinate system is critical for physics accuracy, AI logic, and rendering.

**CRITICAL**: This system uses **dual coordinate spaces** - world space (absolute) and team-relative space (tactical). Understanding both is essential.

## Coordinate System Definition

### World Space (Absolute Coordinates)

The match simulator uses a **right-handed 3D coordinate system** (WebGL/OpenGL standard):

```
         +Y (Height/Up)
          🡑
          |     🡕   -Z (Forwards)
          |   ⟋
          | ⟋
          └────────🡒 +X (Right)
        ⟋
      ⟋
    🡗
    +Z (Backwards)
```

**Handedness**: This is a **right-handed coordinate system** (standard for OpenGL/WebGL):
- Right thumb = +X
- Right index finger = +Y
- Right middle finger = +Z

**Axis Definitions** (World Space):

- **X-Axis**: Left (-) to Right (+)
  - Negative X: Left side of field (from broadcast view)
  - Positive X: Right side of field
  - Zero X: Centerline (vertical center of field)

- **Y-Axis**: Height above ground (UP)
  - Zero Y: Ground level (field surface)
  - Positive Y: Height above ground (ball in air, player jump)
  - Negative Y: Below ground (not used in normal gameplay)

- **Z-Axis**: Down-field depth
  - **Negative Z**: Forward direction (toward opponent goal in FPS-style)
  - **Positive Z**: Backward direction (toward own goal)
  - Zero Z: Halfway line (center of field)

**World Space Usage**:
- Physics calculations (ball trajectory, collisions)
- Rendering (3D scene, camera positioning)
- Field boundaries and markings
- Absolute player positions for recording/replay

### Team-Relative Space (Tactical Coordinates)

**CRITICAL CONCEPT**: Both teams use the **same team-relative coordinate system** where **-Z is ALWAYS the opponent's goal** (forward/attacking direction).

This makes tactics, formations, and AI logic identical for both teams - no need to flip logic based on which team you are.

**Team-Relative Axes**:

- **X-Axis**: Left (-) to Right (+) *from team's perspective*
  - Negative X: Left flank (left winger, left back)
  - Positive X: Right flank (right winger, right back)
  - Zero X: Central channel

- **Y-Axis**: Same as world space (height is universal)

- **Z-Axis**: Depth *from team's perspective*
  - **Negative Z**: FORWARD toward opponent goal (strikers, attackers)
  - **Positive Z**: BACKWARD toward own goal (defenders, goalkeeper)
  - Zero Z: Halfway line (same as world space)

**Center of Mass Purpose**: The team's center of mass is a **tactical reference point** used for:
- Formation positioning (players' designated positions relative to team shape)
- Formation nudging (pulling players toward their assigned positions)
- Bounding box placement (team shape moves with center of mass)
- NOT the coordinate origin (origin remains at field center for both spaces)

**Coordinate Transformation**:

**CRITICAL**: Team-relative space uses the **same origin** as world space (field center). Only the **axes are rotated** for Team 2.

**Team 1 Transformation** (no rotation needed):
- World to Team 1: `{ x, y, z }` (identity transformation)
- Team 1 to World: `{ x, y, z }` (identity transformation)

**Team 2 Transformation** (180° rotation around Y axis):
- World to Team 2: `{ x: -worldX, y: worldY, z: -worldZ }` (flip X and Z)
- Team 2 to World: `{ x: -teamX, y: teamY, z: -teamZ }` (flip X and Z back)

**Mathematical Note**: The 180° rotation around Y is an **involution** (its own inverse) with rotation matrix `R = diag(-1, 1, -1)`. This is why world-to-team and team-to-world transformations use identical operations for Team 2.

**Velocity Transformations** (same rotation as positions):
- Team 1 velocities: `{ vx, vy, vz }` (unchanged)
- Team 2 velocities: `{ vx: -worldVx, vy: worldVy, vz: -worldVz }` (flip X and Z)

**Formation System Integration**:

Formation positions are normalized to -1..1 range in team-relative space, then transformed to world space:

**Team 1 Formation to World**:
1. Scale formation position from -1..1 to field dimensions: `scaledX = formationX * (width / 2)`, `scaledZ = formationZ * (depth / 2)`
2. Add center of mass offset: `worldX = COM.x + scaledX`, `worldZ = COM.z + scaledZ`

**Team 2 Formation to World**:
1. Scale formation position from -1..1 to field dimensions: `scaledX = formationX * (width / 2)`, `scaledZ = formationZ * (depth / 2)`
2. Flip X and Z, then add COM: `worldX = COM.x - scaledX`, `worldZ = COM.z - scaledZ`

Example: Striker at `{ x: 0.0, z: -0.9 }` (center forward, high up field) scales to world position accounting for team's center of mass and attacking direction.

**Why This Matters**:
- **Formation definitions**: Same for both teams (-Z = attackers, +Z = defenders)
- **AI logic**: "Move forward" always means -Z, regardless of team
- **Tactics**: Press high = move to -Z, defend deep = stay at +Z
- **Vision/awareness**: "Player ahead of me" = lower Z value
- **Passing**: "Forward pass" = negative Z direction

### Field Orientation (World Space)

**Standard Field Layout** (105m × 68m):

```
                    Team 2 Goal (world z = -52.5m)
                    Team 2 defends here, attacks ↓
    ┌───────────────────────────────────────────┐
    │                                           │
    │   ╔═══════════════════════════════════╗   │
    │   ║         Team 2 Penalty Area       ║   │
    │   ║                                   ║   │
+34m│   ║                                   ║   │ -34m
    │   ║                                   ║   │
    │   ║                                   ║   │
    │   ╚═══════════════════════════════════╝   │
    │                                           │
    │                    ⊕                     │  ← Center Spot (0, 0, 0)
    │                                           │  ← Halfway Line (z = 0)
    │   ╔═══════════════════════════════════╗   │
    │   ║                                   ║   │
    │   ║                                   ║   │
-34m│   ║                                   ║   │ +34m
    │   ║                                   ║   │
    │   ║         Team 1 Penalty Area       ║   │
    │   ╚═══════════════════════════════════╝   │
    │                                           │
    └───────────────────────────────────────────┘
                    Team 1 Goal (world z = +52.5m)
                    Team 1 defends here, attacks ↑

    X-axis: -34m (left) to +34m (right)
    Z-axis: +52.5m (Team 1 goal) to -52.5m (Team 2 goal)
    
    Team 1: Defends +Z, attacks toward -Z (↑ on diagram)
    Team 2: Defends -Z, attacks toward +Z (↓ on diagram)
```

**Team-Relative View** (Both Teams See Same Coordinate System):

```
                    Opponent Goal (team z = -52.5m)
                    FORWARD / ATTACK ↓
    ┌───────────────────────────────────────────┐
    │                                           │
    │   ╔═══════════════════════════════════╗   │
    │   ║      Opponent Penalty Area        ║   │  ← Attacking Third
    │   ║         (team z = -40)            ║   │
    │   ║                                   ║   │
    │   ║                                   ║   │
    │   ║                                   ║   │
    │   ╚═══════════════════════════════════╝   │
    │                                           │
    │            Team Center of Mass ⊕         │  ← Middle Third
    │               (team z = 0)                │
    │                                           │
    │   ╔═══════════════════════════════════╗   │
    │   ║                                   ║   │
    │   ║                                   ║   │
    │   ║         (team z = +40)            ║   │  ← Defensive Third
    │   ║        Own Penalty Area           ║   │
    │   ╚═══════════════════════════════════╝   │
    │                                           │
    └───────────────────────────────────────────┘
                    Own Goal (team z = +52.5m)
                    BACKWARD / DEFEND ↑

    Team-Relative Coordinates (SAME FOR BOTH TEAMS):
    • -Z = Forward/Attack (opponent goal)
    • +Z = Backward/Defend (own goal)
    • -X = Left flank
    • +X = Right flank
```

### Origin Point

**World Space Origin**: (0, 0, 0)
- Located at exact center of field (halfway line, center spot)
- X = 0: Vertical centerline of field
- Y = 0: Ground level
- Z = 0: Halfway line

**Team-Relative Origin**: (0, 0, 0)
- **Same as world space** - located at field center
- For Team 1: Identical to world space (no transformation)
- For Team 2: X and Z axes are flipped (180° rotation around Y)

**Center of Mass** (Tactical Reference Point):
- **NOT the coordinate origin** - it's a dynamic position in world space
- Used for formation positioning (players' assigned positions relative to team shape)
- Used for formation nudging (pulling players toward formation positions)
- Bounding box around team moves with center of mass
- Example: If COM is at (5, 0, 20), striker's formation position (-0.9 in Z) translates to world position based on COM + bounding box scaling

## Position Representation

### Vector Format

Positions represented as 3D vectors: `{x, y, z}` or `[x, y, z]`
- World space example: `{x: 12.5, y: 0.0, z: -30.0}` = 12.5m right of center, ground level, 30m toward Team 2 goal
- Team-relative example (Team 1): Same as world for Team 1 (identity transform)
- Team-relative example (Team 2): `{x: -12.5, y: 0.0, z: -30.0}` (X and Z flipped from world)

### Coordinate Ranges

**World Space** (105m × 68m field):
- **X**: -34m to +34m (68m width, left/right)
- **Y**:  0m to ~3m (ground to max ball/player height)
- **Z**: -52.5m to +52.5m (105m length, Team 2 goal to Team 1 goal)

**Team-Relative Space**:
- **X**: Depends on team tactical width (typically -40m to +40m)
- **Y**: 0m to ~3m (same as world space)
- **Z**: Relative to team center of mass, -52.5m (opponent goal) to +52.5m (own goal)

### Example Positions

**World Space Examples**:
- Team 1 striker at world `z = -40` (40m toward Team 2's goal at `z = -52.5`)
- Team 2 striker at world `z = 40` (40m toward Team 1's goal at `z = 52.5`)
- Team 1 goalkeeper at world `z = 50` (near Team 1's goal line)
- Team 2 goalkeeper at world `z = -50` (near Team 2's goal line)

**Team-Relative Examples** (both teams see opponent goal at -Z):
- Team 1 striker: World `z = -40` → Team-relative `z = -40` (40m FORWARD)
- Team 2 striker: World `z = 40` → Team-relative `z = -40` (40m FORWARD, SAME as Team 1)
- Team 1 goalkeeper: World `z = 50` → Team-relative `z = 50` (50m BACKWARD)
- Team 2 goalkeeper: World `z = -50` → Team-relative `z = 50` (50m BACKWARD, SAME as Team 1)

**Formation Positions** (Normalized -1 to +1):

Formations use team-relative space with normalized positions, scaled to tactical width and depth:
- `striker_center: { x: 0.0, z: -0.9 }` - Central striker, far forward
- `winger_left: { x: -0.8, z: -0.7 }` - Left winger, wide and forward
- `winger_right: { x: 0.8, z: -0.7 }` - Right winger, wide and forward
- `midfielder_center: { x: 0.0, z: 0.0 }` - Central midfielder at team center
- `fullback_left: { x: -0.9, z: 0.5 }` - Left fullback, wide and deep
- `fullback_right: { x: 0.9, z: 0.5 }` - Right fullback, wide and deep
- `centerback_left: { x: -0.3, z: 0.8 }` - Left center back
- `centerback_right: { x: 0.3, z: 0.8 }` - Right center back
- `goalkeeper: { x: 0.0, z: 0.95 }` - Goalkeeper near own goal

Scaling: `z = -1` → opponent goal line, `z = +1` → own goal line, `x = ±1` → tactical width boundaries

### Boundary Positions

**Goal Lines** (World Space):
- Team 1 goal line: `z = 52.5` (Team 1 defends here)
- Team 2 goal line: `z = -52.5` (Team 2 defends here)
- Halfway line: `z = 0`

**Goal Lines** (Team-Relative Space - SAME FOR BOTH TEAMS):
- Own goal line: `z = 52.5` (BACKWARD, +Z)
- Opponent goal line: `z = -52.5` (FORWARD, -Z)
- Halfway line: Depends on team center of mass (e.g., team center at world `z = 20` → halfway at team-relative `z = -20`)

**Touchlines**:
- World space: Left `x = -34`, Right `x = 34`
- Team-relative (both teams): Left `x = -34`, Right `x = 34` (Team 2's axes flipped)

### Units

**Primary Unit**: Meters (m)
- All internal physics calculations use meters
- Physics constants in SI units (m, kg, s)
- Player positions, velocities in meters
- Ball physics calculations in meters

**Source Unit**: Yards (authentic FIFA specifications)
- Field dimensions BEGIN as yards (authentic football measurements)
- Example: 115 yards × 75 yards (standard FIFA field)
- Yards converted to meters and cached for physics
- **BOTH units stored** for accuracy and performance

**Display Format**: Yards (with meters in brackets)
- Display: "115 yards (105m)" 
- User-facing UI shows yards first (familiar to football fans)
- Meters shown in brackets for reference

**Conversion**:
- 1 yard = 0.9144 meters
- 105m field = 114.8 yards
- 68m width = 74.4 yards

### Precision

**Floating Point Precision**:
- Positions: 64-bit float (JavaScript Number) for all calculations
- Typical precision: ~0.001m (1mm) sufficient for gameplay
- Physics calculations: 64-bit throughout (no degradation)
- Replay serialization: INT16 (compression for storage/transmission)

**INT16 Serialization** (Replay System):
- Positions converted to INT16 for storage efficiency (range: -32768 to +32767)
- Scale by precision factor: Position 25.47m → INT16 value 2547 (at 1cm resolution)
- Reconstruction: `INT16 value × precision factor` → original position

## Velocity Representation

### Velocity Vectors

**World Space Velocities**: Velocities are 3D vectors using same coordinate system as positions (e.g., ball at `{x: 5.0, y: 3.0, z: -12.0}` m/s = moving right, upward, toward Team 2 goal).

**Team-Relative Velocities**: Transformed same as positions.
- Team 1 player running forward: World `vz = -8.0` → Team-relative `vz = -8.0` (FORWARD)
- Team 2 player running forward: World `vz = +8.0` → Team-relative `vz = -8.0` (FORWARD, flipped)
- Both teams: Negative Z velocity = moving FORWARD toward opponent goal

**Velocity Calculations**:
- Magnitude (speed): `Math.sqrt(vx² + vy² + vz²)` in m/s
- Direction (unit vector): `{x: vx/speed, y: vy/speed, z: vz/speed}`

### Typical Velocities

**Player Movement**:
- Walking: 1-2 m/s
- Jogging: 3-5 m/s
- Running: 6-8 m/s
- Sprinting: 8-11 m/s (elite players, ~36-40 km/h)

**Ball Movement**:
- Slow pass: 5-10 m/s
- Moderate pass: 10-20 m/s
- Hard pass/shot: 20-30 m/s
- Power shot: 30-40 m/s
- Maximum shot: 40-50 m/s (elite strikes, ~180 km/h)

## Orientation and Rotation

### Player Facing Direction

**World Space Facing** (2D angle on XZ plane):
- Team 1 player attacking: `facing = π radians` (180° = facing toward -Z, opponent goal)
- Team 2 player attacking: `facing = 0 radians` (0° = facing toward +Z, opponent goal)
- As unit vector: `{facingX, facingZ}` where `facingZ = -1.0` points toward Team 2 goal

**Team-Relative Facing** (SAME for both teams):
- Player attacking forward: `facing = π radians` (180° = facing toward -Z in team space)
- Player defending backward: `facing = 0 radians` (0° = facing toward +Z in team space)
- As unit vector: `{facingX: 0.0, facingZ: -1.0}` = facing FORWARD toward opponent goal

**Angle Conventions** (Team-Relative Space):
- 0 radians (0°): Facing toward own goal (+Z, BACKWARD)
- π/2 radians (90°): Facing right (+X)
- π radians (180°): Facing toward opponent goal (-Z, FORWARD)
- 3π/2 radians (270°): Facing left (-X)

### Ball Spin

**CRITICAL**: Ball spin is **NOT optional** - it's a mandatory core feature!

Ball spin represented as angular velocity (3D vector, rad/s): `{spinX, spinY, spinZ}`

**Spin Effects**:
- **Magnus Effect**: Spin causes ball flight to curve (side spin, top spin)
- **Top Spin** (spinY > 0): Ball dips faster, rolls farther after bounce
- **Back Spin** (spinY < 0): Ball floats longer, bounces higher, rolls less
- **Side Spin** (spinX): Ball curves left or right in flight
- **Bounce Behavior**: Spin affects bounce angle and energy retention
- **Rolling Friction**: Transition from sliding to rolling depends on spin

**Typical Spin Rates**:
- Moderate spin: 10-30 rad/s
- Strong spin: 30-60 rad/s
- Elite curve: 60-100 rad/s (extreme spin on free kicks/crosses)

## Distance Calculations

**IMPORTANT**: Distance calculations work identically in both world space and team-relative space.

### 2D Distance (XZ Plane)

Distance ignoring height: `Math.sqrt(dx² + dz²)` where `dx = x2 - x1`, `dz = z2 - z1`

**Use Cases**: Player-to-player distance, player-to-ball (ground), formation deviation, marking distance, passing lanes

### 3D Distance

Full 3D distance including height: `Math.sqrt(dx² + dy² + dz²)`

**Use Cases**: Ball trajectory (world space), airborne interceptions, jump reach, goalkeeper diving, cross/shot angles

### Direction Vector

Unit vector pointing from one position to another: `{x: dx/dist, y: dy/dist, z: dz/dist}` where `dist` is 3D distance

**Use Cases**: Player facing direction, pass direction, movement target, vision calculations

### Manhattan Distance

Approximation for grid-based calculations: `|x2 - x1| + |y2 - y1| + |z2 - z1|`

**Use Cases**: Fast approximate distance (avoids sqrt), path estimates, zone boundaries

## Boundary Checks

**CRITICAL**: Boundary checks use **world space** for physical field boundaries (touchlines, goal lines). Zone checks (defensive/middle/attacking thirds) use **team-relative space** for tactical reasoning.

### Field Boundaries (World Space)

Field dimensions: 105m length (goal lines at ±52.5), 68m width (touchlines at ±34)

**Boundary Check Formulas**:
- In bounds: `|worldX| ≤ 34 && |worldZ| ≤ 52.5`
- Touchline: `|worldX| > 34`
- Goal line: `|worldZ| > 52.5`
- Left touchline: `worldX < -34`
- Right touchline: `worldX > 34`

### Zone Checks (Team-Relative Space)

**CRITICAL**: Zone checks use team-relative coordinates so logic is IDENTICAL for both teams!

**Field Thirds** (team-relative):
- Defensive third: `teamZ > 35m` (deep in own half, near own goal)
- Attacking third: `teamZ < -35m` (deep in opponent half, near opponent goal)
- Middle third: Between defensive and attacking thirds

**Penalty Area Checks** (team-relative, SAME for both teams):
- Own penalty area: `|teamX| ≤ 20.16 && teamZ > 36 && teamZ ≤ 52.5`
- Opponent penalty area: `|teamX| ≤ 20.16 && teamZ < -36 && teamZ ≥ -52.5`
- Penalty dimensions: 40.32m wide (44 yards), 16.5m deep (18 yards)

**Goal Mouth Checks**:
- Goal width: 7.32m (8 yards)
- Goal height: 2.44m
- In goal mouth (own goal): `|teamX| ≤ 3.66 && teamY ≥ 0 && teamY ≤ 2.44 && teamZ ≥ 52.5`
- In goal mouth (opponent goal): `|teamX| ≤ 3.66 && teamY ≥ 0 && teamY ≤ 2.44 && teamZ ≤ -52.5`

## Coordinate Transformations

### World-to-Team Transformations

**CRITICAL**: These functions convert between world space (absolute positions for physics/rendering) and team-relative space (tactical positions for AI/formations).

Both coordinate systems share the **same origin** (field center). Team 2 only applies a **180° rotation** around Y axis.

**Team 1 Transformations** (identity, no rotation):
- World to Team 1: `{x: worldX, y: worldY, z: worldZ}`
- Team 1 to World: `{x: teamX, y: teamY, z: teamZ}`

**Team 2 Transformations** (180° rotation around Y, flip X and Z):
- World to Team 2: `{x: -worldX, y: worldY, z: -worldZ}`
- Team 2 to World: `{x: -teamX, y: teamY, z: -teamZ}`

**Generic Transformation** (any team):
- If `team === 1`: Use identity transform
- If `team === 2`: Use 180° rotation (flip X and Z)

**Velocity Transformations**: Same rotation as positions (NO translation)
- Team 2 velocity: `{vx: -worldVx, vy: worldVy, vz: -worldVz}`

### Screen Coordinates

Convert 3D world coordinates to 2D screen coordinates:
- Use camera projection (perspective or orthographic)
- `screenX = (projectedX + 1) × screenWidth / 2`
- `screenY = (-projectedY + 1) × screenHeight / 2`

### Perspective vs. Orthographic

**Perspective Projection** (3D view):
- Objects farther away appear smaller
- Natural depth perception
- Used for realistic 3D rendering, broadcast camera view

**Orthographic Projection** (2D/Tactical view):
- Objects same size regardless of distance
- No perspective distortion
- Used for top-down tactical view, tactical analysis

## Direction Vectors

### Normalized Direction

Direction from point A to point B:
- Calculate delta: `dx = toX - fromX`, `dy = toY - fromY`, `dz = toZ - fromZ`
- Calculate length: `length = Math.sqrt(dx² + dy² + dz²)`
- Normalize: `{x: dx/length, y: dy/length, z: dz/length}`
- Handle zero-length case: Return `{x: 0, y: 0, z: 0}` if length is 0

**Team-Relative Direction Examples**:
- Forward (toward opponent goal): `{x: 0, y: 0, z: -1}`
- Backward (toward own goal): `{x: 0, y: 0, z: 1}`
- Left flank: `{x: -1, y: 0, z: 0}`
- Right flank: `{x: 1, y: 0, z: 0}`

### Angle Calculations

**Angle between two vectors**:
- Dot product: `dot = v1.x×v2.x + v1.y×v2.y + v1.z×v2.z`
- Magnitudes: `mag1 = sqrt(v1.x² + v1.y² + v1.z²)`, `mag2 = sqrt(v2.x² + v2.y² + v2.z²)`
- Cosine angle: `cosAngle = dot / (mag1 × mag2)` (clamped to [-1, 1])
- Angle: `acos(cosAngle)` in radians

**Use Cases**: Player field of view, pass angle, facing vs. movement direction

### Heading Angle (XZ Plane)

Angle on horizontal plane (heading):
- From direction vector: `heading = atan2(directionX, directionZ)` in radians
- Between two positions: `heading = atan2(toX - fromX, toZ - fromZ)`

**Heading Convention**:
- **0 radians**: Facing +Z (backward, toward own goal)
- **π radians** (180°): Facing -Z (forward, toward opponent goal)
- **π/2 radians** (90°): Facing +X (right flank)
- **-π/2 radians** (-90°): Facing -X (left flank)

**IMPORTANT**: Uses `atan2(x, z)` instead of standard `atan2(y, x)` to align with our -Z forward convention.

**Team-Relative Heading Examples**:
- Forward heading: `π` (180°, facing -Z)
- Backward heading: `0` (0°, facing +Z)
- Right heading: `π/2` (90°, facing +X)
- Left heading: `-π/2` (-90°, facing -X)

## Vision Cone Calculations

**IMPORTANT**: Vision calculations MUST be done in **team-relative space** so logic is identical for both teams!

### Field of View

Check if object is within player's vision cone:

**Algorithm**:
1. Calculate direction from player to target (team-relative space)
2. Calculate distance to target
3. Early exit if out of range or zero distance
4. Normalize direction to target
5. Calculate player facing direction from heading angle
6. Dot product of facing and target directions
7. Compare dot product to minimum threshold based on FOV angle

**Typical FOV**: 120° (2π/3 radians) = ±60° from center line
- Minimum dot product: `cos(60°) = 0.5`
- In vision cone if `dot ≥ 0.5`

### Peripheral Vision

Extended cone with reduced accuracy:
- Central vision (±30°): 100% accuracy
- Peripheral vision (±60°): 50% accuracy  
- Outside vision (>±60°): 0% accuracy

### Vision Recording (For 1st-Person Replay)

**CRITICAL**: Vision system records eye position, head orientation, and visible objects for **immersive 1st-person replay**!

**Use Case**: Click/double-click any player to enter "through their eyes" view and travel with them through the match.

**Player Local Transform** (Standard Game Engine Pattern):
- Local origin (pivot point) at FEET (ground level, center of player)
- Position: World space feet position (e.g., `{x: 5.2, y: 0.0, z: -20.0}`)
- Body rotation: `rotation` in radians (world space facing)
- Player height: meters (e.g., `1.80`)
- Head child transform: Local offset from feet (e.g., `{x: 0, y: 1.75, z: 0}` = 97% of height)
- Head orientation: `yaw`, `pitch`, `roll` relative to body

**Eye Position Calculation**:
- Eyes at ~97% of player height above feet
- World eye position: `{x: playerX, y: playerY + (height × 0.97), z: playerZ}`
- Automatically moves with player position

**Vision Snapshot Data Structure**:
- Timestamp (match time in ms)
- Player ID and team ID
- Player position (world space, feet on ground)
- Player height
- Body facing (world space, radians)
- Head orientation (yaw, pitch, roll relative to body)
- Vision configuration (FOV, range)
- Visible players this frame (world space positions)
- Visible ball (world space position)

**Recording Frequency**: TBD (probably 50ms or 100ms intervals, synced with AI decision frequency)

**1st-Person Camera Setup**:
1. Calculate eye position from player position + height offset
2. Calculate absolute head direction (body facing + relative head yaw)
3. Set camera position at eye position
4. Calculate look-at target from head orientation (yaw + pitch)
5. Apply head roll to camera rotation
6. Set camera FOV from vision configuration

**Player Selection Interaction**:
- Single click: Highlight player, show stats
- Double-click: Enter 1st-person "through their eyes" view
- Camera follows player's eye position and head orientation throughout match
- Exit with ESC key or click elsewhere

**Debug Visualization** (Ghost View):
- Show both real positions and player's perceived positions simultaneously
- Render perceived positions as ghosted/transparent overlay (what THIS player sees)
- Highlight invisible players (outside vision cone or range)
- Render vision cone visualization

## Interpolation

**IMPORTANT**: Interpolation happens in **world space** for rendering, but can use **team-relative space** for tactical displays.

### Linear Interpolation (Lerp)

Smooth movement between positions:
- Formula: `lerped = a + (b - a) × t` where `t` ∈ [0, 1]
- Works for all 3D components: `{x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t)}`

**Use Cases**:
- Smooth rendering between physics updates (viewer interpolation)
- Ball trajectory prediction
- Player movement prediction for AI

**Viewer Interpolation Example**:
- Physics updates at 20ms intervals (50 Hz)
- Display at 60 Hz (16.67ms per frame) or 144 Hz (6.94ms per frame)
- Interpolate between previous and current physics snapshots
- `alpha = (displayTime - previousTime) / (currentTime - previousTime)`
- `displayPos = lerp(previousPos, currentPos, alpha)`

### Spherical Linear Interpolation (Slerp)

For rotation/orientation (smoother than linear):
- Quaternion interpolation for smooth rotation
- Avoids gimbal lock issues with Euler angles
- Use library (Three.js) for quaternion math

**Use Cases**:
- Camera orientation interpolation (1st-person replay)
- Player head rotation (looking around)
- Player body rotation (turning to face ball)

## Common Coordinate Patterns

**CRITICAL**: Most tactical calculations use **team-relative space** to avoid team-specific logic!

### Center of Mass (Team-Relative)

Calculate team center of mass:
- Team-relative: Average all players' team-relative positions
- World space: Average world positions, then convert to team-relative
- Formula: `COM.x = sum(playerX) / playerCount`, `COM.z = sum(playerZ) / playerCount`

### Defensive Line (Team-Relative)

Find deepest defensive line position:
- Team-relative: Find player with highest Z value (furthest BACK toward own goal)
- Same logic for both teams (no team-specific code)
- Formula: `defensiveLine = max(playerZ)` for all defensive players

### Attacking Line (Team-Relative)

Find most advanced attacking line position:
- Team-relative: Find player with lowest Z value (furthest FORWARD toward opponent goal)
- Same logic for both teams
- Formula: `attackingLine = min(playerZ)` for all attacking players

### Offside Line (Team-Relative)

Offside line is second-last defender:
- Team-relative: Sort defenders by Z (deepest to most advanced)
- Return second-deepest Z value
- Formula: `offsideLine = sorted[1]` (second element after descending sort)

### Offside Check (Team-Relative)

Check if attacking player is in offside position:
- Attacker offside if:
  1. Attacker Z < offside line Z (ahead of second-last defender)
  2. Attacker Z < ball Z (ahead of ball)
- Formula: `isOffside = (attackerZ < offsideLineZ) && (attackerZ < ballZ)`
- Same logic for both teams

## Coordinate Precision and Accuracy

### Floating Point Errors

Be aware of floating point precision:
- **Avoid exact equality**: Use epsilon comparison for near-zero checks
- **Epsilon tolerance**: `EPSILON = 0.001` (1mm tolerance)
- **Near-zero check**: `|value| < EPSILON` instead of `value === 0`
- **Distance comparisons**: Use squared distance to avoid sqrt: `distSq < rangeSq`

### Coordinate Clamping

Clamp positions to valid ranges:
- **World space**: Clamp to field boundaries (X: ±34, Y: ≥0, Z: ±52.5)
- **Team-relative**: Clamp to formation bounds (tactical width, field length)
- **Formula**: `clamped = max(min_value, min(max_value, value))`

## Coordinate System Validation

### Consistency Checks

Validate coordinate system usage:
- Check for NaN or Infinity values
- Validate reasonable range (field + margin)
- Warning for out-of-bounds positions
- Team-relative specific checks (field length bounds)

### Debug Visualization

Visualize coordinate systems:
- **World space axes**: X (red, left/right), Y (green, up/down), Z (blue, field depth)
- **Goal markers**: Team 1 goal (yellow, z=52.5), Team 2 goal (cyan, z=-52.5)
- **Team-relative axes**: Show for specific team with center of mass
- **Team forward/backward**: Color-coded direction indicators
- **Center of mass labels**: Show team tactical reference points
