# POSITIONAL TENDENCIES

## Base Positioning

**Defensive Line Height**
`defensive_line_height`
The average vertical position on the pitch where the player naturally positions themselves. Determines how high up the pitch the player positions relative to their team's goal.
- 0 = Deep in own half, staying near defensive goal line
- 0.5 = Balanced positioning around midfield
- 1 = High near midfield or opposition half, pushing up to opposition goal line

**Horizontal Width**
`horizontal_width`
The lateral position preference from center to touchline. Determines whether a player is a central or wide operator.
- 0 = Stays in central channels, hugs center of pitch
- 0.5 = Half-space operator, balanced positioning
- 1 = Wide near touchline, occupies wide areas

**Vertical Roaming Range**
`vertical_roaming_range`
How much freedom the player takes to move up and down the pitch from their base position. Vertical movement autonomy and range of operation.
- 0 = Maintains fixed vertical position, minimal forward/backward movement
- 0.5 = Moderate roaming with occasional pushes forward or drops back
- 1 = Complete freedom to roam from own box to opposition box

**Horizontal Roaming Range**
`horizontal_roaming_range`
How much freedom the player takes to move laterally across the pitch. Level of autonomy in lateral movement and positional freedom.
- 0 = Stays strictly in assigned lane/channel, rigid horizontal discipline
- 0.5 = Roams within zone but respects general area
- 1 = Drifts across entire width of pitch freely, complete lateral freedom

**Position Maintenance Discipline**
`position_maintenance_discipline`
How rigidly the player sticks to their assigned position versus roaming freely. Tactical discipline versus creative freedom.
- 0 = Constant movement and positional fluidity, free to roam
- 0.5 = Balanced between structure and movement
- 1 = Strict adherence to fixed position regardless of game state

**Positional Freedom**
`positional_freedom`
Overall autonomy from tactical structure. How much the player operates independently of rigid role assignment.
- 0 = Fixed to role position, follows tactical instructions strictly
- 0.5 = Some autonomy within structured framework
- 1 = Free movement across zones, creative license to roam

---

# ATTACKING PHASE - BALL POSSESSION

## Ball Demand & Availability

**Ball Demand Frequency When Close**
`ball_demand_frequency_close`
How often the player actively shows for the ball when they are near (within 10-15 yards) of the ball carrier. Active movement to receive passes in close proximity.
- 0 = Hides or avoids receiving, passive positioning
- 0.5 = Shows selectively, balanced availability
- 1 = Constant demanding and showing for passes, maximum availability

**Ball Demand Frequency When Distant**
`ball_demand_frequency_distant`
How often the player shows for the ball when they are far (20+ yards) from the ball carrier. Making oneself available as a distant option.
- 0 = Doesn't make themselves available from distance
- 0.5 = Occasionally shows for switches and long passes
- 1 = Actively shows and demands the ball even when distant

**Availability to Receive Under Pressure**
`availability_receive_under_pressure`
Willingness to make themselves available for a pass when tightly marked or in crowded areas. Courage to receive in difficult situations.
- 0 = Hides when marked, avoids tight areas
- 0.5 = Shows occasionally when marked but prefers space
- 1 = Actively shows even under intense defensive pressure

**Availability to Receive in Space**
`availability_receive_in_space`
How actively the player positions themselves and signals availability when in open space. Making the most of unmarked situations.
- 0 = Passive positioning even when free
- 0.5 = Moderate signaling and movement in space
- 1 = Active movement and clear signaling when unmarked

## Passing - Distance Categories

**Short Pass Willingness**
`short_pass_willingness`
Preference for playing short passes (0-15 yards). Tendency to keep play tight and maintain possession through short passing.
- 0 = Never chooses short options even when available
- 0.5 = Balanced short passing approach
- 1 = Always prefers short passing when possible, short combinations

**Medium Pass Willingness**
`medium_pass_willingness`
Preference for playing medium-range passes (15-35 yards). Using intermediate passing distances to progress play.
- 0 = Avoids medium-distance passes
- 0.5 = Comfortable with medium-range distribution
- 1 = Prefers medium-range distribution, frequent intermediate passing

**Long Pass Willingness**
`long_pass_willingness`
Preference for playing long passes (35+ yards). Using long-range distribution to switch play or find targets.
- 0 = Never attempts long balls
- 0.5 = Occasional long passing when appropriate
- 1 = Constantly seeks long-range passing opportunities, long diagonal switches

## Passing - Direction & Risk

**Forward Pass Willingness**
`forward_pass_willingness`
Tendency to play passes forward toward the opposition goal. Vertical, progressive passing mindset.
- 0 = Never plays forward passes, always safe/lateral
- 0.5 = Balanced forward passing approach
- 1 = Always looks to pass forward when possible, constant progression

**Lateral Pass Willingness**
`lateral_pass_willingness`
Tendency to play sideways passes across the pitch. Using width to recycle possession or switch play.
- 0 = Never plays lateral passes
- 0.5 = Occasional sideways distribution
- 1 = Prefers sideways distribution to switch play or recycle possession

**Backward Pass Willingness**
`backward_pass_willingness`
Tendency to play passes backward toward own goal. Safety-first, retention-oriented passing.
- 0 = Never plays backward, always progressive
- 0.5 = Occasional safety passes backward
- 1 = Frequently chooses backward/safety passes, slows and recycles

**Passing Risk Appetite**
`passing_risk_appetite`
How risky the player's passing choices are regardless of direction. Willingness to attempt ambitious passes versus safe retention.
- 0 = Only plays safe, simple passes with high completion probability, safe retention
- 0.5 = Balanced risk/reward in passing selection
- 1 = Attempts high-risk passes through tight windows or to heavily marked targets, constant risk for creativity

**Through Ball Attempt Frequency**
`through_ball_attempt_frequency`
How often the player attempts penetrative passes that split defensive lines into space behind defenders. Line-breaking vision and execution.
- 0 = Never attempts through balls
- 0.5 = Occasional through ball attempts when clear opening exists
- 1 = Constantly seeks through ball opportunities, frequent line-breaking passes

**Switch Play Frequency**
`switch_play_frequency`
How often the player attempts long diagonal passes to switch the point of attack from one side to the other. Changing the angle of attack with long switches.
- 0 = Never switches play, keeps play local
- 0.5 = Occasional diagonal switches
- 1 = Constantly looks for switching opportunities, frequent long diagonal switches

## Passing - Situation Specific

**Pass Under Pressure Speed**
`pass_under_pressure_speed`
How quickly the player releases the ball when under defensive pressure. Decision-making speed when pressed.
- 0 = Holds the ball and shields/resists pressure, slow deliberate release
- 0.5 = Quick but measured release under pressure
- 1 = One-touch passing to escape pressure immediately, instant release

**Clearance vs Pass Preference (Defensive Third)**
`clearance_vs_pass_preference_def_third`
Bias toward clearing long versus passing out when in the defensive third, especially under pressure. This primarily shapes CB/FB behaviors for no-nonsense vs ball-playing profiles and interacts with team instructions like Play Out of Defense. It is context-aware: opponents’ press intensity and available outlets should modulate extreme settings.
- 0 = Always looks to pass out, avoids clearances even when pressed
- 0.5 = Situational: clears only when no safe pass exists
- 1 = Clear first under pressure, safety-first decision-making

**Pass in Space Speed**
`pass_in_space_speed`
How quickly the player releases the ball when they have time and space. Tempo control when unpressured.
- 0 = Takes multiple touches and scans before passing
- 0.5 = Moderate pace, 2-3 touches before release
- 1 = Plays one-touch even with time available, accelerates transitions

**First-Time Pass Preference**
`first_time_pass_preference`
General preference for one-touch passing versus taking touches to control. Comfort with immediate distribution.
- 0 = Always takes controlling touches
- 0.5 = Mix of first-time and controlled passing
- 1 = Attempts to play first-time whenever possible

**Tempo Control**
`tempo_control`
Preference for controlling or quickening game rhythm. Impact on overall pace of play.
- 0 = Slows and recycles, deliberate tempo
- 0.5 = Adapts tempo to game situation
- 1 = Accelerates transitions, quickens play constantly

## Dribbling - Context

**Dribbling Frequency When Pressed**
`dribbling_frequency_pressed`
How often the player chooses to dribble when under defensive pressure from nearby opponents. Comfort using dribbling to escape pressure.
- 0 = Never dribbles when pressed, passes immediately
- 0.5 = Occasional dribbling to create space under pressure
- 1 = Always attempts to dribble out of pressure

**Dribbling Frequency in Space**
`dribbling_frequency_space`
How often the player dribbles when they have time and space without immediate pressure. Using dribbling to advance play when free.
- 0 = Passes immediately even when free, quick release
- 0.5 = Moderate dribbling when space permits
- 1 = Constantly dribbles when space is available

**Dribbling vs Multiple Defenders**
`dribbling_vs_multiple_defenders`
Willingness to take on multiple defenders simultaneously. Confidence in 1v2+ situations.
- 0 = Avoids dribbling against multiple opponents
- 0.5 = Selective attempts against multiple defenders
- 1 = Actively takes on 2+ defenders

