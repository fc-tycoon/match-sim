/**
 * FC Tycoon™ 2027 Match Simulator - AI Primitives
 *
 * Copyright © 2025 Darkwave Studios LLC. All rights reserved.
 * This file is part of FC Tycoon™ 2027 Match Simulator.
 * Licensed under the FC Tycoon Match Simulator Source Available License.
 * See LICENSE.md in the project root for license terms.
 */

import type { PlayerContext } from '@/core/ai/PlayerContext'

/**
 * AI PRIMITIVES (The "Building Blocks")
 * File: src/core/ai/AiPrimitives.ts
 *
 * This file defines the core building blocks (Nodes) for the Match Simulator's AI.
 * It implements a "Hybrid Architecture" that combines three distinct AI paradigms:
 *
 * 1. HFSM (Hierarchical Finite State Machine):
 *    - Used for high-level context switching (e.g., Attacking -> Defending).
 *    - Implemented via `State` nodes with guard conditions.
 *
 * 2. Utility AI (Fuzzy Decision Making):
 *    - Used for making "smart" choices when multiple options are valid.
 *    - Implemented via `UtilitySelector` and `Option` nodes.
 *    - Allows for trait-based personality (e.g., Selfishness, Aggression).
 *
 * 3. Behavior Trees (Execution Logic):
 *    - Used for executing concrete sequences of actions.
 *    - Implemented via `Selector`, `Sequence`, `Guard`, and `Action` nodes.
 *
 * ARCHITECTURE NOTES:
 * - Stateless: Nodes do not store state. All state is passed via `PlayerContext`.
 * - Immutable: Once constructed, the tree structure is frozen (`Object.freeze`).
 * - Zero-Allocation: No new objects are created during the update loop.
 */

export type ConditionFn = (ctx: PlayerContext) => boolean
export type ScoreFn = (ctx: PlayerContext) => number
export type ActionFn = (ctx: PlayerContext) => void

// =============================================================================
// 1. NODE SYSTEM (The Logic Engine)
// =============================================================================

/**
 * Base Node class.
 * All AI logic components inherit from this class.
 *
 * @property name - Debug name for the node.
 * @property children - Read-only list of child nodes.
 */
export abstract class Node {
	readonly name: string
	readonly children: ReadonlyArray<Node>

	constructor(name: string, children: Node[] = []) {
		this.name = name
		this.children = children
	}

	/**
	 * Executes the node's logic.
	 * @param ctx - The current context (state) of the player.
	 * @returns TRUE if the node handled the update (Success/Running), FALSE otherwise (Failure).
	 */
	abstract execute(ctx: PlayerContext): boolean
}

// =============================================================================
// 2. COMPOSITES (Control Flow)
// =============================================================================

/**
 * SELECTOR (Priority List)
 * Iterates through children and executes the first one that returns TRUE.
 *
 * Use Case: "Try to do A. If A fails, try B. If B fails, try C."
 * Example: "Shoot -> Pass -> Dribble"
 */
export class Selector extends Node {
	execute(ctx: PlayerContext): boolean {
		for (let i = 0; i < this.children.length; i++) {
			if (this.children[i].execute(ctx)) {
				if (ctx.ai.debug) console.log(`[AI] ${this.name} -> Child ${this.children[i].name} SUCCESS`)
				return true
			}
		}
		if (ctx.ai.debug) console.log(`[AI] ${this.name} -> ALL FAILED`)
		return false
	}
}

/**
 * SEQUENCE (Checklist)
 * Iterates through children and executes them in order.
 * If ANY child returns FALSE, the Sequence stops and returns FALSE.
 * Returns TRUE only if ALL children return TRUE.
 *
 * Use Case: "Ensure A is true, then ensure B is true, then do C."
 * Example: "Check Range -> Check Angle -> Shoot"
 */
