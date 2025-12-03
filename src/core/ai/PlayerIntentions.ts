/**
 * FC Tycoon™ 2027 Match Simulator - Player Intentions
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import * as THREE from 'three'

// NOTE: This class is PURELY decision-making and state updates for the Player AI. NOT physics or movement handling.

// ═══════════════════════════════════════════════════════════════════════════════
//                      M O V E M E N T   E N U M S
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Speed hint for movement intentions.
 * The AI decides HOW FAST to move (urgency level).
 * Steering/Physics will translate this to actual velocity.
 */
export const enum SpeedHint {
	/** Standing still, but may rotate */
	IDLE = 0,
	/** Slow walk (~1.5 m/s) - conserving energy, positioning */
	WALK = 1,
	/** Light jog (~4 m/s) - standard movement */
	JOG = 2,
	/** Running (~7 m/s) - purposeful movement */
	RUN = 3,
	/** Full sprint (~9.5 m/s) - maximum urgency */
	SPRINT = 4,
}

/**
 * Movement mode relative to body facing direction.
 * Football players can move in any direction regardless of where they're looking.
 *
 * The AI decides HOW to move based on tactical situation:
 * - FORWARD: Normal running, fastest mode
 * - BACKWARD: Backpedaling (jockeying, containing), slower but maintains facing
 * - STRAFE_LEFT/RIGHT: Sidestep movement, useful for positioning adjustments
 * - AUTO: Let steering decide most efficient mode based on target and facing
 */
export const enum MovementMode {
	/** Let steering calculate optimal movement direction */
	AUTO = 0,
	/** Standard forward movement (fastest) */
	FORWARD = 1,
	/** Backpedaling - move backward while facing forward (jockey/contain) */
	BACKWARD = 2,
	/** Sidestep left */
	STRAFE_LEFT = 3,
	/** Sidestep right */
	STRAFE_RIGHT = 4,
}

/**
 * Speed multipliers for different movement modes (relative to forward speed)
 */
export const MovementModeSpeedMultiplier: Readonly<Record<MovementMode, number>> = Object.freeze({
	[MovementMode.AUTO]: 1.0,
	[MovementMode.FORWARD]: 1.0,
	[MovementMode.BACKWARD]: 0.6,      // ~60% of forward speed
	[MovementMode.STRAFE_LEFT]: 0.7,   // ~70% of forward speed
	[MovementMode.STRAFE_RIGHT]: 0.7,
})

/**
 * Base speeds in m/s for each speed hint
 */
export const SpeedHintVelocity: Readonly<Record<SpeedHint, number>> = Object.freeze({
	[SpeedHint.IDLE]: 0,
	[SpeedHint.WALK]: 1.5,
	[SpeedHint.JOG]: 4.0,
	[SpeedHint.RUN]: 7.0,
	[SpeedHint.SPRINT]: 9.5,
})

// ═══════════════════════════════════════════════════════════════════════════════
//                      T A C T I C A L   R E A S O N S
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Why the AI made this decision - for debugging and tactical analysis.
 * DO NOT USE STRINGS for AI decision reasons - use this enum for performance!
 */
export const enum TacticalReason {
	NONE = 0,

	// Movement reasons
	MOVE_TO_SLOT,			// Returning to formation slot
	MOVE_TO_SPACE,			// Finding open space
	SUPPORT_ATTACK,			// Providing passing option
	TRACK_RUNNER,			// Following opponent's run
	COVER_SPACE,			// Filling defensive gap
	RECOVERY_RUN,			// Sprinting back after losing ball

	// Pressing reasons
	PRESS_BALL_CARRIER,		// Closing down player with ball
	PRESS_PASSING_LANE,		// Blocking passing option
	PRESS_TRIGGER,			// Triggered by tactical instruction

	// Marking reasons
	MARK_ASSIGNED,			// Man-marking assignment
	MARK_ZONE_THREAT,		// Marking player entering zone
	MARK_NEAREST,			// Marking nearest opponent

	// Ball actions
	RECEIVE_PASS,			// Moving to receive incoming pass
	CREATE_ANGLE,			// Creating passing angle
	MAKE_RUN,				// Making run into space
	HOLD_POSITION,			// Staying put tactically

	// Defensive
	JOCKEY_ATTACKER,		// Containing attacker
	BLOCK_SHOT,				// Moving to block shot
	INTERCEPT_PASS,			// Attempting interception

	// Set pieces
	SET_PIECE_POSITION,		// Taking set piece position
	WALL_POSITION,			// Forming defensive wall

	// Goalkeeper
	GK_POSITION_ADJUST,		// Adjusting angle coverage
	GK_SWEEP,				// Coming off line
	GK_DISTRIBUTE,			// Looking for distribution
}

