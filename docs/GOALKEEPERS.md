# Goalkeepers

## Overview

Goalkeepers are specialized players with unique behaviors, attributes, and AI logic distinct from outfield players. They protect their team's goal, using hands within the penalty area, and make critical decisions about positioning, shot-stopping, crosses, and distribution.

## Goalkeeper-Specific Attributes

### Core Attributes (1-99 Scale)

**Shot Stopping**:
- **Reflexes**: Reaction time for saves (close-range, deflections)
- **Diving**: Ability to dive and reach shots to the side
- **Handling**: Catching/parrying shots cleanly vs. spilling
- **Positioning**: Correct positioning to narrow angles and cover goal

**Aerial Ability**:
- **Aerial Reach**: Jumping height and timing for crosses
- **Aerial Handling**: Catching crosses vs. punching clear
- **Command of Area**: Confidence claiming crosses in traffic

**Distribution**:
- **Throwing**: Accuracy and distance of hand throws
- **Kicking**: Power and accuracy of goal kicks and clearances
- **Vision**: Spotting teammates for distribution (shared with outfield)

**Physical**:
- **Agility**: Speed of lateral movement, getting down low
- **Speed**: Rushing off line, closing down attackers
- **Strength**: Holding position in physical challenges

**Mental**:
- **Composure**: Performance under pressure, decision quality
- **Concentration**: Maintaining focus during low-activity periods
- **Bravery**: Willingness to come out for 1v1s, dive at feet

### Derived Attributes

**One-on-One**:
- Calculated from: Reflexes, Positioning, Bravery, Speed
- Determines success in 1v1 situations with strikers

**Cross Collection**:
- Calculated from: Aerial Reach, Aerial Handling, Command of Area, Bravery
- Determines likelihood of successfully claiming crosses

## Goalkeeper Behaviors

### Shot Stopping

When shot comes toward goal:

1. **Detect Shot**: Shot velocity vector aimed at goal
2. **Calculate Save Difficulty**:
   - Distance from goalkeeper to ball trajectory
   - Shot power/speed
   - Shot placement (corners harder than center)
   - Goalkeeper positioning
3. **Attempt Save**:
   - Probability based on: Reflexes, Diving, Positioning, Agility
   - Success: Catch (Handling high), Parry/Deflect (Handling medium), Spill (Handling low)
   - Failure: Ball enters goal
4. **Animation Selection**:
   - Dive left/right, drop to ground, jump up, standing catch

### Positioning

Goalkeeper dynamically adjusts position based on:

- **Ball Position**: Move to narrow shooting angle
- **Opponent Threat**: Advance or retreat based on attacker proximity
- **Cross Threat**: Position for potential crosses
- **Backpass**: Move to receive backpass from defender

**Positioning Logic**:
- Base position at goal center (e.g., `x = -52.5, y = 0` for Home team)
- Move forward to narrow angle when ball in attacking third: `advanceDist = (Positioning / 99) × 6m`
- Shift laterally to cover near post: `lateralShift = (ballX / fieldWidth) × 2m`

### Cross Handling

When cross is delivered:

1. **Detect Cross**: Ball trajectory passing through penalty area airborne
2. **Assess Threat**:
   - Cross height and speed
   - Opponents in area
   - Distance from goal line
3. **Decision**:
   - **Claim**: Come out and catch (Command of Area high, few opponents)
   - **Punch**: Punch ball clear (traffic in area, uncertain catch)
   - **Stay**: Remain on goal line (poor positioning, low confidence)
4. **Execution**:
   - Probability based on: Aerial Reach, Aerial Handling, Bravery
   - Success: Clean catch or punch clear
   - Failure: Miss ball, spill, weak punch

### Sweeper Keeper

Advanced goalkeepers act as "sweeper":

- **Rush Out**: Leave penalty area to intercept through balls
- **Close Down**: Quickly advance to close down 1v1 attacker
- **Off-Line Positioning**: Position higher up field when team has possession
- **Attributes**: Speed, Positioning, Composure determine sweeper effectiveness

### Distribution

After making save or receiving backpass:

1. **Scan Field**: Look for teammates (Vision attribute)
2. **Select Target**: Choose distribution target based on:
   - Teammate positioning
   - Opponent pressure
   - Tactical instruction (quick counter vs. slow build)
