# Substitutions

## Overview

Substitutions allow teams to replace players during a match, bringing on fresh legs or adjusting tactics. The system must handle both manual substitutions (user-initiated) and automatic substitutions (AI-decided).

## Substitution Rules

### FIFA Standard Rules

- **Maximum Substitutions**: 3-5 depending on competition rules (configurable)
- **No Re-Entry**: Once substituted off, a player cannot return to the field
- **Named Substitutes**: Substitutes must be declared before match starts
- **Stoppage Required**: Substitutions occur during natural stoppages in play
- **Referee Approval**: Substitutions require referee acknowledgment

### Extended Rules (Optional)

- **Extra Time Substitutions**: Additional substitution allowed during extra time
- **Concussion Substitutes**: Special rules for head injury replacements
- **Tactical Variations**: Different limits based on competition rules

## Substitute Bench

### Squad Structure

Each team has:

- **Starting XI**: 11 players on the field (10 outfield + 1 goalkeeper)
- **Named Substitutes**: 3-12 players on the bench (configurable)
- **Maximum Squad Size**: 23 players total (configurable)

### Bench Composition

Typical bench includes:

- **1-2 Substitute Goalkeepers**: Backup goalkeepers
- **Remaining Outfield Players**: Mix of positions and roles for tactical flexibility

## Manual Substitution Process

### User-Initiated Substitutions

1. **User Opens Substitution Panel**: Accesses substitution interface
2. **Selects Player Off**: Chooses player to be substituted off the field
3. **Selects Player On**: Chooses replacement from available substitutes
4. **Confirms Substitution**: Submits substitution request
5. **Referee Acknowledgment**: Substitution queued for next stoppage
6. **Substitution Executed**: Player swap occurs during stoppage

### Substitution Panel UI

**Player Off Section**:
- List of current on-field players
- Player stamina indicators
- Player form/performance indicators
- Position labels

**Player On Section**:
- List of available substitutes
- Player positions and roles
- Substitution count remaining
- Tactical recommendations (optional)

**Confirmation**:
- Preview of substitution
- Tactical impact summary
- Confirm/Cancel buttons

## Automatic Substitutions (AI)

### AI Substitution Decision Making

AI can trigger substitutions based on:

- **Stamina Threshold**: Replace tired players (e.g., <30% stamina)
- **Injury**: Replace injured players
- **Tactical Adjustment**: Change formation or playing style
- **Score Situation**: React to current scoreline (e.g., trailing, add attackers)
- **Time Remaining**: Late-game fresh legs for pressing or defending lead

### AI Substitution Timing

AI evaluates substitution windows at:

- **Half-Time**: Primary substitution window
- **60-70 Minutes**: Common substitution period
- **75-85 Minutes**: Final substitution window
- **Injury Stoppages**: Opportunistic substitutions during breaks

### AI Selection Criteria

When choosing replacement:

1. **Position Match**: Prefer similar positional role
2. **Stamina**: Select fresh player (100% stamina)
3. **Tactical Fit**: Match current formation and style
4. **Attributes**: Consider player strengths vs. opponent weaknesses
5. **Game State**: Adapt to scoreline and time remaining

## Substitution Execution

### Queuing System

Substitutions are queued and executed during valid game stoppages:

1. **Substitution Requested**: User or AI requests substitution
2. **Added to Queue**: Substitution stored in pending queue
3. **Wait for Stoppage**: Match continues until natural break
4. **Execute Substitution**: Swap players during stoppage
5. **Resume Play**: Match continues with new player configuration

### Valid Stoppage Events

Substitutions can occur during:

- **Goal Kicks**: Before goal kick is taken
- **Throw-Ins**: Before throw-in (team making substitution has throw preference)
- **Free Kicks**: Before free kick is taken
- **Half-Time**: Between halves
- **Injuries**: During injury treatment stoppages
- **Goals**: After goal celebration, before kickoff

### Substitution Animation

Visual representation of substitution:

1. **Player Off**: Substituted player jogs/walks off field
2. **Player On**: Replacement enters from touchline
3. **Position Handoff**: Brief exchange between players (optional)
4. **Resume**: New player takes position in formation

## Stamina and Fatigue

### Stamina System

Player stamina affects substitution decisions:

- **Stamina Range**: 0-100% (or 0.0-1.0)
- **Depletion Rate**: Based on movement intensity, sprinting, actions
- **Fatigue Effects**: Reduced speed, decision making, physical attributes
- **Visual Indicators**: Player appearance, UI indicators show stamina levels

### Critical Thresholds

- **100-75%**: Fresh, full performance
- **75-50%**: Slight fatigue, minor performance reduction
- **50-25%**: Noticeable fatigue, significant performance impact
- **25-0%**: Severe fatigue, major performance degradation, injury risk

### Stamina Recovery

- **During Play**: Minimal recovery (walking, standing)
- **Half-Time**: Moderate recovery (10-20% restoration)
- **Substitution**: Replacement enters at 100% stamina

## Formation Changes

### Tactical Substitutions

Substitutions can trigger formation changes:

- **Like-for-Like**: Maintain current formation (e.g., striker for striker)
- **Formation Shift**: Change tactical shape (e.g., 4-3-3 → 4-5-1)
- **Role Change**: Alter player roles within same formation

