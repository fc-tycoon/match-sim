# Deterministic Replay System

## Overview

The match replay system achieves **100% deterministic reproduction** of matches using a seeded PRNG (Pseudo-Random Number Generator). This enables perfect replay functionality with minimal file storage.

**Key Features**:
- **Perfect Reproduction**: Identical match results from same seed every time
- **Minimal File Size**: < 1 MB per match (seed + events only)
- **No Position Storage**: Ball/player positions recalculated during replay
- **Accelerated Playback**: Re-simulate at 10×, 100×, or instant speed
- **Tactical Analysis**: Heatmaps, statistics generated from replayed simulation
- **Browser & Backend**: Works in both browser and Node.js (instant results)

**CRITICAL**: 
- Match engine is **100% deterministic** using seeded PRNG
- Replay works by **re-running simulation** from same seed
- NO position/velocity data stored - everything recalculated
- Identical random seed + inputs = identical match outcome

---

## Deterministic Architecture

### Seeded PRNG

All randomness in the match engine uses a **seeded PRNG** (SplitMix32/PCG32):

**Seed Properties**:
- 32-bit unsigned integer (0 to 4,294,967,295)
- Same seed = same random sequence
- Different seeds = different random sequences
- Can be generated from match ID, timestamp, or user input

**PRNG Usage**:
- AI decision-making (pass vs. shot, tackle timing)
- Player attribute randomness (shot accuracy, pass power)
- Physics outcomes (ball bounce angles, deflections)
- Match events (injury timing, referee decisions)

**Deterministic Guarantee**: Given identical:
- Match seed
- Team rosters (players, attributes, tendencies)
- Formations and tactics
- User inputs (substitutions, tactical changes with timestamps)

The simulation produces **IDENTICAL** results every time.

---

## What Gets Stored

### Match Metadata

**Required Data** (stored in database):
- **Match Seed** (4 bytes): UINT32 seed for PRNG
- **Match ID**: Unique identifier
- **Date/Time**: ISO 8601 timestamp
- **Competition**: League/tournament name
- **Venue**: Stadium name

### Team Data

**Team Rosters** (both teams):
- Team ID, name, formation (e.g., "4-3-3")
- Starting XI player IDs (11 players)
- Substitutes player IDs (7 players)

**Player Attributes** (per player):
- Player ID, number, name, position
- Attributes (pace, passing, shooting, defending, etc.)
- Tendencies (hugsTouchline, findsSpace, forwardRunFrequency, etc.)
- Position discipline (0.0-1.0)

**Team Instructions**:
- Tempo, width, pressingIntensity, defensiveLine (0.0-1.0 floats)
- Goalkeeper instructions (distributeToBack, distributeToFlanks, sweeper, commandsArea)

### Match Events

**User Inputs** (tactical changes during match):
- **Substitutions**: Timestamp, player out ID, player in ID
- **Tactical Changes**: Timestamp, formation change, instruction changes
- **Formation Transitions**: Timestamp, new formation ID

**Match Events** (recorded during simulation):
- **Goals**: Timestamp, player ID, assist player ID, goal type
- **Cards**: Timestamp, player ID, card type (yellow/red)
- **Injuries**: Timestamp, player ID, injury duration
- **Offsides**: Timestamp, player ID
- **Fouls**: Timestamp, player ID, severity

**Event Size**: ~10-30 bytes per event × ~100-300 events = **~1-9 KB per match**

### Match Statistics

**Final Statistics** (stored for quick access):
- Possession percentages (team 1, team 2)
- Shots, shots on target
- Passes, pass accuracy
- Corners, fouls, offsides
- Final score

**Statistics Size**: ~1-2 KB

---

## What Does NOT Get Stored

**NO Position Data**:
- ❌ Ball positions/velocities
- ❌ Player positions/velocities
- ❌ Player orientations (body/head facing)

**NO Physics Data**:
- ❌ Ball spin values
- ❌ Collision states
- ❌ Animation states

**NO AI Data**:
- ❌ AI decision history
- ❌ Vision snapshots
- ❌ Perception data

**Why Not Store These?**:
- Recalculated during replay from seed
- Storing would increase file size to ~65-130 MB per match
- Deterministic engine guarantees identical recalculation

---

## Replay Process

### Loading a Replay

**Load Process**:
1. Load match metadata from database (seed, teams, events)
2. Initialize match engine with **same seed**
3. Load team rosters, attributes, tendencies
4. Load formations and team instructions
5. Load user inputs (substitutions, tactical changes with timestamps)
6. Load match events for verification (optional)

