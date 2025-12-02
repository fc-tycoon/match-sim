# AI Architecture: Hybrid System

## Overview

The Match Simulator uses a **Hybrid AI Architecture** that combines three distinct AI patterns to create realistic, performant, and intelligent player behavior.

1.  **HFSM (Hierarchical Finite State Machine)**: Manages high-level "Modes" (e.g., Attacking vs. Defending).
2.  **Utility AI**: Handles fuzzy decision-making (e.g., "Should I pass, shoot, or dribble?").
3.  **Behavior Trees (BT)**: Executes specific logic sequences (e.g., "Check range -> Wind up -> Shoot").

This architecture separates **Data** (The Context) from **Logic** (The Brain Stem), allowing for a zero-allocation runtime that is highly performant in JavaScript/TypeScript.

### Design Constraints & Principles

The architecture was shaped by strict technical requirements to ensure the simulation runs smoothly in a browser environment:

1.  **High Performance**: The AI must support 22 agents updating every tick without dropping frames.
2.  **Zero Allocations (No GC Thrashing)**:
    *   We avoid creating new objects (like `new Node`, `new Option`, or `new Task`) during the update loop.
    *   Garbage Collection pauses are fatal to simulation smoothness.
    *   *Solution*: The Tree is built once. The Context is reused.
3.  **Encapsulated State Management**:
    *   Nodes must be **Stateless** to be shared.
    *   All state, including traditional HFSM modes and BT `RUNNING` status, lives in `PlayerContext`.
    *   This allows the Logic (BrainStem) to be pure and functional.
4.  **V8 Optimization (JIT Friendly)**:
    *   By using `Object.freeze()` on the Node Tree, we signal to the V8 engine that the object shapes are stable.
    *   This allows aggressive JIT optimization and inline caching for faster execution.

---

## 1. The Context: PlayerContext

The `PlayerContext` class acts as the "Mind" of the player. It is a pure data container that holds the player's subjective view of the world. It is passed down through the AI tree during execution.

**Key Components:**
*   **Self**: Reference to the `Player` entity.
*   **Memory**: The `PlayerMemory` containing `PerceivedPlayer` and `PerceivedBall` data (imperfect information).
*   **Match Context**: Reference to `MatchState` (time, score, phase).
*   **Team Context**: Reference to `TeamState` (tactics, possession).

```typescript
// src/core/PlayerContext.ts
export class PlayerContext {
    player: Player
    memory: PlayerMemory
    match: MatchState
    team: TeamState
    // ...
}
```

---

## 2. The Engine: BrainStem & AiPrimitives

The `BrainStem` class is the wrapper around the **Node System**. It is responsible for traversing the decision tree and executing the logic.

### Node System
All AI components inherit from a lightweight `Node` class defined in `src/core/ai/AiPrimitives.ts`.

```typescript
abstract class Node {
    execute(ctx: PlayerContext): boolean
}
```

### Immutability & Performance
The tree is **Stateless** and **Immutable**.
*   **Stateless**: The `PlayerContext` is passed down the tree. The nodes themselves store no state about the player.
*   **Immutable**: Once the tree is constructed, it is deeply frozen (`Object.freeze`). This ensures that no nodes modify the tree at runtime (Flyweight Pattern).

---

## 3. The Three Layers

### Layer 1: HFSM (High-Level States)
**Purpose**: Context Switching.
Players behave completely differently depending on the phase of play. We use **State Nodes** to switch between these modes efficiently.

*   **Stoppage**: Waiting for kick-off, throw-in, etc.
*   **Attacking**: Team has possession. Focus on finding space, supporting, scoring.
*   **Defending**: Opponent has possession. Focus on marking, pressing, intercepting.

**Implementation**:
A `State` node acts like a Selector but has a **Guard Condition**. If the condition is false, it exits immediately.

```typescript
new State("Attacking", (ctx) => ctx.team.hasPossession, [ ...children ])
```

### Layer 2: Utility AI (The "Brain")
**Purpose**: Fuzzy Decision Making.
In complex situations (like having the ball), there is no single "right" answer. Utility AI scores multiple options and picks the best one based on the current context.

**The "Commitment" Concept**:
Unlike a simple Behavior Tree that might fail instantly, Utility AI selects a **Goal** (e.g., "Score Goal") rather than an **Action** (e.g., "Shoot").

*   **Goal**: "Score Goal" (High Utility Score because we are a Striker near the box).
*   **Execution**: The Behavior Tree for "Score Goal" is smart. It knows:
    1.  If I can shoot -> Shoot.
    2.  If I'm too far -> Move Closer (Dribble).
    3.  If I'm blocked -> Move Sideways (Dribble).

Because the **Utility Score** for "Score Goal" remains high even if we are 30m away, the AI stays "committed" to this goal. It doesn't switch to "Pass" just because it can't shoot *right now*. It actively works to make the shot possible.

**Implementation**:
A `UtilitySelector` evaluates the `.score()` of all its children and executes the winner.

```typescript
new UtilitySelector("AttackOptions", [
    new Option("ScoreGoal", scoreGoalFn, ScoreGoalBehavior), // Score: 0.8
    new Option("Pass", scorePassFn, PassBehavior),           // Score: 0.4
])
// Result: Executes "ScoreGoalBehavior" (which might involve dribbling first)
```

### Layer 3: Behavior Trees (The "Body")
**Purpose**: Execution & Logic Flow.
Once a decision is made (e.g., "Pass"), we need to execute a sequence of checks and actions. Behavior Trees (Selectors and Sequences) are perfect for this.