**Overall Dribble Frequency**
`dribble_frequency`
General frequency of attempting to beat an opponent 1v1 across all situations. Overall dribbling tendency.
- 0 = Rarely dribbles, prefers passing
- 0.5 = Balanced dribbling approach
- 1 = Constantly dribbles at every opportunity

**Ball Carry Distance**
`ball_carry_distance`
Typical distance carried before passing or shooting. How far the player runs with the ball.
- 0 = Quick release, minimal carrying
- 0.5 = Moderate progressive carries
- 1 = Long progressive carries, runs far with ball

## Dribbling - Direction

**Progressive Dribble Willingness**
`progressive_dribble_willingness`
Tendency to dribble forward toward the opposition goal. Using dribbling for vertical progression.
- 0 = Never dribbles forward, only lateral/backward
- 0.5 = Balanced forward dribbling
- 1 = Constantly attacks forward with the ball, vertical forward runs

**Lateral Dribble Willingness**
`lateral_dribble_willingness`
Tendency to dribble sideways across the pitch to find better angles or switch play. Horizontal movement with the ball.
- 0 = Never dribbles laterally
- 0.5 = Occasional lateral movement to create angles
- 1 = Frequently uses lateral dribbling to create angles

**Dribble to Retain Possession**
`dribble_retain_possession`
Using dribbling primarily to shield the ball and hold up play rather than advance. Protective, retention-focused dribbling.
- 0 = Never shields/holds up with the ball
- 0.5 = Occasional shielding when needed
- 1 = Constantly uses body to retain possession under pressure, lateral or shielding dribbles

**Dribble Direction Bias**
`dribble_direction_bias`
Overall preferred dribbling path orientation. Primary directional tendency.
- 0 = Vertical forward runs, direct progression
- 0.5 = Balanced directional approach
- 1 = Lateral or shielding dribbles, horizontal movement

## Shooting - Position Seeking

**Shot Position Seeking Aggression**
`shot_position_seeking_aggression`
How aggressively the player moves into optimal shooting positions. Desire to move into closer shooting positions.
- 0 = Stays deep/wide and doesn't seek shooting positions, content staying outside box
- 0.5 = Moderate movement into shooting zones
- 1 = Constantly maneuvers to get into prime shooting locations, aggressively seeks box area

**Penalty Box Invasion Frequency**
`penalty_box_invasion_frequency`
How often the player enters the penalty area during attacking phases. Goal proximity seeking.
- 0 = Never enters the box
- 0.5 = Selective box entries when opportunity arises
- 1 = Constant presence in the penalty area

## Shooting - Distance Independent

**Close-Range Shot Taking Willingness**
`close_range_shot_willingness`
Willingness to shoot from close range (<18 yards) when the opportunity presents itself. Confidence and decisiveness inside the box.
- 0 = Never shoots even when close, hesitant inside box
- 0.5 = Selective close-range shooting
- 1 = Takes every close-range shooting opportunity, quick trigger when close

**Medium-Range Shot Taking Willingness**
`medium_range_shot_willingness`
Willingness to shoot from medium range (18-25 yards). Confidence from edge of box area.
- 0 = Never shoots from this distance
- 0.5 = Occasional medium-range attempts
- 1 = Frequently attempts shots from medium range

**Long-Range Shot Taking Willingness**
`long_range_shot_willingness`
Willingness to shoot from long range (25+ yards). Ambition to shoot from distance.
- 0 = Never attempts long shots, avoids long shots
- 0.5 = Occasional long-range efforts when well-positioned
- 1 = Frequently shoots from distance, shoots from range constantly

**Shot Selection Patience**
`shot_selection_patience`
How patient the player is in waiting for optimal shooting opportunities. Quality versus quantity approach.
- 0 = Shoots at the first sight of goal, shoots at any opportunity
- 0.5 = Balanced shot selection
- 1 = Waits for the perfect moment even if it means not shooting, waits for perfect chance

**Overall Shooting Frequency**
`shooting_frequency`
General willingness to attempt shots across all distances and situations. Shooting mentality.
- 0 = Waits for perfect chance, rarely shoots
- 0.5 = Balanced shooting approach
- 1 = Shoots at any opportunity, constant shooting

## Shooting - Type

**Power Shot Preference**
`power_shot_preference`
Preference for striking the ball with power rather than placement. Shot execution style - power focus.
- 0 = Never uses power, pure placement, aims with precision
- 0.5 = Balanced power and placement approach
- 1 = Always strikes with maximum power, hits with power

**Placement Shot Preference**
`placement_shot_preference`
Preference for placing shots with precision rather than power. Shot execution style - finesse focus.
- 0 = Never focuses on placement, pure power
- 0.5 = Mix of placed and driven shots
- 1 = Always prioritizes accurate placement over power, aims with precision

**First-Time Shot Willingness**
`first_time_shot_willingness`
Willingness to shoot without taking a touch to control. Instinctive finishing versus composed shooting.
- 0 = Always takes a controlling touch before shooting
- 0.5 = Mix of first-time and controlled shots
- 1 = Shoots first-time whenever possible

## Crossing

**Cross Delivery Frequency Wide Position**
`cross_frequency_wide`
How often the player crosses when in wide positions near the touchline. Crossing mentality from wide areas.
- 0 = Never crosses from wide areas, rarely crosses
- 0.5 = Selective crossing from wide
- 1 = Crosses at every opportunity from wide, crosses whenever possible

**Cross Delivery Frequency Half-Space**
`cross_frequency_half_space`
How often the player crosses from inside positions (half-spaces between width and center). Interior crossing and cutback tendency.
- 0 = Never crosses from inside
- 0.5 = Occasional cutbacks and inside crosses
- 1 = Constantly delivers crosses or cutbacks from central areas

**Early Cross Preference**
`early_cross_preference`
Preference for delivering crosses before reaching the byline. Crossing depth and timing.
- 0 = Never crosses early, always gets to byline, by-line cutbacks
- 0.5 = Mix of early and deep crosses
- 1 = Always delivers early crosses from deep positions, early crosses from deep

**Cross to Back Post Preference**
`cross_back_post_preference`
Preference for delivering crosses to the far/back post area. Target area - back post.
- 0 = Never targets back post
- 0.5 = Varied crossing targets
- 1 = Always aims for back post

**Cross to Near Post Preference**
`cross_near_post_preference`
Preference for delivering crosses to the near post area. Target area - near post.
- 0 = Never targets near post
- 0.5 = Varied crossing targets
- 1 = Always aims for near post

**Pull-Back Cross Preference**
`pullback_cross_preference`
Preference for cutting the ball back along the ground to the edge of the box. Cutback tendency.
- 0 = Never plays cutbacks
- 0.5 = Occasional pull-backs when appropriate
- 1 = Always looks for pull-back opportunities

## Creative Actions

**Trick/Skill Attempt Frequency**
`trick_skill_frequency`
How often the player attempts flicks, tricks, and skill moves. Flair and showmanship in possession.
- 0 = Never attempts skills, predictable
- 0.5 = Occasional skills when appropriate
- 1 = Constantly uses tricks and flair moves

**Flair vs Efficiency**
`flair_vs_efficiency`
Balance between flashy play and practical effectiveness. Style versus substance approach.
- 0 = Purely pragmatic/efficient play, plays for team moves
- 0.5 = Balanced style with occasional flair
- 1 = Prioritizes showboating and entertainment value, prioritizes self expression

**Creative Risk-Taking**
`creative_risk_taking`
Willingness to attempt spectacular, low-percentage creative actions. Willingness to improvise or attempt inventive actions.
- 0 = Only attempts conservative, proven moves
- 0.5 = Calculated creativity when opportunity presents
- 1 = Constantly tries audacious creative plays, spontaneous and imaginative

**Creativity / Vision**
`creativity`
Overall tendency toward improvisation and inventive play. Imaginative decision-making capacity.
- 0 = Predictable, follows patterns
- 0.5 = Moments of creativity within structure
- 1 = Spontaneous and imaginative constantly

## Ball Retention

**Ball Retention Priority Under Pressure**
`ball_retention_priority_pressed`
How much the player prioritizes keeping possession when under pressure versus releasing quickly. Shielding and retention under duress.
- 0 = Passes immediately when pressed
- 0.5 = Moderate shielding and quick release balance
- 1 = Shields and holds the ball maximally under pressure

**Ball Retention Priority in Space**
`ball_retention_priority_space`
How much the player holds onto the ball when they have time and space. Possession mentality when unpressured.
- 0 = Moves the ball on quickly even with time
- 0.5 = Balanced touch-taking in space
- 1 = Takes many touches and holds possession in space

---

# ATTACKING PHASE - OFF-BALL MOVEMENT

## Movement & Support

**Support Distance**
`support_distance`
Preferred spacing from nearby teammates in possession. Proximity to ball and teammates.
- 0 = Close support triangles, tight spacing
- 0.5 = Balanced support distance
- 1 = Stays far to stretch shape, distant positioning

