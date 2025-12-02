<!--
	FC Tycoon™ 2027 Match Simulator - Player Stats Component

	Copyright © 2025 Darkwave Studios LLC. All rights reserved.
	This file is part of FC Tycoon™ 2027 Match Simulator.
	Licensed under the FC Tycoon Match Simulator Source Available License.
	See LICENSE.md in the project root for license terms.
-->

<template>
	<div
		v-if="player"
		class="player-stats"
		:style="style"
	>
		<div class="stats-header">
			<span class="player-number">{{ player.number }}</span>
			<span class="player-team">{{ player.team === 'home' ? match.homeTeam : match.awayTeam }}</span>
			<button
				class="close-btn"
				@click="$emit('close')"
			>
				×
			</button>
		</div>
		<div class="stats-content">
			<div class="stat-row">
				<span>Position:</span>
				<span>{{ formatPos(player.x, player.y) }}</span>
			</div>
			<div class="stat-row">
				<span>Role:</span>
				<span>Unknown</span>
			</div>
			<div class="stat-row">
				<span>Condition:</span>
				<span>100%</span>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	name: 'PlayerStats',

	props: {
		player: { type: Object, default: null },
		match: { type: Object, required: true },
		x: { type: Number, default: 0 },
		y: { type: Number, default: 0 },
	},

	emits: ['close'],

	computed: {
		style() {
			return {
				left: this.x + 'px',
				top: this.y + 'px',
			}
		},
	},

	methods: {
		/**
		 * Format position coordinates for display.
		 * @param {number} x - The x coordinate
		 * @param {number} y - The y coordinate
		 * @returns {string} Formatted position string
		 */
		formatPos(x: number, y: number) {
			const xStr = typeof x === 'number' ? x.toFixed(1) : '?'
			const yStr = typeof y === 'number' ? y.toFixed(1) : '?'
			return `${xStr}, ${yStr}`
		},
	},
})
</script>

<style scoped>
.player-stats {
	position: absolute;
	width: 200px;
	background: rgb(30 30 30 / 95%);
	border: 1px solid #444;
	border-radius: 6px;
	box-shadow: 0 4px 12px rgb(0 0 0 / 50%);
	color: #fff;
	font-size: 12px;
	z-index: 1000;
	pointer-events: auto;
}

.stats-header {
	display: flex;
	align-items: center;
	padding: 8px 12px;
	background: rgb(255 255 255 / 10%);
	border-bottom: 1px solid #444;
	gap: 8px;
}

.player-number {
	background: #fff;
	color: #000;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	font-size: 11px;
}

.player-team {
	flex: 1;
	font-weight: bold;
}

.close-btn {
	background: none;
	border: none;
	color: #999;
	font-size: 18px;
	cursor: pointer;
	padding: 0;
	line-height: 1;
}

.close-btn:hover {
	color: #fff;
}

.stats-content {
	padding: 12px;
}

.stat-row {
	display: flex;
	justify-content: space-between;
	margin-bottom: 6px;
}

.stat-row:last-child {
	margin-bottom: 0;
}

.stat-row span:first-child {
	color: #888;
}
</style>
