# Player Models

## Important

> The character ended up "recentered" because the moment we scale/modify the hips position track we're essentially rewriting the root-motion data Mixamo baked into the animation. That root motion is what keeps the origin at the feet. When you reverted to the old code (no animationOptions overrides) the original FBX hip translations were left intact, so the origin stayed correct. In short: leave the animation tracks untouched (no trackScale, no zeroing) if you want the GLB's origin to remain at the feet. Only rotate the model to stand up.

**DO NOT** use `trackScale` on the model or animation!

---

## Model Export (GLB)

NOTE: I found something interesting. If you follow most of the "AI instructions", they will tell you to hit "ctrl-A", which opens the "apply" transformation window/dialog box. If you "Apply" any of these rotations, scales or translations to the model, they basically get "absorbed" into the base model, where they all basically "reset" the model.  
If you want some of these to really apply on load, then you must NOT apply them to the model in Blender, leave them to the model loaders.  
IOW, when you load the FBX model file, there will likely be a single 90 degree rotation already set. Just hit "ctrl-A" and "absorb" that rotation. OUR world doesn't need that rotation!  
Then we have two options we might want. To LOWER the character by -0.01m, so his studs are below grand level. Looks a bit better to me personally.

NOTE: I believe I added a 90 degree rotation on Z (will be Y in THREE.js), and VERY small transform, -0.01 also on Z, to lower the studs into the ground!


### Detach "body" skin for material changes.

The current model has a material that is reused for skin (`Ch38_Body`) as well as clothing (shirt, pants, socks, etc.)
We want to separate the "skin" material from the rest, so we can tone map the skin independently.

In Blender:
1. Select the `Ch38_Body` mesh (the actual skin mesh with Mesh.003)
2. Go to the Material Properties panel (the red sphere icon in the Properties panel)
3. Click the number next to the material name (e.g., "5" if it shows Ch38_body has 5 users) - this creates a "single user copy"  
Or click the material dropdown and select "New" then copy settings
4. Rename the new material to something like `Ch38_skin` or just `Skin`
5. Leave the clothing meshes (Shirt, Shorts, Socks, Shoes) using the original Ch38_body material (or rename that to Ch38_clothing for clarity)

Result:
* Ch38_skin - Used only by the body mesh (skin, face, hands)
* Ch38_body or Ch38_clothing - Used by shirt, shorts, socks, shoes

Then in the code:

Once you re-export the GLB, the code can detect the skin material by name and apply skin tone tinting without affecting clothing. I can update the material detection to look for materials named skin:

```javascript
// Would detect material named "skin" or "Ch38_skin"
if (matName.includes('skin')) {
    pushUnique(this.skinMaterials, mat)
}
```

### Step 1: Scene Setup (Critical)

Before opening the export menu, you must fix the pivot in the Blender viewport. The export settings cannot fix a bad origin point.

1. Select your Armature (Skeleton) and Mesh.
2. Move them so the feet are standing exactly on the center grid point `(0, 0, 0)`.
3. Apply Transforms: Press `Ctrl + A` and select **All Transforms**.
4. Check: The Location values in the side panel (`N`) should all be `0` and Scale should be `1`.

### Step 2: Export Settings Checklist

Open **File → Export → glTF 2.0 (.glb)** and configure the settings as follows:

| Category | Setting | Value | Notes |
|----------|---------|-------|-------|
| **Include** | Limit to | Selected Objects | Only Mesh and Armature selected |
| | Custom Properties | ☐ Unchecked | |
| | Cameras | ☐ Unchecked | |
| | Punctual Lights | ☐ Unchecked | |
| **Transform** | +Y Up | ☑ Checked | Essential for Three.js |
| **Mesh** | Apply Modifiers | ☐ **Unchecked** | Checking breaks skinning/armature |
| | UVs | ☑ Checked | |
| | Normals | ☑ Checked | |
| | Tangents | ☐ Unchecked | Three.js calculates these |
| | Vertex Colors | ☐ Unchecked | Unless painted on mesh |
| **Shape Keys** | Shape Keys | ☐ Unchecked | Unless using blend shapes/morph targets |
| | Shape Key Normals | ☐ Unchecked | Only needed if Shape Keys enabled |
| **Skinning** | Skinning | ☑ **Checked** | Required for skeletal animation |
| | Bone Influences | 4 | Default; max bones per vertex |
| **Materials** | Materials | ☑ Checked | Export material data |
| | Export | Export | Use "Export" (not Placeholder) |
| | Images | Automatic | Let Blender decide format |
| | Image Quality | 75 | Default; good balance |
| | Create WebP | ☐ Unchecked | Not needed for game assets |
| | WebP Fallback | ☐ Unchecked | Not needed |
| | Unused Textures | ☐ Unchecked | Keeps file smaller |
| **Lighting** | Lighting | Standard | Default; ignored by Three.js anyway |
| **Armature** | Use Rest Position | ☐ Unchecked | We want the current pose |
| | Export Deformation Bones Only | ☑ **Checked** | Removes IK/control bones |
| | Flatten Bone Hierarchy | ☐ Unchecked | |
| **Animation** | Animation | ☐ **Unchecked** | Animations load from FBX separately |

