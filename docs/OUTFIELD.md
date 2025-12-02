# Outfield Players

## Overview

Outfield players are the 10 non-goalkeeper players on each team. They perform a wide variety of actions including movement, passing, shooting, dribbling, tackling, and positioning. Outfield player AI is more complex than goalkeeper AI due to the diversity of roles, situations, and tactical contexts.

## Outfield Player Attributes

### Physical Attributes (1-99 Scale)

**Speed and Movement**:
- **Pace**: Maximum running speed
- **Acceleration**: Rate of speed increase (0 to max speed)
- **Agility**: Change of direction speed, turning radius
- **Balance**: Resistance to being knocked off ball, stability

**Strength and Endurance**:
- **Strength**: Physical power in challenges and shielding ball
- **Stamina**: Endurance, resistance to fatigue
- **Jumping**: Vertical leap height for headers

### Technical Attributes

**Ball Control**:
- **First Touch**: Quality of initial ball control
- **Dribbling**: Close ball control while running
- **Ball Control**: General ability to manipulate ball

**Passing**:
- **Short Passing**: Accuracy of passes under 20m
- **Long Passing**: Accuracy of passes over 20m
- **Crossing**: Accuracy of crosses from wide areas
- **Vision**: Ability to spot passing opportunities

**Shooting**:
- **Finishing**: Accuracy and power of shots on goal
- **Shot Power**: Maximum shot velocity
- **Long Shots**: Accuracy from outside penalty area
- **Volleys**: Shooting technique for airborne balls
- **Penalties**: Penalty kick accuracy

**Defensive**:
- **Tackling**: Success rate of challenges for ball
- **Marking**: Staying close to assigned opponent
- **Interceptions**: Reading play and intercepting passes
- **Heading**: Winning aerial duels
- **Positioning**: Defensive positioning and awareness

### Mental Attributes

**Decision Making**:
- **Decisions**: Quality of action selection (pass vs. dribble vs. shoot)
- **Composure**: Performance under pressure
- **Concentration**: Maintaining focus throughout match
- **Anticipation**: Predicting opponent actions and ball movement

**Tactical**:
- **Teamwork**: Following tactical instructions, supporting teammates
- **Work Rate**: Willingness to track back and press
- **Off the Ball**: Movement to create space and opportunities
- **Aggression**: Intensity in challenges (can lead to fouls)

### Hidden/Derived Attributes

**Weak Foot**:
- Proficiency using non-dominant foot (1-5 stars)
- Affects passing and shooting accuracy with weak foot

**Skill Moves**:
- Repertoire of dribbling tricks (1-5 stars)
- Higher rating = more elaborate dribbling moves

**Preferred Foot**:
- Left, Right, or Both (ambidextrous)

## Outfield Player Roles

### Role System (Not Preset Positions)

Players do NOT have preset positions like "Center Defender" or "Right Back". Instead, they have:

1. **Formation Assignment**: Tactical position in current formation (e.g., "left center back in 4-4-2")
2. **Playing Style**: Preferred style of play (aggressive, defensive, creative, etc.)
3. **Role Weights**: Weights assigned to different roles determining behavior tendencies

**Example Role Weights**:
- `defend: 0.8` - Defensive duties (high for defenders)
- `attack: 0.3` - Attacking duties (low for defenders)
- `createChances: 0.4` - Playmaking, passing
- `dribble: 0.2` - Carrying ball forward
- `press: 0.6` - Pressing opponent with ball
- `supportPlay: 0.7` - Off-ball movement to support teammates

These weights combine with:
- **Formation Position**: Defines starting position and general area
- **Attributes**: Determine execution quality
- **Game State**: Current score, time, opponent tactics

To produce emergent behaviors that adapt to match context.

### Common Emergent Roles

Based on formation, attributes, and weights, players naturally adopt roles:

**Defensive Roles**:
- **Ball-Winner**: High Tackling, Aggression, Stamina (high defend, press weights)
- **Covering Defender**: High Positioning, Anticipation, Pace (high defend, low press weights)
- **Ball-Playing Defender**: High Short Passing, Vision, Composure (high defend, createChances weights)

**Midfield Roles**:
- **Playmaker**: High Vision, Short Passing, Decisions (high createChances weight)
- **Box-to-Box**: High Stamina, Work Rate, Teamwork (balanced weights)
- **Destroyer**: High Tackling, Aggression, Positioning (high defend, press weights)
- **Wide Midfielder**: High Crossing, Pace, Dribbling (high attack, support weights)