3. **Choose Method**:
   - **Hand Throw**: Short-medium range (15-30m), accurate
   - **Roll Out**: Very short range (5-10m), quick restart
   - **Goal Kick**: Long range (40-70m), less accurate
   - **Short Pass**: Feet distribution to nearby defender
4. **Execute**:
   - Accuracy based on: Throwing/Kicking, Vision
   - Power based on: Kicking (feet), Throwing (hands)

## Goalkeeper AI Decision Tree

### Threat Assessment

Each frame, goalkeeper AI evaluates:

1. **Immediate Threat**: Shot incoming (priority 1)
2. **Cross Threat**: Ball in air in penalty area (priority 2)
3. **1v1 Threat**: Attacker through on goal (priority 3)
4. **Positioning**: Adjust position based on ball location (priority 4)
5. **Distribution**: Ball in possession, choose outlet (priority 5)

### Decision-Making Flow

Goalkeeper AI prioritizes actions in descending order:
1. **Shot Incoming**: Execute save (dive/jump based on shot trajectory)
2. **Cross Incoming**: Assess claim/punch decision
3. **Through Ball**: Evaluate rush-out to intercept
4. **Ball Nearby**: Adjust position to narrow angle
5. **In Possession**: Select distribution target
6. **Default**: Maintain base position

## Goalkeeper States

### State Machine

Goalkeeper transitions between states:

**Idle**:
- Default state, positioned in goal
- Scanning field, ready to react
- Transitions: Shot → Diving, Cross → Claiming, Ball Near → Positioning

**Positioning**:
- Adjusting position based on ball location
- Moving to narrow angle or prepare for cross
- Transitions: Shot → Diving, Positioned → Idle

**Diving**:
- Attempting save on shot
- Animation playing (dive, jump, drop)
- Transitions: Save Made → Recovery, Goal Conceded → Conceded

**Claiming Cross**:
- Moving to intercept cross
- Jumping to catch or punch
- Transitions: Claimed → Possession, Missed → Recovery

**Rushing Out**:
- Advancing off line to close down attacker or intercept pass
- High risk, high reward
- Transitions: Ball Won → Possession, Beaten → Conceded

**In Possession**:
- Holding ball after save or claim
- Scanning for distribution target
- Transitions: Distribute → Idle, Pressured → Quick Distribution

**Recovery**:
- Getting up after dive, claim, or collision
- Temporarily vulnerable
- Transitions: Recovered → Idle

**Conceded**:
- Goal scored, goalkeeper in goal
- Brief disappointment animation
- Transitions: Kickoff → Idle

## Goalkeeper-Specific Rules

### Hand Ball (Legal for GK)

Goalkeeper can use hands when:

- **Inside Penalty Area**: GK's own penalty area only
- **Not from Backpass**: Cannot handle deliberate backpass from teammate's feet
- **Not from Throw-In**: Cannot handle ball thrown in by teammate

Illegal handball:

- **Outside Penalty Area**: GK acts as outfield player (no hands)
- **Backpass**: Direct free kick (indirect) awarded to opponent
- **Second Touch After Release**: Cannot pick up ball again without opponent touch

### Six-Second Rule

Goalkeeper cannot hold ball for more than 6 seconds:

- **Timer Starts**: When GK gains full control of ball
- **Timer Resets**: When GK releases ball or opponent touches ball
- **Violation**: Indirect free kick awarded (rarely enforced in simulation)

### Goal Kicks

Goalkeeper takes goal kick:

- **Placement**: Ball placed anywhere in goal area (6-yard box)
- **Execution**: Kick ball out of penalty area
- **Restriction**: Opponents must be outside penalty area until kick taken

## Goalkeeper Animations

### Save Animations

**Dive Left/Right**:
- Full extension dive to reach shots in corners
- Distance based on Diving attribute

**Drop to Ground**:
- Quick drop for low shots
- Speed based on Agility and Reflexes

**Jump/Tip Over**:
- Vertical jump to tip shots over crossbar
- Height based on Aerial Reach

**Standing Catch**:
- Simple catch for shots directly at goalkeeper
- Clean catch vs. parry based on Handling

### Distribution Animations

**Throw**:
- Overarm throw (bowling action)
- Distance based on Throwing attribute

**Roll**:
- Underarm roll to nearby teammate
- Quick release for fast restart

**Kick**:
- Drop kick or place kick from ground
- Power and accuracy based on Kicking

### Movement Animations

**Shuffle**:
- Side-to-side movement for positioning
- Speed based on Agility

