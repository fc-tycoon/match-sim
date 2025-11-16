# TEAM TACTICAL SETTINGS

Team-level tactical settings that apply to the entire team and can accumulate with or override individual player tendencies. These settings define the collective playing style and strategic approach of the team.

---

## TEAM SHAPE & STRUCTURE

**Formation**
`formation`
The base tactical formation/system (e.g., 4-4-2, 4-3-3, 3-5-2).
- Value: Formation string/identifier
- Example: "4-3-3", "3-5-2", "4-2-3-1"

**Defensive Line Height**
`team_defensive_line_height`
How high the team's defensive line is positioned on the pitch.
- 0 = Very deep defensive line (park the bus)
- 0.5 = Moderate defensive line (balanced)
- 1 = Very high defensive line (high press, squeeze pitch)

**Compactness - Vertical**
`team_vertical_compactness`
How compressed the team is between defensive and attacking lines.
- 0 = Very stretched vertically, large gaps between lines
- 0.5 = Balanced vertical spacing
- 1 = Very compact vertically, tight unit

**Compactness - Horizontal**
`team_horizontal_compactness`
How compressed the team is from touchline to touchline.
- 0 = Very wide, stretch the pitch
- 0.5 = Balanced width
- 1 = Very narrow, compact central focus

**Team Width in Attack**
`team_width_attacking`
How wide the team spreads when attacking.
- 0 = Narrow attacking focus, play through the middle
- 0.5 = Balanced width utilization
- 1 = Maximum width, stretch the opposition

**Team Width in Defense**
`team_width_defensive`
How wide the team defends across the pitch.
- 0 = Narrow defensive block, protect the center
- 0.5 = Balanced defensive width
- 1 = Wide defensive coverage, press touchlines

---

## ATTACKING PHILOSOPHY

**Tempo**
`team_tempo`
Overall speed of play and decision-making.
- 0 = Very slow, methodical possession play
- 0.5 = Moderate tempo, varied pace
- 1 = Maximum tempo, constant urgency and speed

**Passing Style**
`team_passing_style`
Dominant passing approach for the team.
- 0 = Direct, long-ball approach
- 0.5 = Mixed passing game
- 1 = Short, possession-based passing

**Passing Risk**
`team_passing_risk`
How risky and ambitious the team's passing is.
- 0 = Very safe, low-risk passing
- 0.5 = Balanced risk approach
- 1 = High-risk, creative passing

**Build-Up Speed**
`team_buildup_speed`
How quickly the team progresses from defense to attack.
- 0 = Slow, patient build-up
- 0.5 = Moderate build-up pace
- 1 = Rapid, direct transitions

**Attacking Width Focus**
`team_attacking_width_focus`
Preference for central versus wide attacking play.
- 0 = Exclusively through the middle
- 0.5 = Balanced central and wide attacks
- 1 = Exclusively down the wings

**Forward Run Frequency**
`team_forward_run_frequency`
How often players make forward runs off the ball.
- 0 = Very few forward runs, static positioning
- 0.5 = Moderate forward runs
- 1 = Constant forward runs, dynamic movement

**Creative Freedom**
`team_creative_freedom`
How much individual creative license players have.
- 0 = Rigid tactical structure, no improvisation
- 0.5 = Structured with creative moments
- 1 = Total creative freedom, fluid positions

**Counter-Attack Mentality**
`team_counter_attack_mentality`
How aggressively the team pursues counter-attacks.
- 0 = Never counters, always resets possession
- 0.5 = Selective counter-attacking
- 1 = Always looks to counter at maximum speed

**Crossing Frequency**
`team_crossing_frequency`
How often the team attempts crosses.
- 0 = Never crosses, plays through/cuts inside
- 0.5 = Balanced crossing approach
- 1 = Constant crossing, delivery-focused

**Through Ball Frequency**
`team_through_ball_frequency`
How often the team attempts through balls.
- 0 = Never attempts through balls
- 0.5 = Opportunistic through balls
- 1 = Constantly seeking through ball opportunities

**Long Ball Frequency**
`team_long_ball_frequency`
How often the team plays long balls.
- 0 = Never plays long, always short build-up
- 0.5 = Mixed long and short passing
- 1 = Constant long balls, direct approach

---

## DEFENSIVE PHILOSOPHY

