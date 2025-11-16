# Match

## Overview

A match is a complete football game between two teams, consisting of multiple phases, timekeeping, scoring, and referee decisions. The match orchestrates all systems: players, ball, AI, physics, and game rules.

## Match Structure

### Standard Match Format

- **Two Halves**: 45 minutes each
- **Half-Time**: 15-minute break (compressed in simulation)
- **Stoppage Time**: Added time for delays (injuries, substitutions, time-wasting)
- **Total Duration**: ~90-95 minutes (not including half-time)

### Extended Formats (Optional)

**Extra Time**:
- **Two Periods**: 15 minutes each
- **Scenario**: Knockout competitions when match is tied after 90 minutes
- **Substitutions**: Additional substitution allowed
- **Total**: 30 minutes additional play

**Penalty Shootout**:
- **Scenario**: Match still tied after extra time
- **Format**: 5 penalties each team (sudden death if tied)
- **Winner**: First team ahead after equal penalties, or sudden death

## Match Phases

### Pre-Match

Activities before kickoff:

1. **Team Selection**: Choose starting XI and substitutes
2. **Formation Setup**: Configure tactical formation
3. **AI Selection**: Choose AI engines for players (if not already set)
4. **Coin Toss**: Determine which team kicks off, which chooses sides
5. **Player Positioning**: Place players in formation for kickoff

### Kickoff

Match start or restart after goal:

1. **Ball Placement**: Ball placed at center spot (0, 0, 0)
2. **Team Positioning**: 
   - Kicking team: Players in own half, one at center spot
   - Defending team: Players in own half, outside center circle (>9.15m from ball)
3. **Referee Signal**: Whistle to start play
4. **Execution**: Kicking team passes ball forward
5. **Play Begins**: Ball is in play once it moves and is touched

### Active Play

Normal gameplay:

- **Continuous Physics**: Ball and players update each frame
- **AI Execution**: Player AIs make decisions and execute actions
- **Referee Monitoring**: Detect fouls, offside, out-of-bounds
- **Time Progression**: Match clock advances
- **Stamina Depletion**: Player stamina decreases with activity

### Stoppage

Play stops for various events:

**Ball Out of Bounds**:
- Touchline: Throw-in
- Goal line (attacker last touch): Goal kick
- Goal line (defender last touch): Corner kick

**Fouls**:
- Free kick awarded to fouled team
- Yellow/red card for serious fouls

**Goals**:
- Play stops for celebration
- Restart with kickoff from center

**Injuries**:
- Play stops for treatment (if serious)
- Restart with drop ball or possession returned to team with ball

**Substitutions**:
- Queued substitutions executed during stoppages

### Half-Time

Break between halves:

1. **Pause Match**: Stop all gameplay
2. **Player Recovery**: Partial stamina recovery (15-25%)
3. **Tactical Adjustments**: User/AI can change tactics, formation
4. **Substitutions**: Make substitutions if desired
5. **Switch Sides**: Teams change attacking directions
6. **Resume**: Kickoff to start second half

### Full-Time

End of match:

1. **Stop Play**: Match time reaches 90:00 + stoppage time
2. **Calculate Result**: Determine winner (or draw)
3. **Post-Match**: Display final score, statistics, player ratings
4. **Extra Time Check**: If knockout match and tied, proceed to extra time
5. **Penalty Shootout Check**: If still tied after extra time, proceed to penalties

### Post-Match

After match concludes:

- **Match Statistics**: Display shots, possession, passes, etc.
- **Player Ratings**: Performance-based ratings (1-10 scale)
- **Match Events**: Timeline of goals, cards, substitutions
- **Replay**: Option to review match or key moments
- **Save Match**: Record match data for history

## Team Phases

**CRITICAL**: Each team operates in one of three phases of play, which determines tactical behavior and attribute weights.

### Phase Types

**Attacking Phase** (team has possession):
- **Trigger**: Team gains possession of ball
- **Behavior**: Players push forward, seek space, create chances
- **Attributes Weighted**: Attacking Awareness, Attacking Decision Making, Passing, Dribbling
- **Formation**: Transition to in-possession formation (attackers higher, wider)

