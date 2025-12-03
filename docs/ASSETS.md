# Asset System

## Overview

The Match Simulator uses a centralized asset system for loading and caching 3D assets (models, animations, textures). Assets are stored in a separate Git repository and included as a **Git submodule**.

**Key Features**:
- Priority-based background loading (critical → high → normal → low)
- Fallback primitives while assets load
- Animation clip management with name mapping
- Texture caching with configurable options
- Model cloning with SkeletonUtils for skinned meshes

---

## Submodule Structure

3D assets are stored in the [match-sim-assets](https://github.com/fc-tycoon/match-sim-assets) repository, mounted at `assets/3d-assets/`.

```
assets/3d-assets/
├── manifest.json           # Asset registry (required)
├── README.md               # Asset repository documentation
├── LICENSE.md              # Asset license terms
│
├── models/
│   ├── player.glb          # Player character model
│   ├── ball.glb            # Football/soccer ball
│   └── stadium1.glb        # Stadium environment
│
├── animations/
│   ├── Breathing Idle.fbx  # Idle animation
│   ├── Walking.fbx         # Walking animation
│   ├── Jog Forward.fbx     # Jogging animation
│   └── *.fbx               # ~90 Mixamo animations
│
├── textures/
│   └── grass_m.jpg         # Field grass texture
│
└── skybox/
    └── *.jpg               # Environment map
```

### Git LFS

Large binary files (GLB, FBX, JPG) are stored with **Git LFS**. Ensure it's installed:

```bash
# Install Git LFS (one-time per machine)
git lfs install

# Pull LFS files if models appear as placeholders
git lfs pull
```

### Submodule Commands

```bash
# Clone with submodules (recommended)
git clone --recurse-submodules https://github.com/fc-tycoon/match-sim.git

# Initialize submodule after clone
git submodule update --init --recursive

# Update submodule to latest
git submodule update --recursive --remote
```

---

## Asset Manifest

The `manifest.json` file defines all assets with their metadata:

```json
{
  "version": "1.3.0",
  "basePath": "/3d-assets",
  "assets": [
    {
      "key": "player",
      "path": "/models/player.glb",
      "category": "model",
      "priority": "critical",
      "fallback": "capsule",
      "scale": 1.8,
      "materials": {
        "maxMetalness": 0.3,
        "minRoughness": 0.6,
        "castShadow": true
      }
    },
    {
      "key": "anim-breathing-idle",
      "path": "/animations/Breathing Idle.fbx",
      "category": "animation",
      "priority": "high",
      "target": "player"
    }
  ]
}
```

### Asset Definition Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | string | ✓ | Unique identifier for programmatic access |
| `path` | string | ✓ | File path relative to `basePath` |
| `category` | string | ✓ | `model`, `animation`, `texture`, or `prop` |
| `priority` | string | ✓ | Loading priority: `critical`, `high`, `normal`, `low` |
| `fallback` | string | | Primitive type if asset unavailable: `capsule`, `sphere`, `box` |
| `target` | string | | For animations: which model this animation targets |
| `scale` | number | | Scale multiplier (default 1.0) |
| `yOffset` | number | | Y-axis offset in model units |
| `rotation` | object | | Rotation in degrees: `{ x, y, z }` |
| `materials` | object | | Material overrides (see below) |
| `metadata` | object | | Additional data (bone names, etc.) |
| `description` | string | | Human-readable description |

### Material Overrides

```json
{
  "materials": {
    "maxMetalness": 0.3,
    "minRoughness": 0.6,
    "emissiveMultiplier": 0.15,
    "color": 16777215,
    "colorMultiplier": 0.8,
    "castShadow": true,
    "receiveShadow": false
  }
}
```

---

## Loading Priorities

Assets are loaded in priority order, allowing critical game elements to appear first:

| Priority | Examples | Use Case |
|----------|----------|----------|
| **critical** | Ball, Player model | Required for basic gameplay |
| **high** | Core animations (idle, walk) | Needed immediately after models |
| **normal** | Common props | General gameplay elements |
| **low** | Stadium, decorations | Background/environment |

All assets begin loading simultaneously, but are queued by priority. On slower connections, critical assets complete first.

---

## Asset Store API

The asset store (`src/store/assets.ts`) provides the main interface for asset management.

### Initialization

```typescript
import assets from '@/store/assets'

// Start background loading (non-blocking)
await assets.startBackgroundLoad((loaded, total, current) => {
  console.log(`Loading ${current}... (${loaded}/${total})`)
})

// Check if all assets are loaded
if (assets.state.allReady) {
  // Safe to use all assets
}
```

### Checking Asset State

```typescript
// Check if specific asset is loaded
if (assets.isLoaded('player')) {
  // Asset ready to use
}

// Check if critical assets are ready
if (assets.areCriticalAssetsLoaded()) {
  // Can start basic rendering
}

// Get loading progress
const { loadedCount, totalCount, progress } = assets.state
```

### Getting Models

```typescript
// Clone a model (creates independent instance with shared geometry)
const playerModel = assets.cloneModel('player')
if (playerModel) {
  scene.add(playerModel)
}

// Get fallback primitive if model not loaded
const primitive = assets.getOrCreatePrimitive('player')
// Returns capsule placeholder
```

### Getting Animations

```typescript
// Get animation clip by asset key
const idleClip = assets.getAnimation('anim-breathing-idle')
if (idleClip) {
  const action = mixer.clipAction(idleClip)
  action.play()
}

// Get all animations for a model
const playerAnims = assets.getAnimationsForModel('player')
// Returns Map<string, THREE.AnimationClip>
```

### Getting Textures

```typescript
// Load texture with options
const grassTexture = await assets.loadTexture('grass-texture', {
  wrapS: THREE.RepeatWrapping,
  wrapT: THREE.RepeatWrapping,
  repeat: { x: 10, y: 10 },
  anisotropy: 16
})
```

---

## Animation System

### Animation Categories

Animations are stored as FBX files (Mixamo format) and mapped to internal names:

| Asset Key | Internal Name | Description |
|-----------|---------------|-------------|
| `anim-breathing-idle` | `breathing-idle` | Default idle stance |
| `anim-walking` | `walking` | Walking forward |
| `anim-standard-walk` | `standard-walk` | Alternative walk |
| `anim-jog-forward` | `jog-forward` | Jogging forward |
| `anim-jog-backward` | `jog-backward` | Jogging backward |
| `anim-jog-strafe-left` | `jog-strafe-left` | Lateral jog left |
| `anim-jog-strafe-right` | `jog-strafe-right` | Lateral jog right |
| `anim-kick` | `kick` | Kicking motion |
| `anim-header` | `header` | Heading motion |
| `anim-tackle` | `tackle` | Tackling motion |
| `anim-goalkeeper-idle` | `goalkeeper-idle` | GK idle stance |
| `anim-goalkeeper-dive` | `goalkeeper-dive` | GK diving save |

### Animation Loading in Player Models

```typescript
// AnimatedPlayerModel.ts
private loadAnimations(): void {
  const animationMappings: Array<[string, PlayerAnimationName]> = [
    ['anim-breathing-idle', 'breathing-idle'],
    ['anim-walking', 'walking'],
    ['anim-jog-forward', 'jog-forward'],
    // ...
  ]

  for (const [assetKey, animName] of animationMappings) {
    const clip = assets.getAnimation(assetKey)
    if (clip) {
      clip.name = animName
      this.animationClips.set(animName, clip)
    }
  }
}
```

### Animation Fallbacks

If a requested animation isn't available, the system uses fallbacks:

```typescript
const fallbackChains: Record<string, string[]> = {
  'walking': ['standard-walk', 'jog-forward', 'breathing-idle'],
  'standard-walk': ['walking', 'jog-forward', 'breathing-idle'],
  'idle': ['breathing-idle'],
}
```

### Playing Animations

```typescript
// Immediate switch
model.setAnimation('walking', { loop: true })

// Crossfade transition (smooth blend)
model.crossFadeTo('breathing-idle', 0.25, { loop: true })

// Stop all animations
model.stopAnimation()
```

---

## Caching Strategy

### Model Caching

- **GLTF/GLB**: Loaded once, cloned via `SkeletonUtils.clone()` for each instance
- **Cloning**: Creates independent Object3D with shared geometry/materials
- **Skinned Meshes**: Properly cloned with skeleton binding

### Animation Caching

- **FBX clips**: Stored by asset key in cache
- **Shared clips**: Multiple models can reference same clip
- **Mixer per model**: Each model has its own AnimationMixer

### Texture Caching

- **By path**: Textures cached by file path
- **Configurable**: Wrap modes, filtering, anisotropy per texture
- **Color space**: Automatic sRGB for color textures

---

## Fallback Primitives

When models haven't loaded yet, fallback primitives provide visual placeholders:

| Primitive | Use Case | Geometry |
|-----------|----------|----------|
| `capsule` | Players | CapsuleGeometry (radius 0.3, height 1.8) |
| `sphere` | Ball | SphereGeometry (radius 0.11) |
| `box` | Generic | BoxGeometry (1×1×1) |

Primitives are marked with `userData.isPlaceholder = true` for identification.

---

## File Formats

| Type | Format | Notes |
|------|--------|-------|
| **Models** | GLB | Binary glTF, optimized for web |
| **Animations** | FBX | Better clip support than GLB for Mixamo |
| **Textures** | JPG/PNG | Standard formats, JPG for photos |
| **Source** | .blend | Blender project files (not loaded at runtime) |

### Why FBX for Animations?

- Mixamo exports animations as FBX with proper naming
- GLB animations often have generic clip names
- FBX preserves bone naming conventions
- Separate animation files allow selective loading

### Why GLB for Models?

- Binary format (smaller than glTF)
- Single file (no external dependencies)
- Includes textures embedded
- Wide Three.js support

---

## Adding New Assets

1. **Add file** to appropriate folder in `assets/3d-assets/`

2. **Update manifest.json**:
   ```json
   {
     "key": "anim-new-animation",
     "path": "/animations/New Animation.fbx",
     "category": "animation",
     "priority": "low",
     "target": "player"
   }
   ```

3. **For animations**, add mapping in `AnimatedPlayerModel.ts`:
   ```typescript
   const animationMappings = [
     // ...existing mappings
     ['anim-new-animation', 'new-animation'],
   ]
   ```

4. **Update PlayerAnimationName type** in `PlayerModelBase.ts`:
   ```typescript
   export type PlayerAnimationName =
     | 'breathing-idle'
     | 'walking'
     | 'new-animation'  // Add new name
     // ...
   ```

5. **Commit submodule changes**:
   ```bash
   cd assets/3d-assets
   git add .
   git commit -m "Add new animation"
   git push
   cd ../..
   git add assets/3d-assets
   git commit -m "Update assets submodule"
   ```

---

## Performance Considerations

### Loading Strategy

- **Parallel loading**: All assets load simultaneously
- **Priority queuing**: Critical assets queued first
- **Progressive rendering**: Scene usable before all assets load

### Memory Management

- **Shared geometry**: Cloned models share geometry data
- **Texture atlasing**: Consider for many small textures
- **Dispose unused**: Call `model.dispose()` when removing

### Animation Performance

- **Mixer updates**: Single `mixer.update(delta)` per frame
- **Action pooling**: Reuse AnimationActions when possible
- **Crossfade cleanup**: Old actions automatically clean up

---

## Troubleshooting

### Models Appear as Capsules/Spheres

1. Check Git LFS is installed: `git lfs install`
2. Pull LFS files: `git lfs pull`
3. Check browser console for loading errors
4. Verify file exists in `assets/3d-assets/models/`

### Animations Not Playing (T-Pose)

1. Check animation is in manifest.json
2. Verify asset key matches: `anim-` prefix required
3. Check console for "Animation not found" warnings
4. Ensure `target` matches model key

### Textures Not Loading

1. Check file path in manifest
2. Verify texture file exists
3. Check browser console for 404 errors
4. Ensure proper color space (sRGB for colors)

### Submodule Not Initialized

```bash
# Initialize and update submodule
git submodule update --init --recursive

# If submodule folder is empty
rm -rf assets/3d-assets
git submodule update --init --recursive
```