**Defensive Mentality**
`team_defensive_mentality`
Overall defensive approach and aggression.
- 0 = Ultra-defensive, deep block
- 0.5 = Balanced defensive approach
- 1 = Ultra-aggressive, constant pressure

**Pressing Intensity**
`team_pressing_intensity`
How aggressively the team presses the opposition. This governs acceleration into pressure, the number of teammates committed to the action, and the willingness to leave shape to hunt the ball. It does not decide where on the pitch the press starts; pair it with Line of Engagement and Pressing Triggers to shape the full behavior.
- 0 = No pressing, drop off and contain
- 0.5 = Moderate pressing in key areas
- 1 = Extreme high press, relentless pressure

**Line of Engagement**
`team_line_of_engagement`
The height on the pitch where the first line of pressure begins (separate from defensive line height). This sets where the block rests and where the initial pressure is invited, without dictating how hard you press. Example: low LOE + high intensity = compact low block that bites hard near your box; high LOE + low intensity = passive high block that screens lanes without over-committing.
- 0 = Very deep line of engagement (press starts near own box)
- 0.5 = Mid-block engagement (press starts around halfway)
- 1 = Very high engagement (press starts at opponent box)

**Pressing Trigger Zone**
`team_pressing_trigger_zone`
Where on the pitch the team begins pressing.
- 0 = Only press in defensive third (low block)
- 0.5 = Press in middle third (mid-block)
- 1 = Press in attacking third (high press)

**Pressing Duration**
`team_pressing_duration`
How long the team sustains a press before dropping off.
- 0 = Immediate drop-off if press beaten
- 0.5 = Moderate press persistence
- 1 = Relentless pressing until ball won

**Counter-Press Intensity**
`team_counter_press_intensity`
How aggressively the team presses immediately after losing possession.
- 0 = No counter-press, immediate drop-off
- 0.5 = Selective counter-pressing
- 1 = Immediate, aggressive counter-press always

**Regroup on Loss vs Counter-Press**
`team_regroup_after_loss`
Whether the team regroups into shape after a turnover instead of counter-pressing.
- 0 = Never regroup, always counter-press
- 0.5 = Situational regrouping
- 1 = Always regroup into defensive shape on loss

**Defensive Line Discipline**
`team_defensive_line_discipline`
How rigidly the defensive line maintains its shape.
- 0 = Fluid defensive line, individuals track runners
- 0.5 = Balanced line discipline
- 1 = Rigid offside trap, perfect line maintenance

**Man-Marking vs Zonal**
`team_marking_system`
Primary defensive marking system.
- 0 = Pure zonal marking
- 0.5 = Hybrid marking approach
- 1 = Pure man-marking

**Tackle Aggression**
`team_tackle_aggression`
How aggressively the team commits to tackles.
- 0 = Conservative tackling, contain and jockey
- 0.5 = Balanced tackling approach
- 1 = Aggressive, committed tackling

**Defensive Width Priority**
`team_defensive_width_priority`
Emphasis on protecting wide areas versus central areas.
- 0 = Protect center, concede wings
- 0.5 = Balanced width and center coverage
- 1 = Protect wings, compact centrally

**Offside Trap Strictness**
`team_offside_trap`
Commitment to holding an aggressive line for offside trap.
- 0 = Rarely steps, prioritize depth security
- 0.5 = Situational trap usage
- 1 = Aggressive, coordinated offside trap

---

### Explainer: Pressing Intensity vs Line of Engagement

Pressing Intensity = “how hard” you press; Line of Engagement = “where” you press. They are independent: any intensity can be used at any line. Practical combos:

- High LOE + High Intensity: classic high press (Gegenpress), jump on first line in opponent third.
- High LOE + Low Intensity: passive high block, screen passes and wait for triggers/errors.
- Low LOE + High Intensity: fierce low-block bite, spring traps near your box and counter.
- Mid LOE + Medium Intensity: balanced mid-block that presses selectively in midfield.

Use Triggers (e.g., back-pass, heavy touch) to time the jump and Traps (direction/side/strength) to steer play into pressure.

## TRANSITIONAL PLAY

**Transition Speed - D to A**
`team_transition_speed_defensive_to_attack`
How quickly the team transitions from defense to attack.
- 0 = Slow, reset possession completely
- 0.5 = Moderate transition speed
- 1 = Lightning-fast counter-attacks

