# PLAYER ROLES

Player role presets for the match simulation engine.

## Overview

Role presets combine tendencies into recognizable playing styles matching position, role, and playing style archetypes.

## File Format

**Role Preset Structure**:
- **name**: Role name (e.g., "Centre Back", "Full-back", "Target Man")
- **description**: Brief description of the role
- **position**: Position category (GK | CD | FB | DM | CM | AM | WM | ST)
- **tendencies**: All 177 outfield tendencies OR all GK tendencies with values between 0.0 and 1.0

All tendencies must be present with values between 0.0 and 1.0.

---

## GOALKEEPERS

### Goalkeeper (gk-goalkeeper.json)
Traditional goalkeeper focused on shot-stopping. Stays near the goal line, rarely sweeps, prioritizes defensive positioning over ball-playing. Reliable last line of defense with minimal risk-taking. Classic shot-stopper.

### Sweeper-Keeper (gk-sweeper-keeper.json)
Modern goalkeeper who acts as an auxiliary defender. Aggressive sweeping behind the defense, excellent with feet, participates in build-up play. Proactive shot-stopper who also functions as an outfield player. Pioneered by Neuer.

#### Key Differentiators

| Tendency | Goalkeeper | Sweeper-Keeper |
|----------|------------|----------------|
| `gk_defensive_line_position` | 0.2 | 0.75 |
| `gk_build_up_line_participation` | 0.1 | 0.85 |
| `gk_sweeping_range` | 0.25 | 0.85 |
| `gk_sweeping_frequency_through_balls` | 0.3 | 0.9 |
| `gk_box_aggression` | 0.3 | 0.9 |
| `gk_1v1_rushing_aggression` | 0.5 | 0.85 |
| `gk_distribution_speed_after_save` | 0.4 | 0.8 |
| `gk_short_distribution_preference` | 0.3 | 0.85 |
| `gk_long_distribution_preference` | 0.7 | 0.3 |
| `gk_pass_to_feet_preference` | 0.3 | 0.9 |
| `gk_goal_kick_short_preference` | 0.2 | 0.9 |
| `gk_ball_playing_confidence_under_pressure` | 0.2 | 0.85 |
| `gk_dribbling_willingness` | 0.1 | 0.7 |
| `gk_command_of_area` | 0.6 | 0.85 |

---

## CENTRE-BACKS

### Centre Back (def-centre-back.json)
Balanced central defender. Covers space, engages attackers, and distributes when safe. Prioritizes defensive solidity with measured passing from the back.

### Ball-Playing Defender (def-ball-playing-defender.json)
Cultured centre-back comfortable on the ball. Steps into midfield when space opens, plays progressive passes, and resists pressure with composure. Sacrifices some defensive intensity for technical quality.

### No-Nonsense Defender (def-no-nonsense-defender.json)
Safety-first centre-back. Clears danger first, asks questions later. Aggressive in duels, disciplined positionally, minimal risk-taking with the ball. Prioritizes defensive security above all else.

### Wide Centre-Back (def-wide-centre-back.json)
Centre-back in a back three who operates on the flank. Covers wide areas, supports midfield like a full-back when needed. Defensive responsibility with modern adaptability to step into wider channels. John Stones-style role.

### Libero (def-libero.json)
Free-roaming sweeper who plays behind the defensive line. Sweeps up danger, brings the ball forward, dictates play from deep. Combines defensive coverage with creative freedom to initiate attacks. Classic Beckenbauer role.


#### Key Differentiators

| Tendency | Centre Back | Ball-Playing | No-Nonsense |
|----------|-------------|--------------|-------------|
| `clearance_vs_pass_preference_def_third` | 0.5 | 0.2 | 0.85 |
| `passing_risk_appetite` | 0.3 | 0.6 | 0.15 |
| `step_into_midfield_in_possession` | 0.2 | 0.6 | 0.05 |
| `press_baiting_tendency` | 0.1 | 0.5 | 0.0 |
| `progressive_dribble_willingness` | 0.2 | 0.6 | 0.1 |
| `through_ball_attempt_frequency` | 0.1 | 0.4 | 0.05 |
| `switch_play_frequency` | 0.3 | 0.6 | 0.2 |
| `defensive_aggression` | 0.6 | 0.5 | 0.8 |
| `tackle_attempt_frequency` | 0.6 | 0.5 | 0.8 |
| `interception_attempt_risk` | 0.5 | 0.6 | 0.4 |
| `position_maintenance_discipline` | 0.7 | 0.5 | 0.85 |
| `spatial_awareness` | 0.8 | 0.9 | 0.75 |

