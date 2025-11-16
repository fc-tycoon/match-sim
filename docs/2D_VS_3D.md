# Rendering Modes (2D and 3D)

## Summary

The simulation (physics, AI, rules) is identical across views. We present it with three renderer modes:
- 2D Canvas (pure HTML Canvas 2D)
- 3D Orthographic (Three.js + WebGPU, top-down, no perspective)
- 3D Perspective (Three.js + WebGPU, moveable cameras)

Chosen stack only: HTML Canvas 2D and Three.js with WebGPU (fallback to WebGL2).

## Shared Principles

- Decoupled from simulation: renderer consumes position/state snapshots and never drives gameplay
- Dynamic scheduling: simulation updates occur at variable intervals (ball 5-20ms, players 10-50ms, AI 30-200ms)
- Viewer interpolation: render at display refresh; interpolate between past snapshots; do not extrapolate
- Single 3D coordinate system (world XYZ); team-relative transforms handled elsewhere
- Same debug mindset across modes (optional overlays for development)

## Mode 1 - 2D Canvas (Pure 2D)

What we want from 2D:
- Top-down tactical view with maximum clarity and performance
- Procedural field layout: touchlines, goal lines, penalty boxes, center circle/spot, halfway line
- Players as simple circles/icons; ball as a circle with optional height cue (size/alpha), no 3D assets
- Clean indicators when needed: possession highlight, velocity arrows, minimal labels
- Camera behavior: fixed full-pitch or follow-ball; pan/zoom as needed
- Target performance: very high (120+ FPS typical on modest hardware)

Primary uses:
- Tactics, analysis, quick iteration, low-power devices

## Mode 2 - 3D Orthographic (Three.js)

What we want from 3D Orthographic:
- Top-down orthographic camera for the same tactical clarity as 2D, but with 3D assets
- GPU-accelerated field, ball, and players (meshes/materials), no perspective distortion
- Fixed overhead or follow-ball camera; simple transitions
- Optional debug overlays rendered in screen space or world space
- Target performance: stable 60 FPS on typical devices

Primary uses:
- Tactical view with enhanced readability and presentation (3D models, shadows, textures) without perspective scaling

## Mode 3 - 3D Perspective (Three.js)

What we want from 3D Perspective:
- Immersive camera modes: broadcast, behind-goal, player-cam, tactical high-angle, free-cam
- Full 3D depth with lighting/shadows/textures; camera can move around the scene
- Also serves as the Ball Physics sandbox: visualize trajectories, spin, Magnus/bounce behavior, slow-motion, frame-step
- Optional debug overlays: trajectory prediction, velocity/spin vectors, contact markers
- Target performance: 60 FPS on capable hardware (graceful degradation on lower-end)

Primary uses:
- Match viewing with depth and motion; physics testing and visual analysis

## Hybrid Overlay (Optional)

- 2D HUD/overlay (names, arrows, minimap) composited over either 3D mode when useful

## Interpolation & Timing

- Simulation emits time-stamped snapshots at variable intervals (see EVENT_SCHEDULER.md)
- Renderer computes alpha from wall-clock time between previous/current snapshots
- Interpolate positions/orientations; clamp alpha to avoid stepping into the future

## Settings (High Level)

- mode: '2d_canvas' | '3d_orthographic' | '3d_perspective'
- quality (3D only): 'low' | 'medium' | 'high' | 'ultra'
- toggles (3D only): shadows, antialiasing, particles, motionBlur
- cameraMode (3D Perspective): 'broadcast' | 'behind_goal' | 'player_cam' | 'tactical' | 'free' | 'physics_test'

## Scope Notes

- Keep this document HIGH LEVEL: no implementation code, no alternative engines
- Further technical details (coordinates, scheduler, physics) live in their dedicated documents