**Defending Phase** (opponent has possession):
- **Trigger**: Opponent gains possession of ball
- **Behavior**: Players drop back, close spaces, pressure ball carrier
- **Attributes Weighted**: Defending Awareness, Defending Decision Making, Tackling, Marking
- **Formation**: Transition to out-of-possession formation (compact, deeper)

**Contesting Phase** (ball is loose):
- **Trigger**: Ball not controlled by either team (loose ball, 50/50 challenge, aerial duel)
- **Behavior**: Players compete for possession, close down ball
- **Attributes Weighted**: Mixed (both attacking and defending)
- **Formation**: Maintain current formation (no transition)

### Phase Transitions

Phase changes when possession changes:

**Possession Detection**:
- Ball possessed by Team 1 → Team 1 'attacking', Team 2 'defending'
- Ball possessed by Team 2 → Team 1 'defending', Team 2 'attacking'
- Ball loose (no clear control) → Both teams 'contesting'
- Control threshold: Player within control distance AND `hasBall = true`

**Transition Speed**:
- **Instant Phase Change**: Team phase updates immediately when possession changes
- **Gradual Formation Change**: Formation transition takes 2-5 seconds (players move to new positions)

### Phase-Specific Behavior

**Attacking Phase**:
- **Formation**: Use in-possession formation (e.g., 4-3-3 Attack)
- **Player Roles**: Strikers push high, fullbacks overlap, midfielders support
- **AI Decisions**: Prioritize passing forward, making runs, shooting
- **Attribute Weights**: Attacking Awareness × 1.5, Defending Awareness × 0.5

**Defending Phase**:
- **Formation**: Use out-of-possession formation (e.g., 4-5-1 Defend)
- **Player Roles**: Defenders hold line, midfielders drop deep, striker stays forward (target for counter)
- **AI Decisions**: Prioritize intercepting passes, blocking shots, marking opponents
- **Attribute Weights**: Defending Awareness × 1.5, Attacking Awareness × 0.5

**Contesting Phase**:
- **Formation**: Maintain current formation (no transition)
- **Player Roles**: Players nearest ball compete for possession
- **AI Decisions**: Prioritize winning ball, getting into position
- **Attribute Weights**: Both attacking and defending attributes at normal weight

### Player Involvement

**Not All Players Involved**:
- Players far from ball may not change behavior immediately
- AI updates subset of players (50ms cycle) - phase change propagates gradually
- Players near ball react faster than players far from ball

**Example**: Counter-Attack Scenario
1. **t=0ms**: Team 1 defending, intercepts pass
2. **t=0ms**: Team 1 phase = attacking, Team 2 phase = defending (instant)
3. **t=0-50ms**: Intercepting player AI decides to pass forward (attacking behavior)
4. **t=50-100ms**: Nearby teammates AI start making forward runs (attacking behavior)
5. **t=500-2000ms**: Formation gradually transitions to in-possession shape (players move to new positions)

### Phase-Specific Statistics

Track statistics by phase for each team:

**Attacking Phase Metrics**:
- Duration (seconds in attacking phase)
- Shots, passes, possession percentage during attacking

**Defending Phase Metrics**:
- Duration (seconds in defending phase)
- Tackles, interceptions, clearances during defending

**Contesting Phase Metrics**:
- Duration (seconds in contesting phase)
- Duels won/lost during contesting

## Time Management

### Match Clock

- **Format**: MM:SS (e.g., 45:30 = 45 minutes 30 seconds)
- **Half 1**: 0:00 to 45:00+
- **Half 2**: 45:00 to 90:00+
- **Extra Time 1**: 90:00 to 105:00+
- **Extra Time 2**: 105:00 to 120:00+

### Real-Time vs. Game Time

**Simulation Speed Options**:
- **Real-Time**: 1 second real = 1 second game time (90 min real for full match)
- **2× Speed**: 1 second real = 2 seconds game time (45 min real for full match)
- **5× Speed**: 1 second real = 5 seconds game time (18 min real for full match)
- **10× Speed**: Fast simulation mode

**Performance Considerations**:
- Higher speeds require stable frame rates
- AI execution frequency may need adjustment at high speeds

### Stoppage Time Calculation

Stoppage time added for:

- **Substitutions**: ~30 seconds per substitution
- **Injuries**: Variable (30 seconds to 3+ minutes)
- **Goals**: ~30 seconds per goal
- **Time-Wasting**: Referee discretion (delays in restarting play)
- **VAR** (optional): Video review delays