**Transition Speed - A to D**
`team_transition_speed_attack_to_defense`
How quickly the team transitions from attack to defense.
- 0 = Slow recovery, late defensive organization
- 0.5 = Moderate recovery speed
- 1 = Immediate defensive shape recovery

**Transition Organization**
`team_transition_organization`
How organized transitions are versus chaotic/direct.
- 0 = Chaotic, direct transitions (kick and rush)
- 0.5 = Balanced organization
- 1 = Highly organized, structured transitions

**Recovery Run Intensity**
`team_recovery_run_intensity`
How hard players work to get back defensively.
- 0 = Minimal recovery effort, stay forward
- 0.5 = Moderate recovery runs
- 1 = Maximum recovery effort, all back

**Counter Width**
`team_counter_width`
How much the team stretches play horizontally during counters.
- 0 = Narrow, central counters
- 0.5 = Balanced counter width
- 1 = Max width on break, hit flanks early

---

## TEAM MENTALITY

**Overall Mentality**
`team_overall_mentality`
General team attitude from defensive to attacking.
- 0 = Ultra-defensive mentality
- 0.5 = Balanced approach
- 1 = Ultra-attacking mentality

**Risk Appetite**
`team_risk_appetite`
Overall willingness to take risks in play.
- 0 = Ultra-cautious, safety-first
- 0.5 = Balanced risk-taking
- 1 = Maximum risk, adventurous play

**Possession vs Directness**
`team_possession_vs_directness`
Playing philosophy emphasis.
- 0 = Possession-based, patient build-up
- 0.5 = Pragmatic, situational approach
- 1 = Direct, vertical football

**Work Rate Requirement**
`team_work_rate_requirement`
Expected physical effort and running from players.
- 0 = Minimal work rate, conserve energy
- 0.5 = Moderate work rate demands
- 1 = Maximum work rate, relentless running

**Discipline vs Freedom**
`team_discipline_vs_freedom`
Tactical rigidity versus creative license.
- 0 = Rigid tactical structure, strict roles
- 0.5 = Structured with flexibility
- 1 = Total freedom, fluid positions

**Time Wasting**
`team_time_wasting`
How deliberately the team slows play when in control.
- 0 = No time-wasting
- 0.5 = Situational time management
- 1 = Heavy time-wasting when appropriate

---

## SET-PIECE STRATEGIES

**Corner Kick Strategy**
`team_corner_strategy`
Approach to attacking corner kicks.
- 0 = Short corners, work space
- 0.5 = Mixed short and direct corners
- 1 = Direct crosses, attack the box

**Free Kick Strategy - Attacking**
`team_free_kick_attacking_strategy`
Approach to attacking free kicks.
- 0 = Always play short, work opportunities
- 0.5 = Varied free kick approach
- 1 = Always shoot or cross direct

**Free Kick Strategy - Defensive**
`team_free_kick_defensive_strategy`
Defensive free kick organization.
- 0 = Man-marking on free kicks
- 0.5 = Mixed marking system
- 1 = Zonal marking on free kicks

**Throw-In Approach**
`team_throw_in_approach`
How the team uses throw-ins.
- 0 = Safe, short throw-ins
- 0.5 = Balanced throw-in usage
- 1 = Long throw-ins as attacking weapon

**Tactical Fouling to Stop Counters**
`team_tactical_fouling`
Willingness to commit small fouls to halt transitions.
- 0 = Avoids tactical fouls
- 0.5 = Situational cynical fouls
- 1 = Readily uses tactical fouls to stop breaks

---

## GOALKEEPER INTEGRATION

**Goalkeeper Distribution Instruction**
`team_gk_distribution_instruction`
Team instruction for goalkeeper distribution.
- 0 = Always short, build from back
- 0.5 = Varied distribution based on situation
- 1 = Always long, bypass midfield

**Goalkeeper Sweeping Instruction**
`team_gk_sweeping_instruction`
How much the goalkeeper should sweep.
- 0 = Stay on line, traditional keeper
- 0.5 = Moderate sweeping
- 1 = Aggressive sweeper keeper

**Goalkeeper Role in Build-Up**
`team_gk_buildup_role`
Goalkeeper's involvement in possession build-up.
- 0 = Not involved, safety option only
- 0.5 = Occasional involvement
- 1 = Active participant, extra outfield player