/**
 * Communication signals between players.
 * DO NOT USE STRINGS - use this enum for performance!
 */
export const enum CommunicationSignal {
	NONE = 0,

	// Requesting ball
	CALL_FOR_BALL,			// "Here!" - wanting the pass
	CALL_EARLY,				// "Early!" - pass before control
	CALL_FEET,				// "Feet!" - want ball to feet
	CALL_SPACE,				// "Space!" - want ball into space

	// Directing teammates
	POINT_LEFT,				// Pointing to space on left
	POINT_RIGHT,			// Pointing to space on right
	POINT_BEHIND,			// Pointing to space behind defense

	// Warnings
	MAN_ON,					// "Man on!" - pressure coming
	TIME,					// "Time!" - you have space
	TURN,					// "Turn!" - can turn with ball
	LEAVE_IT,				// "Leave it!" - ball going out or keeper's

	// Defensive
	MARK_UP,				// "Mark up!" - pick up a man
	SQUEEZE,				// "Squeeze!" - compress shape
	HOLD_LINE,				// "Hold!" - maintain offside line
	DROP,					// "Drop!" - fall back
}

/**
 * Type of scan target for vision system.
 */
export const enum ScanTargetType {
	/** No active scan target */
	NONE = 0,
	/** Scanning a specific player */
	PLAYER,
	/** Scanning the ball */
	BALL,
	/** Scanning a location (goal, space, passing lane) */
	LOCATION,
}

/**
 * Scan target for vision system - what to look at and why.
 */
export interface ScanTarget {
	/** Type of target being scanned */
	type: ScanTargetType
	/** Player ID if scanning a player */
	playerId?: number
	/** Location if scanning a spot (Vector3 for looking up/down at ball etc.) */
	location?: THREE.Vector3
	/** Why we're scanning this target */
	reason: TacticalReason
}

// ═══════════════════════════════════════════════════════════════════════════════
//                      P L A Y E R   I N T E N T I O N S
// ═══════════════════════════════════════════════════════════════════════════════

export interface PlayerIntentions {
	type: IntentionType

	// ═══════════════════════════════════════════════════════════
	//                 T A R G E T S
	// ═══════════════════════════════════════════════════════════

	/**
	 * Where to move to (2D world coordinates).
	 * X = goal-to-goal, Y = touchline-to-touchline.
	 *
	 * NOTE: This is Vector2, NOT Vector3! Player movement is on the ground plane.
	 * For aerial actions (headers, volleys), use separate action intentions.
	 * Jumping happens at the movement target, not during travel.
	 */
	targetPosition?: THREE.Vector2

	/**
	 * Desired velocity vector for intercepting moving targets (2D world coordinates).
	 * X = goal-to-goal direction, Y = touchline-to-touchline direction.
	 *
	 * NOTE: Vector2 - integrates directly with PlayerBody.velocity
	 */
	targetVelocity?: THREE.Vector2

	/** Player ID to interact with (chase, pass to, mark) */
	targetPlayerId?: number

	// ═══════════════════════════════════════════════════════════
	//                 M O V E M E N T   H I N T S
	// ═══════════════════════════════════════════════════════════

	/** How fast to move (urgency level) - defaults to JOG */
	speedHint?: SpeedHint

	/** How to move relative to facing (forward/backward/strafe) - defaults to AUTO */
	movementMode?: MovementMode

	/**
	 * Where the body should face while moving (2D world coordinates).
	 * If not set, body faces movement direction (AUTO mode).
	 *
	 * NOTE: Vector2 - body rotation is a 2D angle on the ground plane.
	 * Used for: jockeying (face attacker while moving back), looking at ball while repositioning.
	 */
	faceTarget?: THREE.Vector2

	/**
	 * Where the head/eyes should look (3D world coordinates).
	 * Independent of body facing - can look up at lofted ball, down at feet.
	 *
	 * NOTE: Vector3 - allows vertical look direction (up at ball, down at ground).
	 * If not set, defaults to faceTarget direction at eye height.
	 */
	lookAtTarget?: THREE.Vector3

	/**
	 * What to scan with the vision system.
	 * Can be a player, the ball, or a location (goal, passing lane, space).
	 *
	 * NOTE: Structured target, not arbitrary point. AI must have a REASON for scanning.
	 */
	scanTarget?: ScanTarget