### Re-Running Simulation

**Replay Execution**:
1. Initialize event scheduler with match seed
2. Set up teams with identical formations/tactics/instructions
3. Run simulation tick-by-tick (1 tick = 1 ms)
4. Apply user inputs at stored timestamps:
   - Substitutions at exact tick
   - Tactical changes at exact tick
   - Formation transitions at exact tick
5. Render or analyze as simulation progresses

**Deterministic Guarantee**:
- Same seed → same PRNG sequence
- Same user inputs → same outcomes
- Result: **IDENTICAL match every time**

### Playback Modes

**Real-Time Playback** (1× speed):
- RealTimeScheduler at speed = 1.0
- Render every frame for visual display
- Identical to watching live match

**Accelerated Playback** (5×, 10×, 100× speed):
- RealTimeScheduler at speed = 5.0, 10.0, 100.0
- Render every N frames (skip intermediate frames)
- Useful for quick replay or analysis

**Instant Results** (headless):
- HeadlessScheduler.run() to end
- No rendering, maximum CPU speed
- Used for post-match analysis, statistics generation
- Typical duration: ~1-5 seconds for 90-minute match

---

## Tactical Analysis

### Heatmap Generation

**Process**:
1. Re-run simulation in headless mode
2. Track player positions every N ticks (e.g., every 1000 ticks = 1 second)
3. Quantize positions to grid cells (1.0m resolution)
4. Increment cell visit counts
5. Generate heatmap visualization

**Output**:
- 2D grid with visit counts per cell
- Color gradient (blue = low, red = high)
- Overlay on field view

### Pass Network

**Process**:
1. Load match events from database (or JSON)
2. Filter for PASS events
3. Extract passer ID and receiver ID
4. Count pass frequency between player pairs
5. Build network graph

**Output**:
- Nodes = players (positioned at average location)
- Edges = passes (thickness = pass count)
- Shows team chemistry and passing patterns

### Custom Statistics

**Process**:
1. Re-run simulation with custom event listeners
2. Track specific events (tackles, interceptions, key passes)
3. Calculate custom metrics during replay
4. Generate reports, charts, visualizations

**Examples**:
- Distance covered per player
- Sprint count and duration
- Pass completion rate by field zone
- Defensive actions per phase
- Shot locations and outcomes

---

## File Size Comparison

### Deterministic Replay (New System)

**Storage Requirements**:
- Match seed: 4 bytes
- Match metadata: ~500 bytes
- Team rosters: ~2 KB (2 teams × ~1 KB)
- Player attributes: ~10 KB (22 players × ~450 bytes)
- Match events: ~1-9 KB (~100-300 events)
- Statistics: ~1-2 KB
- **Total**: **< 20 KB per match** (uncompressed)

**With Compression**: ~10-15 KB per match

### Old Position-Based System (Previous Concept)

**Storage Requirements** (for comparison):
- Ball position snapshots: ~1.4 KB/sec × 5400 sec = ~7.6 MB
- Player position snapshots: ~17.6 KB/sec × 5400 sec = ~95 MB
- Event snapshots: ~40-80 KB
- Delta events: ~2.5-5 MB
- Metadata: ~15 KB
- **Total**: **~130 MB per match** (uncompressed)
- **Compressed**: ~65-90 MB per match

### Savings

**File Size Reduction**: 
- **Uncompressed**: 130 MB → 20 KB = **~6,500× smaller**
- **Compressed**: 70 MB → 15 KB = **~4,700× smaller**

**Storage Benefits**:
- Store **1,000 matches** in ~15-20 MB (vs. 65-90 GB)
- Store **10,000 matches** in ~150-200 MB (vs. 650-900 GB)
- Easily share matches (< 20 KB file vs. 70 MB file)

---

## Replay Verification

### Match Hash

**Verification Process**:
1. After simulation completes, compute match hash
2. Hash includes final score, key events, statistics
3. Store hash with match metadata
4. On replay, compute hash again and compare
5. If mismatch, flag as corrupted or version incompatibility

**Hash Algorithm**: MD5 or XXHash of serialized match result

### Version Compatibility

**Version Field**: `replayVersion: "1.0.0"`

**Compatibility Check**:
1. Load replay version from database
2. Compare with current engine version
3. If incompatible, warn user or attempt migration
4. Supports backward compatibility for older replays

---

## Downloadable Replays

### Export Format

