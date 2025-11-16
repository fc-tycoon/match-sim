# Match Stream and Replay System

## Overview

The match stream records simulation state to JSON-serialized format during match execution, enabling:
- **Live Match Playback**: View match as it happens, scrubbing back to any previous point
- **Post-Match Replay**: Load completed matches from database for analysis
- **Downloadable Stream**: Export match stream as JSON file at any point (live or post-match)
- **Event Navigation**: Instantly jump to play resumption events (kickoff, throw-ins, free kicks, etc.)
- **Tactical Analysis**: Heatmaps, statistics, player tracking from recorded positions

**CRITICAL**: 
- Stream stores **POSITIONS and PHYSICS only** - NOT AI decisions or vision snapshots
- Visual replay ONLY - NOT deterministic simulation replay
- INT16 serialization with 1cm resolution for efficient storage
- Event-based snapshots: Play resumption events (kickoff, goal kicks, corners, etc.) + optional periodic snapshots (30s during continuous play)
- Entire match stored as single JSON blob in database (stream + metadata + statistics)

---

## Snapshot Architecture

### Event-Based Snapshot System

The match stream uses **event snapshots** triggered on play resumption events:

**Event Snapshots** (Play Resumption Triggers):
- **Kickoff**: Match start, start of second half, after goals
- **Goal Kicks**: Goalkeeper restarts play after ball crosses goal line
- **Throw-Ins**: Ball out of bounds on touchline
- **Corners**: Ball crosses goal line off defending team
- **Free Kicks**: After fouls, offsides
- **Penalties**: Penalty kick awarded
- **Drop Balls**: Referee stops play and restarts with drop ball
- Storage: Full state snapshot + absolute match timestamp (ms since match start)
- Purpose: Natural replay navigation points, efficient delta encoding
- Full state: Ball + all 22 players + referees (if present)

**Optional Periodic Snapshots** (During Continuous Play):
- Triggered: Every 30 seconds *relative to last event snapshot* (configurable)
- Storage: UINT16 for relative offset (supports up to 65,535ms = ~65 seconds from last event)
- Purpose: Prevents excessive delta chain length during long periods of uninterrupted play
- Still stores absolute match timestamp for navigation
- Full state: Ball + all 22 players

**Why Event-Based?**
- Natural replay segments (match pauses at these moments)
- Efficient delta encoding (most changes occur between play resumptions)
- Intuitive navigation (jump to "throw-in at 23:45" instead of arbitrary timestamp)
- Reduced snapshot overhead (~20-40 per half vs. 90 fixed 30s snapshots)

### Delta Encoding Between Snapshots

Between snapshots, only CHANGES are recorded using delta events:

**Delta Event Structure** (stored sequentially in event stream):
- `msOffset` (UINT8): 0-255ms since PREVIOUS event (NOT since snapshot)
- `entityId` (UINT8): 0-21 = player ID, 255 = ball
- `updateType` (UINT8): Bitmask flags (0x01=pos, 0x02=vel, 0x04=bodyFacing, 0x08=headYaw, 0x10=headPitch)
- `data` (INT16 array): Only fields marked in updateType bitmask

**Reconstruction Process**:
Absolute tick time calculated by sequential summation of msOffset values from snapshot's baseTick through event index.

**Why msOffset Chain?**
- No redundant `tickOffset` field (saves 2 bytes per event)
- UINT8 (0-255ms) sufficient - events never >255ms apart
- Simple sequential summation to reconstruct absolute time

**Replay Configuration**:
- Periodic snapshot interval: 30 seconds (relative to last event snapshot, configurable)
- Max snapshot interval: 65535ms (UINT16 limit, ~65 seconds max relative offset)
- Event triggers: kickoff, goal_kick, throw_in, corner, free_kick, penalty, drop_ball, goal, half_time, full_time

---

## Recording Architecture

### Dynamic Recording Rates

Replay records entity updates at VARIABLE frequencies (not fixed timesteps):