## Runs - Timing

**Early Run Frequency**
`early_run_frequency`
How often the player makes runs before the pass is played, anticipating the ball. Anticipatory movement timing.
- 0 = Never runs early, waits for the pass
- 0.5 = Mix of early and reactive runs
- 1 = Constantly makes early anticipatory runs

**Late Run Frequency**
`late_run_frequency`
How often the player delays their runs until after the pass is played. Reactive run timing.
- 0 = Never makes delayed runs
- 0.5 = Balanced run timing
- 1 = Constantly times runs late

**Run Anticipation vs Reaction**
`run_anticipation_vs_reaction`
Whether the player anticipates and moves before seeing the pass or reacts after seeing it. Overall run timing philosophy.
- 0 = Waits to see the ball before moving, reacts late
- 0.5 = Balanced anticipation and reaction
- 1 = Moves in anticipation before the pass is played, anticipates early

## Runs - Direction/Type

**Run Behind Defense Frequency**
`run_behind_defense_frequency`
How often the player makes runs into channels behind the defensive line. In-behind attacking runs.
- 0 = Never runs in behind, static positioning
- 0.5 = Opportunistic runs behind defense
- 1 = Constantly attacks space behind defenders

**Run Across Defense Frequency**
`run_across_defense_frequency`
How often the player makes lateral runs across the defensive line. Horizontal movement to exploit gaps.
- 0 = Static positioning, no lateral movement
- 0.5 = Occasional movement across the line
- 1 = Constant horizontal movement across defenders

**Run to Feet Frequency**
`run_to_feet_frequency`
How often the player checks toward the ball to receive to feet rather than running away. Dropping deep to link play.
- 0 = Never checks to feet, always runs away
- 0.5 = Mix of checking and running beyond
- 1 = Constantly drops deep to receive

**Diagonal Run Frequency**
`diagonal_run_frequency`
How often the player makes angled runs rather than purely vertical or horizontal. Use of diagonal angles.
- 0 = Only makes straight runs
- 0.5 = Balanced run angles
- 1 = Constant diagonal movement

**Blind Side Run Frequency**
`blind_side_run_frequency`
How often the player attacks the blind side of defenders rather than showing for the ball. Exploiting defender vision gaps.
- 0 = Always shows in defender's vision
- 0.5 = Occasional blind side exploitation
- 1 = Constantly exploits blind spots

## Runs - Area

**Box Entry Run Frequency**
`box_entry_run_frequency`
How often the player makes runs into the penalty area. Attacking the penalty box.
- 0 = Stays outside the box, never enters
- 0.5 = Selective box entries
- 1 = Constantly makes runs into the box

**Near Post Run Frequency**
`near_post_run_frequency`
How often the player attacks the near post area on crosses and through balls. Near post targeting.
- 0 = Never attacks near post
- 0.5 = Occasional near post runs
- 1 = Constantly attacks near post space

**Far Post Run Frequency**
`far_post_run_frequency`
How often the player attacks the far/back post area on crosses. Back post targeting.
- 0 = Never attacks far post
- 0.5 = Occasional far post runs
- 1 = Constantly makes far post runs

**Edge of Box Positioning**
`edge_box_positioning`
How often the player positions themselves at the edge of the penalty area. Operating on the 18-yard line.
- 0 = Avoids the edge, operates elsewhere
- 0.5 = Occasional edge positioning
- 1 = Constantly occupies edge of box positions

## Support Play

**Close Support Frequency**
`close_support_frequency`
How often the player provides close support (within 10 yards) to the ball carrier. Tight triangular support.
- 0 = Stays distant from the ball
- 0.5 = Balanced support distance
- 1 = Constantly provides tight support

**Distant Support Frequency**
`distant_support_frequency`
How often the player provides support from distance, stretching play and offering width/depth. Stretching the opposition shape.
- 0 = Never stretches away, stays close
- 0.5 = Balanced positioning
- 1 = Constantly provides distant support options

**Third Man Run Frequency**
`third_man_run_frequency`
How often the player makes runs beyond both the ball and the first receiver (third man runs). Advanced run-making.
- 0 = Never makes third man runs
- 0.5 = Opportunistic third man runs
- 1 = Constantly exploits these opportunities

**Overlap Run Frequency**
`overlap_run_frequency`
How often the player makes runs outside and beyond a teammate with the ball. External overlapping runs.
- 0 = Never overlaps, rarely overlaps
- 0.5 = Occasional overlaps when space permits
- 1 = Constantly overlaps teammates, frequent overlapping

**Underlap Run Frequency**
`underlap_run_frequency`
How often the player makes runs inside and beyond a teammate with the ball. Internal penetrative runs.
- 0 = Never underlaps
- 0.5 = Occasional inside runs
- 1 = Constantly makes inside runs, constant inside runs

**Forward Run Frequency**
`forward_run_frequency`
Overall likelihood of making forward runs beyond the ball. General attacking run tendency.
- 0 = Holds position, never runs forward
- 0.5 = Selective forward movement
- 1 = Constant forward penetration

## Space Manipulation

**Space Creation for Others**
`space_creation_for_others`
Whether the player exploits space themselves or moves to create space for teammates. Selfless movement versus personal exploitation.
- 0 = Always attacks space personally
- 0.5 = Balanced space usage
- 1 = Primary focus is dragging defenders to create space for others

**Decoy Run Frequency**
`decoy_run_frequency`
How often the player makes runs designed to drag defenders without expecting to receive. Sacrificial off-ball movement.
- 0 = Never makes decoy runs
- 0.5 = Occasional decoy movement
- 1 = Constant sacrificial movement

**Channel Discipline**
`channel_discipline`
How strictly the player stays in their assigned channel/zone versus drifting between all channels. Positional rigidity versus fluidity.
- 0 = Stays in designated zone, rigid horizontal discipline
- 0.5 = Some interchange within general area
- 1 = Freely interchanges across all channels

**Pulls-Wide Bias (Left vs Right)**
`pulls_wide_bias`
Preferred lateral drift bias when pulling wide from central zones. Often correlates with dominant foot and preferred receiving shape (open body to inside or outside). Synergizes with inverted/full-back roles and can be used to open lanes for underlaps or isolate 1v1s on the weak side.
- 0 = Prefers drifting to the left side
- 0.5 = No lateral bias
- 1 = Prefers drifting to the right side

**Depth Variation**
`depth_variation`
How much the player varies their vertical positioning during attacks. Vertical unpredictability.
- 0 = Maintains constant depth
- 0.5 = Occasional depth changes
- 1 = Constantly changes depth to create confusion

## Build-Up Roles & Inversions

**Drop Between Centre-Backs (In Possession)**
`drop_between_center_backs_in_possession`
DM tendency to drop into the back line when the team has the ball (Half-Back behavior). Widens the first line to stretch the press and stabilizes rest defense by forming a temporary back three. Risk: leaves gaps in midfield if timing/cover is poor; trigger quality improves with CB width cues and opponent pressing height.
- 0 = Never drops into the back line
- 0.5 = Situational dropping based on pressure/shape
- 1 = Consistently forms a back three in build-up

**Step Into Midfield (In Possession)**
`step_into_midfield_in_possession`
CB tendency to step forward into midfield lanes during build-up (Libero / Build-Up CB). Helps break the first line, draw a marker, and create 3-2 or 2-3 structures against a front two. Requires coverage and communication; the vacated CB space must be protected by the six or opposite CB.
- 0 = Stays in line, no stepping into midfield
- 0.5 = Situational stepping when space opens
- 1 = Proactively steps into midfield to overload

**Full-Back Inversion Frequency**
`fullback_inversion_frequency`
How often a full-back tucks inside toward midfield in possession. Creates central overloads, supports counter-pressing lanes, and enables box or WM midfield shapes. Pair with winger width/inside-forward roles; risk is wide channel exposure in negative transitions if rest defense is weak.
- 0 = Always stays wide on the touchline
- 0.5 = Occasional inversion depending on build-up
- 1 = Frequently inverts inside to form extra midfielder

**Overlapping Centre-Back Frequency**
`overlapping_center_back_frequency`
How often a wide centre-back in a back three overlaps beyond the wing-back in possession. Useful when the wing-back tucks inside or pins the full-back, creating a surprise wide overload. Demands clear coverage rules from the remaining defenders and the six; mistimed overlaps can expose large half-space channels.
- 0 = Never overlaps
- 0.5 = Situational overlapping when covered
- 1 = Actively overlaps to create wide overloads

## Link-Up & Combinations

**Link-Up Play Involvement**
`link_up_play_involvement`
How often the player engages in combination play and quick passing sequences. Combination play frequency.
- 0 = Avoids combinations, isolated play
- 0.5 = Occasional link-up play
- 1 = Constantly seeks one-twos and link-up play

**One-Two Seeking**
`one_two_seeking`
How often the player specifically looks for wall passes (give-and-go). Direct combination frequency.
- 0 = Never attempts one-twos
- 0.5 = Occasional wall passes
- 1 = Constantly seeks wall pass opportunities