**Press-Relief via GK**
`team_gk_press_relief`
Use GK as pressure release valve under press.
- 0 = Avoids recycling to GK under pressure
- 0.5 = Situational use of GK to relieve press
- 1 = Proactively bounce through GK to escape press

---

## SPECIAL SITUATIONS

**Opposition Playing Style Response**
`team_opposition_adaptation`
How much the team adapts to opposition.
- 0 = Never adapts, plays own game always
- 0.5 = Minor tactical adjustments
- 1 = Completely adapts to counter opposition

**Game State Response - Winning**
`team_gamestate_winning_response`
How the team plays when winning.
- 0 = Stays aggressive, keeps attacking
- 0.5 = Balanced approach when ahead
- 1 = Sits deep, protects lead

**Game State Response - Losing**
`team_gamestate_losing_response`
How the team plays when losing.
- 0 = Stays disciplined, patient
- 0.5 = Gradually increases urgency
- 1 = All-out attack, desperate

**Fatigue Management**
`team_fatigue_management`
How the team conserves energy versus constant intensity.
- 0 = Constant high intensity, no energy conservation
- 0.5 = Balanced intensity management
- 1 = Heavy energy conservation, manage tempo

---

## BUILD-UP INSTRUCTIONS

**Play Out of Defense**
`team_play_out_of_defense`
Preference to circulate at the back before progressing.
- 0 = Bypass build-up, go long early
- 0.5 = Mixed build-up
- 1 = Insist on short build from the back

**Pass Into Space**
`team_pass_into_space`
Encourage passes ahead of runners versus to feet.
- 0 = To-feet preference
- 0.5 = Situational balls into space
- 1 = Constantly pass into space

**Work Ball Into Box vs Shoot on Sight**
`team_work_ball_into_box`
Patience to create high-quality shots versus volume shooting.
- 0 = Shoot on sight, early shot selection
- 0.5 = Balanced shot selection
- 1 = Work ball into box, refuse low-quality shots

**Dribble Frequency (Team)**
`team_dribble_frequency`
How often players are encouraged to carry/dribble.
- 0 = Dribble less, circulate more
- 0.5 = Mixed carry/pass approach
- 1 = Dribble more, encourage take-ons

**Focus of Play**
`team_focus_left_right_centre`
Primary lane of attack.
- 0 = Focus down the left
- 0.5 = Balanced left/center/right
- 1 = Focus down the right

**Overlaps/Underlaps - Left**
`team_overlap_left`, `team_underlap_left`
Frequency of overlapping/underlapping movements on left flank.
- 0 = Rarely overlap/underlap
- 0.5 = Situational overlaps/underlaps
- 1 = Constant overlaps/underlaps

**Overlaps/Underlaps - Right**
`team_overlap_right`, `team_underlap_right`
Frequency of overlapping/underlapping movements on right flank.
- 0 = Rarely overlap/underlap
- 0.5 = Situational overlaps/underlaps
- 1 = Constant overlaps/underlaps

**Hit Early Crosses**
`team_hit_early_crosses`
Encourage early deliveries before reaching the byline.
- 0 = Work to byline
- 0.5 = Mixed cross timing
- 1 = Target early crosses

**Cross Type Preference**
`team_cross_type_floated_vs_driven`
General crossing style.
- 0 = Driven/low crosses preferred
- 0.5 = Mixed cross types
- 1 = Floated/lofted crosses preferred

---

## PRESSING TRIGGERS & TRAPS

Press triggers are additive on top of Pressing Intensity and Line of Engagement.

**Back-Pass Trigger**
`team_press_trigger_back_pass`
Press more aggressively on backward passes.
- 0 = Ignore back-pass triggers
- 0.5 = Situational trigger
- 1 = Always jump on back passes

**Lateral-Pass Trigger**
`team_press_trigger_lateral_pass`
Press more aggressively on sideways passes.
- 0 = Ignore lateral-pass triggers
- 0.5 = Situational trigger
- 1 = Always jump on lateral passes

**Heavy Touch Trigger**
`team_press_trigger_heavy_touch`
Exploit poor control or heavy first touch.
- 0 = Do not jump on heavy touches
- 0.5 = Situational jump
- 1 = Always pounce on heavy touches

**Receiver Back-to-Goal Trigger**
`team_press_trigger_back_to_goal`
Press as receiver is facing own goal.
- 0 = Ignore body-shape triggers
- 0.5 = Situational trigger
- 1 = Always press when receiver is back to goal

