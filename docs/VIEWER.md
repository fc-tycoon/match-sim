# Viewer Architecture

## Overview

The **viewer** is the visual component that displays the match stream. It is **separated** from the match engine during replay, but has **limited interaction** when in live mode.

**CRITICAL**: 
- Viewer reads position stream from match engine/database (ball/player positions at DYNAMIC variable intervals)
- **Simulation Time**: 1 tick = 1 millisecond (NO predefined timesteps)
- **Replay Mode**: Read-only stream playback, no interaction
- **Live Mode** (when at most recent stream event): Can view vision cones, make tactical changes, subs, shouts

---

## Viewer/Simulation Separation

### Stream-Based Communication

**Architecture Diagram**:

```
Match Engine (Main Thread) ───Stream──→ Viewer (Renderer)
  - Ball Physics                         - Interpolation
  - Player AI                            - Camera
  - Match Logic         ←────Commands─   - 3D Rendering
                         (Live Mode)
```

**Data Flow**:
- **Match Engine → Viewer**: Stream output (position updates)
- **Viewer → Match Engine**: Commands in live mode (subs, tactics, shouts)

**Update Frequencies**:
- **Match Engine**: DYNAMIC intervals - 1 tick = 1ms, NO predefined timesteps
  - Ball physics: 5-20 ticks (speed-based, suspended when stopped)
  - Player physics: 10-50 ticks (speed-based)
  - Player AI: 30-200 ticks (proximity/attribute-based)
  - See EVENT_SCHEDULER.md for complete details
- **Viewer**: Variable display framerate (60/144/240 Hz monitor refresh)
- **Stream**: Position updates at DYNAMIC variable intervals (ball 5-20ms, players 10-50ms)

**Modes**:
- **Live Mode**: Viewer can send commands to match engine (tactical changes, subs, shouts)
- **Replay Mode**: Viewer reads stream only, no interaction

### Why Separate?

1. **Frame-Rate Independence**: Match engine runs deterministically regardless of display framerate
2. **Replay Compatibility**: Same viewer can display live match OR replay from database
3. **Multiple Perspectives**: Multiple viewers can watch same simulation (broadcast, tactical, 1st-person)
4. **Performance**: Match engine can run faster than real-time (5×, 10× speed) while viewer displays smoothly
5. **Testability**: Match engine can run headless (no viewer) for simulations

---

## Viewer Modes

### Live Mode (isLive = true)

Viewer is at most recent event in stream.

**Mode Detection**: Check if `currentDeltaIndex === matchStream.deltaEvents.length - 1`. If true, enable live mode features (vision cones, tactical controls).

**Live Mode Features**:
- View player vision cones (queried from match engine, not stream)
- Make tactical changes → sends command to match engine
- Make substitutions → sends command to match engine
- Issue shouts (Attack/Defend/Shoot) → sends command to match engine
- Match engine processes commands, continues writing to stream

### Replay Mode (isLive = false)

Viewer is behind current stream position (scrubbed back in time).

**Mode Transition**: When user scrubs timeline backward, find delta index for timestamp and set `isLive = false`. Disable vision cones and tactical controls.

**Replay Mode Limitations**:
- Read-only stream playback
- Cannot view vision cones (not in stream)
- Cannot make tactical changes or substitutions
- When playback resumes forward and reaches most recent event → becomes live mode

---

## Viewer Update Loop

### Display Framerate

Viewer runs at monitor refresh rate (variable 60-240 Hz).

**Update Loop**:
1. Get current and previous delta events from stream
2. Calculate interpolation alpha: `(displayTime - prevTime) / (currentTime - prevTime)`
3. Interpolate positions/rotations between events
4. If live mode and player selected, query vision cone from match engine
5. Render scene
6. Continue at display framerate via `requestAnimationFrame`

**Key Points**:
- **Variable Framerate**: Viewer uses `requestAnimationFrame` (syncs to monitor)
- **Interpolation**: Smooth movement between stream delta events
- **No Extrapolation**: Always interpolate between past states (never predict future)
- **Live Features**: Vision cones, tactical controls only when isLive = true

---

## Match Stream Interface

### Stream Event Format

Match engine writes delta events to stream at variable intervals:

**Delta Event Structure** (from match stream - see REPLAY.md):
- `msOffset` (UINT8): 0-255ms since previous event
- `entityId` (UINT8): 0-21 = player ID, 255 = ball
- `updateType` (UINT8): Bitmask flags (0x01=pos, 0x02=vel, 0x04=bodyFacing, 0x08=headYaw, 0x10=headPitch)
- `data` (INT16 array): Only fields marked in updateType bitmask