**Lay-Off Preference**
`lay_off_preference`
How often the player simply lays the ball off to nearby teammates with simple touches. Simple possession play.
- 0 = Never plays simple lay-offs
- 0.5 = Occasional simple passes
- 1 = Always chooses the simple lay-off option

**Press-Baiting Tendency**
`press_baiting_tendency`
Willingness to invite pressure before releasing to break lines. High values require first touch, composure, and crisp release timing; best used with rehearsed support angles and pre-planned escape patterns. Risk: turnovers in own half if teammates don’t provide outlets on cue.
- 0 = Releases early to avoid pressure
- 0.5 = Occasional baiting when safe
- 1 = Deliberately draws press to free teammates

---

# TRANSITION - DEFENSE TO ATTACK

**Counter-Attack Sprint Intensity**
`counter_attack_sprint_intensity`
How quickly and intensely the player sprints forward when possession is won. Explosive transitional movement.
- 0 = Stays back during transitions, slow to join
- 0.5 = Moderate counter-attacking involvement
- 1 = Explodes forward at maximum intensity immediately

**Counter-Attack Directness**
`counter_attack_directness`
How direct the player is during transitions from defense to attack. Speed of attacking transition.
- 0 = Builds slowly and patiently, slow structured transition
- 0.5 = Balanced transition speed
- 1 = Maximum speed and directness toward goal, instant surge forward

**Forward Carry Willingness in Transition**
`forward_carry_transition`
Willingness to carry the ball forward personally during transitions rather than passing. Personal ball progression in transition.
- 0 = Passes immediately when winning ball
- 0.5 = Selective carries versus passing
- 1 = Always drives forward with the ball

**Transition Support Speed**
`transition_support_speed`
How quickly the player supports teammates during counter-attacks. Supporting transitional movement.
- 0 = Slow to support transitions
- 0.5 = Moderate support speed
- 1 = Immediate sprint to support counter-attacks

**Transition Positioning - Wide vs Central**
`transition_positioning_wide_central`
Whether the player stays central or stretches wide during transitions. Lateral positioning in transitions.
- 0 = Stays central, narrow transitions
- 0.5 = Balanced positioning
- 1 = Immediately stretches to wide areas in transition

**Counter-Attack Participation**
`counter_attack_participation`
Overall involvement level in fast-break transitions. General counter-attacking mentality.
- 0 = Stays back, minimal involvement
- 0.5 = Selective participation
- 1 = Joins every counter

---

# DEFENSIVE PHASE - PRESSING & ENGAGEMENT

## Press Trigger & Intensity

**Press Trigger Intensity High**
`press_trigger_intensity_high`
How intensely and frequently the player presses in the opposition third. High pressing aggression.
- 0 = Never presses high, drops back
- 0.5 = Moderate high pressing
- 1 = Constant aggressive high pressing

**Press Trigger Intensity Medium**
`press_trigger_intensity_medium`
How intensely and frequently the player presses in the middle third. Midfield pressing engagement.
- 0 = Never presses in midfield
- 0.5 = Selective midfield pressing
- 1 = Constant pressing in middle third

**Press Trigger Intensity Low**
`press_trigger_intensity_low`
How intensely and frequently the player presses in the defensive third. Deep defensive pressing.
- 0 = Never presses deep, holds shape
- 0.5 = Occasional defensive third engagement
- 1 = Actively presses even near own goal

**Press Urgency**
`press_urgency`
Overall how quickly player initiates press on ball carrier across all zones. Speed of pressing trigger.
- 0 = Waits for shape, patient engagement
- 0.5 = Balanced press timing
- 1 = Immediate pressing trigger

## Press Behavior

**Press Initiation Speed**
`press_initiation_speed`
How quickly the player engages when pressing is triggered. Acceleration into press.
- 0 = Patient, delayed engagement
- 0.5 = Moderate engagement speed
- 1 = Immediate explosive pressure

**Press Duration Persistence**
`press_duration_persistence`
How long the player continues pressing before giving up. Sustained pressing effort.
- 0 = Brief press attempts, gives up quickly
- 0.5 = Moderate press duration
- 1 = Relentless pursuit until ball is won or play moves away

**Press Angle - Ball Side**
`press_angle_ball_side`
The angle of approach when pressing. Directional forcing in pressing.
- 0 = Shows the opponent inside, forces centrally
- 0.5 = Neutral pressing angle
- 1 = Shows the opponent outside toward touchline

**Press as First Defender**
`press_as_first_defender`
How often the player acts as the first defender to engage the ball carrier. Primary pressing role.
- 0 = Never engages directly, holds position
- 0.5 = Selective first defender engagement
- 1 = Always first to press

**Press as Second Defender**
`press_as_second_defender`
How actively the player supports a teammate who is pressing. Supporting press role.
- 0 = Doesn't provide press support
- 0.5 = Moderate support positioning
- 1 = Actively closes down space around first presser

## Defensive Actions

**Cover Shadow Priority**
`cover_shadow_priority`
Whether the player engages the ball carrier or prioritizes blocking passing lanes. Direct engagement versus lane occupation.
- 0 = Always engages ball carrier directly
- 0.5 = Balanced approach
- 1 = Focuses on cutting passing lanes

**Tackle Attempt Frequency**
`tackle_attempt_frequency`
How often the player attempts tackles versus just containing. Tackling aggression versus containment.
- 0 = Holds position without tackling, cautious jockey
- 0.5 = Balanced tackle timing
- 1 = Constantly attempts tackles, dives into tackles

**Defensive Aggression**
`defensive_aggression`
Overall intensity and physicality of defensive actions. General defensive intensity.
- 0 = Passive, containing defense, avoids duels
- 0.5 = Balanced defensive approach
- 1 = Aggressive, intense engagement

**Standing Tackle vs Sliding Tackle**
`standing_vs_sliding_tackle`
Preference for staying on feet versus sliding. Tackle type preference.
- 0 = Always slides, frequent sliding
- 0.5 = Balanced tackle type selection
- 1 = Always stays on feet

**Aggression / Duel Frequency**
`aggression`
Overall readiness to engage physically in challenges. Physical commitment level.
- 0 = Avoids duels, minimal contact
- 0.5 = Selective physical engagement
- 1 = Initiates them frequently, maximum physicality

## Interceptions & Anticipation

**Interception Attempt Frequency**
`interception_attempt_frequency`
How often the player attempts to intercept passes. Reading and anticipating passing lanes.
- 0 = Purely reactive defending, conservative
- 0.5 = Balanced interception attempts
- 1 = Constantly reads and attempts interceptions, anticipates and intercepts

**Risk of Interception Attempts**
`interception_attempt_risk`
How risky the interception attempts are. Aggressive anticipation versus safe positioning.
- 0 = Only attempts safe interceptions
- 0.5 = Calculated risks
- 1 = High-risk anticipation that can be exploited if wrong

**Second Ball Anticipation**
`second_ball_anticipation`
How aggressively the player anticipates and attacks loose balls and second balls. Loose ball aggression.
- 0 = Holds position, reactive to loose balls
- 0.5 = Moderate second ball pursuit
- 1 = Attacks every potential second ball

**Anticipation**
`anticipation`
Overall ability to read unfolding play and act early. Cognitive anticipation capacity.
- 0 = Reacts late, slow to read situations
- 0.5 = Good anticipation in familiar situations
- 1 = Anticipates early, reads play before it develops

---

# DEFENSIVE PHASE - POSITIONING

## Defensive Shape

**Defensive Drop Depth**
`defensive_drop_depth`
How deep the player drops when defending. Vertical defensive positioning.
- 0 = Holds a high defensive line
- 0.5 = Moderate defensive depth
- 1 = Drops all the way to the goal line

**Defensive Width Responsibility**
`defensive_width_responsibility`
How wide an area the player covers defensively. Horizontal defensive coverage.
- 0 = Stays narrow/central, compact positioning
- 0.5 = Balanced width responsibility
- 1 = Covers the full width of their zone

**Defensive Line Compactness**
`defensive_line_compactness`
How narrow the player keeps the defensive shape horizontally. Horizontal compression.
- 0 = Spreads wide, maintains width
- 0.5 = Balanced spacing
- 1 = Compresses into narrow defensive block

**Defensive Depth Compactness**
`defensive_depth_compactness`
How compressed the defensive shape is vertically. Vertical compression.
- 0 = Stretched vertically, loose lines
- 0.5 = Moderate vertical spacing
- 1 = Compact vertical spacing between defensive lines

**Defensive Compactness Loyalty**
`defensive_compactness_loyalty`
Maintains team shape over individual pressing. Shape discipline versus ball-chasing.
- 0 = Abandons shape often, ball-focused
- 0.5 = Balanced shape maintenance
- 1 = Stays compact, shape-oriented

## Marking & Tracking

**Zonal vs Man-Marking Preference**
`zonal_vs_man_marking`
Defensive approach to marking opponents. Fundamental marking philosophy.
- 0 = Pure zonal marking (space-oriented), zone-focused
- 0.5 = Hybrid marking approach
- 1 = Pure man-marking (player-oriented), man-focused