**Pressing Trap Direction**
`team_press_trap_direction`
Force play inside versus outside when pressing.
- 0 = Force inside (to crowd)
- 0.5 = Neutral
- 1 = Force outside (to touchline)

**Pressing Trap Side**
`team_press_trap_side`
Bias to set pressing traps on a flank.
- 0 = Left-side trap bias
- 0.5 = No side bias
- 1 = Right-side trap bias

**Pressing Trap Strength**
`team_press_trap_strength`
How aggressively teammates collapse when trap is sprung.
- 0 = Loose trap, minimal collapse
- 0.5 = Moderate collapse
- 1 = Hard trap, full collapse

---

## REST DEFENSE

Structures maintained behind the ball during attacks to prevent counters.

**Back Cover Commitment**
`team_rest_defense_back_cover`
How many players/lines are retained as cover during sustained attacks.
- 0 = Minimal cover (commit numbers forward)
- 0.5 = Balanced cover
- 1 = Maximum cover (keep extra line behind)

**Rest Defense Width**
`team_rest_defense_width`
How wide the rest defense positions to control counters.
- 0 = Very narrow rest defense
- 0.5 = Balanced width
- 1 = Very wide rest defense

---

## NOTES

### Implementation Hierarchy

1. **Team Settings Override Individual**: Where team settings conflict with individual tendencies, team settings take precedence (e.g., `team_tempo` overrides individual `movement_tempo`)

2. **Accumulation**: Some settings accumulate with individual tendencies (e.g., `team_pressing_intensity` + individual `press_trigger_intensity`)

3. **Contextual Application**: Settings can be applied contextually based on:
   - Game state (winning/losing/drawing)
   - Time remaining
   - Opposition strength
   - Player fatigue levels

### Preset Tactical Styles

Common tactical presets that combine multiple settings:

**Tiki-Taka**
- High possession (`team_possession_vs_directness` = 0)
- Short passing (`team_passing_style` = 1)
- High press (`team_pressing_intensity` = 0.8, `team_pressing_trigger_zone` = 1)
- Narrow width (`team_horizontal_compactness` = 0.7)

**Counter-Attack**
- Deep block (`team_defensive_line_height` = 0.2)
- Direct transitions (`team_transition_speed_defensive_to_attack` = 1)
- Fast tempo when winning ball (`team_tempo` = 0.8)
- Direct passing (`team_possession_vs_directness` = 0.8)

**Park the Bus**
- Ultra-defensive (`team_overall_mentality` = 0)
- Deep line (`team_defensive_line_height` = 0.1)
- No pressing (`team_pressing_intensity` = 0.1)
- Minimal risks (`team_risk_appetite` = 0.1)

**Gegenpress**
- High press (`team_pressing_intensity` = 1, `team_pressing_trigger_zone` = 1)
- Counter-press (`team_counter_press_intensity` = 1)
- High intensity (`team_work_rate_requirement` = 0.9)
- Quick transitions (`team_transition_speed_defensive_to_attack` = 0.9)

**Route One (Long Ball)**
- Direct passing (`team_passing_style` = 0, `team_long_ball_frequency` = 1)
- High tempo (`team_tempo` = 0.8)
- Long distribution (`team_gk_distribution_instruction` = 1)
- Physical approach (`team_tackle_aggression` = 0.8)

**Total Football**
- Fluid positions (`team_creative_freedom` = 0.9, `team_discipline_vs_freedom` = 0.8)
- High press (`team_pressing_intensity` = 0.8)
- Possession-based (`team_possession_vs_directness` = 0.2)
- Attacking mentality (`team_overall_mentality` = 0.8)

**Wing Play**
- Wide attacks (`team_width_attacking` = 1)
- Crossing frequency (`team_crossing_frequency` = 0.9)
- Width in attack (`team_attacking_width_focus` = 0.9)

**False 9**
- Fluid forward positioning (`team_creative_freedom` = 0.8)
- Short passing (`team_passing_style` = 0.8)
- Creative freedom (`team_discipline_vs_freedom` = 0.7)

**Control Possession**
- Possession-focused (`team_possession_vs_directness` = 0.2)
- Work ball into box (`team_shot_selection_patience` = 1)
- Play out of defense (`team_play_out_of_defense` = 1)
- Medium press and lower risk (`team_pressing_intensity` = 0.5, `team_risk_appetite` = 0.4)
