# Ball

## Overview

The ball is the central entity in the match simulation. All player actions revolve around the ball's position and state. The ball physics engine determines how the ball moves, bounces, rolls, and responds to player interactions.

## Ball Entity

### Position Properties

The ball maintains **two position representations** for different use cases:

**position3d** (THREE.Vector3) - Physics & Rendering:
- `position3d.x`: World X (goal-to-goal, -52.5 to +52.5 meters)
- `position3d.y`: Height above ground (vertical UP, 0 = ground level)
- `position3d.z`: World Y (touchline-to-touchline, -34 to +34 meters)

**position2d** (THREE.Vector2) - Gameplay Logic:
- `position2d.x`: World X (goal-to-goal, -52.5 to +52.5 meters)
- `position2d.y`: World Y (touchline-to-touchline, -34 to +34 meters)

**Coordinate Mapping**:
```
position2d.x = position3d.x   (World X = Three.js X)
position2d.y = position3d.z   (World Y = Three.js Z)
```

### Physical Properties

- **Velocity**: 3D velocity vector (vx, vHeight, vz) in meters/second (Three.js space)
- **Spin**: 3D angular velocity (wx, wy, wz) in radians/second (**MANDATORY** - not optional!)
- **Mass**: Standard football mass (~0.43 kg)
- **Radius**: Standard football radius (~0.11 m)
- **Air Pressure**: Internal pressure (affects bounce, affects performance in rare cases)

### State Properties

The ball maintains state information:

- **Possession**: Which player (if any) has possession
  - `null`: Ball is free (no possession)
  - `playerId`: Player currently in possession
- **Last Touch**: Last player to touch the ball
- **Out of Play**: Whether ball is outside field boundaries
- **Height Status**: Ground level, airborne, or high ball
- **Movement State**: Rolling, bouncing, flying, stationary

## Ball Physics Engine

### Physics Model

The ball physics engine simulates realistic ball behavior using:

- **Gravity**: Constant downward acceleration (-9.8 m/s² on Y-axis)
- **Air Resistance (Drag)**: Drag force proportional to velocity squared
- **Ground Friction**: Rolling resistance when ball is on ground
- **Bounce**: Coefficient of restitution for ground collisions
- **Magnus Effect**: Lift force from ball spin causing flight path curvature (**MANDATORY** feature)

### Update Cycle

Each physics update (dynamic 5-20ms intervals):

1. **Apply Forces**: Gravity, air resistance, Magnus effect (spin)
2. **Update Velocity**: Integrate acceleration over time step (dt = actual interval)
3. **Update Position**: Integrate velocity over time step (dt)
4. **Update Spin**: Apply spin decay (friction with air)
5. **Check Ground Collision**: If y ≤ ball radius, trigger bounce
6. **Apply Ground Friction**: If rolling on ground, decelerate and convert slip to roll
7. **Check Field Boundaries**: Detect out-of-bounds

### Dynamic Update Scheduling

**CRITICAL**: Ball physics uses **dynamic update intervals** (5-20ms based on speed), NOT fixed timesteps.

- **Dynamic Interval**: 5ms (very fast) to 20ms (slow rolling) - varies with ball speed
- **Suspension**: Ball updates suspended when stationary (speed < 0.001 m/s)
- **No Frame-Rate Coupling**: Physics NEVER tied to display FPS
- **Speed-Based**: Faster ball = more frequent updates for accuracy
- **Renderer Interpolation**: Display reads current state and interpolates for smooth rendering at monitor refresh rate (60 Hz, 144 Hz, etc.)
- **Deterministic**: Uses seeded PRNG for reproducible physics

**Update Frequency Formula**:
- Speed < 0.001 m/s: **SUSPENDED** (return null, no updates)
- Interval calculation: `interval = Math.max(5, 20 - (speed / 30) × 15)` ms
- Dynamic range: 5ms (fast) to 20ms (slow)

**Update Examples**:
- Stationary (<0.001 m/s): **SUSPENDED** until kicked
- Slow roll (3 m/s): **18ms** (~55 Hz)
- Medium speed (10 m/s): **15ms** (~67 Hz)
- Fast shot (20 m/s): **10ms** (100 Hz)
- Very fast shot (30+ m/s): **5ms** (200 Hz)

## Ball Movement States

### Stationary