**Attacking Roles**:
- **Target Player**: High Jumping, Strength, Heading (high attack weight)
- **Poacher**: High Finishing, Anticipation, Off the Ball (high attack, low createChances)
- **Creator**: High Vision, Crossing, Dribbling (high createChances, attack weights)
- **Pace Merchant**: High Pace, Acceleration, Dribbling (high attack, dribble weights)

## Outfield AI Decision Making

### Decision Tree Structure

Each frame, outfield AI evaluates current situation:

1. **Assess Possession**: Do I have ball, teammate has ball, or opponent has ball?
2. **Evaluate Options**: What actions are available?
3. **Calculate Probabilities**: For each action, calculate success probability
4. **Select Action**: Choose action based on probabilities and tactical context
5. **Execute Action**: Perform selected action with attribute-based outcome

### Possession States

**Player In Possession**:
- Options: Pass, Shoot, Dribble, Shield, Cross
- Evaluation: Scan for teammates, assess shooting angle, check pressure
- Selection: Weighted by role, attributes, tactical instructions

**Teammate In Possession**:
- Options: Move into space, make run, provide support, mark opponent
- Evaluation: Where is ball, where are teammates, where are opponents
- Selection: Based on Off the Ball, Teamwork, role weights

**Opponent In Possession**:
- Options: Press ball carrier, mark opponent, cover space, intercept passing lane
- Evaluation: Ball location, opponent threat, defensive shape
- Selection: Based on Positioning, Marking, Tackling, role weights

### Probability-Based Actions

Each action has success probability based on relevant attributes:

**Pass Accuracy Formula**:
- Base attribute: Short Passing (< 20m) or Long Passing (≥ 20m)
- Base probability: `attribute / 99`
- Distance modifier: `1.0 - (distance / 100) × 0.5` (longer = harder)
- Pressure modifier: `1.0 - (pressure / 99) × 0.3` (more pressure = harder)
- Fatigue modifier: `stamina / 100` (lower stamina = harder)
- Final probability: `baseProbability × distanceMod × pressureMod × fatigueMod`

AI executes pass if probability > random threshold or best available option

## Outfield Player Actions

### Movement

**Running**:
- **Max Speed**: Based on Pace attribute
- **Acceleration**: Based on Acceleration attribute
- **Direction Change**: Based on Agility attribute
- **Stamina Depletion**: Running depletes stamina

**Sprinting**:
- **Burst Speed**: 1.3-1.5× normal pace
- **Limited Duration**: Can only sprint for short periods
- **High Stamina Cost**: Depletes stamina 3-5× faster
- **Recovery**: Brief cooldown after sprint ends

**Jogging**:
- **Slower Speed**: 0.6-0.8× normal pace
- **Stamina Recovery**: Minimal stamina depletion, slight recovery
- **Positioning**: Used when repositioning without urgency

### Passing

**Short Pass** (< 20m):
- **Accuracy**: Based on Short Passing attribute
- **Power**: Moderate (enough to reach target quickly)
- **Execution Time**: Fast (0.5-1.0 seconds)
- **Best Use**: Building play, safe possession

**Long Pass** (> 20m):
- **Accuracy**: Based on Long Passing attribute
- **Power**: High (ball travels distance quickly)
- **Execution Time**: Moderate (1.0-1.5 seconds)
- **Best Use**: Switching play, long balls to attackers

**Through Ball**:
- **Accuracy**: Based on Short/Long Passing + Vision
- **Timing**: Must weight pass to reach running teammate
- **Execution**: Requires anticipation of teammate movement
- **Best Use**: Breaking defensive lines

**Cross**:
- **Accuracy**: Based on Crossing attribute
- **Target**: Area in penalty box or specific teammate
- **Height**: Varied (low driven, floated, high ball)
- **Best Use**: Wide positions attacking goal

### Shooting

**Standard Shot**:
- **Accuracy**: Based on Finishing attribute
- **Power**: Based on Shot Power attribute
- **Placement**: Aim for corners or specific areas
- **Best Use**: Clear sight of goal

**Long Shot** (Outside penalty area):
- **Accuracy**: Based on Long Shots attribute
- **Power**: High Shot Power required
- **Difficulty**: Lower success rate than close-range
- **Best Use**: When no better option available