### AI Formation Adaptation

When AI makes tactical substitutions:

1. **Evaluate Situation**: Assess score, time, opponent tactics
2. **Select Formation**: Choose appropriate tactical response
3. **Select Players**: Pick substitutes fitting new formation
4. **Execute Changes**: Make 1-3 substitutions to implement new shape
5. **Adjust Center of Mass**: Recalculate team positioning

## Injury Substitutions

### Forced Substitutions

Injuries may require immediate substitutions:

- **Serious Injury**: Player cannot continue
- **Mandatory Substitution**: Must replace injured player
- **Concussion Protocol**: Special substitution rules
- **No Substitutions Available**: Team plays with 10 players (rare)

### Injury Detection

Match engine detects injuries through:

- **Collision Events**: Physical contact between players
- **Stamina Depletion**: Extreme fatigue increases injury risk
- **Random Events**: Low-probability injury occurrences
- **Attribute-Based**: Injury proneness, physique, age factors

## Substitution Limits

### Tracking Substitutions

System tracks:

- **Substitutions Made**: Count of completed substitutions (per team)
- **Substitutions Remaining**: Available substitution slots
- **Extra Time Allowance**: Additional substitutions in extra time (if enabled)
- **Eligible Players**: Available substitutes on bench

### Limit Enforcement

When substitution limit reached:

- **Disable Substitution UI**: Gray out substitution button
- **AI Awareness**: AI knows it cannot make more substitutions
- **Injury Handling**: Team must play short if injury occurs and no substitutions remain

## Goalkeeper Substitutions

### Special Considerations

Goalkeeper substitutions have unique handling:

- **Mandatory Goalkeeper**: Must have exactly 1 goalkeeper on field
- **Goalkeeper Injury**: Must substitute with another goalkeeper (or outfield player as emergency GK)
- **Tactical GK Change**: Rare, but allowed for tactical reasons
- **Emergency GK**: If no substitute GK available, designate outfield player as GK

### Emergency Goalkeeper

If all goalkeepers injured/sent off:

1. **Select Outfield Player**: Choose player to become emergency GK
2. **Attribute Penalty**: Significantly reduced GK attributes
3. **AI Switch**: Player uses goalkeeper AI (with poor attributes)
4. **Visual Indicator**: Different kit or indicator showing emergency GK status

## Substitution Data

### Historical Tracking

**Substitution Event Record Structure**:
- `matchTime`: 67.5 (minutes)
- `team`: 1 or 2
- `playerOff`:
  - `id`: Player ID
  - `name`: Player name
  - `position`: {x, z} (world space position when substituted)
  - `stamina`: 0.32 (stamina percentage, 0.0-1.0)
  - `reason`: "stamina" | "injury" | "tactical"
- `playerOn`:
  - `id`: Substitute player ID
  - `name`: Substitute player name
  - `stamina`: 1.0 (always fresh, full stamina)
- `formationBefore`: "4-4-2" (formation before substitution)
- `formationAfter`: "4-5-1" (formation after substitution, if changed)

### Post-Match Analysis

Substitution data used for:

- **Match Timeline**: Visual representation of substitutions
- **Tactical Analysis**: Formation changes and their effects
- **Performance Metrics**: Impact of substitutions on match outcome
- **AI Learning**: Training data for AI substitution decisions

## Multi-Substitution

### Triple Substitutions

Allow multiple simultaneous substitutions:

- **UI Support**: Select multiple players off/on in single action
- **Efficiency**: Execute all substitutions during single stoppage
- **Formation Changes**: Implement major tactical shifts
- **Late-Game Surge**: Bring on fresh attackers when chasing game

### Execution

1. **User Selects Multiple Players**: Choose 2-3 players off
2. **User Selects Replacements**: Choose corresponding players on
3. **Preview Changes**: Show formation and tactical impact
4. **Confirm All**: Submit all substitutions as batch
5. **Execute Together**: All players swap during same stoppage

## Substitution Strategy

### Common Patterns

#### Defensive Substitution

- **Situation**: Protecting a lead
- **Change**: Add defensive midfielder, remove attacker
- **Formation**: Shift to more defensive shape (e.g., 4-4-2 → 4-5-1)

#### Attacking Substitution

- **Situation**: Chasing a goal
- **Change**: Add attacker, remove defensive player
- **Formation**: Shift to more offensive shape (e.g., 4-5-1 → 4-3-3)

#### Fresh Legs

- **Situation**: Maintaining pressure in final 20 minutes
- **Change**: Like-for-like substitutions prioritizing stamina
- **Formation**: Maintain current shape

#### Injury Response

- **Situation**: Key player injured
- **Change**: Direct replacement with similar attributes
- **Formation**: Maintain or slightly adjust based on available players

## User Interface

### Substitution Button

- **Location**: Main match controls
- **State**: Active during stoppages, disabled during play
- **Badge**: Shows remaining substitutions (e.g., "3" or "SUB x3")
- **Disabled State**: Grayed out when no substitutions remaining

### Substitution Confirmation

Before executing:

- **Visual Preview**: Show players swapping positions
- **Tactical Impact**: Formation diagram with changes highlighted
- **Stamina Comparison**: Show stamina levels of both players
- **Confirm/Cancel**: Final decision point