---

## FULL-BACKS / WING-BACKS

### Full-Back (def-full-back.json)
Balanced wide defender. Supports attacks with measured forward runs, defends the flank with discipline, and provides width in possession. Offers reliable presence in both phases without extreme attacking or defensive bias.

### Wing-Back (def-wing-back.json)
Attacking-minded wide defender. High and wide in possession, frequent overlapping runs, aggressive crossing from advanced positions. Relies on recovery runs when caught upfield, prioritizes offensive contribution.

### Inverted Wing-Back (def-inverted-wing-back.json)
Full-back who tucks inside to form central overloads. Creates box midfield shapes, supports counter-pressing lanes, sacrifices wide presence for central control. Underlaps instead of overlaps, provides pass options in half-spaces.

#### Key Differentiators

| Tendency | Full-Back | Wing-Back | Inverted WB |
|----------|-----------|-----------|-------------|
| `horizontal_width` | 0.85 | 0.95 | 0.7 |
| `fullback_inversion_frequency` | 0.1 | 0.05 | 0.9 |
| `overlap_run_frequency` | 0.6 | 0.9 | 0.2 |
| `underlap_run_frequency` | 0.3 | 0.2 | 0.7 |
| `forward_run_frequency` | 0.5 | 0.8 | 0.5 |
| `cross_frequency_wide` | 0.6 | 0.85 | 0.3 |
| `cross_frequency_half_space` | 0.4 | 0.3 | 0.5 |
| `defensive_line_height` | 0.45 | 0.5 | 0.4 |
| `tracking_back_intensity` | 0.8 | 0.7 | 0.7 |
| `recovery_run_speed` | 0.75 | 0.85 | 0.8 |
| `defensive_width_responsibility` | 0.9 | 0.85 | 0.6 |
| `transition_positioning_wide_central` | 0.2 | 0.1 | 0.3 |
| `close_support_frequency` | 0.6 | 0.5 | 0.8 |
| `defensive_balance_priority` | 0.7 | 0.6 | 0.8 |
| `work_rate_out_of_possession` | 0.8 | 0.75 | 0.8 |

---

## DEFENSIVE MIDFIELDERS

### Anchor Man (mid-anchor-man.json)
Disciplined defensive midfielder who holds position. Screens defense, maintains compactness, rarely ventures forward. Provides structural stability and safe distribution. Excels at reading the game, intercepting passes, and keeping the team compact.

### Half-Back (mid-half-back.json)
Defensive midfielder who drops between center-backs in possession. Forms back three to aid build-up, provides cover during transitions, excellent positional awareness. Prioritizes defensive balance over attacking contribution, often acting as third center-back when team has the ball.

### Ball-Winning Midfielder (mid-ball-winning-midfielder.json)
Aggressive ball-hunter. High pressing intensity, frequent tackles, excellent second-ball anticipation. Breaks up opposition play with energy and physicality, distributes simply after regaining possession. Thrives in counter-pressing situations and transition moments.

#### Key Differentiators

| Tendency | Anchor Man | Half-Back | Ball-Winner |
|----------|------------|-----------|-------------|
| `position_maintenance_discipline` | 0.95 | 0.85 | 0.5 |
| `positional_freedom` | 0.1 | 0.3 | 0.5 |
| `drop_between_center_backs_in_possession` | 0.2 | 0.85 | 0.05 |
| `defensive_compactness_loyalty` | 0.95 | 0.95 | 0.65 |
| `covering_teammate_frequency` | 0.95 | 0.98 | 0.7 |
| `defensive_balance_priority` | 0.95 | 0.98 | 0.6 |
| `press_trigger_intensity_high` | 0.5 | 0.4 | 0.9 |
| `press_as_first_defender` | 0.5 | 0.4 | 0.85 |
| `tackle_attempt_frequency` | 0.7 | 0.65 | 0.9 |
| `defensive_aggression` | 0.6 | 0.55 | 0.85 |
| `tracking_runner_priority` | 0.6 | 0.55 | 0.8 |
| `counter_press_intensity` | 0.6 | 0.55 | 0.95 |
| `second_ball_anticipation` | 0.85 | 0.9 | 0.95 |
| `work_rate_out_of_possession` | 0.8 | 0.8 | 0.95 |
| `energy_conservation_philosophy` | 0.5 | 0.55 | 0.2 |