*   **Selector**: Priority List (Try A, if fail, Try B).
*   **Sequence**: Checklist (Do A, then B, then C).
*   **Guard**: Conditional execution (If A, then B).

```typescript
new Sequence("ExecutePass", [
    new Condition("HasLineOfSight", ...),
    new Action("FaceTarget", ...),
    new Action("KickBall", ...)
])
```

---

## 4. Debugging

The AI system includes a built-in debugging system that can be enabled per-player via the `ctx.ai.debug` flag.

When enabled, the AI nodes will log their execution flow to the console:
*   **Selectors/Sequences**: Log success/failure of children.
*   **Utility Selectors**: Log the score of each option and the final selection.
*   **States**: Log when a state becomes active.
*   **Conditions**: Log the result of the check.
*   **Actions**: Log when an action is executed.

```typescript
// Enable debugging for a specific player
playerContext.ai.debug = true;
```

---

## 5. The Three-Layer Architecture

To ensure smooth movement and separation of concerns, the system is divided into three distinct layers:

### Layer 1: AI Layer (The Brain)
*   **Frequency**: Low (e.g., 5Hz - 10Hz)
*   **Responsibility**: Decision Making.
*   **Output**: Sets a **Functional Intention** in the `PlayerContext`.
*   **Example**: "I see space ahead. I will `DRIBBLE` to `(50, 20)`."

### Layer 2: Steering Layer (The Motor System)
*   **Frequency**: High (60Hz - Frame Rate)
*   **Responsibility**: Calculating Forces.
*   **Input**: Reads the current `Intention`.
*   **Logic**: Uses steering behaviors (Seek, Arrive, Pursue) to calculate the desired acceleration. Handles smoothing and blending.
*   **Output**: `SteeringOutput` (Linear Acceleration, Angular Acceleration).
*   **Example**: "To get to `(50, 20)` from here, I need to accelerate vector `(1.2, 0.5)`."

### Layer 3: Physics Layer (The Body)
*   **Frequency**: High (60Hz - Fixed Time Step)
*   **Responsibility**: Integration & Collision.
*   **Input**: `SteeringOutput` (Forces).
*   **Logic**: Applies forces to velocity, updates position, resolves collisions with other players/ball.
*   **Output**: New Position and Velocity.
*   **Example**: "Applying force. New velocity is `5.1m/s`. Collision check passed. New position is `(45.1, 10.2)`."

---

## 6. Functional Intentions

---

## 6. Versioning & Registry

The system supports multiple AI versions running simultaneously (e.g., for A/B testing or replay determinism).

*   **BrainStem**: The wrapper class containing the version string and the root node.
*   **BrainRegistry**: A factory that returns the correct `BrainStem` instance based on a version string.
*   **Implementations**: Located in `src/core/ai/brains/` (e.g., `v1.ts`).

```typescript
// Loading a specific AI version
const brain = getBrainVersion("1.0.0");
brain.update(playerContext);
```

## 7. Advantages

1.  **Flexibility (The "Holy Grail")**:
    *   **Best of All Worlds**: This system is the perfect balance between three powerful AI paradigms.
    *   **HFSM Structure**: Provides clear, high-level context switching (Attacking vs. Defending) so players don't try to shoot while they should be marking.
    *   **Utility Nuance**: Enables fuzzy, "human-like" decision making where there is no single right answer (e.g., "Pass vs. Dribble").
    *   **Behavior Tree Execution**: Offers modular, reusable logic blocks for executing complex sequences.
    *   This hybrid approach eliminates the weaknesses of each individual system (e.g., HFSM spaghetti code, BT rigidity) while keeping their strengths.

2.  **Performance**:
    *   **Zero Allocation**: The tree is built once and frozen. No garbage collection spikes during matches.
    *   **Stateless**: A single tree instance can drive 22 players simultaneously, saving memory.

3.  **Realism**:
    *   Utility AI allows players to make "sub-optimal" but realistic choices based on their traits (e.g., a selfish striker shooting instead of passing).
    *   The "Commitment" system prevents jittery behavior.

4.  **Modularity & Scalability**:
    *   New behaviors are just new Nodes.

## 8. Examples

### Example 1: Simple Attacker Logic
A basic striker logic that checks if they can shoot, otherwise tries to get closer.

```typescript
new Selector("StrikerLogic", [
    // Priority 1: Shoot if possible
    new Sequence("AttemptShot", [
        new Condition("InRange", ctx => ctx.memory.distToGoal < 20),
        new Condition("OpenAngle", ctx => ctx.memory.shotAngle > 0.5),
        new Action("Shoot", ctx => ctx.player.intentions.shoot())
    ]),
    // Priority 2: Dribble closer
    new Action("DribbleToGoal", ctx => ctx.player.intentions.dribble(ctx.match.goalPos))
])
```

### Example 2: Utility Decision (Pass vs Dribble)
Using the Utility system to decide the best course of action based on the situation.

```typescript
new UtilitySelector("BallCarrierOptions", [
    // Option 1: Pass (Score based on teammate openness)
    new Option("Pass", 
        ctx => calculatePassScore(ctx), 
        new Action("ExecutePass", ctx => ctx.player.intentions.pass(bestTeammate))
    ),
    // Option 2: Dribble (Score based on space ahead)
    new Option("Dribble", 
        ctx => calculateDribbleScore(ctx), 
        new Action("ExecuteDribble", ctx => ctx.player.intentions.dribble(spaceAhead))
    )
])
```