Ball at rest on ground:

- **Velocity**: (vx=0, vy=0, vHeight=0)
- **Position**: height = 0 (ground level)
- **Friction**: No rolling friction applied
- **Transitions**: Kicked → Flying/Rolling

### Rolling

Ball rolling on ground:

- **Velocity**: vx, vy > 0, vHeight = 0
- **Position**: height = 0 (ground level)
- **Friction**: Applied each frame, decelerating ball
- **Deceleration**: ~0.5-1.0 m/s² (configurable)
- **Transitions**: Stops → Stationary, Kicked → Flying

### Bouncing

Ball bouncing off ground:

- **Velocity**: vHeight < 0 (moving downward)
- **Position**: height = 0 (collision point)
- **Bounce**: vHeight = -vHeight × restitution (e.g., 0.7)
- **Energy Loss**: Each bounce reduces vertical velocity
- **Transitions**: Multiple bounces → Rolling → Stationary

### Flying

Ball in the air:

- **Velocity**: vx, vy, vHeight all potentially non-zero
- **Position**: height > 0 (above ground)
- **Gravity**: Applied each frame (-9.8 m/s² on height axis)
- **Air Resistance (Drag)**: Applied proportional to velocity²
- **Magnus Effect**: Lift force from spin curves trajectory (**ALWAYS ACTIVE**)
- **Spin Decay**: Angular velocity decreases over time due to air friction
- **Transitions**: Lands → Bouncing/Rolling

## Ball Interactions

### Player Kicks Ball

When player kicks ball:

1. **Calculate Kick Direction**: Based on player action (pass, shot, clearance)
2. **Calculate Kick Power**: Based on player attributes and intended action
3. **Set Ball Velocity**: Apply velocity vector to ball
4. **Set Spin**: Apply angular velocity for curve/swerve effects (**ALWAYS** applied, amount depends on kick type)
5. **Clear Possession**: Ball becomes free (possession = null)
6. **Record Last Touch**: Update lastTouch to kicking player

**Spin Application**:
- **Driven Shot**: Low spin (5-15 rad/s), straight trajectory
- **Curved Shot**: Medium-high side spin (30-60 rad/s), curves left/right
- **Chip/Lob**: Back spin (20-40 rad/s), ball floats longer, bounces higher
- **Top Spin Drive**: Forward spin (20-50 rad/s), ball dips faster, rolls farther
- **Swerving Free Kick**: Extreme side spin (60-100 rad/s), dramatic curve

### Player Controls Ball

When player dribbles/controls ball:

1. **Set Possession**: Ball possession = player ID
2. **Update Ball Position**: Move ball with player's feet
3. **Offset from Player**: Ball positioned 0.5-1.0m in front of player
4. **Match Player Velocity**: Ball moves at player's speed
5. **Maintain Ground Level**: Ball stays at y = 0

### Ball Collision with Player

When ball collides with player (not in possession):

1. **Detect Collision**: Ball enters player's collision radius
2. **Calculate Deflection**: Based on impact angle and velocities
3. **Apply Velocity Change**: Deflect ball trajectory
4. **Determine New Possession**: High control attribute → gain possession
5. **Record Last Touch**: Update lastTouch to colliding player

## Possession Mechanics

### Gaining Possession

Player gains possession when:

- **Stationary Ball**: Player moves within control radius, successful control check
- **Slow Rolling Ball**: Player intercepts, successful control check
- **Airborne Ball**: Player wins header or brings down ball with chest/foot
- **Tackle**: Player wins tackle against opponent

### Losing Possession

Player loses possession when:

- **Kick**: Player passes, shoots, or clears ball
- **Tackle**: Opponent successfully tackles
- **Out of Control**: Ball moves too far from player
- **Knocked Off Ball**: Physical contact with opponent
- **Foul**: Player commits foul

### Possession Check

Each frame, for player in possession:

1. **Check Distance**: Ball within control radius (1-2m)
2. **Check Pressure**: Opponents within pressure radius
3. **Control Attribute**: Higher control = larger control radius
4. **Lose Possession**: If ball too far or tackled successfully

## Ball Out of Play

### Boundary Detection

Ball is out of play when:

- **Touchline**: y < -fieldWidth/2 or y > fieldWidth/2
- **Goal Line**: x < -fieldLength/2 or x > fieldLength/2 (and not in goal)
- **Above Maximum Height**: height > 50m (unrealistic height, error condition)