**Sprint**:
- Forward rush for 1v1 or sweeper action
- Speed based on Speed attribute

**Dive at Feet**:
- Brave dive to smother ball at attacker's feet
- Execution based on Bravery and One-on-One

## Goalkeeper Weaknesses and Errors

### Error Probability

Goalkeepers can make mistakes:

- **Spilled Save**: Handling error, ball rebounds into play
  - Probability inversely proportional to Handling attribute
- **Misjudged Cross**: Mistime jump or miss ball entirely
  - Probability inversely proportional to Aerial Handling, Command of Area
- **Poor Distribution**: Inaccurate throw/kick to opponent
  - Probability inversely proportional to Throwing/Kicking, Vision
- **Positioning Error**: Caught out of position
  - Probability inversely proportional to Positioning, Concentration

### Pressure Effects

Opponent pressure affects GK performance:

- **Rushed Distribution**: Attacker closing down → Quick, less accurate distribution
- **Claim Under Pressure**: Opponents in area → Lower claim success rate
- **1v1 Stress**: Composure attribute determines performance under pressure

## Goalkeeper Stamina

### Stamina Depletion

Goalkeepers have lower stamina depletion than outfield players:

- **Base Depletion**: ~10-20% of outfield player rate
- **High Activity**: Increased depletion during high save volume
- **Rushing Out**: Sprinting off line depletes stamina faster

### Fatigue Effects

When fatigued (stamina < 50%):

- **Reduced Reflexes**: Slower reaction time
- **Reduced Diving**: Less distance covered on dives
- **Reduced Agility**: Slower lateral movement
- **Increased Errors**: Higher probability of mistakes

## Independent Goalkeeper AI

### Per-Goalkeeper AI Selection

Each goalkeeper can use different AI engine:

- **Team 1 Goalkeeper**: Uses AI Engine A
- **Team 2 Goalkeeper**: Uses AI Engine B
- **Substitutes**: Can use different AI engines per player

### AI Worker Interface

**Input** (sent to worker):
- Goalkeeper attributes (1-99 scale: reflexes, diving, handling, positioning, etc.)
- Goalkeeper tendencies (0.0-1.0 floats, snake_case: come_for_crosses, sweeper_keeper, etc.)
- Current position, velocity, facing direction (unit vector)
- Visible entities (opponents, teammates, ball within vision)
- Goal data (position, width, height)
- Game state (score, time, phase)

**Output** (returned from worker):
- `action` ('position' | 'dive' | 'claim' | 'rush_out' | 'distribute' | 'stay')
- `target` (target position or distribution target coordinates)
- `power` (0.0-1.0, distribution power or dive intensity)
- `direction` (movement/dive direction vector)

## Goalkeeper Training and Development

### Attribute Growth

Goalkeeper attributes improve through:

- **Match Performance**: Successful saves increase Reflexes, Diving
- **Cross Handling**: Claiming crosses improves Aerial Handling
- **Distribution**: Accurate passes improve Throwing/Kicking
- **Training**: Dedicated GK training sessions (outside match simulation)

### Age Curve

Goalkeeper performance over career:

- **Young (16-21)**: Developing attributes, inconsistent
- **Peak (26-34)**: Attributes at maximum, consistent performance
- **Veteran (35+)**: Physical decline (Agility, Speed), mental peak (Positioning, Concentration)

## Special Scenarios

### Penalty Kicks

Goalkeeper faces penalty:

1. **Positioning**: Stand on goal line, centered
2. **Guess Direction**: Randomly select dive direction (or AI prediction based on shooter tendencies)
3. **Dive**: Execute dive at moment of shot
4. **Save Probability**: 
   - Base: ~20% (realistic penalty save rate)
   - Modified by: Reflexes, Diving, Positioning, shooter's Penalty Taking

### Free Kicks

Goalkeeper organizes defense:

1. **Position Wall**: Instruct defenders to form wall
2. **Cover Goal**: Position to cover un-walled side
3. **React to Shot**: Dive/jump to save
4. **Cross Handling**: If free kick is cross, apply cross logic

### Corner Kicks

Goalkeeper prepares for corner:

1. **Positioning**: Near post or center of goal (based on Positioning attribute)
2. **Scan Area**: Track opponents in box
3. **Claim Decision**: Decide whether to come out for cross
4. **Execution**: Attempt claim or stay on line
