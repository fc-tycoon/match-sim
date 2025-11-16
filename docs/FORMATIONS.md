# Formations

## Overview

Formations define the tactical positioning structure of outfield players (goalkeepers excluded). The formation system uses **normalized team-relative coordinates** to ensure identical logic for both teams.

**CRITICAL**: Formation positions use **team-relative space** with **-1 to 1 normalized coordinates** on the X and Z axes.

---

## Team-Relative Space for Formations

### Coordinate System

**Team-Relative Space** (used for formations):
- **Origin (0, 0)**: Team center of mass (dynamic position based on player positions)
- **-Z Axis**: Toward opponent goal (attacking direction) - strikers positioned here
- **+Z Axis**: Toward own goal (defending direction) - defenders positioned here
- **-X Axis**: Left side of field (from team perspective)
- **+X Axis**: Right side of field (from team perspective)

**Normalized Range**: All formation positions within **-1 to 1** bounding box:
- **X Range**: -1 (left touchline) to +1 (right touchline)
- **Z Range**: -1 (deepest attacker) to +1 (deepest defender)

### Transformation to World Space

Formation positions (team-relative) transform to world space (absolute) coordinates:

**Team 1** (attacks toward +Z):
- worldX = teamCenterX + (formationX × tacticalWidth / 2)
- worldZ = teamCenterZ + (formationZ × tacticalDepth / 2)

**Team 2** (attacks toward -Z):
- worldX = teamCenterX - (formationX × tacticalWidth / 2)  [Flip X]
- worldZ = teamCenterZ - (formationZ × tacticalDepth / 2)  [Flip Z]

**Why This Works**:
- Both teams use **identical formation definitions** (same -1 to 1 coordinates)
- **-Z always means "toward opponent goal"** for both teams
- Team 2 transformation flips X and Z to mirror Team 1
- No team-specific code needed - single formation system handles both

---

## Formation Structure

### Formation Definition

A formation is a set of **normalized positions** for outfield players (10 players - goalkeeper excluded):

**4-4-2 Formation Example**:
- **Strikers** (attacking, -Z direction): Left striker (-0.3, -0.9), Right striker (0.3, -0.9)
- **Midfielders**: Left winger (-0.7, -0.3), Left center mid (-0.2, 0.0), Right center mid (0.2, 0.0), Right winger (0.7, -0.3)
- **Defenders** (defending, +Z direction): Left fullback (-0.7, 0.6), Left centerback (-0.2, 0.8), Right centerback (0.2, 0.8), Right fullback (0.7, 0.6)

**Key Points**:
- **-Z**: Strikers positioned at z = -0.9 (toward opponent goal)
- **+Z**: Defenders positioned at z = 0.6-0.8 (toward own goal)
- **±X**: Wingers/fullbacks positioned at ±0.7 (toward touchlines)
- **Center**: Center midfielders/center backs near x = 0 (center of field)
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

Team center of mass is the **average position of all outfield players** (excluding goalkeeper). Formula: `centerX = sum(player.x) / count`, `centerZ = sum(player.z) / count`. This becomes the (0, 0) origin in team-relative space.

### Player Target Position

Each player's **target position** in world space is calculated from formation position, scaled by tactical dimensions and compactness, then transformed relative to center of mass.

**Transformation**:
- **Offset**: `formationPos × (tacticalSize / 2) × compactness`
- **Team 1**: `worldPos = centerOfMass + offset` (normal)
- **Team 2**: `worldPos = centerOfMass - offset` (flipped X and Z)

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

Attacking formation used when team has ball. Attackers push higher (-Z), midfielders advance, tactical width increases (e.g., 70m), tactical depth increases (e.g., 50m).

### Out-of-Possession Formation

Defensive formation when opponent has ball. Fewer attackers (e.g., single striker at z=-0.7 instead of -0.95), midfielders drop deeper (+Z), tactical width decreases (e.g., 50m), tactical depth decreases (e.g., 35m compact block).

### Transition Logic

Formation selected based on team phase: `attacking` → in-possession formation, `defending` or `contesting` → out-of-possession formation (defensive default).

**Smooth Transition**: Players gradually move from old target to new target position over 2-5 seconds. AI continues making decisions during transition.

---

## Common Formations

### 4-4-2 (Balanced)

```
         ST        ST          (-Z: Strikers)
    LM        CM   CM       RM
    LB    CB          CB    RB  (+Z: Defenders)
```

- 4 defenders, 4 midfielders, 2 strikers
- Balanced width and depth
- Versatile for both attack and defense

### 4-3-3 (Attacking)

```
    LW        ST        RW      (-Z: Strikers)
         CM   CDM   CM
    LB    CB          CB    RB  (+Z: Defenders)
```

- 4 defenders, 3 midfielders (1 holding), 3 attackers
- Wide attacking threat
- Midfield can be overrun if CDM isolated

### 3-5-2 (Wing-backs)

```
         ST        ST          (-Z: Strikers)
    LWB  CM    CDM    CM   RWB
        CB    CB    CB          (+Z: Defenders)
```

- 3 center backs, 5 midfielders (2 wing-backs), 2 strikers
- Wing-backs provide width in attack, drop to form back 5 in defense
- Requires high stamina from wing-backs

### 4-2-3-1 (Possession)

```
              ST              (-Z: Striker)
    LW        CAM        RW
         CDM        CDM
    LB    CB          CB    RB  (+Z: Defenders)
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
- **z**: Between -1.0 and 1.0 (inclusive)
- **role**: Valid tactical role string

### Validation Rules

**Formation Validation Requirements**:
- Formation must have a name (string)
- Exactly 10 positions required (outfield players only, goalkeeper excluded)
- Each position must have valid coordinates: x and z between -1.0 and 1.0
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
- **Coordinate Display**: Show x, z coordinates for selected position
- **Role Assignment**: Dropdown to assign tactical role

### Export Format

Export formations with:
- **name**: Formation name (e.g., "Custom 4-4-2")
- **positions**: Array of position objects (x, z coordinates, role)
- **tacticalWidth**: Width parameter (meters)
- **tacticalDepth**: Depth parameter (meters)
- **compactness**: Compactness parameter (0.0-1.0)

### Import Validation

Imported formations validated before use (see Validation Function above).

---

## Summary

**Formation System Architecture**:
- **Team-Relative Space**: -1 to 1 normalized coordinates (X and Z)
- **-Z = Attacking**: Strikers positioned toward opponent goal
- **+Z = Defending**: Defenders positioned toward own goal
- **Origin (0, 0)**: Team center of mass (dynamic)
- **Transformation**: Team 1 normal, Team 2 flips X and Z
- **Identical Logic**: Both teams use same formation definitions

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