### Restart Actions

When ball goes out:

- **Throw-In**: Ball crossed touchline (y boundary)
- **Goal Kick**: Ball crossed goal line (x boundary), last touched by attacking team
- **Corner Kick**: Ball crossed goal line (x boundary), last touched by defending team
- **Goal**: Ball crossed goal line inside goal posts and under crossbar

### Out of Play State

While ball is out:

1. **Freeze Ball Movement**: Stop physics simulation
2. **Determine Restart Type**: Throw, goal kick, corner, or goal
3. **Determine Restart Position**: Place ball at appropriate position
4. **Award to Team**: Determine which team takes restart
5. **Wait for Referee**: Referee signals restart

## Goal Detection

### Goal Line Technology

Ball crosses goal line inside goal when:

- **Position Check**: x < goalLineX or x > goalLineX (depending on which goal)
- **Width Check**: -goalWidth/2 < x < goalWidth/2
- **Height Check**: 0 < y < goalHeight (2.44m)
- **Fully Crossed**: Entire ball crosses line (check ball center + radius)

### Goal Validation

When goal scored:

1. **Check Ball Position**: Verify ball fully crossed goal line
2. **Check Legal Play**: No fouls, no offside (if applicable)
3. **Award Goal**: Increment team score
4. **Record Goal Data**: Scorer, assist, time, position
5. **Trigger Celebration**: Animation/cutscene
6. **Reset for Kickoff**: Center circle restart

## Ball Trajectory Calculations

### Parabolic Flight

For simple physics (no air resistance):

- **Horizontal Velocity**: Constant (vx, vy)
- **Vertical Velocity**: vHeight = vHeight0 - g × t
- **Position**: 
  - x = x0 + vx × t
  - y = y0 + vy × t
  - height = height0 + vHeight0 × t - 0.5 × g × t²

### With Air Resistance

More realistic trajectory:

- **Drag Force**: F_drag = -0.5 × ρ × Cd × A × v² × v̂
  - ρ: Air density (~1.2 kg/m³ at sea level)
  - Cd: Drag coefficient (~0.2 for smooth football, ~0.25 for textured)
  - A: Cross-sectional area (π × r²) ≈ 0.038 m²
  - v: Velocity magnitude (m/s)
  - v̂: Unit velocity vector (direction)
- **Acceleration**: a_drag = F_drag / mass
- **Updated Velocity**: v = v + (a_gravity + a_drag + a_magnus) × dt
- **Updated Position**: p = p + v × dt

### Magnus Effect (Spin-Induced Curve)

**CRITICAL**: Magnus effect is a **MANDATORY** core feature, not optional!

The Magnus effect causes spinning balls to curve in flight due to pressure differential around the ball.

**Magnus Force Formula**:

```
F_magnus = C_L × (ω × v)
```

Where:
- **C_L**: Lift coefficient (Magnus coefficient)
  - Depends on ball properties and spin rate
  - Typical value: 0.001 to 0.003 (tunable)
- **ω**: Angular velocity vector (rad/s) - ball spin
  - ω_x: Side spin (ball curves left/right)
  - ω_y: Top/back spin (ball dips/floats)
  - ω_z: Barrel roll (minimal gameplay effect)
- **v**: Linear velocity vector (m/s) - ball movement
- **×**: Cross product (perpendicular to both ω and v)

**Direction**: Magnus force is perpendicular to BOTH spin axis and velocity:
- **Right-hand rule**: Point fingers along velocity, curl toward spin axis, thumb points toward Magnus force

**Magnitude**: Proportional to both spin rate and velocity
- Higher spin → stronger curve
- Higher velocity → stronger curve (but also less flight time)
- Force peaks when spin axis perpendicular to velocity

**Magnus Force Calculation**:
- Cross product: `spinCrossVelocity = spin × velocity` (ω × v)
- Magnus force: `F = magnusCoeff × (spin × velocity)`
- Acceleration: `a = F / mass`
- Add to total acceleration for flight path

### Spin Effects on Ball Behavior

**CRITICAL**: Spin affects flight, bounce, and roll - these are NOT optional!

#### Top Spin (Forward Rotation, spinY > 0)