**Typical Ranges**:
- First half: 1-3 minutes
- Second half: 3-6 minutes (usually more than first half)

## Scoring System

### Goal Detection

Goal scored when:

1. **Ball Position**: Fully crosses goal line
2. **Goal Bounds**: Between posts and below crossbar
3. **Legal Play**: No fouls or offside in build-up
4. **Award Goal**: Increment team score

### Goal Data Recording

Goal events recorded with the following data:
- `time` (match minute, e.g., 23.5)
- `team` (scoring team, 1 or 2)
- `scorer` (player ID and name)
- `assist` (optional, player ID and name)
- `type` ('open_play' | 'penalty' | 'free_kick' | 'corner' | 'own_goal')
- `position` (ball position when shot taken, world coordinates)
- `videoClip` (optional replay data)

### Score Display

- **Live Score**: Visible during match
- **Goal Alerts**: Visual/audio notification when goal scored
- **Goal Celebration**: Brief animation/cutscene
- **Updated Scoreline**: Display updated score after celebration

## Referee System

### Referee Role

The referee enforces rules and controls match flow:

- **Detect Fouls**: Identify illegal challenges
- **Award Free Kicks**: Place ball and award kick to fouled team
- **Issue Cards**: Yellow/red cards for serious fouls
- **Offside Detection**: Flag offside positions (if offside rules enabled)
- **Time Management**: Add stoppage time, end match at full-time
- **Advantage**: Allow play to continue despite foul if advantageous

### Foul Detection

Referee detects fouls through:

1. **Collision Detection**: Physical contact between players
2. **Context Analysis**: Determine if contact was legal (fair challenge) or foul
3. **Severity Assessment**: Minor foul vs. serious foul vs. violent conduct
4. **Decision**: Free kick, penalty, card, or advantage

**Foul Types**:
- **Slide Tackle**: Mistimed tackle, contact before ball
- **Pushing**: Excessive force pushing opponent
- **Holding**: Grabbing opponent's shirt or body
- **Tripping**: Contact that causes opponent to fall
- **Handball**: Deliberate hand/arm contact with ball (outfield players)

### Disciplinary Actions

**Yellow Card**:
- **Offenses**: Persistent fouling, unsporting behavior, dissent, time-wasting
- **Effect**: Caution, second yellow = red card
- **Accumulation**: Multiple yellows across matches can lead to suspension

**Red Card**:
- **Offenses**: Serious foul play, violent conduct, second yellow card, denying obvious goal-scoring opportunity (DOGSO)
- **Effect**: Immediate ejection, team plays with 10 players (or fewer)
- **No Replacement**: Cannot substitute for sent-off player

**Penalty Kick**:
- **Awarded**: Foul by defender in own penalty area
- **Placement**: Ball on penalty spot (11m from goal)
- **Execution**: 1v1, shooter vs. goalkeeper
- **Other Players**: Must be outside penalty area and arc until kick taken

### Advantage Rule

Referee can allow play to continue despite foul:

1. **Foul Detected**: Contact that would normally stop play
2. **Assess Advantage**: Does fouled team benefit from continuing play?
3. **Decision**:
   - **Play On**: Wave arms to indicate advantage
   - **Stop Play**: Award free kick
4. **Delayed Booking**: Can issue card later even if advantage played

## Match Events

### Event Timeline

Match events recorded chronologically with the following data structure:
- `time` (match minute)
- `type` ('kickoff', 'goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time')
- `team` (team number, 1 or 2)
- Event-specific data (e.g., `scorer`, `assist`, `player`, `playerOff`, `playerOn`, `score`)

### Event Types

- **Kickoff**: Match start or restart after goal
- **Goal**: Goal scored
- **Yellow/Red Card**: Disciplinary action
- **Substitution**: Player replacement
- **Injury**: Player injury (if significant)
- **Free Kick**: Awarded for foul
- **Penalty**: Penalty kick awarded
- **Corner**: Corner kick
- **Half-Time/Full-Time**: Period transitions

## Match Statistics

### Team Statistics

**Possession**:
- Percentage of time each team has ball
- Calculation: (teamPossessionTime / totalTime) × 100

**Shots**:
- Total shots, shots on target, shots off target
- Breakdown by player