**Tracking Runner Priority**
`tracking_runner_priority`
How much the player prioritizes tracking runners versus holding position. Runner tracking versus positional discipline.
- 0 = Holds position strictly, never tracks
- 0.5 = Selective tracking within zone
- 1 = Tracks runners anywhere on the pitch

**Tight Marking Intensity**
`tight_marking_intensity`
How closely the player marks opponents. Marking proximity and pressure.
- 0 = Gives opponents significant space
- 0.5 = Balanced marking distance
- 1 = Tight, physical marking with minimal space

**Tracking Distance Limit**
`tracking_distance_limit`
How far the player is willing to track runners. Maximum tracking range.
- 0 = Only tracks short distances before passing off
- 0.5 = Moderate tracking distances
- 1 = Tracks runners across the entire pitch

**Zone Responsibility**
`zone_responsibility`
Preference for zonal coverage versus man-marking focus. Defensive responsibility type.
- 0 = Man-focused, follows player
- 0.5 = Balanced zonal/man approach
- 1 = Zone-disciplined, holds space

## Duels

**Ground Duel Engagement**
`ground_duel_engagement`
Willingness to engage in physical ground duels. Physical contest commitment on ground.
- 0 = Avoids physical battles
- 0.5 = Selective ground duel engagement
- 1 = Seeks out every ground duel opportunity

**Aerial Challenge Frequency**
`aerial_challenge_frequency`
How often the player contests aerial balls. Aerial duel participation rate.
- 0 = Never challenges aerially, avoids headers
- 0.5 = Selective aerial challenges
- 1 = Contests every aerial ball, contests all high balls

**Aerial Duel Aggression**
`aerial_duel_aggression`
How aggressively the player attacks aerial balls. Intensity of aerial contests.
- 0 = Passive aerial contests
- 0.5 = Moderate aerial aggression
- 1 = Aggressive attacking of aerial balls

**Physical Duel Intensity**
`physical_duel_intensity`
Overall physicality in duels and defensive actions. General physical commitment.
- 0 = Minimal physical contact
- 0.5 = Balanced physicality
- 1 = Maximum physicality and contact

## Defensive Coverage

**Covering Teammate Frequency**
`covering_teammate_frequency`
How often the player provides defensive cover for teammates who have been beaten. Covering support provision.
- 0 = Never provides cover
- 0.5 = Occasional covering runs
- 1 = Constantly covers for teammates

**Defensive Balance Priority**
`defensive_balance_priority`
Whether the player ball-watches or maintains team defensive shape. Shape discipline versus ball focus.
- 0 = Focuses entirely on the ball, ball-watches
- 0.5 = Balanced awareness
- 1 = Prioritizes maintaining balanced team shape

**Tracking Back Intensity**
`tracking_back_intensity`
Effort level in defensive recovery after losing possession. Recovery work rate.
- 0 = Remains advanced, minimal tracking
- 0.5 = Moderate recovery effort
- 1 = Fully tracks to own box

---

# TRANSITION - ATTACK TO DEFENSE

**Counter-Press Intensity**
`counter_press_intensity`
How aggressively the player counter-presses immediately after losing possession. Immediate pressing after turnover.
- 0 = Drops back immediately
- 0.5 = Selective counter-pressing
- 1 = Aggressive immediate press to regain

**Counter-Press Duration**
`counter_press_duration`
How long the player continues counter-pressing. Sustained counter-press effort.
- 0 = Brief counter-press attempt
- 0.5 = Moderate counter-press duration
- 1 = Sustained aggressive counter-pressing

**Recovery Run Speed**
`recovery_run_speed`
How quickly the player sprints back into defensive position after losing possession. Transition recovery pace.
- 0 = Jogs back slowly
- 0.5 = Moderate recovery pace
- 1 = Maximum sprint intensity immediately

**Recovery Run Discipline**
`recovery_run_discipline`
How organized and intelligent the recovery run is. Quality of defensive transition.
- 0 = Often caught out of position
- 0.5 = Generally sound positioning
- 1 = Immediately recovers to optimal defensive position

**Transition Defensive Positioning Priority**
`transition_defensive_positioning_priority`
Whether the player chases the ball or prioritizes getting into good defensive position. Ball-chasing versus positional recovery.
- 0 = Chases ball, reactive
- 0.5 = Balanced approach
- 1 = Immediately moves to optimal defensive position

**Counter-Press Reaction**
`counter_press_reaction`
Overall response immediately after losing the ball. Immediate turnover response.
- 0 = Drops back, disengages
- 0.5 = Situational counter-pressing
- 1 = Presses to recover instantly

**Defensive Transition Delay**
`defensive_transition_delay`
Delay before retreating after loss. Speed of defensive transition initiation.
- 0 = Instant drop, immediate retreat
- 0.5 = Moderate transition speed
- 1 = Lingers forward, slow to retreat

---

# PHYSICAL & TEMPO

**Movement Tempo - With Ball**
`movement_tempo_with_ball`
The speed and intensity of movement when in possession. Pace of on-ball actions.
- 0 = Slow, deliberate movement with ball
- 0.5 = Moderate tempo with possession
- 1 = High-intensity constant movement

**Movement Tempo - Without Ball**
`movement_tempo_without_ball`
The speed and intensity of off-ball movement. Pace of off-ball actions.
- 0 = Slow, minimal movement off ball
- 0.5 = Moderate off-ball activity
- 1 = Constant high-intensity movement

**Sprint Frequency Forward**
`sprint_frequency_forward`
How often the player sprints forward (attacking runs and transitions). Forward sprint tendency.
- 0 = Minimal forward sprints
- 0.5 = Selective forward sprinting
- 1 = Constantly sprinting forward

**Sprint Frequency Backward**
`sprint_frequency_backward`
How often the player sprints backward (recovery runs). Backward sprint tendency.
- 0 = Minimal recovery sprints
- 0.5 = Moderate recovery sprinting
- 1 = Constantly sprinting back

**Energy Conservation Philosophy**
`energy_conservation_philosophy`
How the player manages their energy throughout the match. Effort management strategy.
- 0 = Maximum effort always regardless of situation
- 0.5 = Smart energy management
- 1 = Highly selective with efforts to conserve energy

**Work Rate in Possession**
`work_rate_in_possession`
Overall activity level and intensity during attacking phases. Offensive work rate.
- 0 = Minimal movement when team has ball, conserves energy
- 0.5 = Balanced attacking work rate
- 1 = Maximum intensity and constant movement

**Work Rate Out of Possession**
`work_rate_out_of_possession`
Overall activity level and intensity during defensive phases. Defensive work rate.
- 0 = Minimal defensive work rate
- 0.5 = Balanced defensive effort
- 1 = Maximum defensive intensity

**Workrate / Stamina Bias**
`workrate`
Overall effort level sustained throughout the match. Stamina and engine.
- 0 = Conserves energy, selective efforts
- 0.5 = Sustainable work rate
- 1 = Relentless engine, maximum effort always

---

# MENTAL & DECISION-MAKING TENDENCIES

**Composure vs Instinct**
`composure_vs_instinct`
Decision speed under pressure. Thinking versus reacting.
- 0 = Deliberate and calm, measured decisions
- 0.5 = Balanced composure and instinct
- 1 = Impulsive and fast-reacting, instinctive

**Spatial Awareness**
`spatial_awareness`
Tendency to maintain good spacing and positional understanding. Environmental awareness.
- 0 = Static, poor positional awareness
- 0.5 = Good situational awareness
- 1 = Constantly scanning and adjusting

**Decision Consistency**
`decision_consistency`
Reliability in repeating smart decisions under fatigue. Mental reliability.
- 0 = Erratic, inconsistent choices
- 0.5 = Generally reliable
- 1 = Dependable decision-maker always

**Selfishness (Goal Focus)**
`selfishness`
Preference to finish attacks rather than pass. Individual versus team focus.
- 0 = Looks for teammates, team-first
- 0.5 = Balanced decision-making
- 1 = Prioritizes shooting, self-first

**Team Orientation**
`team_orientation`
Cooperative playmaking versus individualistic approach. Collective versus individual play.
- 0 = Plays for team moves, collective focus
- 0.5 = Balanced team/individual play
- 1 = Prioritizes self expression, individualistic

---

# INDIVIDUAL PREFERENCES

These tendencies represent individual player preferences and habits that are independent of playing style or tactical role. They reflect personal characteristics rather than positional archetypes.

## Set-Piece Preferences

**Free Kick Taking Preference**
`free_kick_taker_preference`
Willingness and preference to take free kicks. Personal ambition for set-piece responsibility; can improve perceived authority and rhythm for specialists. Team instructions or analytics may still override selection in specific zones or angles.
- 0 = Never wants to take free kicks, prefers others
- 0.5 = Happy to take if asked but not demanding
- 1 = Always demands to take free kicks, primary taker mentality