---

## CENTRAL MIDFIELDERS

### Box-to-Box Midfielder (mid-box-to-box.json)
Complete midfielder with tireless work ethic. Contributes in both penalty boxes, makes late runs, tracks back diligently. Balanced skill set across all phases, high stamina and work rate define the role. Embodies the modern complete midfielder archetype.

### Mezzala (mid-mezzala.json)
Creative central midfielder who drifts into half-spaces and wide areas. Makes underlapping runs, links play between midfield and attack, operates in channels. Combines technical quality with intelligent movement off the ball, creating numerical advantages in wide zones.

### Deep-Lying Playmaker (mid-deep-lying-playmaker.json)
Quarterback from deep. Dictates tempo, orchestrates attacks with range of passing, rarely leaves central position. Prioritizes vision and distribution over physical contribution, often drops deep to collect the ball and start attacks with precision.

### Carrilero (mid-carrilero.json)
Shuttling midfielder who covers lateral space. Supports wide areas, tracks runners, links defense to attack through tireless lateral movement. Provides defensive width and positional flexibility without extreme offensive contribution. Named after Spanish railway workers for constant shuttling.

### Roaming Playmaker (mid-roaming-playmaker.json)
Creative midfielder with license to roam. Drifts across positions seeking space, combines technical quality with tactical freedom. Unpredictable movement creates overloads and disorganizes opposition shape, demanding special tactical accommodation from teammates.

#### Key Differentiators

| Tendency | Box-to-Box | Mezzala | DLP | Carrilero | Roaming PM |
|----------|------------|---------|-----|-----------|------------|
| `positional_freedom` | 0.6 | 0.75 | 0.3 | 0.55 | 0.9 |
| `position_maintenance_discipline` | 0.5 | 0.4 | 0.75 | 0.6 | 0.25 |
| `horizontal_roaming_range` | 0.6 | 0.75 | 0.4 | 0.8 | 0.85 |
| `vertical_roaming_range` | 0.8 | 0.7 | 0.4 | 0.6 | 0.85 |
| `late_run_frequency` | 0.75 | 0.7 | 0.15 | 0.45 | 0.65 |
| `underlap_run_frequency` | 0.5 | 0.85 | 0.15 | 0.5 | 0.65 |
| `through_ball_attempt_frequency` | 0.4 | 0.6 | 0.8 | 0.3 | 0.75 |
| `tempo_control` | 0.6 | 0.65 | 0.9 | 0.6 | 0.75 |
| `creativity` | 0.6 | 0.8 | 0.9 | 0.5 | 0.95 |
| `creative_risk_taking` | 0.5 | 0.7 | 0.7 | 0.4 | 0.85 |
| `defensive_balance_priority` | 0.7 | 0.6 | 0.8 | 0.8 | 0.55 |
| `tracking_back_intensity` | 0.9 | 0.7 | 0.65 | 0.85 | 0.6 |
| `work_rate_out_of_possession` | 0.9 | 0.75 | 0.65 | 0.9 | 0.7 |
| `workrate` | 0.95 | 0.8 | 0.65 | 0.9 | 0.75 |
| `energy_conservation_philosophy` | 0.2 | 0.3 | 0.5 | 0.25 | 0.35 |

---

## ATTACKING MIDFIELDERS

### Advanced Playmaker (mid-advanced-playmaker.json)
Creative orchestrator in the final third. Exceptional vision and passing, patient in possession, seeks to unlock defenses with through balls and intelligent movement. Operates between the lines with technical excellence, prioritizing creation over goalscoring.

### Attacking Midfielder (mid-attacking-midfielder.json)
Balanced attacking midfielder. Combines creative passing with goal threat, supports strikers while contributing goals. Versatile presence between midfield and attack, comfortable receiving, passing, and shooting. Classic number 10 role.

### Shadow Striker (mid-shadow-striker.json)
Goal-hunting attacking midfielder. Makes late runs into the box, prioritizes shooting over creation. Ghost-like movement off defenders' shoulders, exploits space behind strikers. More striker than playmaker, often highest scorer despite nominal midfield position.

