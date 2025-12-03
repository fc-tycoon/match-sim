# Coordinate System

## Overview

The simulation uses a **single 2D world space** for all game logic. Canvas 2D and Three.js renderers are different views of the same world.

---

## World Space (Primary)

All simulation, physics, and AI operate in this coordinate system.

```
    World 2D (Simulation Space)
    ═══════════════════════════

                        +Y (Top Touchline)
                         ↑
                         │
                         │
    -X (Home Goal) ←─────●─────→ +X (Away Goal)
                         │
                         │
                         ↓
                        -Y (Bottom Touchline / Camera Side)

    ● = Origin (Center Spot)

    Home Team: Defends -X, Attacks → +X
    Away Team: Defends +X, Attacks ← -X
```

### Axis Definitions

| Axis | Direction | Range | Notes |
|------|-----------|-------|-------|
| **X** | Goal-to-goal | -52.5m to +52.5m | Home defends -X, Away defends +X |
| **Y** | Touchline-to-touchline | -34m to +34m | Camera typically at -Y side |
| **Height** | Ground to sky | 0m to ~30m | Ball and players (jumping) |

### Key Positions

| Location | Coordinates |
|----------|-------------|
| Center spot | (0, 0) |
| Home goal center | (-52.5, 0) |
| Away goal center | (+52.5, 0) |
| Top-left corner | (-52.5, +34) |
| Bottom-right corner | (+52.5, -34) |

### Team Attack Directions

| Team | Defends | Attacks | Attack Vector |
|------|---------|---------|---------------|
| **Home** | -X (left) | +X (right) | `{ x: 1, y: 0 }` |
| **Away** | +X (right) | -X (left) | `{ x: -1, y: 0 }` |

At half-time, teams swap attack directions (flip signs).

---

## Canvas 2D Transform

Canvas has origin at **top-left**, with **+Y pointing down**.

```
    Canvas 2D (Raw)
    ═══════════════

    (0,0)─────────────────→ +X (Right)
      │
      │     ┌─────────────────────────────┐
      │     │                             │
      │     │   Home Goal      Away Goal  │
      │     │      ║              ║       │
      │     │      ║      ●       ║       │
      │     │      ║              ║       │
      │     │                             │
      │     └─────────────────────────────┘
      ↓
     +Y (Down)
```

### Recommended: Translate to Center with Y-Flip

To simplify ALL drawing operations, translate the canvas context to center and apply a Y-flip scale:

```javascript
// Get field from match store
const field = matchStore.field

// Setup: Transform canvas so (0,0) is at center spot, Y flipped
ctx.translate(canvasWidth / 2, canvasHeight / 2)
ctx.scale(scale, -scale)  // Y-flip: positive scale on X, negative on Y

// Now position2d works directly!
ctx.arc(position2d.x, position2d.y, radius, 0, Math.PI * 2)

// Field dimensions come from field object
ctx.fillRect(-field.LENGTH_HALF, -field.WIDTH_HALF, field.LENGTH, field.WIDTH)

// Use Box2 for bounds checking
if (field.fieldBounds.containsPoint(position2d)) {
    // Position is in bounds
}
```

After this transform:
- **Canvas origin** = Center spot (0, 0) in world space
- **Canvas +X** = World +X (toward Away goal) ✓
- **Canvas +Y** = World +Y (toward top touchline) ✓ (flipped from raw canvas)
- **`position2d.x`, `position2d.y`** work directly with no conversion!

**Note**: Text rendering needs `ctx.save()`, undo the Y-flip with `ctx.scale(1, -1)`, draw text, `ctx.restore()`.

---

## Three.js Transform

Three.js uses **Y-up** convention (Y = height) with **right-handed** coordinates.