**Stream Frequency** (dynamic intervals):
- **Ball**: 5-20ms variable (~50-200 Hz) - Speed-based, high frequency for fast shots
- **Players**: 10-50ms variable (~20-100 Hz) - Speed-based, sufficient for smooth movement
- **Note**: Viewer handles variable intervals seamlessly via interpolation

### Stream Event Reconstruction

Viewer reconstructs world coordinates from stream events by reading delta event data and converting INT16 to world coordinates.

**Reconstruction Process**:
1. Get entity from entityId (255 = ball, 0-21 = player)
2. Check updateType bitmask to determine which fields are present
3. Read position if flag 0x01 set: Convert INT16 to meters (`value / 100`)
4. Read velocity if flag 0x02 set: Convert INT16 to m/s (`value / 100`)
5. Read body facing if flag 0x04 set: Convert UINT16 to radians (`value / 65535 × 2π`)
6. Read head orientation (yaw/pitch) if flags 0x08/0x10 set
7. Update current world state with new values

### Event Stream Buffer

Viewer maintains buffer of recent stream events (default 100 events).

**Buffer Features**:
- **Interpolation**: Need previous and current events
- **Jitter Protection**: Buffer absorbs timing variations
- **Replay**: Can scrub backward/forward through buffer

---

## Interpolation

### Position Interpolation (Lerp)

Linear interpolation for positions: `lerp(a, b, t) = a + (b - a) * t`

Example ball position interpolation: `lerpVector3(previousPos, currentPos, alpha)` where each component (x, y, z) uses lerp formula.

### Rotation Interpolation (Slerp)

Spherical linear interpolation for rotations (quaternions or angles). For body yaw: `lerp(previousYaw, currentYaw, alpha)` with angle wrapping.

### Alpha Calculation

Calculate interpolation factor between stream events.

**Formula**: `alpha = clamp((displayTime - prevTime) / (currentTime - prevTime), 0.0, 1.0)`

**Example** (with variable stream intervals):
- Previous event at t=100ms
- Current event at t=113ms (13ms variable delta - ball slowing down)
- Display frame at t=105ms
- Alpha = (105 - 100) / (113 - 100) = 0.385
- Interpolated position = 38.5% between previous and current

**Never Extrapolate**:
- If `displayTime > currentTime`, alpha clamped to 1.0 (use current snapshot)
- If `displayTime < prevTime`, alpha clamped to 0.0 (use previous snapshot)
- Prevents prediction errors and visual artifacts

---

## Camera Perspectives

### Broadcast Camera

Standard TV-style camera behind goal, elevated (position ~(0, 25, 60), looking at field center, 60° FOV).

**Features**: Follows ball with smooth panning, zooms based on action intensity, wide field view.

### Tactical Camera

Top-down orthographic view from high above field (position ~(0, 80, 0), looking straight down, narrow FOV or orthographic).

**Features**: Shows entire field, clear formation view, ideal for tactical analysis.

### 1st-Person Camera

Player's perspective using recorded head orientation from stream.

**Camera Setup**:
- **Position**: Player position + eye height offset (~1.7m)
- **Rotation**: Head yaw and pitch from stream (UINT16 → radians conversion)
- **FOV**: ~120° (realistic human field of view)

**Features**: Immersive player perspective, shows what player sees, requires head orientation data.

### Free Camera

User-controlled camera with complete freedom of movement. User input (mouse/keyboard) controls position, target, and FOV. Useful for debugging and screenshots.

---

## Rendering Pipeline

### Scene Setup

Three.js scene with WebGPU renderer, field, ball, and player meshes.

**Components**:
- **Renderer**: WebGPURenderer with antialiasing
- **Scene**: Contains all 3D objects (field, ball, 22 players)
- **Camera**: PerspectiveCamera with configurable FOV
- **Lighting**: Ambient light + directional light for realistic shadows
- **Field Mesh**: Plane geometry (~120m × 90m) with grass material
- **Ball Mesh**: Sphere geometry (0.11m radius) with white material
- **Player Meshes**: Capsule geometry (0.3m radius, 1.7m height) with team colors

### Frame Rendering

Update scene and render each frame.

**Render Process**:
1. Update ball mesh position from interpolated scene state
2. Update all 22 player mesh positions and rotations (body yaw)
3. Call `renderer.render(scene, camera)` to draw frame

### Animation Blending

Blend between animation states (idle, walk, run, sprint) using animation mixer.

**Transition Logic**: When animation state changes, fade out current animation (0.2s) and fade in new animation (0.2s). Update mixer each frame with delta time.

---