export class Sequence extends Node {
	execute(ctx: PlayerContext): boolean {
		for (let i = 0; i < this.children.length; i++) {
			if (!this.children[i].execute(ctx)) {
				if (ctx.ai.debug) console.log(`[AI] ${this.name} -> Child ${this.children[i].name} FAILED`)
				return false
			}
		}
		if (ctx.ai.debug) console.log(`[AI] ${this.name} -> ALL SUCCESS`)
		return true
	}
}

/**
 * GUARD (Conditional Execution)
 * Checks a condition function.
 * - If TRUE: Executes the child node and returns its result.
 * - If FALSE: Returns FALSE immediately.
 *
 * Use Case: Protecting a subtree from running if preconditions aren't met.
 */
export class Guard extends Node {
	conditionFn: ConditionFn

	constructor(name: string, conditionFn: ConditionFn, thenNode: Node) {
		super(name, [thenNode])
		this.conditionFn = conditionFn
	}

	execute(ctx: PlayerContext): boolean {
		if (this.conditionFn(ctx)) {
			const result = this.children[0].execute(ctx)
			if (ctx.ai.debug) console.log(`[AI] ${this.name} -> Condition MET, Child Result: ${result}`)
			return result
		}
		if (ctx.ai.debug) console.log(`[AI] ${this.name} -> Condition FAILED`)
		return false
	}
}

/**
 * IF/ELSE (Branching Logic)
 * Evaluates a condition, then executes ONE of two branches:
 * - If TRUE: Executes the `thenNode` (committed - won't fallback).
 * - If FALSE: Executes the `elseNode`.
 *
 * Returns the result of whichever branch was executed.
 *
 * Use Case: Explicit branching where we want to guarantee no fallthrough.
 * Example: "IF in shooting range THEN (shoot OR create angle) ELSE move to range"
 */
export class IfElse extends Node {
	conditionNode: Condition

	constructor(name: string, conditionNode: Condition, thenNode: Node, elseNode: Node) {
		super(name, [thenNode, elseNode])
		this.conditionNode = conditionNode
	}

	execute(ctx: PlayerContext): boolean {
		const conditionMet = this.conditionNode.execute(ctx)
		if (conditionMet) {
			const result = this.children[0].execute(ctx)
			if (ctx.ai.debug) console.log(`[AI] ${this.name} -> Condition TRUE, THEN branch result: ${result}`)
			return result
		} else {
			const result = this.children[1].execute(ctx)
			if (ctx.ai.debug) console.log(`[AI] ${this.name} -> Condition FALSE, ELSE branch result: ${result}`)
			return result
		}
	}
}

/**
 * UTILITY SELECTOR (Best Choice)
 * Evaluates the .score() of ALL children first.
 * Then executes the single child with the highest score.
 *
 * Use Case: Fuzzy decisions where multiple options are valid, but one is "better".
 * Example: "Pass (0.4) vs Shoot (0.8) vs Dribble (0.2)" -> Executes Shoot.
 * Returning -Infinity excludes an option entirely. Can be useful for gating or thresholds.
 */
export class UtilitySelector extends Node {
	constructor(name: string, children: Option[]) {
		super(name, children)
		// Make sure all children are `Option` nodes
		for (const child of children) {
			if (!(child instanceof Option)) {
				throw new Error(`UtilitySelector can only have Option children. Invalid child: ${(child as Node).name}`)
			}
		}
	}

	execute(ctx: PlayerContext): boolean {
		let bestNode: Node | null = null
		let bestScore = -Infinity

		// Find best child
		for (const child of this.children) {
			const score = (child as Option).score(ctx)
			if (ctx.ai.debug) console.log(`[AI] ${this.name} -> Option ${child.name} Score: ${score}`)
			if (score > bestScore) {
				bestScore = score
				bestNode = child
			}
		}

		// Execute best child
		if (bestNode) {
			if (ctx.ai.debug) console.log(`[AI] ${this.name} -> Selected: ${bestNode.name} (${bestScore})`)
			return bestNode.execute(ctx)
		}

		if (ctx.ai.debug) console.log(`[AI] ${this.name} -> NO VALID OPTION`)
		return false
	}
}

