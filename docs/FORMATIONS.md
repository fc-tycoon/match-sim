# Formations

## Overview

Formations define the tactical positioning structure of outfield players (goalkeepers excluded). The formation system uses **normalized slot coordinates** (-1 to +1) in world space axes, combined with each team's `attackDir` vector to resolve forward/backward directions.

**CRITICAL**: Formation slots use **world space axes** (X = goal-to-goal, Y = touchline-to-touchline) with **-1 to 1 normalized coordinates**. Each team's `attackDir` determines which direction is "forward."

> **See Also**: [COORDINATES.md](./COORDINATES.md) for the authoritative coordinate system documentation.

---

## Formation Slot Space

### Coordinate System

**Formation Slots** use normalized world axes:
- **Origin (0, 0)**: Team center of mass (dynamic position based on player positions)
- **X Axis**: Goal-to-goal direction (-1 to +1)
- **Y Axis**: Touchline-to-touchline direction (-1 to +1)

**Attack Direction** (`attackDir`) determines team-relative meaning:

| Team | attackDir | Forward (toward opponent) | Backward (toward own goal) |
|------|-----------|---------------------------|----------------------------|
| **Home** | `{x: 1, y: 0}` | +X direction | -X direction |
| **Away** | `{x: -1, y: 0}` | -X direction | +X direction |

**Normalized Range**: All formation positions within **-1 to 1** bounding box:
- **X Range**: -1 to +1 (scaled by tacticalDepth)
- **Y Range**: -1 to +1 (scaled by tacticalWidth)

### Transformation to World Space

Formation slot positions transform to world space using center of mass and tactical dimensions:

**Formula**:
```
worldX = centerOfMassX + (slot.x × tacticalDepth / 2)
worldY = centerOfMassY + (slot.y × tacticalWidth / 2)
```

**How Teams Differ**:
- **Home Team**: `attackDir = {x: 1, y: 0}` - positive slot.x = forward (toward opponent)
- **Away Team**: `attackDir = {x: -1, y: 0}` - negative slot.x = forward (toward opponent)

Both teams use **identical formation definitions**. The `attackDir` vector resolves which direction is "forward" for AI decision-making.

---

## Formation Structure

### Formation Definition

A formation is a set of **normalized positions** for outfield players (10 players - goalkeeper excluded):

**4-4-2 Formation Example** (Home team perspective, attacking +X):
- **Strikers** (forward, high +X): Left striker (-0.3, +0.9), Right striker (0.3, +0.9)
- **Midfielders**: Left winger (-0.7, +0.3), Left center mid (-0.2, 0.0), Right center mid (0.2, 0.0), Right winger (0.7, +0.3)
- **Defenders** (backward, low -X): Left fullback (-0.7, -0.6), Left centerback (-0.2, -0.8), Right centerback (0.2, -0.8), Right fullback (0.7, -0.6)

**Key Points**:
- **High X**: Attackers positioned with higher X values (toward opponent goal for Home)
- **Low X**: Defenders positioned with lower X values (toward own goal for Home)
- **±Y**: Wingers/fullbacks positioned at ±0.7 (toward touchlines)
- **Center**: Center midfielders/center backs near y = 0 (center of field)
- **Role**: Each position has a tactical role (used for AI decision-making)

### Formation Parameters

**Formation Configuration**:
- `name`: Formation identifier (e.g., '4-4-2')
- `positions`: Array of 10 positions (goalkeeper excluded)
- `tacticalWidth`: Maximum team width in meters (e.g., 60m when fully stretched)
- `tacticalDepth`: Maximum team depth in meters (e.g., 40m from attackers to defenders)
- `compactness`: Multiplier for bounding box size (0.0-1.0, where 0.5 = half width/depth, 1.0 = full)

---

## Dynamic Formation Positioning

### Center of Mass Calculation

Team center of mass is the **average position of all outfield players** (excluding goalkeeper). Formula: `centerX = sum(player.x) / count`, `centerY = sum(player.y) / count`. This becomes the (0, 0) origin for formation slot positions.

### Player Target Position

Each player's **target position** in world space is calculated from formation position, scaled by tactical dimensions and compactness, then transformed relative to center of mass.

**Transformation**:
- **Offset**: `formationPos × (tacticalSize / 2) × compactness`
- **Home Team**: `worldPos = centerOfMass + offset` (normal)
- **Away Team**: `worldPos = centerOfMass - offset` (flipped X and Y)