**Volley**:
- **Accuracy**: Based on Volleys attribute
- **Timing**: Must connect cleanly with airborne ball
- **Difficulty**: Higher complexity than standard shot
- **Best Use**: Crosses, bouncing balls

**Header**:
- **Accuracy**: Based on Heading attribute
- **Power**: Based on Jumping + Strength
- **Timing**: Jump timing critical
- **Best Use**: Crosses, set pieces

### Dribbling

**Close Control Dribbling**:
- **Speed**: Reduced movement speed (0.7-0.8× pace)
- **Control**: Ball stays close to player (0.5-1.0m)
- **Attribute**: Based on Dribbling attribute
- **Best Use**: Tight spaces, under pressure

**Sprint Dribbling**:
- **Speed**: Near full sprint speed
- **Control**: Ball pushed further ahead (1.5-2.5m)
- **Risk**: Easier for defenders to intercept
- **Best Use**: Open space, counter-attacks

**Skill Moves**:
- **Execution**: Based on Skill Moves rating (1-5 stars)
- **Effect**: Beat defender with feint, turn, or trick
- **Success**: Based on Dribbling + Agility vs. defender's Tackling
- **Best Use**: 1v1 situations

### Defending

**Tackling**:
- **Success**: Based on Tackling attribute vs. opponent's Dribbling
- **Result**: Win ball, foul, or miss tackle
- **Risk**: Mistimed tackle = foul or beaten defender
- **Best Use**: When close to opponent with ball

**Interception**:
- **Success**: Based on Interceptions + Anticipation
- **Positioning**: Must be in passing lane
- **Timing**: Read pass and react
- **Best Use**: Cutting out opponent passes

**Marking**:
- **Execution**: Stay close to assigned opponent (1-3m)
- **Tightness**: Based on Marking attribute
- **Effect**: Limit opponent's options and time on ball
- **Best Use**: Denying space to dangerous opponents

**Pressing**:
- **Action**: Close down ball carrier rapidly
- **Intensity**: Based on Work Rate + Aggression
- **Team Coordination**: Multiple players press together
- **Best Use**: Forcing errors, regaining possession high up field

### Shielding

**Body Positioning**:
- **Execution**: Position body between ball and opponent
- **Effectiveness**: Based on Strength + Balance
- **Effect**: Protect possession under pressure
- **Duration**: Can only shield for limited time (3-5 seconds)

## Limited Vision System

### Vision Attributes and Perception

Outfield players have limited field of view:

- **Vision Attribute**: Determines base perception range
- **Field of View**: ~120-180° cone in front of player
- **Peripheral Vision**: Reduced perception outside main cone

**Vision Range**:
- High Vision (80-99): See players/ball up to 40-50m
- Medium Vision (50-79): See players/ball up to 25-40m
- Low Vision (1-49): See players/ball up to 15-25m

### Fuzzy Perception

Players do NOT have perfect knowledge:

- **Position Uncertainty**: Perceived positions have gaussian error
  - Closer objects: Lower error (±0.5m)
  - Distant objects: Higher error (±3-5m)
- **Velocity Uncertainty**: Perceived speeds have error
- **Attribute Estimation**: Players estimate opponent attributes (not exact)

### Information Flow

1. **Direct Vision**: Players within vision cone and range
2. **Communication**: Teammates share information (limited, delayed)
3. **Memory**: Players remember last known positions (decay over time)
4. **Prediction**: AI predicts future positions based on velocity

## AI Execution Model

### Player-Managed Workers (Encapsulated)

**CRITICAL**: Players create and manage Web Workers internally. Match engine only calls player methods.

- **Encapsulated Workers**: Player class creates worker in constructor, terminates in destroy()
- **Clean Interface**: Match engine calls `player.makeDecision()`, player handles worker communication
- **Context Isolation**: Workers provide sandboxed execution for custom AI scripts (primary benefit)
- **Stateless AI**: Workers receive current game state, return intentions
- **No Shared Memory**: Workers cannot access other AI instances or full world state
- **Parallel Execution**: Multiple workers can run concurrently on multi-core CPUs

### Input State

Player's internal worker receives sanitized state (sensor-based perception):