**Passes**:
- Total passes, completed passes, pass accuracy
- Short passes, long passes, crosses

**Tackles**:
- Total tackles, successful tackles, tackle success rate

**Other**:
- Corners, fouls, offsides, cards

### Player Statistics

**Performance Metrics**:
- Minutes played
- Goals, assists
- Shots, shots on target
- Passes completed, pass accuracy
- Tackles won, interceptions
- Distance covered, sprints

**Rating Calculation**:
- Base rating: 6.0
- Modifiers: Goals (+1.0), assists (+0.5), shots on target (+0.1), etc.
- Penalties: Missed chances (-0.5), fouls (-0.1), cards (-0.5 yellow, -2.0 red)
- Final rating: 1.0-10.0 scale

## Match Configuration

### Match Settings

Configurable parameters:

**Time**:
- `halfDuration` (minutes per half, default 45)
- `extraTimeDuration` (minutes per extra time period, default 15)
- `stoppageTimeEnabled` (boolean)

**Rules**:
- `offsideRule` (boolean)
- `cardSystem` (boolean, yellow/red cards)
- `advantageRule` (boolean)
- `maxSubstitutions` (3 or 5 depending on competition)

**AI**:
- `team1AI.outfield` (AI script for outfield players)
- `team1AI.goalkeeper` (AI script for goalkeeper)
- `team2AI` (same structure)

**Physics/Referee/Simulation**:
- `ballPhysics` ('realistic' or alternatives)
- `refereeLeniency` (0.0 = strict, 1.0 = lenient)
- `simulationSpeed` (1.0 = real-time)

## Match State Machine

### State Transitions

Match progresses through states:

**Normal Match Flow**:
1. PRE_MATCH → KICKOFF (H1) → ACTIVE_PLAY ↔ STOPPAGE → HALF_TIME
2. KICKOFF (H2) → ACTIVE_PLAY ↔ STOPPAGE → FULL_TIME

**Knockout Match (if tied)**:
3. KICKOFF (ET1) → ACTIVE_PLAY ↔ STOPPAGE → EXTRA_TIME_HALF
4. KICKOFF (ET2) → ACTIVE_PLAY ↔ STOPPAGE → FULL_TIME
5. (if still tied) PENALTY_SHOOTOUT → POST_MATCH

### State Data

Current match state includes:
- `phase` ('active_play' | 'stoppage' | 'half_time' | ...)
- `time` (match minute, e.g., 45.3)
- `score` ([Team1, Team2])
- `ball` (position, velocity, possession)
- `players` (array of player states with id, position, velocity, stamina, etc.)
- `events` (chronological match events)
- `statistics` (team1 and team2 stats objects)

## Save/Load Match State

### Match Serialization

Save match state for:

- **Pause/Resume**: Save state when pausing, load when resuming
- **Replay**: Record state each frame for replay functionality
- **Debugging**: Inspect specific match moments

**Serialized State Components**:
- Match configuration (match settings)
- Current state (live match state)
- Event history (all events so far)
- Frame history (optional state snapshots for replay)

### Deterministic Replay

For accurate replays:

1. **Record RNG Seed**: Save random number generator state
2. **Record Inputs**: Save all user inputs and AI decisions
3. **Replay**: Re-execute match with same seed and inputs
4. **Validation**: Verify replayed match matches original

## Match Commentary (Optional)

### Commentary System

Generate dynamic commentary:

- **Event Triggers**: Goals, shots, passes, tackles
- **Context-Aware**: Adjust commentary based on score, time, player names
- **Variety**: Multiple phrases per event type
- **Audio/Text**: Display text commentary or play audio clips

**Example Commentary**: Late equalizer at 89th minute triggers dramatic commentary about rescuing the team.

## Network/Multiplayer (Future)

### Match Synchronization

For multiplayer matches:

- **Client-Server**: Server runs authoritative simulation
- **Client Prediction**: Clients predict movement, server corrects
- **State Updates**: Server sends state updates at fixed intervals
- **Input Lag**: Client sends inputs with timestamps, server processes

### Spectator Mode

Allow spectating live or recorded matches:

- **Camera Control**: Spectator controls camera independently
- **Statistics Overlay**: View live statistics
- **Event Highlights**: Jump to key moments
- **No Interaction**: Cannot affect match outcome