**Dynamic Positioning**:
- Target position moves with center of mass (team attacks/defends as unit)
- Players seek their target position via AI movement decisions
- Compactness affects spacing between players

---

## Formation Nudges (Position Discipline System)

**Formation nudges** are controlled by the **positionDiscipline** parameter (0.0-1.0 float), which determines how strongly formation positions pull players toward assigned positions.

**CRITICAL**: Position discipline is a **continuous weight** (0.0-1.0), NOT a boolean tendency!

### Position Discipline Values

**positionDiscipline** (0.0-1.0 float) controls formation nudge strength:

**Discipline Scale**:
- `0.0`: Free role (NO formation nudge, complete tactical freedom)
- `0.2`: Very low (roaming playmaker, minimal constraint)
- `0.5`: Medium (balanced, moderate nudge to formation position)
- `0.8`: High (most positions, strong structural adherence)
- `1.0`: Maximum (rigid, always returns to exact formation position)

**Typical Values**:
- **0.0**: Roaming playmaker, false 9, free role (NO formation constraint)
- **0.2**: Creative attacking midfielder, inside forward (wide freedom)
- **0.5**: Box-to-box midfielder, full-back (balanced freedom/structure)
- **0.8**: Holding midfielder, center-back, target man (tight structure)
- **1.0**: Extremely disciplined (rarely used, very rigid positioning)

### Nudge Calculation

Formation nudge blends between tactical target (AI-decided) and formation target (assigned position) based on positionDiscipline weight.

**Blending Formula**: `finalTarget = tacticalTarget × (1 - discipline) + formationTarget × discipline`

**Movement Target Calculation**:
- Input: Tactical target (AI-chosen position), formation target (assigned position), discipline weight (0.0-1.0)
- Output: Final movement target blending both positions
- Formula: Weighted average of tactical freedom and formation constraint

**Examples**:
- **Free role playmaker** (discipline = 0.0): 100% tactical freedom, NO formation constraint
- **Holding midfielder** (discipline = 0.8): 80% formation position, 20% tactical freedom
- **Rigid center-back** (discipline = 1.0): 100% formation position, NO tactical freedom

### AI Integration

**Worker Formation Data**:
Player's internal workers receive `positionDiscipline` in formation data:
	
	// Calculate tactical target (where AI wants to go based on game state)
	const tacticalTarget = calculateTacticalTarget(player, data.vision, data.gameState)
	
	// Formation target (where formation says player should be)
**Examples**:
- **discipline = 0.0**: `finalTarget = tacticalTarget` (100% AI decision, no formation constraint)
- **discipline = 0.5**: `finalTarget = 50% tactical + 50% formation` (balanced blend)
- **discipline = 1.0**: `finalTarget = formationTarget` (100% formation position, ignores AI)

### Discipline by Position (Typical Values)

Different positions typically use different discipline values (guidelines, not rigid rules):

**Attackers** (lower discipline = more freedom):
- Free Role Playmaker: 0.0 (complete freedom)
- False 9: 0.2 (very low)
- Winger: 0.5 (medium - can cut inside or stay wide)
- Striker: 0.6 (moderate - some freedom to drop deep)
- Target Man: 0.8 (high - stays in position)

**Midfielders** (medium discipline):
- Attacking Mid: 0.4 (lower - freedom to roam)
- Central Mid: 0.7 (higher - maintains structure)
- Holding Mid: 0.9 (very high - rarely leaves position)
- Box-to-Box: 0.5 (medium - balanced)

**Defenders** (higher discipline = more rigid):
- Fullback: 0.7 (high - overlaps controlled)
- Wingback: 0.6 (medium-high - more freedom)
- Center Back: 0.9 (very high - rarely ventures forward)
- Sweeper: 0.8 (high - can step forward)

**NOTE**: Managers can set any discipline value (0.0-1.0) for any position.

---

## Formation Transitions

### In-Possession Formation

Attacking formation used when team has ball. Attackers push higher (toward opponent goal via attackDir), midfielders advance, tactical width increases (e.g., 70m), tactical depth increases (e.g., 50m).

### Out-of-Possession Formation

Defensive formation when opponent has ball. Fewer attackers (e.g., single striker), midfielders drop deeper (toward own goal), tactical width decreases (e.g., 50m), tactical depth decreases (e.g., 35m compact block).

### Transition Logic

