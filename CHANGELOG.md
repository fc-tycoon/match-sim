# Changelog

All notable changes to FC Tycoon Match Simulator are documented in this file.

---

## [27.0.0-alpha.3] - 2025-12-02

### Added
- **Debugging Controls**: "Step 1 Tick" button for precise single-tick advancement with event count status
- **Speed Slider**: Non-linear speed control (0.1x–1200x) with discrete ranges:
  - 0.1–2.0x in 0.1 step increments
  - 3–10x in 1 step increments
  - 20–100x in 10 step increments
  - 200–1200x in 100 step increments
- **Tick Display**: Shows current tick number with tooltip in floating controls
- **Events Store Refactoring**: Typed log methods (`debug()`, `info()`, `warning()`, `error()`, `log()`) with automatic tick capture from scheduler

### Changed
- **Event Log Display**: Newest events shown first (reversed order) for better debugging flow
- **Speed Display**: Formatted speed values (e.g., "x1.5", "x100") in UI
- **Floating Controls Layout**: Centered score between team names, reorganized speed and tick controls
- **Events Store API**: Auto-captures tick from scheduler instead of accepting as parameter

### Fixed
- **Vision Cone Direction**: Corrected rotation angle for Y-flipped canvas coordinate system (was showing behind player, now shows in front)
- **Vision Cone Click Detection**: Fixed inverted dx/dy vector math in player selection
- **Player Team Detection**: Now correctly displays player's team name instead of showing "Away United" for all players

---

## [27.0.0-alpha.2] - 2025-12-02

First major update with full 3D animations, skybox, AI systems, and complete match engine.

### Added
- **Core Engine**: MatchEngine, MatchGenerator, Match, MatchState, Ball, BallPhysics, Field, Referee
- **Player Systems**: Player, PlayerBody, PlayerSkills, PlayerVision, PlayerContext, PlayerIntentions, PlayerSteering
- **Formation System**: FormationAABB, PositionSlot, PositionRole, TeamFormation, TeamTactics
- **AI Systems**: PlayerAI, AiBrainRegistry, AiPlayStates, AiPrimitives, SteeringBehaviors, Shooting behavior
- **3D Rendering**: ThreeMatchScene, ThreeRendererBase, ThreePerspectiveRenderer, ThreeOrthoRenderer
- **Player Models**: AnimatedPlayerModel (Mixamo), PrimitivePlayerModel, PlayerModelFactory
- **2D Rendering**: Canvas2DRenderer with vision cones and direction indicators
- **UI Components**: MatchSimulator page, EventLog, PlayerStats, Settings dialog
- **Stores**: assets, database, events, match, renderer, settings
- **Data**: 150+ formations, 20+ position roles, position slots database
- **Project**: 3d-assets submodule, favicon, robots.txt, stylelint config

### Removed
- `src/core/rng.ts` (replaced by Random.ts)
- `docs/2D_VS_3D.md` (merged into ARCHITECTURE.md)

---

## [27.0.0-alpha.1] - 2025-11-17

### Changed
- Deterministic seeded matches requirement (100% reproducible)

---

## [27.0.0-alpha.1] - 2025-11-16

### Added
- Full TypeScript transition
- RNG core module
- License headers on source files
- Third-party licenses documentation

### Changed
- Better TypeScript support and configuration

---

## [27.0.0-alpha.1] - 2025-11-16

### Fixed
- Minor corrections

---

## [27.0.0-alpha.1] - 2025-11-16

### Added
- Initial commit with basic project structure