**Player Input State Structure**:
- `self`: Player ID, position, velocity, stamina, attributes, has possession
- `visiblePlayers`: Only players in vision cone/range (filtered by perception)
- `visibleBall`: Ball position/velocity or null (if not visible)
- `teammates`: Filtered by vision
- `opponents`: Filtered by vision
- `ball`: Position, velocity, possession (null if not visible)
- `gameState`: Score, time, phase
- `tacticalContext`: Formation, role weights, instructions

### Output Action

**AI Action Structure**:
- `action`: 'move' | 'pass' | 'shoot' | 'dribble' | 'tackle' | 'shield'
- `target`: {x, y} (movement target or pass target, world space coordinates)
- `power`: 0.0-1.0 (shot/pass power)
- `sprint`: boolean (sprint or jog)
- `urgency`: 0.0-1.0 (action urgency, affects animation speed)

## Stamina and Fatigue

### Stamina Depletion

Stamina depletes based on activity:

- **Standing/Walking**: -0.01% per second
- **Jogging**: -0.1% per second
- **Running**: -0.3% per second
- **Sprinting**: -1.0% per second
- **Physical Actions**: -0.5% per tackle, header, shot

### Fatigue Effects

As stamina decreases, performance declines:

**Stamina Ranges**:
- **100-75%**: Full performance, no penalties
- **75-50%**: Slight decline (-5% to physical attributes)
- **50-25%**: Noticeable decline (-15% to physical attributes)
- **25-0%**: Severe decline (-30% to all attributes, injury risk)

**Affected Attributes**:
- Pace, Acceleration, Agility (most affected)
- Stamina, Work Rate (moderate effect)
- Mental attributes (Concentration, Decisions) slightly affected

### Stamina Recovery

- **During Play**: Minimal recovery when jogging/walking
- **Half-Time**: 15-25% recovery
- **Substitution**: Replacement enters at 100% stamina

## Tactical Instructions

### Team Tactics

AI responds to team-level instructions:

- **Attacking Mentality**: Higher attack weights, more aggressive pressing
- **Defensive Mentality**: Higher defend weights, drop deeper
- **Possession Style**: Short passing, patient build-up
- **Direct Style**: Long passes, quick transitions
- **High Press**: Press opponents high up field
- **Low Block**: Defend deep, compact shape

### Individual Instructions

Players can have individual tactical instructions:

- **Stay Forward**: Remain in attacking positions (low defend weight)
- **Get Back**: Prioritize defensive duties (high defend weight)
- **Hug Touchline**: Stay wide in attack
- **Cut Inside**: Move centrally from wide positions
- **Get Into Box**: Make late runs into penalty area

## Special Situations

### Set Pieces

**Free Kicks**:
- Designated taker based on attributes (Set Pieces, Long Shots)
- Other players position for crosses or rebounds
- Defenders form wall, mark opponents

**Corner Kicks**:
- Taker: High Crossing attribute
- Attackers: Position in penalty area (high Heading, Jumping)
- Defenders: Mark opponents, cover near/far posts

**Throw-Ins**:
- Nearest player takes throw
- Teammates move to provide passing options
- Opponents mark dangeroug targets

### Injuries

When player injured:

1. **Detect Injury**: Collision or stamina depletion triggers injury check
2. **Severity**:
   - Minor: Continue with reduced attributes (temporary)
   - Moderate: Cannot continue, requires substitution
   - Serious: Long-term injury (affects future matches)
3. **AI Response**: Injured player limited movement, prioritizes safety

## Player Development

### Attribute Growth

Attributes improve through:

- **Match Performance**: Successful actions increase related attributes
- **Training**: Dedicated practice sessions (outside match scope)
- **Experience**: Older players have better mental attributes

### Age Curve

Performance over career:

- **Young (16-21)**: Growing attributes, high potential
- **Peak (24-30)**: Maximum physical and mental attributes
- **Veteran (31+)**: Physical decline, mental attributes peak

## Independent Outfield AI

### Per-Player AI Selection

Each outfield player can use different AI engine:

- **Team 1 Players**: Can mix AI engines (Player 1 uses Engine A, Player 2 uses Engine B)
- **Team 2 Players**: Independent selection from Team 1
- **Custom AI**: Users can create custom AI engines for specific roles

### Registry Integration

AI engines registered in central registry:

- **Outfield AI Type**: Identified in manifest
- **Configuration**: Each engine exposes configurable parameters
- **Selection**: Dropdown in Player Config screen per player