**Flight Effects**:
- **Dips Faster**: Magnus force pushes ball downward
- **Shorter Flight Time**: Ball hits ground sooner
- **Steeper Descent**: Ball approaches ground at sharper angle

**Bounce Effects**:
- **Lower Bounce**: Less vertical velocity retained
- **Accelerates Forward**: Spin converts to forward velocity on contact

**Roll Effects**:
- **Rolls Farther**: Extra forward momentum from spin
- **Faster Transition**: Quickly transitions from sliding to rolling

**Use Cases**: Driven shots, low passes, keeping ball down

**Typical Spin Rates**: 20-50 rad/s

#### Back Spin (Backward Rotation, spinY < 0)

**Flight Effects**:
- **Floats Longer**: Magnus force pushes ball upward
- **Extended Flight Time**: Ball stays airborne longer
- **Shallower Descent**: Ball approaches ground at gentler angle

**Bounce Effects**:
- **Higher Bounce**: More vertical velocity retained
- **Decelerates Forward**: Spin reduces forward velocity on contact
- **Can Bounce Backward**: With enough spin, ball can reverse direction

**Roll Effects**:
- **Rolls Less**: Forward momentum reduced
- **Slower Transition**: Takes longer to start rolling

**Use Cases**: Chips, lobs, stops, goalkeeper distributions

**Typical Spin Rates**: 20-40 rad/s (chips), 40-80 rad/s (extreme back spin)

#### Side Spin (Lateral Rotation, spinX ≠ 0)

**Flight Effects**:
- **Curves Left/Right**: Magnus force pushes ball sideways
- **Curve Magnitude**: Proportional to spin rate and velocity
- **Curve Direction**: 
  - spinX > 0: Ball curves RIGHT (clockwise rotation viewed from above)
  - spinX < 0: Ball curves LEFT (counter-clockwise rotation)

**Bounce Effects**:
- **Bounce Angle Changes**: Ball bounces at angle different from approach
- **Lateral Velocity**: Spin adds sideways component to bounce
- **Unpredictable for Defenders**: Makes ball harder to control

**Roll Effects**:
- **Curves During Roll**: Ball continues to curve on ground (less than in air)
- **Gradual Straightening**: Spin decays, curve reduces

**Use Cases**: Curving free kicks, crossing, swerving shots

**Typical Spin Rates**: 
- **Moderate Curve**: 30-60 rad/s
- **Strong Curve**: 60-100 rad/s
- **Extreme Swerve** (elite players): 100+ rad/s

#### Combined Spin (Multiple Axes)

Real kicks often have spin on multiple axes:
- **Example**: Curving shot with slight top spin
  - `spinX = -45.0` (curving LEFT, negative side spin)
  - `spinY = 15.0` (slight top spin, dips faster)
  - `spinZ = 0.0` (no barrel roll)
  - Result: Ball curves left AND dips

**Knuckleball Effect** (Minimal Spin):
- Very low spin rate (< 5 rad/s)
- Unstable flight path (chaotic aerodynamics)
- Unpredictable movement (hard for goalkeepers)
- Requires specific kick technique

### Spin Decay

Spin reduces over time due to air friction:
- Per-frame decay: `spin *= decayRate` where `decayRate ≈ 0.98` (2% loss per frame, tunable)
- Air friction: Constant decay in flight
- Ground contact: Sudden spin change on bounce
- Ball material: Surface texture affects decay rate

### Typical Spin Rates Summary

| Spin Type | Magnitude (rad/s) | Effect | Use Case |
|-----------|-------------------|--------|----------|
| No spin | 0-5 | Knuckleball (unpredictable) | Specific free kicks |
| Minimal | 5-15 | Slight curve/dip | Driven shots |
| Moderate | 15-30 | Noticeable curve/dip | Standard passes, shots |
| Strong | 30-60 | Clear curve/dip | Curving shots, chips |
| Very Strong | 60-100 | Dramatic curve | Swerving free kicks, crosses |
| Extreme | 100+ | Extreme swerve | Elite players, special techniques |

## Ball Visual Representation

### Rendering

Ball rendered as:

- **3D Sphere**: Textured with football pattern (pentagons/hexagons - classic or modern design)
- **Rotation**: Texture rotates based on spin vector (visualizes spin rate and axis)
- **Shadow**: Dynamic ground shadow for depth perception
- **Motion Blur**: Optional blur effect for fast-moving ball (high velocity shots)
- **Spin Visualization**: Rotating texture clearly shows spin direction and rate

