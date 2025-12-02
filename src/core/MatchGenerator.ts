import { EventScheduler, EventType } from './EventScheduler'
import { match as matchStore } from '@/store/match'
import { events } from '@/store/events'
import { Match } from '@/core/Match'
import { MatchEngine } from '@/core/MatchEngine'
import { Team, Venue } from '@/core/Team'
import { Player } from '@/core/Player'
import { Field } from '@/core/Field'
import { TeamTactics } from '@/core/TeamTactics'
import { TeamFormation, SlotPlayer } from '@/core/TeamFormation'
import { Formation } from '@/core/Formation'
import { PositionSlot } from '@/core/PositionSlot'
import { PositionRole } from '@/core/PositionRole'
import { RealTimeScheduler } from '@/core/RealTimeScheduler'
import { Database } from '@/store/database'
import { DefendingSide } from '@/core/TeamState'

export class MatchGenerator {
	/**
	 * Create a new match with the given scheduler and seed.
	 *
	 * @param {EventScheduler} scheduler - The underlying event scheduler
	 * @param {number} seed - The random seed for deterministic simulation
	 * @returns {Match} The created match (data only, no engine)
	 */
	static createMatch(scheduler: EventScheduler, seed: number): Match {
		// 1. Create Field
		const field = new Field()

		// 2. Create Teams with proper defending sides
		// Home team defends LEFT (-X), attacks RIGHT (+X)
		// Away team defends RIGHT (+X), attacks LEFT (-X)
		const homeTeam = this.createDummyTeam(1, 'Home FC', Venue.HOME, Team.COLOR_HOME, DefendingSide.LEFT, 1)    // 4-2-3-1
		const awayTeam = this.createDummyTeam(2, 'Away United', Venue.AWAY, Team.COLOR_AWAY, DefendingSide.RIGHT, 150) // 3-5-2

		// 3. Create Match
		const match = new Match(field, homeTeam, awayTeam, seed, scheduler)

		return match
	}

	/**
	 * Generate and initialize a full match for real-time visualization.
	 *
	 * @param {RealTimeScheduler} realtime - The real-time scheduler wrapper
	 * @param {number} seed - The random seed for deterministic simulation
	 */
	static generateFullMatch(realtime: RealTimeScheduler, seed: number) {
		console.log('Generating Full Match with Real Engine...')

		// Create Match (data)
		const match = this.createMatch(realtime.scheduler, seed)

		// Create Engine (combines Match + Scheduler wrapper)
		const engine = new MatchEngine(match, realtime)
		engine.initialize()

		// Set the engine in the store (this makes players/ball accessible)
		matchStore.setEngine(engine)

		// Log Start
		events.log('Match Initialized', 0)

		// Schedule Kickoff
		realtime.scheduler.schedule(0, EventType.REFEREE, () => {
			events.log('KICKOFF! The match begins.', realtime.scheduler.currentTick)
		})
	}

	/**
	 * Create a dummy team for testing purposes.
	 * Uses Database to load formation and slot data.
	 *
	 * @param id - Team ID
	 * @param name - Team name
	 * @param venue - Home/Away/Neutral
	 * @param color - Team color (hex)
	 * @param defendingSide - Which side the team is defending
	 * @param formationId - Formation ID from database (e.g., 1 = 4-2-3-1, 150 = 3-5-2)
	 * @returns The created team
	 */
	private static createDummyTeam(
		id: number,
		name: string,
		venue: Venue,
		color: number,
		defendingSide: DefendingSide,
		formationId: number,
	): Team {
		const players: Player[] = []

		// Create dummy team object for circular reference
		const dummyTeam = {} as Team

		// Create 11 Players
		for (let i = 1; i <= 11; i++) {
			players.push(new Player({
				id: id * 100 + i,
				name: `${name} ${i}`,
				team: dummyTeam,
				shirt_number: i,
			}))
		}

		// Get formation from Database, fall back to formation id 1 if not found
		const dbFormation = Database.getFormation(formationId) ?? Database.formations[0]
		const dbSlots = Database.getFormationSlots(dbFormation.id)

		// Convert Database slots to PositionSlot instances
		const slots: PositionSlot[] = dbSlots.map(dbSlot =>
			new PositionSlot(
				dbSlot.id,
				dbSlot.position_id,
				dbSlot.code,
				dbSlot.name,
				dbSlot.channel,
				dbSlot.position_x,
				dbSlot.position_y, // Slot Y: -1 (defensive) to +1 (attacking), maps to goal-to-goal axis
			),
		)

		const formation = new Formation(dbFormation.id, dbFormation.family, dbFormation.name, slots)

		// Assign Players to Slots
		const slotPlayers: SlotPlayer[] = []
		const dummyRole = new PositionRole(1, 'Standard', '', '', '', '', '', 0.5, 0.5)

		players.forEach((p, index) => {
			if (index < slots.length) {
				slotPlayers.push({
					slot: slots[index],
					role: dummyRole,
					player: p,
				})
			}
		})

		const teamFormation = new TeamFormation(formation, slotPlayers)

		// Create tactics with proper defending side for AABB orientation
		const tactics = new TeamTactics(teamFormation, defendingSide)

		// Create Real Team
		const realTeam = new Team(id, venue, name, color, players, tactics)

		// Fix Player Team References
		players.forEach(p => {
			(p as any).team = realTeam
		})

		return realTeam
	}
}