```
    Three.js 3D (Right-Handed)
    ══════════════════════════

                    +Y (Height/Up)
                     ↑
                     │
                     │
                     │    +Z (Top Touchline)
                     │   ╱
                     │  ╱
                     │ ╱
    -X (Home Goal) ──●─────→ +X (Away Goal)
                    ╱│
                   ╱ │
                  ╱  │
                 ↓
                -Z (Bottom Touchline / Camera)

    Ground plane: XZ (Y = 0)
    Camera at -Z looking toward +Z
```

**Transform**: X stays same, height → Y, World Y → Z (no negation).

---

## Direction Vectors

Directions are stored as **unit vectors** `{ x, y }` in world space (not angles).

```
    Direction Vector Example
    ════════════════════════

    World: Player facing toward Away goal (+X direction)
           dir = { x: 1, y: 0 }

                 ↑ +Y
                 │
            ○────→  dir = (1, 0) pointing +X
                 │
                 ↓ -Y
```

### Why Vectors Instead of Angles?

- No angle wrapping (-π to +π)
- No trig functions for most operations
- Same vector works in both renderers
- Intuitive math: dot product, interpolation

### Common Directions

| Direction | Vector |
|-----------|--------|
| Toward Away goal | `{ x: 1, y: 0 }` |
| Toward Home goal | `{ x: -1, y: 0 }` |
| Toward top touchline | `{ x: 0, y: 1 }` |
| Toward bottom touchline | `{ x: 0, y: -1 }` |

---

## Ball State

The ball maintains **two position representations**:

### position3d (Vector3) - Physics & Rendering

For 3D physics simulation and Three.js rendering:

| Component | Description | Range |
|-----------|-------------|-------|
| **position3d.x** | World X (goal-to-goal) | -52.5 to +52.5 |
| **position3d.y** | Height above ground (vertical UP) | 0 to ~30m |
| **position3d.z** | World Y (touchline-to-touchline) | -34 to +34 |

### position2d (Vector2) - Gameplay Logic & Canvas 2D

For bounds checking, AI decisions, tactical calculations, and Canvas 2D rendering:

| Component | Description | Range |
|-----------|-------------|-------|
| **position2d.x** | World X (goal-to-goal) | -52.5 to +52.5 |
| **position2d.y** | World Y (touchline-to-touchline) | -34 to +34 |

With a center-translated, Y-flipped canvas (see Canvas 2D Transform section), `position2d.x` and `position2d.y` can be used directly for drawing.

### Velocity & Spin (Vector3)

| Property | Description |
|----------|-------------|
| **velocity** | 3D velocity (vx, vHeight, vz) in m/s |
| **spin** | Angular velocity (wx, wy, wz) in rad/s |

### Coordinate Mapping

```
position2d.x = position3d.x   (World X = Three.js X)
position2d.y = position3d.z   (World Y = Three.js Z)
```

**Three.js mapping**: `threeX = worldX`, `threeY = height`, `threeZ = worldY`

---

## Player State

| Property | Description |
|----------|-------------|
| **x** | Goal-to-goal position (-52.5 to +52.5) |
| **y** | Touchline-to-touchline position (-34 to +34) |
| **height** | Feet above ground (0 = standing, >0 = jumping) |
| **vx, vy** | Horizontal velocity (m/s) |
| **vHeight** | Vertical velocity (m/s, positive = upward) |
| **bodyDir** | Unit vector - which way torso faces |
| **headAngle** | Relative angle from body direction (radians, 0 = forward) |
| **headWorldDir** | Computed unit vector - head world direction (bodyDir + headAngle) |

**Three.js mapping**: `threeX = x`, `threeY = height`, `threeZ = y`

**Note**: Player's physical height (e.g., 1.8m tall) is a separate **attribute**, not a position component. Eye position is calculated as `height + (physicalHeight × 0.97)`.

---

## Formation Slots

Formations use normalized -1 to +1 positions in **world space axes**, scaled by tactical width/depth and offset from center of mass.

