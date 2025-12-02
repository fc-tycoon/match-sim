# Postion roles and slots

This document outlines the data structures and coordinate systems used in the Match Simulator, derived from the FC Tycoon database.

## Data Files (JSON)

The Match Simulator consumes the following JSON files, which are direct exports from the game database tables.
These files are located in `/src/exports/`

### 1. `positions.json`
Defines the base playing positions (e.g., Goalkeeper, Defender, Midfielder, Striker).

*   **id** (Number): Unique identifier (1-127).
*   **abbr** (String): Short abbreviation (e.g., "GK", "CD", "ST").
*   **name** (String): Full name (e.g., "Goalkeeper", "Central Defender").
*   **unit** (Number): Field unit classification.
    *   `1`: Goalkeeper
    *   `2`: Defense
    *   `3`: Midfield
    *   `4`: Attack

### 2. `position_slots.json`
Defines specific tactical slots on the field (e.g., Left Center Back, Right Wing). These slots have normalized coordinates relative to the team's center of mass.

*   **id** (Number): Unique identifier.
*   **position_id** (Number): Reference to `positions.id`.
*   **code** (String): Tactical code (e.g., "CD-L", "CD-C", "CD-R", "CM-L", "CM-C", "CM-R", "DM-C", "RW", "RB", "RWB").
*   **name** (String): Descriptive name (e.g., "Central Defender (Left)").
*   **channel** (Number): Horizontal channel on the pitch.
    *   `-2`: Left
    *   `-1`: Left Half-space
    *   `0`: Centre
    *   `1`: Right Half-space
    *   `2`: Right
*   **position_x** (Float): X coordinate in slot space (goal-to-goal direction). Range: `-1.0` to `1.0`. Note: `0.0` aligns with the team's center of mass.
*   **position_y** (Float): Y coordinate in slot space (touchline direction). Range: `-1.0` (Left/Bottom) to `1.0` (Right/Top).

### 3. `position_roles.json`
Defines the playing styles and behaviors for players (e.g., "Ball Playing Defender", "False Nine"). Contains detailed skill weights and tendencies.

*   **id** (Number): Unique identifier.
*   **name** (String): Role name.
*   **role_type** (String): "attacker", "defender", or "support".
*   **attacking_phase** (Number): 0-100.
*   **defending_phase** (Number): 0-100.
*   **[Skill Weights]** (Float): Various fields ending in `_wt` (e.g., `finishing_wt`, `tackling_wt`) representing the importance of attributes for this role (0.0 - 1.0).
*   **[Tendencies]** (Number/Boolean): Fields like `pressing_intensity`, `drifts_wide`, `cuts_inside`.

### 4. `position_slot_roles.json`
A join table linking **Position Slots** to allowed **Position Roles**. A single slot (e.g., "Striker") can have multiple valid roles (e.g., "Target Man", "Poacher").

*   **id** (Number): Unique identifier.
*   **slot_id** (Number): Reference to `position_slots.id`.
*   **role_id** (Number): Reference to `position_roles.id`.

### 5. `formations.json`
Defines team formations.

*   **id** (Number): Unique identifier.
*   **family** (Number): Formation family code (e.g., `442`, `433`).
*   **name** (String): Specific formation name (e.g., "4-4-2 Narrow Diamond").
*   **position_slots** (Array<Number>): An array of exactly 11 `position_slots.id`s that make up this formation.

---

## Coordinate Systems

The simulation uses **World Space** for physics and rendering, and **Formation Slot Space** (normalized -1 to +1) for tactical positioning. Each team's `attackDir` vector determines the forward direction.

### 1. World Space (2D Simulation + 3D Rendering)

This is the absolute coordinate system for the match simulation. See `docs/COORDINATES.md` for full details.

**World 2D (Simulation):**
*   **Origin (0, 0)**: Center spot of the field.
*   **+X Axis**: Toward Away goal (Home attacks this direction).
*   **-X Axis**: Toward Home goal (Away attacks this direction).
*   **+Y Axis**: Toward top touchline.
*   **-Y Axis**: Toward bottom touchline (camera side).

**Three.js 3D (Rendering):**
*   **X Axis**: Same as World X (goal-to-goal).
*   **Y Axis**: Height above ground (up). Ground level is Y=0.
*   **Z Axis**: Maps from World Y (touchline-to-touchline). threeZ = worldY (right-handed).

### 2. Formation Slot Space (Tactical)

Formation slots use normalized -1 to +1 coordinates in **world axes**, offset from the team's center of mass. Each team's `attackDir` vector determines which direction is "forward."

*   **Origin (0, 0)**: The "Center of Mass" of the team (excluding the Goalkeeper). This point moves dynamically as the team shifts up and down the field.
*   **X Axis**: Goal-to-goal direction (same as World X)
*   **Y Axis**: Touchline-to-touchline direction (same as World Y)
*   **attackDir**: Home = `{x: 1, y: 0}` (forward = +X), Away = `{x: -1, y: 0}` (forward = -X)

**Note**: In `position_slots.json`, coordinates are stored as `position_x` and `position_y`.
*   `position_slots.position_x` maps to **Slot X** (touchline direction).
*   `position_slots.position_y` maps to **Slot Y** (goal-to-goal direction).
    *   The `attackDir` vector determines whether positive or negative slot values mean "forward."

### Coordinate Mapping

Players are positioned in **Slot Space** (normalized -1 to +1), then transformed into **World Space** using center of mass and tactical dimensions.

#### Home Team (attacks toward +X)
The Home team attacks toward +X (Away goal).
*   **attackDir**: `{x: 1, y: 0}`
*   **Defends**: -X (Home Goal)
*   **Attacks**: +X (Away Goal)
*   **World X** = Team Center X + (Slot X × tacticalDepth / 2)
*   **World Y** = Team Center Y + (Slot Y × tacticalWidth / 2)

#### Away Team (attacks toward -X)
The Away team attacks toward -X (Home goal).
*   **attackDir**: `{x: -1, y: 0}`
*   **Defends**: +X (Away Goal)
*   **Attacks**: -X (Home Goal)
*   **Transformation**: Same formula, but `attackDir` is used by AI to determine "forward" direction.

### Team Bounding Box
The `position_slots` coordinates are normalized values relative to a dynamic **Team Bounding Box** centered on the team's center of mass.
*   **X Range**: `-1.0` to `+1.0` (scaled by tacticalDepth)
*   **Y Range**: `-1.0` to `+1.0` (scaled by tacticalWidth)

This bounding box is "virtual" and serves as an anchor for formation shape. Players act as autonomous agents and can leave this box based on their role freedom and game context, but their "home" position is anchored to these coordinates relative to the team's center.