**Penalty Taking Preference**
`penalty_taker_preference`
Willingness and confidence to take penalties. Penalty-taking mentality that partially reflects pressure resilience and clutch disposition. Managerial policy can rotate duties regardless of preference to manage fatigue or psychology.
- 0 = Avoids penalty duty, prefers others
- 0.5 = Willing to take if assigned
- 1 = Demands penalty duty, confident taker

**Corner Taking Preference**
`corner_taker_preference`
Willingness to take corner kicks. Set-piece delivery preference that also interacts with footedness (in/outswing profiles) and delivery type. Some teams switch takers by side to preserve near-post routines or favor inswing.
- 0 = Never takes corners, prefers being in the box
- 0.5 = Comfortable taking corners when assigned
- 1 = Prefers taking corners over attacking them

## Personal Habits

**Leadership Vocal Intensity**
`leadership_vocal_intensity`
How vocal and commanding the player is on the pitch. Communication frequency and intensity that can improve block cohesion, pressing synchronization, and set-piece organization. Excessive vocal control can conflict with rigid tactical instructions if misaligned.
- 0 = Silent, never communicates
- 0.5 = Communicates when necessary
- 1 = Constantly talking, organizing, commanding teammates

**Celebration Extravagance**
`celebration_extravagance`
Goal celebration style and intensity. Emotional expression after scoring that can influence crowd energy and teammate morale, but risks time-wasting if excessive. Referee tolerance varies by competition and game state.
- 0 = Minimal celebration, straight back to center
- 0.5 = Moderate celebration with teammates
- 1 = Elaborate, theatrical celebrations

**Arguing with Referee Frequency**
`referee_arguing_frequency`
How often the player disputes referee decisions. Disciplinary risk from dissent with potential yellow cards or added stoppage time at critical moments. Captains with higher values may still be effective advocates if they manage tone and timing.
- 0 = Never argues, accepts all decisions
- 0.5 = Occasional protests on major decisions
- 1 = Constantly arguing with officials

**Injury Recovery Mentality**
`injury_recovery_speed_mentality`
Approach to playing through minor discomfort. Pain tolerance and toughness that affect availability and training continuity, but may raise long-term aggravation risk. Compliance with physio guidance and squad depth moderates practical outcomes.
- 0 = Very cautious, sits out with minor knocks
- 0.5 = Balanced approach to injury management
- 1 = Plays through pain, rarely reports injuries

---

# GOALKEEPER-SPECIFIC TENDENCIES

## Positioning - Base

**Defensive Line Starting Position**
`gk_defensive_line_position`
How far from goal the goalkeeper typically positions themselves. Average starting distance from goal line.
- 0 = Stays on the goal line
- 0.5 = Moderate positioning in goal area
- 1 = Positions at the edge of the penalty area, far sweeper position

**Lateral Positioning Aggression**
`gk_lateral_positioning_aggression`
How aggressively the goalkeeper cuts down angles by positioning themselves. Angle-narrowing proactivity.
- 0 = Conservative angle positioning
- 0.5 = Balanced angle management
- 1 = Aggressive angle narrowing

**Set Piece Positioning**
`gk_set_piece_positioning`
Positioning during set pieces. Set-piece starting position.
- 0 = Conservative positioning (back post)
- 0.5 = Balanced set piece positioning
- 1 = Aggressive central positioning

## Build-Up Positioning

**Build-Up Line Participation**
`gk_build_up_line_participation`
Degree to which the goalkeeper steps up to align with, or in between, center-backs during controlled build-up. Higher values create a temporary back three to stretch the first press and multiply short options, supporting ball-playing/libero-keeper profiles. Coverage and press-resistance are prerequisites; poor spacing can expose the goal on turnovers.
- 0 = Stays deep, does not join backline in possession
- 0.5 = Situational stepping up when unpressed and outlets are set
- 1 = Proactively joins the backline as a third CB in early build-up

## Sweeping

**Sweeping Range**
`gk_sweeping_range`
How far from goal the goalkeeper is willing to come to sweep. Maximum sweeping distance.
- 0 = Never leaves the 6-yard box
- 0.5 = Moderate sweeping to penalty area edge
- 1 = Sweeps all the way to the halfway line

**Sweeping Frequency - High Balls**
`gk_sweeping_frequency_high_balls`
How often the goalkeeper comes off their line to collect high balls and crosses. Cross claiming tendency.
- 0 = Never leaves goal line for high balls
- 0.5 = Selective high ball claiming
- 1 = Aggressively claims every high ball, commands area

**Sweeping Frequency - Through Balls**
`gk_sweeping_frequency_through_balls`
How often the goalkeeper rushes out to sweep through balls. Through ball interception tendency.
- 0 = Stays on line for through balls, stays deep
- 0.5 = Selective sweeping of through balls
- 1 = Rushes out for every through ball, sweeps behind defense often

**Sweeping Decision Speed**
`gk_sweeping_decision_speed`
How quickly the goalkeeper makes the decision to sweep. Sweeping decisiveness.
- 0 = Hesitant, slow decision-making
- 0.5 = Measured decision speed
- 1 = Instantaneous decisions

**Box Aggression**
`gk_box_aggression`
Overall frequency of leaving box to intercept through balls. General sweeping aggression.
- 0 = Stays deep, rarely leaves box
- 0.5 = Moderate box aggression
- 1 = Sweeps behind defense often

## 1v1 Situations

**1v1 Rushing Aggression**
`gk_1v1_rushing_aggression`
How aggressively the goalkeeper rushes out in 1v1 situations. Proactive engagement in 1v1s.
- 0 = Stays back on line
- 0.5 = Balanced 1v1 approach
- 1 = Charges out aggressively

**1v1 Timing**
`gk_1v1_timing`
When the goalkeeper commits in 1v1s. Timing of 1v1 commitment.
- 0 = Rushes out early, premature engagement
- 0.5 = Balanced timing
- 1 = Waits late for calculated timing

**1v1 Size Making**
`gk_1v1_size_making`
How much the goalkeeper spreads themselves to appear big in 1v1s. Physical presence in 1v1s.
- 0 = Stays compact/small
- 0.5 = Moderate spreading
- 1 = Maximizes size by spreading

## Distribution - Speed & Style

**Distribution Speed After Save**
`gk_distribution_speed_after_save`
How quickly the goalkeeper distributes after making a save. Counter-attack initiation speed.
- 0 = Slow, deliberate distribution
- 0.5 = Moderate distribution pace
- 1 = Immediate release to launch counters, immediate counter launch

**Distribution Speed After Collection**
`gk_distribution_speed_after_collection`
How quickly the goalkeeper distributes after collecting the ball in open play. General distribution tempo.
- 0 = Slow distribution, resets play
- 0.5 = Balanced distribution speed
- 1 = Instant release

**Distribution Under Pressure Speed**
`gk_distribution_speed_under_pressure`
How quickly the goalkeeper releases when being pressed. Composure under pressure.
- 0 = Waits for space/time, holds when pressed
- 0.5 = Measured release under pressure
- 1 = Quick release under pressure, calm under press

**Counter-Launch Instinct**
`gk_counter_launch_instinct`
Speed of initiating counter after catching the ball. Transition initiation mentality.
- 0 = Resets play, slow to launch
- 0.5 = Situational counter launching
- 1 = Immediate counter launch

## Distribution - Distance

**Short Distribution Preference**
`gk_short_distribution_preference`
Preference for short distribution (<20 yards) to nearby defenders. Build-up play tendency.
- 0 = Never plays short, always long
- 0.5 = Balanced distribution range
- 1 = Always prefers short distribution, short build-up

**Medium Distribution Preference**
`gk_medium_distribution_preference`
Preference for medium-range distribution (20-40 yards) to midfielders. Intermediate distribution.
- 0 = Never plays medium range
- 0.5 = Balanced distribution distances
- 1 = Always prefers medium distribution

**Long Distribution Preference**
`gk_long_distribution_preference`
Preference for long distribution (40+ yards) to forwards. Direct launching tendency.
- 0 = Never plays long, short build-up only
- 0.5 = Balanced long/short approach
- 1 = Always prefers long distribution, long launches

**Distribution Range**
`gk_distribution_range`
Overall prefers short build-up versus long launches. General distribution philosophy.
- 0 = Short, patient build-up
- 0.5 = Varied distribution
- 1 = Long, direct launching

## Distribution - Type

**Pass to Feet Preference**
`gk_pass_to_feet_preference`
Preference for passing accurately to teammates' feet versus other distribution methods. Precision passing tendency.
- 0 = Never passes to feet, always launches
- 0.5 = Balanced distribution types
- 1 = Always passes accurately to feet

**Throw Preference**
`gk_throw_preference`
Preference for throwing the ball versus other distribution methods. Hand distribution usage.
- 0 = Never throws, always kicks
- 0.5 = Situational throwing
- 1 = Always throws when legally possible

**Kick from Hands Preference**
`gk_kick_from_hands_preference`
Preference for kicking from hands (drop kicks, volleys) versus other methods. Hand-kick distribution.
- 0 = Never kicks from hands
- 0.5 = Balanced kicking approach
- 1 = Always kicks from hands

