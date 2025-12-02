# Field

The `Field` class (`src/core/Field.ts`) is the single source of truth for all field-related data:

- **Dimensions** in both yards (source) and meters (physics)
- **Box2 bounding boxes** for efficient collision and zone detection
- **Visual properties** (colors, line thickness) for rendering
- **Boundary detection** methods for out-of-bounds and goal scoring
- **Static defaults** for use when a Field instance isn't available

## Coordinate System

See [COORDINATES.md](COORDINATES.md) for the full coordinate system documentation.

**Quick Reference:**
- **Origin (0, 0)**: Center spot
- **X-axis**: Goal-to-goal (Home defends -X, Away defends +X)
- **Y-axis**: Touchline-to-touchline (-Y = bottom, +Y = top)
- **Units**: Meters (physics), Yards (source of truth)

## Default Dimensions

| Property | Yards | Meters |
|----------|-------|--------|
| Length | 115 | ~105.2m |
| Width | 74 | ~67.7m |
| Goal Width | 8 | ~7.3m |
| Goal Height | 8 ft | ~2.4m |
| Penalty Area Depth | 18 | ~16.5m |
| Penalty Area Width | 44 | ~40.2m |
| Goal Area Depth | 6 | ~5.5m |
| Goal Area Width | 20 | ~18.3m |
| Center Circle Radius | 10 | ~9.15m |
| Penalty Spot Distance | 12 | ~11m |
| Corner Arc Radius | 1 | ~0.91m |

## Box2 Regions

The Field provides `Box2` objects for efficient zone detection:

```
┌─────────────────────┬──────────────────────────┬──────────────────────────┐
│ Box2                │ Min (lower-left)         │ Max (upper-right)        │
├─────────────────────┼──────────────────────────┼──────────────────────────┤
│ fieldBounds         │ (-52.6, -33.8)           │ (52.6, 33.8)             │
│ homePenaltyArea     │ (-52.6, -20.1)           │ (-36.1, 20.1)            │
│ awayPenaltyArea     │ (36.1, -20.1)            │ (52.6, 20.1)             │
│ homeGoalArea        │ (-52.6, -9.1)            │ (-47.1, 9.1)             │
│ awayGoalArea        │ (47.1, -9.1)             │ (52.6, 9.1)              │
│ homeGoal            │ (-54.4, -3.7)            │ (-52.6, 3.7)             │
│ awayGoal            │ (52.6, -3.7)             │ (54.4, 3.7)              │
└─────────────────────┴──────────────────────────┴──────────────────────────┘
```

**Usage:**
```typescript
// Check if position is in penalty area
if (field.homePenaltyArea.containsPoint(position)) { ... }

// Get penalty area for a team
const penaltyArea = field.getPenaltyArea(team)
```

## Visual Properties

| Property | Default | Description |
|----------|---------|-------------|
| `COLOR_GRASS` | `0x2d5a3d` | Primary grass color |
| `COLOR_GRASS_STRIPE` | `0x2a5338` | Grass stripe pattern |
| `COLOR_GRASS_BORDER` | `0x1a472a` | Border/runoff area |
| `COLOR_LINE` | `0xffffff` | Field line markings |
| `COLOR_SKY` | `0x6bb6ff` | Sky background |
| `COLOR_CONE` | `0xffff00` | Training cone color |
| `LINE_THICKNESS` | `0.12m` | Line width |

## Key Methods

### Zone Detection

```typescript
// Get penalty/goal area for a team
getDefendingPenaltyArea(team: Team): Box2
getAttackingPenaltyArea(team: Team): Box2
getDefendingGoal(team: Team): Box2
getAttackingGoal(team: Team): Box2

// Check if position is in a zone
isInDefendingPenaltyArea(x: number, y: number, team: Team): boolean
isInAttackingPenaltyArea(x: number, y: number, team: Team): boolean
```

### Boundary Types

The Field module exports types used by `BallPhysics` for boundary detection:

```typescript
// BoundaryExit enum - indicates how ball exited play
BoundaryExit.IN_PLAY      // Ball still on field
BoundaryExit.TOUCHLINE    // Crossed side (throw-in)
BoundaryExit.GOAL_LINE    // Crossed end (goal kick/corner)
BoundaryExit.GOAL_HOME    // Scored in home goal
BoundaryExit.GOAL_AWAY    // Scored in away goal

// BoundaryCheckResult interface - returned by BallPhysics
interface BoundaryCheckResult {
    exit: BoundaryExit
    crossingPoint: Vector2 | null
    lastTouchedBy?: Team
}
```

> **Note:** Boundary checking (ball crossing lines) is handled by `BallPhysics`, not Field, because it must account for ball radius.

### Utility

```typescript
// Get goal center position
getDefendingGoalPosition(team: Team): { x: number, y: number }
getAttackingGoalPosition(team: Team): { x: number, y: number }

// Check if point is inside field
containsPoint(x: number, y: number): boolean

// Constrain position outside restricted areas (for set pieces)
constrainOutsideDefendingPenaltyArea(x: number, y: number, team: Team): { x: number, y: number }
constrainOutsideCenterCircle(x: number, y: number): { x: number, y: number }
```

## Static Properties

```typescript
Field.DEFAULT_LENGTH       // 105.2m (115 yards)
Field.DEFAULT_WIDTH        // 67.7m (74 yards)
Field.DEFAULT_LENGTH_YARDS // 115
Field.DEFAULT_WIDTH_YARDS  // 74
Field.YARDS_TO_METERS      // 0.9144
Field.FEET_TO_METERS       // 0.3048
```