#### Key Differentiators

| Tendency | Adv. Playmaker | Att. Midfielder | Shadow Striker |
|----------|----------------|-----------------|----------------|
| `shot_position_seeking_aggression` | 0.5 | 0.7 | 0.85 |
| `penalty_box_invasion_frequency` | 0.5 | 0.7 | 0.85 |
| `shooting_frequency` | 0.5 | 0.7 | 0.85 |
| `shot_selection_patience` | 0.8 | 0.6 | 0.4 |
| `late_run_frequency` | 0.6 | 0.7 | 0.9 |
| `blind_side_run_frequency` | 0.6 | 0.65 | 0.85 |
| `box_entry_run_frequency` | 0.6 | 0.75 | 0.9 |
| `through_ball_attempt_frequency` | 0.9 | 0.7 | 0.5 |
| `creativity` | 0.95 | 0.8 | 0.6 |
| `space_creation_for_others` | 0.85 | 0.7 | 0.55 |
| `link_up_play_involvement` | 0.95 | 0.85 | 0.7 |
| `selfishness` | 0.3 | 0.5 | 0.7 |
| `counter_attack_participation` | 0.75 | 0.8 | 0.9 |
| `forward_run_frequency` | 0.6 | 0.75 | 0.85 |

---

## WINGERS

### Traditional Winger (att-traditional-winger.json)
Classic touchline winger. Hugs the sideline, receives wide, delivers crosses. Stretches defenses horizontally, creates space for overlapping full-backs and central strikers. Pure width provider with excellent crossing ability.

### Inside Forward (att-inside-forward.json)
Goal-scoring winger who cuts inside. Dribbles infield onto stronger foot, shoots frequently from diagonal angles. Invades the penalty area, threatens goal directly. More goalscorer than creator, exploits inside channels.

### Inverted Winger (att-inverted-winger.json)
Creative winger who operates on "wrong" flank. Cuts inside with technique, creates through passing and linkup, provides underlapping runs. Focuses on playmaking over goalscoring, opens space for overlapping full-backs.

#### Key Differentiators

| Tendency | Traditional | Inside Forward | Inverted |
|----------|-------------|----------------|----------|
| `horizontal_width` | 0.95 | 0.8 | 0.75 |
| `pulls_wide_bias` | 0.95 | 0.7 | 0.65 |
| `cross_frequency_wide` | 0.9 | 0.5 | 0.4 |
| `early_cross_preference` | 0.75 | 0.5 | 0.45 |
| `shooting_frequency` | 0.55 | 0.8 | 0.6 |
| `diagonal_run_frequency` | 0.65 | 0.85 | 0.75 |
| `dribble_direction_bias` | 0.15 | 0.75 | 0.8 |
| `penalty_box_invasion_frequency` | 0.6 | 0.8 | 0.65 |
| `creativity` | 0.6 | 0.6 | 0.85 |
| `through_ball_attempt_frequency` | 0.4 | 0.5 | 0.7 |
| `link_up_play_involvement` | 0.7 | 0.65 | 0.85 |
| `underlap_run_frequency` | 0.4 | 0.5 | 0.7 |
| `space_creation_for_others` | 0.55 | 0.5 | 0.7 |
| `selfishness` | 0.5 | 0.7 | 0.4 |
| `overlap_run_frequency` | 0.2 | 0.25 | 0.3 |

---

## SECOND STRIKERS / CENTER FORWARDS

### Second Striker (att-second-striker.json)
Support striker behind the main forward. Excellent link-up play, intelligent late runs, creates and scores in equal measure. Operates between midfield and attack, combines technical skill with positional awareness. Facilitates team play while contributing goals.

### False 9 (att-false-9.json)
Revolutionary striker who drops deep. Abandons traditional striker position, drags defenders out, creates space for runners. Exceptional creativity and vision, acts as deep playmaker while nominally positioned as striker. Requires intelligent teammates making runs.

### Deep-Lying Forward (att-deep-lying-forward.json)
Link-play specialist who connects midfield to attack. Drops to feet frequently, excellent hold-up and lay-offs, prioritizes team involvement over personal glory. Creates space and opportunities for others through intelligent positioning and technical quality.

#### Key Differentiators