**Goal Kick Short Preference**
`gk_goal_kick_short_preference`
Preference for short goal kicks versus long. Goal kick philosophy.
- 0 = Always plays long goal kicks
- 0.5 = Varied goal kick approach
- 1 = Always plays short goal kicks

**Goal Kick Directness**
`gk_goal_kick_directness`
How direct and progressive goal kicks are. Goal kick ambition.
- 0 = Safe, sideways goal kicks
- 0.5 = Balanced progression
- 1 = Progressive, forward-thinking goal kicks

## Ball Playing

**Ball Playing Confidence - No Pressure**
`gk_ball_playing_confidence_no_pressure`
Comfort level with the ball at feet when not under pressure. Outfield play comfort in space.
- 0 = Minimal touches even when free
- 0.5 = Comfortable with basic footwork
- 1 = Comfortable dribbling and playing freely

**Ball Playing Confidence - Under Pressure**
`gk_ball_playing_confidence_under_pressure`
Comfort level with the ball at feet when being pressed. Composure under pressing.
- 0 = Immediately clears under any pressure, clears safe
- 0.5 = Moderate comfort under pressure
- 1 = Comfortable playing out even under intense press, calm under press

**First Touch Composure**
`gk_first_touch_composure`
Quality and calmness of first touch when receiving back passes or collecting balls. Touch quality under pressure.
- 0 = Panicked, heavy touches
- 0.5 = Reliable first touch
- 1 = Ice-cold composure

**Passing Range Ambition**
`gk_passing_range_ambition`
Ambition in attempting various passing distances and types. Passing variety and ambition.
- 0 = Only simple passes
- 0.5 = Comfortable with varied passing
- 1 = Attempts full range of passing including difficult long passes

**Dribbling Willingness**
`gk_dribbling_willingness`
Willingness to dribble with the ball outside the penalty area. Outfield play adventurousness.
- 0 = Never leaves box with ball
- 0.5 = Occasional dribbling when safe
- 1 = Comfortable dribbling outside penalty area

**Pass Risk**
`gk_pass_risk`
Willingness to play risky short passes under pressure. Build-up risk tolerance.
- 0 = Clears safe, no risks
- 0.5 = Calculated risks in build-up
- 1 = Calm under press, high-risk passing

## Shot-Stopping Style

**Dive Commitment**
`gk_dive_commitment`
How fully the goalkeeper commits to diving saves. Save commitment intensity that can extend effective reach and block area but increases exposure to feints and second-ball chaos if the first contact spills. Lower commitment reduces injury/scramble risk but can concede inches on tight finishes.
- 0 = Tentative dives, pulls out early, conservative commitment
- 0.5 = Balanced dive commitment
- 1 = Full extension dives, total commitment to every save

**Parry vs Hold Preference**
`gk_parry_vs_hold_preference`
Handling preference on shots - catching versus parrying to safety. Save handling philosophy that influences rebound zones and second-ball danger; coaching can tune parry angles toward safe areas. Weather and ball conditions should modulate extreme preferences.
- 0 = Always tries to hold/catch when possible, secure handling
- 0.5 = Situational catching and parrying
- 1 = Parries to safety first, minimizes catching risks

**Low Shot Positioning**
`gk_low_shot_positioning`
Positioning and technique for low shots. Low save positioning style that improves saves to feet and across-the-body efforts but can compromise readiness for sudden chips or high strikes. Best paired with strong push-off mechanics and quick recovery steps.
- 0 = Stays high, dives down late for low shots
- 0.5 = Balanced positioning for low shots
- 1 = Gets low early, anticipates low shots with low stance

**High Shot Positioning**
`gk_high_shot_positioning`
Positioning and technique for high shots. High save positioning style that helps claim high deliveries and cover the top corners but risks slower access to low corners if stance remains tall. Complementary reflex/anticipation traits mitigate the trade-off.
- 0 = Stays low, jumps late for high shots
- 0.5 = Balanced positioning for high shots
- 1 = Tall stance, anticipates high shots with elevated positioning

**Cross Claiming Frequency**
`gk_cross_claiming`
Likelihood of claiming high crosses versus staying on line. Aerial dominance.
- 0 = Stays on line, never claims
- 0.5 = Selective cross claiming
- 1 = Commands area, claims everything

**Punch vs Catch Bias**
`gk_punch_vs_catch`
Handling style preference on crosses and high balls. Handling decision-making.
- 0 = Always catches when possible
- 0.5 = Situational catching/punching
- 1 = Prefers punching to safety

**Shot-Stopping Reflex Bias**
`gk_reflex_bias`
Shot-stopping approach - positioning versus reflexes. Save style philosophy.
- 0 = Anticipates early, positional saves
- 0.5 = Balanced approach
- 1 = Reacts instinctively, reflex saves

---

# PLAYER ROLE ARCHETYPES

Example tendency profiles for common player role archetypes. These serve as templates that can be customized for individual players.

## FORWARDS

### Target Man
A traditional center forward who holds up play, wins aerial duels, and brings teammates into play.

**Key Tendencies:**
- `close_range_shot_willingness` = 0.9 (clinical in the box)
- `medium_range_shot_willingness` = 0.4 (not their strength)
- `long_range_shot_willingness` = 0.2 (rarely shoots from distance)
- `aerial_challenge_frequency` = 0.95 (constant aerial presence)
- `lay_off_preference` = 0.85 (brings teammates into play)
- `link_up_play_involvement` = 0.8 (drops deep to connect)
- `penalty_box_invasion_frequency` = 0.9 (always in dangerous areas)
- `run_behind_defense_frequency` = 0.3 (not pace-reliant)
- `physical_duel_intensity` = 0.9 (holds off defenders)
- `movement_tempo_with_ball` = 0.3 (slow, deliberate)
- `dribbling_frequency_space` = 0.2 (passes rather than dribbles)

### Poacher
Pure goal scorer who lives in the penalty box and focuses on finishing chances.

**Key Tendencies:**
- `close_range_shot_willingness` = 1.0 (always shoots when close)
- `medium_range_shot_willingness` = 0.7 (will shoot if clear)
- `long_range_shot_willingness` = 0.1 (waits for better position)
- `shot_position_seeking_aggression` = 0.95 (constantly hunting goals)
- `penalty_box_invasion_frequency` = 1.0 (lives in the box)
- `run_behind_defense_frequency` = 0.85 (exploits offside trap)
- `run_anticipation_vs_reaction` = 0.8 (early runs)
- `selfishness` = 0.8 (shoot-first mentality)
- `passing_risk_appetite` = 0.3 (simple passes only)
- `link_up_play_involvement` = 0.2 (not their game)

### Complete Forward
Versatile striker who can do everything - score, assist, dribble, and link play.

**Key Tendencies:**
- `close_range_shot_willingness` = 0.85
- `medium_range_shot_willingness` = 0.75
- `long_range_shot_willingness` = 0.6
- `dribbling_frequency_space` = 0.75 (comfortable on ball)
- `progressive_dribble_willingness` = 0.8 (runs at defense)
- `link_up_play_involvement` = 0.75 (good combination play)
- `creative_risk_taking` = 0.7 (tries ambitious plays)
- `run_behind_defense_frequency` = 0.7
- `aerial_challenge_frequency` = 0.7
- `selfishness` = 0.5 (balanced decision-making)
- `team_orientation` = 0.7 (team player who can score)

### Deep-Lying Forward (False 9)
Forward who drops deep to create space and link play, rather than staying high.

**Key Tendencies:**
- `defensive_line_height` = 0.4 (drops deeper)
- `vertical_roaming_range` = 0.9 (huge vertical freedom)
- `positional_freedom` = 0.85 (drifts across frontline)
- `link_up_play_involvement` = 0.95 (primary playmaker)
- `through_ball_attempt_frequency` = 0.85 (creates chances)
- `creative_risk_taking` = 0.8 (ambitious passing)
- `penalty_box_invasion_frequency` = 0.6 (late arrival)
- `run_behind_defense_frequency` = 0.3 (not their role)
- `close_support_frequency` = 0.9 (always available)
- `spatial_awareness` = 0.9 (finds pockets)

## WINGERS

### Inside Forward
Winger who cuts inside to shoot and create, rather than crossing.

**Key Tendencies:**
- `horizontal_width` = 0.8 (starts wide)
- `horizontal_roaming_range` = 0.7 (drifts inside)
- `medium_range_shot_willingness` = 0.9 (cuts in to shoot)
- `long_range_shot_willingness` = 0.75 (curlers from edge)
- `cross_frequency_wide` = 0.3 (prefers cutting inside)
- `progressive_dribble_willingness` = 0.85 (runs at defense)
- `dribble_direction_bias` = 0.85 (inside cutting tendency)
- `penalty_box_invasion_frequency` = 0.8 (arrives in box)
- `selfishness` = 0.65 (looks to score)
- `trick_skill_frequency` = 0.7 (beats defenders)