| Component | Update Range | Average | Data Size (per update) |
|-----------|--------------|---------|------------------------|
| **Ball** | 5-20ms | ~13ms (~77 Hz) | 18 bytes |
| **Players** (×22) | 10-50ms | ~25ms (~40 Hz) | 20 bytes each = 440 bytes |
| **Vision** | NOT RECORDED | N/A | (Too large, can reconstruct) |
| **AI Decisions** | NOT RECORDED | N/A | (Not needed for visual replay) |

**Total Recording Rate** (estimated):
- **Ball**: ~77 updates/sec × 18 bytes = ~1.4 KB/sec
- **Players**: ~40 updates/sec × 440 bytes = ~17.6 KB/sec
- **Delta Overhead**: ~5 bytes per event × ~1000 events/sec = ~5 KB/sec
- **Total**: ~24 KB/sec = **~1.44 MB/minute** = **~130 MB for 90-minute match**

**Event Snapshots**: ~40-80 per match (kickoffs, throw-ins, corners, goal kicks, etc.) × ~500 bytes = ~20-40 KB
**Periodic Snapshots**: ~0-60 per match (only during long uninterrupted play) × ~500 bytes = ~0-30 KB

**Compression**: Deflate/gzip reduces by ~50-70% = **~65-90 MB per match**

---

## INT16 Serialization

### Why INT16?

**INT16** (16-bit signed integer) provides:
- **Range**: -32,768 to 32,767
- **Precision**: 1 value = 1 centimeter (0.01 meters)
- **Field Coverage**: ±327.68 meters (sufficient for 120m × 90m field)
- **Efficiency**: 2 bytes per coordinate (vs. 4 bytes for float32, 8 bytes for float64)

### Conversion Functions

**World Coordinates → INT16**: `Math.round(worldCoord * 100)` - converts meters to centimeters (e.g., 52.75m → 5275)

**INT16 → World Coordinates**: `int16Coord / 100` - converts centimeters back to meters (e.g., 5275 → 52.75m)

**Precision**: 1cm resolution is **more than sufficient** for replay:
- Human eye cannot distinguish 1cm differences at typical viewing distances
- Player movement interpolated smoothly between updates
- Ball trajectory imperceptible quantization

---

## Ball Snapshot Format

### Ball State (18 bytes per snapshot)

Ball snapshots recorded at variable rate (5-20ms updates) include:

- **Position (6 bytes)**: X, Y, Z coordinates in centimeters (Int16 each)
- **Velocity (6 bytes)**: X, Y, Z velocity in cm/s (Int16 each, ±327 m/s range)
- **Spin (6 bytes)**: X, Y, Z angular velocity in rad/s × 100 (Int16 each, ±327 rad/s range)

**Ranges**:
- Velocity: ±327 m/s (exceeds realistic ball speeds of 0-50 m/s)
- Spin: ±327 rad/s (covers realistic spin of 0-100 rad/s)

**Total**: 18 bytes per ball update

### Ball Snapshot Example

Ball at position (52.75m, 0.50m, -10.25m) with velocity (5.0, 2.5, -3.0) m/s and spin (2, 10, -1) rad/s:
- Position: `{posX: 5275, posY: 50, posZ: -1025}` (meters × 100)
- Velocity: `{velX: 500, velY: 250, velZ: -300}` (m/s × 100)
- Spin: `{spinX: 200, spinY: 1000, spinZ: -100}` (rad/s × 100)

---

## Player Snapshot Format

### Player State (20 bytes per player × 22 players = 440 bytes per snapshot)

Player snapshots recorded at variable rate (10-50ms updates) include:

- **Position (6 bytes)**: X, Y, Z coordinates in centimeters (Int16 each)
- **Velocity (4 bytes)**: X, Z velocity in cm/s (Int16 each) - Y omitted (usually ~0)
- **Body Facing (2 bytes)**: Rotation 0-65535 mapped to 0-2π radians (Uint16)
- **Head Orientation (4 bytes)**: Yaw (0-2π radians, Uint16) + Pitch (-π/2 to π/2 × 1000, Int16)
- **Animation State (1 byte)**: Compact representation (idle=0, walk=1, run=2, sprint=3, kick=4, etc.)
- **Flags (1 byte)**: Bit-packed boolean fields (hasBall, isGoalkeeper, etc.)

**Optimizations**:
- **Velocity Y Omitted**: Players usually on ground (Y velocity ~0 for most updates)
- **Head Orientation**: Yaw + pitch only (no roll - players don't roll heads)
- **Animation State**: Single byte encoding for common animations
- **Flags**: Bit-packed boolean fields

**Total Size**: 20 bytes per player

**Recording Rate**: Variable (10-50ms per player update) × 20 bytes

---

## Event Snapshot Structure

### Complete Match State Snapshot

Taken at play resumption events (kickoff, throw-ins, corners, etc.):

**Snapshot Components**:
- **Event Type**: String identifier ('kickoff', 'goal_kick', 'throw_in', 'corner', etc.)
- **Base Tick (4 bytes)**: Absolute tick time (ms since match start)
- **Array Offset (4 bytes)**: Offset in delta event stream array (for instant seek)

**Ball State (18 bytes)**:
- Position (X, Y, Z) + Velocity (X, Y, Z) + Spin (X, Y, Z)

**All 22 Players (440 bytes total)**:
- Each player: Position (6 bytes) + Velocity (4 bytes) + Orientation (6 bytes) + Animation/Flags (2 bytes)

**Match Metadata (50-100 bytes)**:
- Score: Team 1, Team 2 scores (1 byte each)
- Match Time: Clock in milliseconds (4 bytes)
- Phase: Current phase (first half, second half, etc.) (1 byte)
- Possession: Team with possession (1 byte)

**Event-Specific Metadata**:
- Event data fields (executing player, position, etc.) - varies by event type
- Examples: Player taking throw-in/free kick (Uint8), event position coordinates (Int16 pair)

**Total Event Snapshot Size**: ~550-650 bytes

**Usage**: Jump to any event snapshot for instant playback - no delta scanning required. Viewer retrieves snapshot by index and starts reconstruction from that point.

**Game Events** (goals, cards, substitutions, etc.):

Game events recorded with fixed header:
- **Timestamp (4 bytes)**: Milliseconds since match start
- **Event Type (1 byte)**: 0=pass, 1=shot, 2=tackle, 3=foul, etc.
- **Player ID (1 byte)**: 0-21, player who triggered event
- **Event Data (variable)**: Event-specific data

**Common Events**:
- **Pass**: Player ID, target player ID, pass accuracy
- **Shot**: Player ID, shot power, shot accuracy, on target
- **Tackle**: Player ID, success/failure
- **Foul**: Player ID, severity, card (yellow/red/none)
- **Goal**: Player ID, assist player ID, goal type (header, volley, etc.)
- **Substitution**: Player out ID, player in ID
- **Offside**: Player ID
- **Ball Out**: Out type (goal kick, corner, throw-in)

**Event Data Size**: ~10-30 bytes per event (varies by event type)

**Event Frequency**: ~100-300 events per match → **~1-9 KB total per match** (negligible)

---

## Match Stream JSON Format

### Complete Match Stream Structure

The entire match is serialized to a single JSON object stored in the database with the following structure:

**Match Metadata**:
- Match ID, date (ISO 8601 timestamp), competition, venue

**Team Information** (both teams):
- Team ID, name, formation (e.g., "4-3-3")
- Player roster (11-18 players per squad):
  - Player ID, number, name, position
  - Attributes (pace, passing, shooting, etc.)
  - Tendencies (hugsTouchline, findsSpace, etc.)

**Match Stream Data**:
- Event snapshots: Kickoffs, throw-ins, corners, etc. (~40-80 snapshots per match)
  - Each snapshot: eventType, baseTick, ball state, all player positions, metadata, eventData, arrayOffset
- Periodic snapshots: Optional snapshots during long continuous play (~0-60 snapshots per match)
  - Each snapshot: baseTick, ball state, all player positions, metadata, relativeOffset
- Delta events: Position updates between snapshots (~500,000-1,000,000 events per match)
  - Each event: msOffset, entityId, updateType, data

**Match Events** (goals, cards, substitutions):
- Event type (goal, yellow_card, substitution, etc.)
- Timestamp (match time in ms)
- Player ID, team ID
- Event-specific data

**Match Statistics**:
- Possession (team percentages)
- Shots, shots on target
- Passes, pass accuracy (percentage)
- Corners, fouls, offsides
- Additional statistics

**Match Result**:
- Final score (team 1, team 2)
- Winner (team ID or 'draw')
- Duration (total match time in ms)

**Total JSON Size** (uncompressed):
- Metadata + teams: ~10-20 KB
- Event snapshots: ~20-50 KB
- Periodic snapshots: ~0-30 KB
- Delta events: ~125-130 MB
- Match events: ~5-10 KB
- Statistics: ~1-2 KB
- **Total**: ~130-135 MB uncompressed
- **Compressed** (gzip): ~65-90 MB

### Downloadable Stream

**Critical Feature**: Match stream can be downloaded at ANY point during live match or post-match.

**Implementation**: Serialize stream to JSON, create blob with `new Blob([json], { type: 'application/json' })`, trigger browser download with filename `match-{matchId}-{timestamp}.json`.

**Use Cases**:
- Export match for sharing with other users
- Backup match data during live play
- Archive completed matches outside database
- Import matches into analysis tools
- Share highlight reels with community

---

## Stream Playback

### Time-Travel Playback

**Seek Algorithm**:
1. Find nearest snapshot BEFORE target timestamp (compare event snapshots and periodic snapshots)
2. Use whichever snapshot is closest to target (prefer periodic if closer)
3. Start with snapshot state (ball + 22 players)
4. Apply delta events sequentially from snapshot.arrayOffset until reaching target timestamp
5. Accumulate msOffset values: `currentTick = snapshot.baseTick + sum(event[i].msOffset)`
6. Stop when `currentTick > targetTimestamp`

**Interpolation Between Updates**:
- If seeking between delta events, interpolate (Lerp positions, Slerp rotations)
- Never extrapolate (always use past events)

### Playback Speeds

Replay supports variable playback speeds: **0.25× (slow motion), 0.5× (half speed), 1.0× (real-time), 2.0× (fast), 5.0× (very fast)**

**Implementation**:
- Viewer interpolates snapshots at display framerate (60/144 Hz)
- Playback speed controls which snapshots are used for interpolation
- Slow motion uses more snapshots (smoother), fast uses fewer (jumpier)

---

## Live vs. Replay Mode

### Stream Position Tracking

The viewer tracks its position in the match stream to determine mode.

**Position Tracking**:
- Viewer maintains: `currentEventIndex`, `currentDeltaIndex`, `isLive` flag
- Updates position by scanning delta events from current event snapshot
- Sets `isLive = true` when `currentDeltaIndex === deltaEvents.length - 1` (at most recent event)

**Live Mode** (isLive = true):
- Viewer is at most recent delta event in stream
- Can view player vision cones (queried from match engine, not from stream)
- Can make tactical changes, substitutions, shouts → sends commands to match engine
- Match engine processes commands, continues writing new delta events to stream
- Viewer automatically advances currentDeltaIndex as new events arrive

**Replay Mode** (isLive = false):
- Viewer is behind current stream position (scrubbed back in time)
- Read-only playback of recorded stream
- Cannot view vision cones (not in stream)
- Cannot make tactical changes or substitutions
- When playback resumes forward and reaches most recent event → becomes live mode

### Vision Cone Display (Live Mode Only)

**CRITICAL**: Vision cones are NOT stored in match stream - only available in live mode via match engine query.

**Live Mode Query**: In live mode, viewer calls `matchEngine.getPlayerVision(playerId)` to retrieve real-time vision data. If not live, vision cone display is unavailable (returns early with warning).

**Live Mode Features**:
- Click player → show vision cone overlay
- Show visible players/ball within cone
- Update vision cone as head orientation changes
- Vision data queried in real-time, NOT from stream

**Replay Mode Limitations**:
- Vision cones NOT available (not stored in stream)
- Can reconstruct approximate vision from head orientation + positions
- Viewer can estimate "what player could see" but not exact vision data

---

## 1st-Person Camera

**CRITICAL**: Stream enables **viewing match through player's eyes** using recorded head orientation.

### 1st-Person Camera Setup

**Camera Positioning**:
- **Position**: Player eye height = `position.y + 1.75m` (typical human eye level)
- **Rotation**: Head yaw converted from UINT16: `headYaw / 65535 * 2π`, head pitch from INT16: `headPitch / 1000`
- **FOV**: ~90° horizontal (realistic human field of view)

**What Player "Sees"**:
- **Camera Position**: Player's eye position (posY + 1.75m)
- **Camera Orientation**: Head yaw/pitch from stream
- **Limited FOV**: ~90° horizontal (realistic human FOV)
- **No Vision Cone Culling**: Full scene rendered (vision cone not in stream)
- **Approximate View**: Can estimate what player could see, but not exact vision data (live mode only)

**Use Cases**:
- **Goal Celebrations**: See goal from striker's perspective
- **Save Replays**: See crucial save from goalkeeper's POV
- **Tactical Analysis**: Understand player's decision-making context
- **Highlight Reels**: Create "player cam" compilation videos

---

## Heatmap Generation

### Position Heatmap

**Generation Algorithm**:
1. Initialize 2D grid (default 1.0m resolution)
2. For each player snapshot: Convert INT16 position to world coordinates
3. Quantize to grid cells: `gridX = floor(x / resolution)`, `gridZ = floor(z / resolution)`
4. Increment cell count for each visit
5. Return grid map with visit counts

**Visualization**:
- Color gradient (blue = low, red = high)
- Overlay on field 2D view
- Shows player positioning tendencies

### Pass Network

**Generation Algorithm**:
1. Filter match events for PASS events
2. Extract passer ID and receiver ID from event data
3. Create edge key: `${fromId}->${toId}`
4. Increment pass count for each edge
5. Return network map with pass counts per edge

**Visualization**:
- Nodes = players (positioned at average location)
- Edges = passes (thickness = pass count)
- Shows team chemistry and passing patterns

### Pass Network

Generate pass network from match events by:
- Filtering match events for PASS event types
- Extracting from/to player IDs
- Counting pass frequency between player pairs
- Building network map of player connections

**Visualization**:
- Nodes = players (positioned at average location)
- Edges = passes (thickness = pass count)
- Shows team chemistry and passing patterns

---

## Database Storage

### JSON Serialization

Match stream is stored as single JSON blob in database.

**Storage Process**:
1. Serialize entire matchStream object: `JSON.stringify(matchStream)`
2. Store in database as TEXT or BLOB column
3. Optional: Compress with gzip before storing (see below)
4. Load from database: `JSON.parse(row.streamData)`

**Storage Considerations**:
- **Uncompressed**: ~130-135 MB per match (JSON string)
- **Compressed** (gzip): ~65-90 MB per match (binary blob)
- Database-agnostic (works with any database supporting TEXT/BLOB columns)
- Optional: Store metadata separately for efficient querying (team names, final score, date)

### Compression Strategy

**Deflate/Gzip Compression**:
- Lossless compression (no data loss)
- ~50-70% file size reduction for JSON
- Fast decompression (minimal overhead)

**Process**: Use pako library (or equivalent) to compress JSON string with `pako.gzip(json)` before storing as binary blob. Decompress on load with `pako.ungzip(blob, { to: 'string' })` then parse JSON.

---

## Stream Validation

### Checksum Verification

Optional CRC32 checksum for integrity verification. If present, compute CRC32 of stream data and compare with stored checksum. Throw error if mismatch indicates corruption.

### Version Compatibility

Version field ensures compatibility. On load, check if `matchStream.version > CURRENT_STREAM_VERSION`. If newer version detected, throw error or handle migration. Supports backward compatibility for older stream formats.

---

## Summary

**Match Stream Architecture**:
- **Event-Based Snapshots**: Play resumption events (kickoff, throw-ins, corners, goal kicks, etc.) + optional periodic snapshots (30s during continuous play)
- **Delta Encoding**: msOffset chain (UINT8, 0-255ms between delta events)
- **INT16 Serialization**: 1cm resolution, 2 bytes per coordinate
- **Variable Recording Rates**: Ball 5-20ms, Players 10-50ms (NOT fixed timesteps)
- **JSON Format**: Single JSON blob per match stored in database
- **Downloadable**: Export match stream as JSON file at any point (live or post-match)
- **File Size**: ~65-135 MB per 90-minute match (compressed/uncompressed)
- **Time-Travel**: Seek to any timestamp via event snapshots + delta reconstruction

**Stream Components**:
- **Ball**: 18 bytes per update @ variable rate (5-20ms, avg ~13ms = ~77 Hz) = ~1.4 KB/sec
- **Players**: 20 bytes per player @ variable rate (10-50ms, avg ~25ms = ~40 Hz) = ~17.6 KB/sec
- **Event Snapshots**: ~40-80 per match (play resumption events) × ~550 bytes = ~20-45 KB
- **Periodic Snapshots**: ~0-60 per match (only during long uninterrupted play) × ~500 bytes = ~0-30 KB
- **Delta Events**: ~500,000-1,000,000 per match × ~5 bytes = ~2.5-5 MB
- **Metadata + Teams**: ~10-20 KB
- **Match Events**: ~100-300 × ~30 bytes = ~3-9 KB
- **Statistics**: ~1-2 KB

**What Gets Recorded**:
✅ Ball position, velocity, spin (every physics update)
✅ Player position, velocity, orientation, head orientation (every physics update)
✅ Match events (goals, cards, substitutions, fouls)
✅ Event snapshots (kickoff, throw-ins, corners, goal kicks, etc.)
✅ Periodic snapshots (optional, during continuous play)
✅ Full match metadata (teams, players, attributes, formation)
✅ Match statistics (possession, passes, shots, etc.)

**What Does NOT Get Recorded**:
❌ AI decision history (not needed for visual replay)
❌ Vision snapshots (not needed, can estimate from head orientation)
❌ Event scheduler state (internal implementation detail)
❌ Update intervals/frequencies (dynamic, not deterministic)

**Live vs. Replay Mode**:
- **Live Mode** (isLive = true): Viewer at most recent stream event
  * Can view player vision cones (queried from match engine, not stream)
  * Can make tactical changes, substitutions, shouts
  * Match engine processes commands, writes to stream
- **Replay Mode** (isLive = false): Viewer behind current stream position
  * Read-only playback of recorded stream
  * Cannot view vision cones (not in stream)
  * Cannot make tactical changes
  * Returns to live mode when reaching most recent event

**Playback Features**:
- Variable playback speeds (0.25× to 5×)
- Smooth interpolation at any display framerate (60-240 Hz)
- Instant jump to event snapshots (no delta scanning)
- Heatmaps and tactical analysis
- Pass networks and statistics
- 1st-person camera (using recorded head orientation)
- Visual replay ONLY (NOT deterministic simulation replay)

**Storage & Export**:
- Database: Single JSON blob per match
- Compression: Deflate/gzip (~50-70% reduction) = ~65-90 MB
- Download: Export as JSON file at any point (live or post-match)
- Sharing: JSON format enables easy sharing between users
