# Player Vision & Scanning

## Real World Football Vision

In professional football, a player's awareness of their surroundings is as critical as their physical attributes. This awareness is built through two distinct types of vision:

### 1. Central (Foveal) Vision
*   **Focus**: High detail, narrow field of view (approx. 2-5 degrees).
*   **Usage**: Used for specific tasks requiring precision, such as striking the ball, tackling, or identifying a specific player's face/signal.
*   **Limitation**: You can only focus on one small thing at a time.

### 2. Peripheral Vision
*   **Focus**: Low detail, wide field of view (approx. 180 degrees).
*   **Usage**: Motion detection and spatial awareness. A player "senses" movement or shapes in their periphery without looking directly at them.
*   **Limitation**: Cannot accurately judge speed, exact distance, or identity. It provides a "fuzzy" picture of the world.

## The Art of Scanning

"Scanning" (or "checking your shoulder") is the deliberate act of momentarily moving the head to direct Central Vision towards areas of interest (teammates, opponents, space) that are currently outside the field of view.

*   **Frequency**: Elite players (like Xavi or Lampard) scan 6-8 times every 10 seconds when not in possession.
*   **Purpose**: To build and refresh a mental "snapshot" of the pitch.
*   **The "Mental Map"**: Players don't react to what they see *instantly*; they react to their mental model of the pitch, which is constantly decaying and needs refreshing via scanning.

## Simulation Implementation

Our simulation attempts to model this realistic behavior to create emergent AI mistakes and brilliance.

### The "Visible" World
Instead of giving the AI perfect knowledge of the game state (God View), each player has a `PlayerVision` system that constructs their own subjective reality.

*   **Infinite Peripheral Range**: In the real world, you can see a player 50m away if they are in your field of view. We simulate this by having an "infinite" range for detection in the peripheral cone. If you are in the cone, you are "Visible".
*   **Fuzzy Perception**: Just because a player is "Visible" doesn't mean their position is known accurately. The simulation adds "noise" to the perceived position of entities in peripheral vision. The further away and the more peripheral the target, the less accurate the position.

### The Scanning Mechanic
To resolve the "Fuzzy" perception into accurate data, the AI must perform a **Scan**.

1.  **The Action**: The AI decides to "Scan" (look around).
2.  **The Update**: This directs Central Vision towards targets.
3.  **The Result**: The "noise" is removed, and the player's mental model is updated with the accurate position and velocity of the target.
4.  **Decay**: As soon as the player looks away, the information begins to "decay" (become fuzzy) again over time.

### Decision Making
The AI makes decisions based on this *subjective* and potentially *flawed* information.
*   A player might pass to where they *think* a teammate is (based on a scan 2 seconds ago), only to find the teammate has moved.
*   A defender might miss a run made in their blind spot because they failed to scan.

This system creates natural, human-like errors and rewards players with high "Vision", "Awareness", and "Anticipation" attributes who scan more effectively.

## Attribute Mapping

The effectiveness of the vision system is driven by the player's attributes. Note that skills are rarely 1-to-1; most behaviors are a blend of multiple attributes.

### 1. The "Hardware" (Capacity to see)
*   **Scan Frequency**: Determines the cooldown between Scan Ticks. It is a weighted blend of attributes depending on the phase of play:
    *   **50% `Awareness`** (Attacking or Defensive)
    *   **30% `Anticipation`** (Attacking or Defensive)
    *   **20% `Vision`**
    *   **`Chemistry`** between players also reduces the time "cost" of scanning that teammate by a maximum of 100ms, so another scan will be available sooner.
*   **Peripheral Noise**: Reduces the "fuzziness" of the peripheral vision.
    *   **50% `Vision`**
    *   **50% `Awareness`** (Attacking or Defensive)
    *   High stats result in a clearer picture of the "corner of the eye", allowing for better passive tracking of targets.
*   **`Concentration`**:
    *   **Memory Decay**: Determines how fast the "Scanned" data reverts to "Fuzzy" data.
    *   **High Concentration**: The player remembers the exact position/vector of a scanned target for 2-3 seconds.
    *   **Low Concentration**: The data becomes stale/fuzzy after 0.5 seconds.
*   **`Chemistry` (Teammate Relationship)**:
    *   **High Chemistry**: Acts as a multiplier for `Concentration` and `Anticipation` when scanning that specific teammate.

### 2. The "Software" (What to look at)
When a Scan Tick happens, the AI must choose **ONE** target from the list of candidates in Central Vision.

*   **`Attacking Awareness`** (Phase: Possession):
    *   **Weighting Bias**: Used to prioritize targets when attacking.
    *   **High Stat**: Prioritizes teammates making forward runs, open space, or the goal.
    *   **Low Stat**: Might waste a scan on a teammate who is marked or standing still.
*   **`Defensive Awareness`** (Phase: Out of Possession):
    *   **Weighting Bias**: Used to prioritize targets when defending.
    *   **High Stat**: Prioritizes the ball carrier, opponents making blind-side runs, or dangerous passing lanes.

### 3. The "Processing" (What we understand)
Once a target is Scanned, the quality of information retrieved depends on these stats.

*   **`Anticipation` (Att/Def)**:
    *   **Intention Reading**:
        *   **High Att. Anticipation**: When scanning a teammate, you "see" their future position and detect their `Intention` (e.g., "He wants a wall pass").
        *   **High Def. Anticipation**: When scanning an opponent, you predict their next move (e.g., "He is about to cut inside").
    *   **Vector Accuracy**: Improves the accuracy of the perceived velocity vector.
*   **`Creativity` / `Flair`**:
    *   **Opportunity Unlock**: High Creativity might "unlock" complex options attached to a target (e.g., seeing a passing lane that requires a curve/trivela).
*   **`Chemistry` (Teammate Relationship)**:
    *   **Effect**: Scans are "High Quality" (instant intention reading) and have "Low Fade" (info stays accurate longer), simulating the intuitive understanding between players who know each other well.