### Traditional Winger
Wide player who hugs touchline and delivers crosses.

**Key Tendencies:**
- `horizontal_width` = 0.95 (stays very wide)
- `horizontal_roaming_range` = 0.3 (disciplined width)
- `cross_frequency_wide` = 0.95 (constant crossing)
- `early_cross_preference` = 0.75 (whips it in)
- `medium_range_shot_willingness` = 0.3 (crossing preferred)
- `dribbling_frequency_space` = 0.8 (beats fullback)
- `lateral_dribble_willingness` = 0.9 (hugs touchline)
- `penalty_box_invasion_frequency` = 0.2 (stays wide)
- `team_orientation` = 0.85 (service-focused)
- `channel_discipline` = 0.9 (stays in lane)

## MIDFIELDERS

### Deep-Lying Playmaker (Regista)
Deep midfielder who dictates tempo and distributes from deep positions.

**Key Tendencies:**
- `defensive_line_height` = 0.3 (sits deep)
- `positional_freedom` = 0.7 (roams to find space)
- `long_pass_willingness` = 0.95 (switches play constantly)
- `through_ball_attempt_frequency` = 0.85 (killer passes)
- `passing_risk_appetite` = 0.75 (ambitious distribution)
- `switch_play_frequency` = 0.9 (changes point of attack)
- `short_pass_willingness` = 0.7 (varied passing)
- `tempo_control` = 0.9 (dictates rhythm)
- `ball_retention_priority_space` = 0.8 (rarely loses ball)
- `movement_tempo_without_ball` = 0.4 (doesn't press high)
- `forward_run_frequency` = 0.2 (stays deep)

### Box-to-Box Midfielder
All-action midfielder who contributes in both penalty boxes.

**Key Tendencies:**
- `vertical_roaming_range` = 0.95 (box to box)
- `work_rate_in_possession` = 0.9
- `work_rate_out_of_possession` = 0.95 (tireless)
- `forward_run_frequency` = 0.8 (late runs)
- `recovery_run_speed` = 0.9 (gets back quickly)
- `medium_range_shot_willingness` = 0.75 (shoots from edge)
- `tackle_attempt_frequency` = 0.75 (wins ball)
- `interception_attempt_frequency` = 0.7
- `press_trigger_intensity_high` = 0.75
- `energy_conservation_philosophy` = 0.2 (relentless)

### Attacking Midfielder (Number 10)
Creative midfielder who operates in the hole between midfield and attack.

**Key Tendencies:**
- `defensive_line_height` = 0.65 (advanced position)
- `creative_risk_taking` = 0.95 (tries difficult passes)
- `through_ball_attempt_frequency` = 0.95 (primary creator)
- `dribbling_frequency_space` = 0.8 (comfortable on ball)
- `trick_skill_frequency` = 0.75 (beats pressing)
- `medium_range_shot_willingness` = 0.8 (shoots from distance)
- `link_up_play_involvement` = 0.9 (connecting play)
- `spatial_awareness` = 0.9 (finds space between lines)
- `work_rate_out_of_possession` = 0.3 (limited defensive work)
- `creativity` = 0.95 (game-changing moments)

### Holding Midfielder (Destroyer)
Defensive midfielder who focuses on winning the ball and protecting the defense.

**Key Tendencies:**
- `defensive_line_height` = 0.25 (sits deep)
- `position_maintenance_discipline` = 0.9 (holds position)
- `tackle_attempt_frequency` = 0.9 (aggressive tackling)
- `defensive_aggression` = 0.85 (committed challenges)
- `interception_attempt_frequency` = 0.9 (reads the game)
- `passing_risk_appetite` = 0.2 (safe distribution)
- `short_pass_willingness` = 0.8 (simple passing)
- `covering_teammate_frequency` = 0.9 (protects defense)
- `defensive_balance_priority` = 0.95 (team shape focus)
- `forward_run_frequency` = 0.1 (stays back)

## DEFENDERS

### Ball-Playing Center Back
Modern defender comfortable with the ball who can initiate attacks.

**Key Tendencies:**
- `defensive_line_height` = 0.6 (higher line)
- `ball_retention_priority_pressed` = 0.75 (calm under pressure)
- `long_pass_willingness` = 0.8 (diagonal switches)
- `passing_risk_appetite` = 0.6 (progressive passing)
- `dribbling_frequency_pressed` = 0.4 (can beat press)
- `defensive_aggression` = 0.6 (measured tackling)
- `tight_marking_intensity` = 0.7
- `aerial_challenge_frequency` = 0.85 (still a defender)
- `first_time_pass_preference` = 0.7 (quick distribution)

### Stopper
Traditional no-nonsense defender who focuses purely on defending.

**Key Tendencies:**
- `defensive_line_height` = 0.35 (sits deeper)
- `defensive_aggression` = 0.95 (aggressive defending)
- `tackle_attempt_frequency` = 0.9 (constant challenges)
- `aerial_challenge_frequency` = 0.95 (dominates aerially)
- `tight_marking_intensity` = 0.9 (man-marking)
- `physical_duel_intensity` = 0.95 (physical presence)
- `passing_risk_appetite` = 0.1 (simple passes only)
- `ball_retention_priority_pressed` = 0.2 (clears it)
- `position_maintenance_discipline` = 0.85 (holds position)

### Full-Back (Defensive)
Full-back who prioritizes defending over attacking.

**Key Tendencies:**
- `horizontal_width` = 0.85 (wide positioning)
- `defensive_width_responsibility` = 0.9 (tracks wide)
- `overlap_run_frequency` = 0.3 (selective overlaps)
- `cross_frequency_wide` = 0.4 (occasional crossing)
- `recovery_run_speed` = 0.95 (rapid recovery)
- `tracking_runner_priority` = 0.9 (follows winger)
- `tight_marking_intensity` = 0.85
- `defensive_balance_priority` = 0.9 (positional discipline)

### Wing-Back
Attacking full-back who operates as a winger in possession.

**Key Tendencies:**
- `horizontal_width` = 0.95 (maximum width)
- `vertical_roaming_range` = 0.85 (up and down)
- `overlap_run_frequency` = 0.9 (constant overlaps)
- `cross_frequency_wide` = 0.85 (primary deliverer)
- `forward_run_frequency` = 0.8 (joins attacks)
- `work_rate_in_possession` = 0.85
- `work_rate_out_of_possession` = 0.9 (recovery runs)
- `energy_conservation_philosophy` = 0.2 (high intensity)

## GOALKEEPERS

### Sweeper Keeper
Modern goalkeeper who acts as an extra defender and plays high.

**Key Tendencies:**
- `gk_defensive_line_position` = 0.85 (very high)
- `gk_sweeping_range` = 0.9 (aggressive sweeping)
- `gk_sweeping_frequency_through_balls` = 0.95 (always sweeps)
- `gk_ball_playing_confidence_under_pressure` = 0.85 (calm on ball)
- `gk_short_distribution_preference` = 0.9 (builds from back)
- `gk_pass_risk` = 0.7 (progressive passing)
- `gk_distribution_range` = 0.3 (short build-up)

### Traditional Goalkeeper
Classic shot-stopper who stays on their line.

**Key Tendencies:**
- `gk_defensive_line_position` = 0.2 (stays deep)
- `gk_sweeping_range` = 0.2 (rarely sweeps)
- `gk_sweeping_frequency_through_balls` = 0.1 (stays on line)
- `gk_ball_playing_confidence_under_pressure` = 0.2 (clears it)
- `gk_long_distribution_preference` = 0.9 (launches long)
- `gk_distribution_range` = 0.9 (direct distribution)
- `gk_cross_claiming` = 0.8 (commands box)
- `gk_reflex_bias` = 0.8 (reflex saves)

---

# IMPLEMENTATION NOTES

## Tendency Value Ranges

When implementing player roles, use these tendency values as starting points and adjust based on:

1. **Player Attributes**: Higher technical attributes may allow more ambitious tendencies
2. **Team Tactics**: Some tendencies should be influenced by team tactical settings
3. **Player Personality**: Individual preferences can override role defaults
4. **Experience**: Younger players may have less refined tendencies
5. **Specific Instructions**: Manager instructions can temporarily modify tendencies

## JSON Format Example

Role-specific tendency sets can be defined with:
- **role**: Role identifier (e.g., "target_man")
- **tendencies**: Key-value pairs of tendency names and values (0.0-1.0 floats)

Example tendency set for target man:
- close_range_shot_willingness: 0.9
- aerial_challenge_frequency: 0.95
- lay_off_preference: 0.85
- link_up_play_involvement: 0.8
- penalty_box_invasion_frequency: 0.9
- physical_duel_intensity: 0.9
- movement_tempo_with_ball: 0.3

## Combining with Team Tactics

Player tendencies work in concert with team tactical settings:

- **Override**: Some team settings override player tendencies (e.g., `team_tempo` forces pace)
- **Accumulate**: Others combine with player values (e.g., `team_pressing_intensity` + `press_trigger_intensity`)
- **Contextual**: Game state can temporarily modify both team and player values