## Viewer Performance

### Framerate Targets

| Monitor | Refresh Rate | Target FPS | Interpolation Rate |
|---------|--------------|------------|--------------------|
| Standard | 60 Hz | 60 FPS | 6 snapshots per ball snapshot |
| Gaming | 144 Hz | 144 FPS | 14.4 snapshots per ball snapshot |
| High-End | 240 Hz | 240 FPS | 24 snapshots per ball snapshot |

**Key Insight**: Higher refresh rates require MORE interpolation (viewer frames between simulation snapshots).

### Performance Optimization

- **Level of Detail (LOD)**: Reduce player mesh complexity at distance
- **Frustum Culling**: Don't render players outside camera view
- **Instanced Rendering**: Share meshes for identical players
- **Occlusion Culling**: Don't render players behind stadium/crowd

---

## Viewer/Replay Integration

### Live Simulation

**Live Match Process**:
- Simulation processes ball physics, player movement, AI decisions
- Creates snapshot containing current world state
- Sends snapshot to viewer via `viewer.addSnapshot(snapshot)`
- Continues simulation loop asynchronously

### Replay Files

**Replay Playback Process**:
- Load match stream JSON from database: Get match by ID
- Start from first event snapshot (kickoff): Initialize world state
- Reconstruct initial world state from snapshot
- Play forward through delta events at playback speed
- Apply each delta event to current state
**Live Match Stream**:
Match engine calls viewer stream event handler when writing position updates. Viewer updates live status to verify still at most recent event.

**Match Engine Loop**: Processes physics and AI, writes position updates when entities need updates, emits events to connected viewers, schedules next updates.

**Same Viewer Code**: Viewer doesn't care if events come from live match engine or database replay.

---

## Summary

**Viewer Architecture**:
- **Stream-Based**: Viewer reads position stream from match engine/database
- **Two Modes**: Live mode (at most recent event) vs. Replay mode (behind current position)
- **Live Mode Features**: Vision cones, tactical changes, subs, shouts (when isLive = true)
- **Replay Mode**: Read-only playback, no interaction
- **Variable Framerate**: Viewer displays at monitor refresh (60/144/240 Hz)
- **Interpolation**: Smooth movement between variable-interval stream events

**Match Stream** (dynamic intervals - see `EVENT_SCHEDULER.md` and `REPLAY.md`):
- Ball: 5-20ms variable (~50-200 Hz) - Speed-based
- Players: 10-50ms variable (~20-100 Hz) - Speed-based
- Event snapshots: Kickoffs, throw-ins, corners, goal kicks, etc.
- Periodic snapshots: Optional, every 30s during continuous play
- Delta events: Position updates between snapshots (msOffset chain)

**Live Mode** (isLive = true):
- Viewer at most recent stream event
- Can query vision cones from match engine (not in stream)
- Can send commands to match engine (tactics, subs, shouts)
- Match engine processes commands, writes to stream

**Replay Mode** (isLive = false):
- Viewer behind current stream position (scrubbed back)
- Read-only stream playback
- No vision cones (not in stream)
- No tactical controls
- Returns to live mode when reaching most recent event

**Downloadable Stream**:
- Export match stream as JSON file at any point (live or post-match)
- Single JSON blob contains full match data (metadata, stream, statistics)
- See `REPLAY.md` for complete stream format

**Interpolation**:
- Lerp: Linear interpolation for positions/velocities
- Slerp: Spherical interpolation for rotations
- Alpha: Never extrapolate (clamp 0.0-1.0)
- Handles variable stream intervals seamlessly

**Camera Perspectives**:
- Broadcast: TV-style camera with smooth panning
- Tactical: Top-down orthographic view
- 1st-Person: Through player's eyes (using recorded head orientation)
- Custom: Free camera for replay analysis

**Match Engine Independence**:
- Match engine can run headless (no viewer) for simulations
- Same viewer code for live match and replay
- Viewer doesn't control match engine timing
- Clean separation of concerns
- Viewer handles variable snapshot intervals seamlessly

**Interpolation**:
- Lerp for positions (linear)
- Slerp for rotations (spherical)
- Alpha clamped 0.0-1.0 (never extrapolate)
- Works with variable snapshot intervals (ball 5-20ms, players 10-50ms)

**Camera Perspectives**:
- Broadcast (TV-style)
- Tactical (top-down)
- 1st-Person (player POV)
- Free (user-controlled)

**Benefits**:
- Frame-rate independence
- Replay compatibility
- Multiple simultaneous viewers
- Performance (simulation runs at own pace)
- Variable update intervals (more efficient than fixed timesteps)