	// ═══════════════════════════════════════════════════════════
	//                 A C T I O N   P A R A M E T E R S
	// ═══════════════════════════════════════════════════════════

	/** Kick/throw power (0.0 to 1.0) */
	power?: number

	/** Ball curve/bend (-1.0 to 1.0) */
	curve?: number

	// ═══════════════════════════════════════════════════════════
	//                 D E B U G   /   M E T A D A T A
	// ═══════════════════════════════════════════════════════════

	/**
	 * Why the AI made this decision.
	 * NOTE: Use TacticalReason enum, NOT strings! String comparisons kill performance.
	 */
	tacticalReason?: TacticalReason

	/**
	 * Communication signal to teammates.
	 * NOTE: Use CommunicationSignal enum, NOT strings!
	 */
	signal?: CommunicationSignal
}

export interface PlayerAction {
	type: ActionType
	/** Target position for passes, shots, throws (2D world coordinates) */
	targetPosition?: THREE.Vector2
	/** Height target for lofted balls, headers etc. */
	targetHeight?: number
	/** Optional force/power parameter (0.0 - 1.0), if applicable */
	force?: number
}

// These are the Functional Intentions that the Steering Layer knows how to execute.
// The AI (Brain) is responsible for calculating the specific targetPosition based on tactics.
export const enum IntentionType {
	// ═══════════════════════════════════════════════════════════
	//                 M O V E M E N T (Off-Ball)
	// ═══════════════════════════════════════════════════════════
	IDLE,				// Stand still / Hold position
	MOVE_TO,			// Standard movement (Seek/Arrive) to a spot
	SPRINT_TO,          // Urgent movement (Seek) to a spot

    // Tactical Movement
    RUN_IN_BEHIND,      // Curving run to beat offside trap / find space behind defense
    SUPPORT,            // Moving to provide a passing angle
    TRACK_RUNNER,       // Following an opponent without engaging
    COVER_SPACE,        // Zonal positioning

    // Defensive Engagement
	CHASE,				// Intercept moving target (Pursue)
	PRESS,              // Aggressive closing down (High speed, prepare to tackle)
	MARK,               // Tight man-marking (Match velocity + position offset)
	JOCKEY,				// Defensive containment (Face target + Maintain Dist + Backpedal)

	// ═══════════════════════════════════════════════════════════
	//                 B A L L   C O N T R O L (On-Ball)
	// ═══════════════════════════════════════════════════════════
	DRIBBLE,			// Move while keeping ball close
    DRIBBLE_SPRINT,     // Knock ball ahead and chase it
	SHIELD,				// Protect ball from opponent (Body between ball and foe)
    FEINT,              // Body feint / Step-over (Animation + slight movement deviation)
    HOLD_UP,            // Stationary shielding / waiting for support

	// ═══════════════════════════════════════════════════════════
	//                 A C T I O N   P R E P A R A T I O N
	// ═══════════════════════════════════════════════════════════
    // These are states where the player is preparing for a specific physics event
	RECEIVE_GROUND,		// Prepare to control incoming ground pass
    RECEIVE_HIGH,       // Prepare to chest/head/volley a high ball
    SET_PIECE_RUN_UP,   // Specific movement path before a free kick/corner
    PREPARE_TACKLE,     // Lining up a slide/standing tackle

	// ═══════════════════════════════════════════════════════════
	//                 G O A L K E E P E R
	// ═══════════════════════════════════════════════════════════
    GK_IDLE,            // Adjusting position relative to ball
    GK_COVER_ANGLE,     // Moving to bisect the angle between ball and goal
    GK_RUSH_OUT,        // Sweeper keeper action (Pursue Ball)
    GK_PREPARE_SAVE,    // Set position, knees bent, ready to dive
    GK_DISTRIBUTE,      // Looking for throw/kick options

	// ═══════════════════════════════════════════════════════════
	//                 S P E C I A L
	// ═══════════════════════════════════════════════════════════
    CELEBRATE,          // Post-goal behavior (Run to corner, hands up, etc.)
    PROTEST,            // Argue with ref
    INJURED,            // Writhe in pain
}