**World Space Rendering**: Ball always rendered in world space coordinates (absolute position for physics/graphics)

### 2D View

In 2D top-down view:

- **Circle**: Solid circle representing ball position (world space X/Y projection)
- **Trail**: Optional trajectory trail showing recent path (last 1-2 seconds)
- **Height Indicator**: Color or size variation showing height position
  - Ground level (y ≈ 0): Normal size/color
  - Low airborne (y < 2m): Slightly larger/brighter
  - High airborne (y ≥ 2m): Much larger/different color
- **Velocity Arrow**: Optional arrow showing velocity direction and magnitude
- **Spin Indicator**: Optional rotation visual or icon showing spin type (top/back/side)

## Ball Physics Configuration

### Tunable Parameters

**Dynamic Scheduling**:
- `minUpdateInterval`: 5ms (fastest update for very fast ball)
- `maxUpdateInterval`: 20ms (slowest update for slow rolling)
- `stopThreshold`: 0.001 m/s (velocity below which ball stops)

**Physics Constants**:
- `gravity`: -9.8 m/s² (Earth gravity, Y-axis)
- `airDensity`: 1.2 kg/m³ (sea level)
- `dragCoefficient`: 0.2 (dimensionless, 0.2-0.25 for football)

**Ground Interaction**:
- `groundFriction`: 0.8 (rolling deceleration multiplier)
- `restitution`: 0.7 (bounce coefficient, 0-1, 70% energy retained)

**Spin Effects** (MANDATORY - always active):
- `magnusCoefficient`: 0.002 (lift coefficient, 0.001-0.003)
- `spinDecayRate`: 0.98 (2% spin loss per update)

**Ball Properties**:
- `mass`: 0.43 kg (FIFA standard: 410-450g)
- `radius`: 0.11 m (FIFA standard: 21-22cm diameter)

**Advanced Physics**:
- `slipToRollThreshold`: 0.5 m/s (velocity for transition to pure rolling)
- `dragCrisisSpeed`: 15.0 m/s (speed where drag coefficient drops, optional)

### Preset Profiles

Different physics profiles for variety:

- **Realistic**: Standard FIFA-compliant physics with full Magnus effect, realistic drag
- **Arcade**: Reduced air resistance, higher restitution (more bouncy), reduced spin decay
- **Simulation**: Full physics with Magnus effect, air resistance, spin, wind (future)
- **Classic**: Simplified spin model, moderate air resistance (retro feel)

**Note**: All profiles include spin - it's a core feature, not optional!

## Ball State Serialization

### State Data Structure

**Ball State** (Full Precision):
- **Position**: `{x, y, height}` in meters (world space, where x = goal-to-goal, y = touchline, height = vertical)
- **Velocity**: `{x, y, height}` in m/s (world space)
- **Spin**: `{spinX, spinY, spinZ}` in rad/s (MANDATORY - always present, uses Three.js axis convention)
- **Possession**: Player ID or null
- **Last Touch**: Player ID
- **Out of Play**: Boolean flag
- **State**: 'stationary' | 'rolling' | 'bouncing' | 'flying'
- **Timestamp**: ms since match start

**Deterministic Physics**:
- All physics calculations use seeded PRNG for reproducibility
- Same seed produces identical ball trajectories every time
- No random variation between replay runs
- Perfect reproduction for replay from seed

## Edge Cases

### Ball Stuck

If ball becomes stuck (e.g., in corner, under player):

- **Detection**: Ball velocity near zero for extended time
- **Auto-Unstick**: Apply small random force to dislodge
- **Referee Intervention**: Award drop ball if stuck persists

### Unrealistic Velocity

If ball velocity exceeds physical limits:

- **Max Velocity Cap**: Clamp velocity to realistic maximum (~50 m/s)
- **Error Logging**: Record unrealistic physics events
- **Correction**: Reset ball to last valid state if needed

### Multiple Simultaneous Touches

If multiple players touch ball same frame:

- **Priority Order**: Determine touch priority (first in update order, or random)
- **Physics Resolution**: Process touches sequentially
- **Possession Award**: Highest control attribute wins possession