| Tendency | Second Striker | False 9 | Deep-Lying Fwd |
|----------|----------------|---------|----------------|
| `run_to_feet_frequency` | 0.7 | 0.9 | 0.85 |
| `depth_variation` | 0.75 | 0.9 | 0.8 |
| `creativity` | 0.8 | 0.95 | 0.75 |
| `through_ball_attempt_frequency` | 0.65 | 0.85 | 0.6 |
| `space_creation_for_others` | 0.7 | 0.9 | 0.75 |
| `link_up_play_involvement` | 0.9 | 0.85 | 0.9 |
| `lay_off_preference` | 0.75 | 0.7 | 0.85 |
| `shooting_frequency` | 0.75 | 0.65 | 0.6 |
| `penalty_box_invasion_frequency` | 0.8 | 0.65 | 0.7 |
| `late_run_frequency` | 0.8 | 0.65 | 0.65 |
| `forward_run_frequency` | 0.75 | 0.6 | 0.65 |
| `positional_freedom` | 0.65 | 0.85 | 0.7 |
| `close_support_frequency` | 0.75 | 0.8 | 0.9 |
| `selfishness` | 0.6 | 0.4 | 0.45 |
| `shot_selection_patience` | 0.55 | 0.65 | 0.65 |

---

## STRIKERS

### Poacher (att-poacher.json)
Pure penalty box predator. Lives for goals, exceptional positioning and anticipation, ruthless finishing from close range. Minimal contribution outside the box, but unmatched instinct for being in the right place at the right time. Clinical and selfish in the best sense.

### Target Man (att-target-man.json)
Physical striker who dominates aerially. Excellent hold-up play, wins flick-ons and lay-offs, brings teammates into play. Less mobile but exceptional at using strength and positioning. Focal point for direct attacking play and set pieces.

### Pressing Forward (att-pressing-forward.json)
High-intensity striker who leads the press. Relentless work rate out of possession, constantly harasses defenders, triggers pressing traps. Combines defensive contribution with finishing ability. First line of defense, tireless energy.

### Complete Forward (att-complete-forward.json)
Versatile striker capable of everything. Scores, creates, presses, links play—no significant weakness. Balanced across all attacking tendencies, adapts to game situations seamlessly. Modern all-around forward who does whatever the team needs.

### Advanced Forward (att-advanced-forward.json)
Pace-driven striker who stretches defenses. Constantly runs in behind, exploits high defensive lines, exceptional off-ball movement. Threatens space as much as possession. Devastating on the counter, forces defenders to drop deep.

#### Key Differentiators

| Tendency | Poacher | Target Man | Pressing Fwd | Complete Fwd | Advanced Fwd |
|----------|---------|------------|--------------|--------------|--------------|
| `penalty_box_invasion_frequency` | 0.95 | 0.75 | 0.85 | 0.85 | 0.9 |
| `run_to_feet_frequency` | 0.5 | 0.85 | 0.6 | 0.7 | 0.5 |
| `aerial_challenge_frequency` | 0.7 | 0.95 | 0.7 | 0.8 | 0.7 |
| `work_rate_out_of_possession` | 0.5 | 0.6 | 0.95 | 0.8 | 0.75 |
| `run_behind_defense_frequency` | 0.8 | 0.5 | 0.8 | 0.75 | 0.95 |
| `shooting_frequency` | 0.95 | 0.7 | 0.8 | 0.8 | 0.85 |
| `link_up_play_involvement` | 0.6 | 0.85 | 0.75 | 0.85 | 0.7 |
| `press_trigger_intensity_high` | 0.5 | 0.5 | 0.95 | 0.7 | 0.65 |
| `selfishness` | 0.9 | 0.6 | 0.6 | 0.6 | 0.7 |
| `counter_attack_participation` | 0.85 | 0.65 | 0.9 | 0.9 | 0.95 |
| `lay_off_preference` | 0.45 | 0.9 | 0.65 | 0.75 | 0.6 |
| `close_range_shot_willingness` | 0.98 | 0.85 | 0.9 | 0.9 | 0.95 |
| `early_run_frequency` | 0.85 | 0.5 | 0.75 | 0.75 | 0.9 |
| `creativity` | 0.4 | 0.55 | 0.6 | 0.75 | 0.65 |
| `counter_press_intensity` | 0.55 | 0.6 | 0.95 | 0.75 | 0.75 |

---