export const enum ActionType {
	KICK,
	VOLLEY,
	HEADER,
	CHEST,
	DEFLECT,			// unintended touch/ricochet
	BLOCK,				// shot/pass block
	INTERCEPT,
	TACKLE,
	DRIBBLE,			// controlled carry touch
	PASS,
	SHOT,
	CLEARANCE,
	PLACE,				// intentional placement on ground, eg. free-kick, corner kick, kickoff etc, can also be used by goalkeeper when placing ball for a goal kick
	CARRY,				// Carry the ball while running ... actually, I wanted "CARRY" to be for "carrying the ball in hands"
	HOLD,				// maintain possession while stationary
	PICK_UP_BALL,		// ANY player can pick up the ball (eg. after a foul, out of play, etc.)
	THROW_IN,			// throw-in action, this is actually the "launch" action, after the player has picked up the ball, moved to position, optionally taken a short run-up, then thrown the ball back into play. This action launches a ball in a direction, but from above the players head.

	// goalkeeper-specific
	GK_CATCH,			// hold
	GK_DROP,			// accidental/controlled drop
	GK_PARRY,			// deflect away with hands
	GK_PUNCH,
	GK_THROW,			// distribution by overarm throw
	GK_ROLL,			// distribution by roll
}


// Optional: tiny helpers for readable logs/UI without hardcoding strings in logic
export const ActionLabel = Object.freeze({
	[ActionType.KICK]: 'kick',
	[ActionType.VOLLEY]: 'volley',
	[ActionType.HEADER]: 'header',
	[ActionType.CHEST]: 'chest',
	[ActionType.DEFLECT]: 'deflect',
	[ActionType.BLOCK]: 'block',
	[ActionType.INTERCEPT]: 'intercept',
	[ActionType.TACKLE]: 'tackle',
	[ActionType.DRIBBLE]: 'dribble',
	[ActionType.PASS]: 'pass',
	[ActionType.SHOT]: 'shot',
	[ActionType.CLEARANCE]: 'clearance',
	[ActionType.GK_CATCH]: 'catch',
	[ActionType.GK_DROP]: 'drop',
	[ActionType.GK_PARRY]: 'parry',
	[ActionType.GK_PUNCH]: 'punch',
	[ActionType.GK_THROW]: 'keeper throw',
	[ActionType.GK_ROLL]: 'keeper roll',
})


// Older system, but kept for reference
export const enum _IntentionType {
	// ═══════════════════════════════════════════════════════════
	//                 M O V E M E N T   G O A L S
	// ═══════════════════════════════════════════════════════════
	MOVE_TO_POSITION,
	GET_OPEN,			// off-the-ball movement to create space/passing option
	SUPPORT_PLAY,		// provide passing option without necessarily breaking lines (e.g. triangle support)
	CREATE_SPACE,		// dummy run to drag defenders away
	BACKTRACK,			// recovery run to defensive position
	TRACK_RUNNER,		// following an opponent making a run
	COVER_SPACE,		// zonal marking / filling gaps
	PRESS_OPPONENT,		// closing down specific player
	CONTAIN_OPPONENT,	// jockeying/delaying


	// ═══════════════════════════════════════════════════════════
	//                 B A L L   A C T I O N S
	// ═══════════════════════════════════════════════════════════
	// These are intentions that usually result in an immediate action
	DRIBBLE_PROGRESS,	// carry ball forward
	DRIBBLE_BEAT,		// take on defender 1v1
	SHIELD_BALL,		// protect possession
	HOLD_UP_PLAY,		// wait for support
	DISTRIBUTE,			// pass the ball (short/long/cross)
	SHOOT,				// attempt to score
	CLEAR_DANGER,		// get ball away from defensive zone

	// ═══════════════════════════════════════════════════════════
	//                 S P E C I A L   S T A T E S
	// ═══════════════════════════════════════════════════════════
	PREPARE_SET_PIECE,
	CELEBRATE,
	PROTEST,			// arguing with ref
	TIME_WASTE,			// running down the clock

	// ═══════════════════════════════════════════════════════════
	//                 G O A L K E E P E R
	// ═══════════════════════════════════════════════════════════
	GK_SAVE,			// General intention to stop a shot (leads to dive, catch, block actions, parry, punch); Possible Actions: GK_DIVE, GK_CATCH, GK_PARRY, BLOCK, GK_PUNCH.
	GK_CLAIM_HIGH_BALL,	// Intercepting crosses/corners; Possible Actions: GK_CATCH, GK_PUNCH, JUMP.
	GK_SWEEP,			// Rushing out to clear through balls; Possible Actions: CLEARANCE, TACKLE, KICK.
	GK_DISTRIBUTE,		// Putting ball back in play (leads to throw, roll, kick actions); Possible Actions: GK_THROW, GK_ROLL, KICK.
	GK_ORGANIZE_WALL,	// Positioning defenders for free kicks
}
