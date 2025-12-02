/**
 * FC Tycoon™ 2027 Match Simulator - Player Skills
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

export interface PlayerSkills {
	// Technical Skills
	first_touch: number			//	First Touch — clean ground reception under pressure; crucial for CBs/FBs building out
	ball_control: number
	dribbling: number
	technique: number
	high_ball_control: number	// Tooltip: Ability to control and manipulate the ball when it is in the air, including chesting, volleying, and controlling high passes. .... High-Ball Control — bring down lofted/over-shoulder balls at speed (distinct from heading)
	press_resistance: number	// Tooltip: Ability to maintain possession and composure while under pressure from opponents. .... Press Resistance — retain possession when closely marked or challenged by opponents ........ Press Resistance — survive first touch + turn/bounce under a press; reduces panic giveaways

	// Shooting Skills
	finishing: number
	shot_power: number
	long_shots: number
	volleys: number
	curve: number

	// Passing Skills
	passing: number				// Tooltip: The ability to accurately deliver the ball to a teammate over various distances and under different conditions. ...... Passing — short/medium range accuracy and weight; includes through balls and lay-offs ...........  Passing (ground) — general ground distribution accuracy/weight (distinct from vision)
	lofted_pass: number			// Tooltip: The ability to accurately deliver the ball through the air to a teammate over longer distances or when bypassing opponents. ...... Lofted Pass — accuracy/weight on long, aerial, or chipped passes ........ Lofted Pass (air) — general aerial distribution accuracy/weight (distinct from vision) ..........Lofted Pass — chipped/dinked/switch deliveries; exit pressure over a line
	crossing: number
	one_touch_play: number		// AKA Directional/Directed First Touch ???

	// Physical Skills
	acceleration: number
	sprint_speed: number
	strength: number
	stamina: number
	physical_contact: number
	agility: number
	balance: number
	shielding: number			// Tooltip: Protects the ball using body positioning to resist challenges and retain possession.

	// Defensive Skills
	marking: number				// Tooltip: The ability to closely track and stay with an opponent to prevent them from receiving the ball or making effective plays. ...... Tooltip: Stays tight to an assigned opponent, tracks their movements, denies easy receives and turns.
	tackling: number
	sliding_tackles: number
	interceptions: number
	jockeying: number
	pressing: number
	blocking: number
	screening: number

	// Aerial
	heading_accuracy: number
	jumping: number
	aerial_duels: number

	// Set Piece Skills
	free_kicks: number
	corner_kicks: number
	penalties: number

	// Attacking Mentality
	attacking_awareness: number
	attacking_off_the_ball: number
	attacking_work_rate: number
	attacking_decisions: number
	attacking_anticipation: number
	attacking_teamwork: number

	// Defensive Mentality
	defensive_awareness: number
	defensive_positioning: number
	defensive_work_rate: number
	defensive_decisions: number
	defensive_anticipation: number
	defensive_teamwork: number

	// Mental Skills
	vision: number
	creativity: number
	flair: number
	composure: number
	concentration: number
	aggression: number
	bravery: number
	tactical_discipline: number
	reactions: number

	// Goalkeeping Skills
	gk_positioning: number
	gk_handling: number
	gk_shot_stopping: number
	gk_decisions: number
	gk_reflexes: number
	gk_diving: number
	gk_one_on_one: number
	gk_kicking: number
	gk_catching: number
	gk_aerial_ability: number
	gk_command_of_area: number
	gk_communication: number
	gk_throwing: number
}

export const DEFAULT_SKILLS: PlayerSkills = Object.freeze({
	first_touch: 0.5,
	ball_control: 0.5,
	dribbling: 0.5,
	technique: 0.5,
	high_ball_control: 0.5,
	press_resistance: 0.5,
	finishing: 0.5,
	shot_power: 0.5,
	long_shots: 0.5,
	volleys: 0.5,
	curve: 0.5,
	passing: 0.5,
	lofted_pass: 0.5,
	crossing: 0.5,
	one_touch_play: 0.5,
	acceleration: 0.5,
	sprint_speed: 0.5,
	strength: 0.5,
	stamina: 0.5,
	physical_contact: 0.5,
	agility: 0.5,
	balance: 0.5,
	shielding: 0.5,
	marking: 0.5,
	tackling: 0.5,
	sliding_tackles: 0.5,
	interceptions: 0.5,
	jockeying: 0.5,
	pressing: 0.5,
	blocking: 0.5,
	screening: 0.5,
	heading_accuracy: 0.5,
	jumping: 0.5,
	aerial_duels: 0.5,
	free_kicks: 0.5,
	corner_kicks: 0.5,
	penalties: 0.5,
	attacking_awareness: 0.5,
	attacking_off_the_ball: 0.5,
	attacking_work_rate: 0.5,
	attacking_decisions: 0.5,
	attacking_anticipation: 0.5,
	attacking_teamwork: 0.5,
	defensive_awareness: 0.5,
	defensive_positioning: 0.5,
	defensive_work_rate: 0.5,
	defensive_decisions: 0.5,
	defensive_anticipation: 0.5,
	defensive_teamwork: 0.5,
	vision: 0.5,
	creativity: 0.5,
	flair: 0.5,
	composure: 0.5,
	concentration: 0.5,
	aggression: 0.5,
	bravery: 0.5,
	tactical_discipline: 0.5,
	reactions: 0.5,
	gk_positioning: 0.5,
	gk_handling: 0.5,
	gk_shot_stopping: 0.5,
	gk_decisions: 0.5,
	gk_reflexes: 0.5,
	gk_diving: 0.5,
	gk_one_on_one: 0.5,
	gk_kicking: 0.5,
	gk_catching: 0.5,
	gk_aerial_ability: 0.5,
	gk_command_of_area: 0.5,
	gk_communication: 0.5,
	gk_throwing: 0.5,
})