### Summary

1. Fix Origin in Viewport (`Ctrl + A`)
2. Limit to Selected
3. Uncheck Apply Modifiers
4. Check Export Deformation Bones Only
5. Uncheck Animation

Export as `player.glb`

---

## Animations (FBX)

**UPDATE**: Animations stay as FBX! There was no real benefit to the FBX→GLB conversion. Read notes below.

**IMPORTANT**: Use at least 30 FPS. The 24 FPS animations created an annoying jitter/stutter effect. 30 FPS looked perfect when rendered at 60 FPS.

### Mixamo Download Settings

| Setting | Value | Reason |
|---------|-------|--------|
| Format | FBX Binary (.fbx) | Best compatibility with Three.js FBXLoader |
| FPS | 30 | Good balance of smoothness vs file size. 60 is overkill for idle animations, 24 can look choppy |
| Skin | Without Skin | You already have your character model (player.glb). Download animation data only |
| Keyframe Reduction | None | Preserves all keyframes, prevents interpolation artifacts that can cause jitter |

### Why These Settings

**FPS: 30**
- 24 FPS: Can look slightly choppy, designed for film
- 30 FPS: Standard for games, smooth enough, reasonable file size
- 60 FPS: Only needed for fast/athletic animations (sprinting, combat), doubles file size

**Without Skin**
- Your character mesh is already in player.glb
- Animation-only FBX files are much smaller
- Avoids mesh/skeleton conflicts between files

**Keyframe Reduction: None**
- "Uniform" and "Non-uniform" remove keyframes to reduce file size
- This can introduce interpolation errors that cause jitter/stuttering
- For idle animations, file size is already small, so no need to reduce

### Download Steps

1. Select your animation on Mixamo
2. Click Download
3. Format: FBX Binary (.fbx)
4. Skin: Without Skin
5. Frames per Second: 30
6. Keyframe Reduction: none

This should give you the cleanest animation data with minimal jitter.

---

## Convert to GLB (NOT NECESSARY! UNUSED! BROKEN!)

**NOTE**: I have been unsuccessful in converting and/or using GLB format animations. Whenever the animation was applied to the character, you only saw the bones, and the mesh disappeared, no matter what options or how I exported it. It was probably something to do with how the AI was applying the animation to the model, because they always seem eager to process all the nodes. So, I'm just going to use the original FBX animations, and keep the model in GLB. The reason why the model is in GLB, is because there was problem importing the FBX model, the character always lost his hair.

### If You Must Export Animation as GLB (Reference Only)

| Section | Setting | Status | Notes |
|---------|---------|--------|-------|
| Skinning | Skinning | ☑ Checked | Required for skeletal animations |
| Animation | Animation | ☑ Checked | Required |
| | Animation Mode | Actions | Correct for Mixamo |
| | Shape Keys | ☑ Checked | Good for facial animations if any |
| **Armature** | Export all Armature Actions | ☑ Checked | Ensures all animation clips export |
| | Reset Pose Bones Between Actions | ☑ Checked | Good practice |
| **Shape Keys** | Reset Shape Keys Between Actions | ☑ Checked | Good |
| **Sampling** | Sampling Rate | 1 | Correct - samples every frame |
| | Sampling Interpolation Fallback | Linear | Good |
| **Optimize** | Optimize Animation Size | ☑ Checked | Reduces file size |
| | Force Keeping Channels for Bones | ☑ Checked | Important - prevents losing bone data |
| | Force Keeping Channel for Objects | ☐ Unchecked | Fine |
| | Disable Viewport for Other Objects | ☐ Unchecked | Fine |
| **Extra** | Prepare Extra Animations | ☐ Unchecked | Fine for single animation per file |
| **Bake & Merge** | Bake All Objects Animations | ☐ Unchecked | Fine - Mixamo already baked |
| | Merge Animation | Actions | Correct |
| **Rest & Ranges** | Use Current Frame as Object Rest Transformations | ☐ Unchecked | Correct |
| | Limit to Playback Range | ☐ Unchecked | Correct - exports full animation |
| | Set All gLTF Animation Starting at 0 | ☑ Checked | Recommended - ensures animations start at frame 0 |


# Breathing Idle

Before exporting it, I set the "Character Arm-Space" to 45.