// =============================================================================
// 3. HFSM NODES (State Machine)
// =============================================================================

/**
 * STATE (High-Level Mode)
 * Acts like a Selector, but has a Guard Condition.
 * - If Guard is FALSE: Returns FALSE immediately (skips children).
 * - If Guard is TRUE: Executes children as a Selector.
 *
 * Use Case: Top-level states like "Attacking", "Defending", "Stoppage".
 */
export class State extends Node {
	condition: ConditionFn

	constructor(name: string, condition: ConditionFn, children: Node[]) {
		super(name, children)
		this.condition = condition
	}

	execute(ctx: PlayerContext): boolean {
		// 1. Guard
		if (!this.condition(ctx)) {
			// if (ctx.ai.debug) console.log(`[AI] State ${this.name} -> Inactive`) // Too noisy
			return false
		}

		if (ctx.ai.debug) console.log(`[AI] State ${this.name} -> ACTIVE`)

		// 2. Execute Children (Priority)
		for (let i = 0; i < this.children.length; i++) {
			if (this.children[i].execute(ctx)) {
				return true
			}
		}

		if (ctx.ai.debug) console.log(`[AI] State ${this.name} -> No child handled update`)
		return false
	}
}

// =============================================================================
// 4. LEAF NODES (Logic)
// =============================================================================

/**
 * CONDITION (Leaf)
 * Checks a value in the context.
 * Returns TRUE or FALSE based on the checkFn.
 * Does NOT modify state.
 */
export class Condition extends Node {
	checkFn: (ctx: PlayerContext) => boolean

	constructor(name: string, checkFn: (ctx: PlayerContext) => boolean) {
		super(name)
		this.checkFn = checkFn
	}

	execute(ctx: PlayerContext): boolean {
		const result = this.checkFn(ctx)
		if (ctx.ai.debug) console.log(`[AI] Condition ${this.name} -> ${result}`)
		return result
	}
}

/**
 * ACTION (Leaf)
 * Performs a task (usually setting an Intention in the context).
 * Always returns TRUE (Success).
 */
export class Action extends Node {
	actionFn: ActionFn

	constructor(name: string, actionFn: ActionFn) {
		super(name)
		this.actionFn = actionFn
	}

	execute(ctx: PlayerContext): boolean {
		if (ctx.ai.debug) console.log(`[AI] Action ${this.name} -> EXECUTED`)
		this.actionFn(ctx)
		return true
	}
}

/**
 * OPTION (Utility Leaf)
 * An Action wrapper that includes a scoring function.
 * Required as a child of UtilitySelector.
 */
export class Option extends Action {
	scoreFn: ScoreFn

	constructor(name: string, scoreFn: ScoreFn, actionFn: ActionFn) {
		super(name, actionFn)
		this.scoreFn = scoreFn
	}

	score(ctx: PlayerContext): number {
		return this.scoreFn(ctx)
	}
}

// =============================================================================
// 5. BRAIN STEM (The Root Executor)
// =============================================================================

/**
 * BRAIN STEM
 * The wrapper class for the entire Behavior Tree.
 * Holds the Root Node and the Version string.
 *
 * Responsible for:
 * 1. Storing the immutable tree structure.
 * 2. Freezing the tree upon construction to ensure immutability.
 * 3. Providing the `update(ctx)` entry point.
 */
export class BrainStem {
	readonly version: string
	readonly root: Node

	constructor(version: string, root: Node) {
		this.version = version
		this.root = root
		Object.freeze(this) // Shallow freeze the stem
		this.freezeNode(this.root) // Deep freeze the tree
	}

	update(ctx: PlayerContext): void {
		this.root.execute(ctx)
	}

	private freezeNode(node: Node) {
		Object.freeze(node)
		if (node.children) {
			Object.freeze(node.children)
			for (const child of node.children) {
				this.freezeNode(child)
			}
		}
	}
}