Formation selected based on team phase: `attacking` → in-possession formation, `defending` or `contesting` → out-of-possession formation (defensive default).

**Smooth Transition**: Players gradually move from old target to new target position over 2-5 seconds. AI continues making decisions during transition.

---

## Common Formations

### 4-4-2 (Balanced)

```
         ST        ST          (Forward: Strikers)
    LM        CM   CM       RM
    LB    CB          CB    RB  (Backward: Defenders)
```

- 4 defenders, 4 midfielders, 2 strikers
- Balanced width and depth
- Versatile for both attack and defense

### 4-3-3 (Attacking)

```
    LW        ST        RW      (Forward: Attackers)
         CM   CDM   CM
    LB    CB          CB    RB  (Backward: Defenders)
```

- 4 defenders, 3 midfielders (1 holding), 3 attackers
- Wide attacking threat
- Midfield can be overrun if CDM isolated

### 3-5-2 (Wing-backs)

```
         ST        ST          (Forward: Strikers)
    LWB  CM    CDM    CM   RWB
        CB    CB    CB          (Backward: Defenders)
```

- 3 center backs, 5 midfielders (2 wing-backs), 2 strikers
- Wing-backs provide width in attack, drop to form back 5 in defense
- Requires high stamina from wing-backs

### 4-2-3-1 (Possession)

```
              ST              (Forward: Striker)
    LW        CAM        RW
         CDM        CDM
    LB    CB          CB    RB  (Backward: Defenders)
```

- 4 defenders, 2 holding midfielders, 3 attacking midfielders, 1 striker
- Strong defensive base with creative attacking midfielders
- Popular in modern football

---

## Formation Validation

### Required Properties

All formations must include:
- **name**: Human-readable formation name
- **positions**: Array of exactly 10 positions (outfield players only)
- **tacticalWidth**: Positive number (meters)
- **tacticalDepth**: Positive number (meters)

### Position Constraints

Each position must:
- **x**: Between -1.0 and 1.0 (inclusive)
- **y**: Between -1.0 and 1.0 (inclusive)
- **role**: Valid tactical role string

### Validation Rules

**Formation Validation Requirements**:
- Formation must have a name (string)
- Exactly 10 positions required (outfield players only, goalkeeper excluded)
- Each position must have valid coordinates: x and y between -1.0 and 1.0
- Each position must have a role (string identifier)
- Tactical width and depth must be positive numbers (> 0)
- Compactness must be between 0.0 and 1.0 if specified

---

## Formation Editor

Formation editor allows creating/modifying formations visually:

### Visual Representation

- **2D Top-down View**: Show field with -1 to 1 grid overlay
- **Player Markers**: Draggable markers for each position
- **Center of Mass**: Visual indicator at (0, 0)
- **Coordinate Display**: Show x, y coordinates for selected position
- **Role Assignment**: Dropdown to assign tactical role

### Export Format

Export formations with:
- **name**: Formation name (e.g., "Custom 4-4-2")
- **positions**: Array of position objects (x, y coordinates, role)
- **tacticalWidth**: Width parameter (meters)
- **tacticalDepth**: Depth parameter (meters)
- **compactness**: Compactness parameter (0.0-1.0)

### Import Validation

Imported formations validated before use (see Validation Function above).

---

## Summary

**Formation System Architecture**:
- **Formation Slots**: -1 to 1 normalized coordinates in world axes (X and Y)
- **attackDir Vector**: Determines forward direction (Home = +X, Away = -X)
- **Origin (0, 0)**: Team center of mass (dynamic)
- **Transformation**: Slot positions scaled by tacticalWidth/tacticalDepth + center of mass offset
- **Identical Logic**: Both teams use same formation definitions, attackDir resolves directions

**Dynamic Positioning**:
- Target positions move with center of mass
- Players seek target via AI movement
- Compactness scales formation bounding box
- Formation nudges balance discipline vs. freedom

**Formation Transitions**:
- In-possession formation (attacking phase)
- Out-of-possession formation (defending phase)
- Smooth transition over 2-5 seconds

**Player Tendencies**:
- Free Roaming: Weak nudges (0.3), drift from position
- Disciplined: Strong nudges (0.9), stay in position
- Default: Moderate nudges (0.6)

**Validation**:
- 10 positions required (outfield only, no goalkeeper)
- Coordinates within -1 to 1 range
- Positive tactical dimensions