```
    Formation Slot Space
    ════════════════════

                        +Y (Top Touchline)
                         ↑
                         │
         ○ LW ───────────●─────────── ○ RW
                        CoM
    -X ←─────────────────┼─────────────────→ +X
    (Home Goal)          │              (Away Goal)
                         │
                         ↓
                        -Y (Bottom Touchline)

    Slot coordinates: x = -1 to +1, y = -1 to +1
    Scaled by tacticalWidth and tacticalDepth
    Offset from team's center of mass (CoM)
```

| Slot Axis | World Axis | Range |
|-----------|------------|-------|
| **slot.x** | World X | -1.0 to +1.0 |
| **slot.y** | World Y | -1.0 to +1.0 |

### Attack Direction

Each team has an `attackDir` vector that defines "forward":

| Team | Attack Direction | Forward | Backward |
|------|------------------|---------|----------|
| **Home** | `{ x: 1, y: 0 }` | +X | -X |
| **Away** | `{ x: -1, y: 0 }` | -X | +X |

**Deriving team-relative directions** from `attackDir`:

| Direction | Formula |
|-----------|---------|
| Forward | `attackDir` |
| Backward | `{ x: -attackDir.x, y: 0 }` |
| Left | `{ x: -attackDir.y, y: attackDir.x }` |
| Right | `{ x: attackDir.y, y: -attackDir.x }` |

At half-time, teams swap `attackDir` (flip signs).

---

## Quick Reference

```
    ╔══════════════════════════════════════════════════════════════════════════╗
    ║                    COORDINATE SYSTEM COMPARISON                          ║
    ╠══════════════════════════════════════════════════════════════════════════╣
    ║                                                                          ║
    ║   WORLD 2D              CANVAS 2D              THREE.JS 3D               ║
    ║   ════════              ═════════              ══════════                ║
    ║                                                                          ║
    ║       +Y                (0,0)→ +X                  +Y (up)               ║
    ║        ↑                  ↓                         ↑                    ║
    ║        │                 +Y                         │ +Z                 ║
    ║   -X ──●── +X                                       │╱                   ║
    ║        │                                       -X ──●── +X               ║
    ║        ↓                                           ╱                     ║
    ║       -Y                                          -Z (camera)            ║
    ║                                                                          ║
    ╠══════════════════════════════════════════════════════════════════════════╣
    ║   Transform to Canvas:       Transform to Three.js (Right-Handed):       ║
    ║   • X stays same             • X stays same                              ║
    ║   • Y flips (negate)         • height → Three.js Y                       ║
    ║                              • World Y → Three.js Z (no negation)        ║
    ╚══════════════════════════════════════════════════════════════════════════╝
```

```
    ╔══════════════════════════════════════════════════════════════════════════╗
    ║                         TRANSFORM SUMMARY                                ║
    ╠══════════════════════════════════════════════════════════════════════════╣
    ║                                                                          ║
    ║   World → Canvas (with center-translate + Y-flip):                       ║
    ║   ────────────────────────────────────────────────                       ║
    ║   Setup:    ctx.translate(w/2, h/2); ctx.scale(s, -s)                    ║
    ║   Position: ctx.arc(position2d.x, position2d.y, r, ...)  // Direct!      ║
    ║   Text:     ctx.save(); ctx.scale(1,-1); drawText; ctx.restore()         ║
    ║                                                                          ║
    ║   World → Three.js:                                                      ║
    ║   ─────────────────                                                      ║
    ║   Position:  threeX = worldX,  threeY = height,  threeZ = worldY         ║
    ║   Direction: lookAt(posX + dirX, height, posY + dirY)                    ║
    ║                                                                          ║
    ╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Key Principles

1. **Single source of truth**: All state lives in world space (2D + height)
2. **Renderers are views**: They read state, never modify it
3. **Directions as vectors**: No angle conversions needed between renderers
4. **Minimal transforms**: Canvas flips Y, Three.js is direct axis mapping
5. **Right-handed 3D**: Blender/OpenGL models render correctly without modification