**JSON Export Structure**:
```json
{
	"replayVersion": "1.0.0",
	"matchSeed": 1234567890,
	"matchId": "match-001",
	"date": "2025-11-16T14:30:00Z",
	"competition": "Premier Division",
	"venue": "Old Stafford",
	"teams": [
		{
			"teamId": "team-001",
			"name": "Manchester Reds",
			"formation": "4-3-3",
			"startingXI": [],
			"substitutes": [],
			"instructions": {}
		},
		{
			"teamId": "team-002",
			"name": "Anfield FC",
			"formation": "4-3-3",
			"startingXI": [],
			"substitutes": [],
			"instructions": {}
		}
	],
	"players": [
		{
			"playerId": "player-001",
			"number": 7,
			"name": "James Horner",
			"position": "ST",
			"attributes": {},
			"tendencies": {}
		}
	],
	"userInputs": [
		{
			"timestamp": 120000,
			"type": "substitution",
			"playerOut": "player-001",
			"playerIn": "player-012"
		}
	],
	"matchEvents": [
		{
			"timestamp": 45000,
			"type": "goal",
			"playerId": "player-001",
			"assistPlayerId": "player-003",
			"goalType": "header"
		}
	],
	"statistics": {
		"finalScore": {"team1": 2, "team2": 1},
		"possession": {"team1": 55, "team2": 45},
		"shots": {"team1": 12, "team2": 8}
	},
	"matchHash": "a3b2c1d4e5f6..."
}
```

**File Size**: ~15-25 KB per match (JSON format)

**Download Process**:
1. Serialize match data to JSON
2. Create blob for download
3. Trigger browser download with filename

**Use Cases**:
- Share replays with other users
- Archive matches outside database
- Import matches into analysis tools
- Community highlight reels
- Tournament brackets with replays

---

## Database Storage

### Schema Design

**Matches Table**:
- `match_id` (PRIMARY KEY): Unique match identifier
- `match_seed` (UINT32): PRNG seed for replay
- `date` (TIMESTAMP): Match date/time
- `competition` (VARCHAR): League/tournament name
- `venue` (VARCHAR): Stadium name
- `team1_id`, `team2_id` (FOREIGN KEY): Team references
- `final_score_team1`, `final_score_team2` (INT): Final score
- `match_data` (JSON/TEXT): Complete replay data
- `match_hash` (VARCHAR): Verification hash
- `replay_version` (VARCHAR): Engine version

**Storage Size**: ~15-25 KB per match (JSON data)

---

## Backend Integration

### Instant Results Mode

**Process**:
1. Generate random match seed
2. Load team rosters from database
3. Initialize HeadlessScheduler with seed
4. Run simulation to completion
5. Extract statistics and events
6. Store replay data in database

**Performance**: 90-minute match in ~1-5 seconds

**Use Cases**:
- Background season simulation
- Batch tournament processing
- AI testing and validation

### Browser vs. Backend

**Browser** (Real-Time/Replay):
- RealTimeScheduler for live matches
- Render 3D/2D visualization
- User tactical changes
- Visual playback

**Backend** (Instant Results):
- HeadlessScheduler instant sim
- No rendering
- Statistics generation only
- Store for later playback

**Compatibility**: Same deterministic engine, identical results from same seed.

---

## Summary

**Deterministic Replay System**:
- **100% Deterministic**: Same seed = identical match every time
- **Minimal File Size**: < 20 KB per match
- **Perfect Reproduction**: Re-run simulation from seed
- **Accelerated Playback**: 5×, 10×, 100× speed or instant
- **Tactical Analysis**: Heatmaps, statistics from replayed simulation
- **Browser & Backend**: Works in both environments

**Storage Requirements**:
- Match seed (4 bytes)
- Team/player data (~12 KB)
- Match events (~1-9 KB)
- Statistics (~1-2 KB)
- **Total**: < 20 KB per match

**Replay Process**:
1. Load seed + teams + events from database
2. Initialize simulation with same seed
3. Re-run simulation tick-by-tick
4. Apply user inputs at stored timestamps
5. Render or analyze as simulation progresses

**Benefits**:
- **6,500× smaller** file sizes
- Store 10,000 matches in ~150 MB
- Easy sharing (< 20 KB files)
- Perfect reproduction guaranteed
- Works in browser and backend

**Use Cases**:
- Post-match replay and analysis
- Instant results (background simulation)
- Tactical analysis (heatmaps, pass networks)
- Community sharing (small file sizes)
- Tournament/season progression
