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

export interface PlayerIntentions {
	type: IntentionType

	// Targets
	targetPosition?: THREE.Vector3      // Where to go / Where to kick
    targetVelocity?: THREE.Vector3      // Desired velocity vector (e.g. for intercepting)
	targetPlayerId?: number             // Who to chase / Who to pass to
    targetBodyOrientation?: number      // Desired body facing angle (radians)

	// Parameters
	speed?: number                      // 0.0 to 1.0 (Walk vs Sprint)
	power?: number                      // 0.0 to 1.0 (Kick power)
	curve?: number                      // -1.0 to 1.0 (Bend)

    // Head & Vision Hints (Decoupled from Movement)
    lookAtTarget?: THREE.Vector3        // Where the head should try to face (independent of body if possible)
    scanInterest?: THREE.Vector3        // A suggestion for the vision system (e.g. "Check this area")

	// Debug / Metadata
	tacticalReason?: string             // e.g. "RunInBehind", "Support"

    // Communication
    signal?: string                     // e.g. "POINT_TO_SPACE", "CALL_FOR_BALL"
}

export interface PlayerAction {
	type: ActionType
	targetPosition?: THREE.Vector3		// for passes, shots, throws etc.
	force?: number						// optional force/power parameter (0.0 - 1.0), if applicable
}

export interface ScanTarget {
	type: ActionType
	targetPosition?: THREE.Vector3		// for passes, shots, throws etc.
	force?: number						// optional force/power parameter (0.0 - 1.0), if applicable
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
