<!--
	FC Tycoon™ 2027 Match Simulator - Event Log Component

	Copyright © 2025 Darkwave Studios LLC. All rights reserved.
	This file is part of FC Tycoon™ 2027 Match Simulator.
	Licensed under the FC Tycoon Match Simulator Source Available License.
	See LICENSE.md in the project root for license terms.
-->

<template>
	<div class="event-log">
		<div class="log-content">
			<div
				v-if="events.length === 0"
				class="empty-log"
			>
				No events yet
			</div>
			<div
				v-for="(event, index) in events"
				:key="index"
				class="log-entry"
			>
				<span class="log-time">{{ formatTime(event.tick) }}</span>
				<span class="log-text">{{ event.message }}</span>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	name: 'EventLog',

	props: {
		match: { type: Object, required: true },
	},

	data() {
		return {
			events: [] as Array<{ tick: number; message: string }>,
		}
	},

	watch: {
		'match.tick'(newTick) {
			// In a real implementation, we would watch for new events from the scheduler
			// For now, we'll just simulate some events based on tick for demonstration
			if (newTick > 0 && newTick % 15000 < 20) { // Every ~15 seconds
				this.addEvent(newTick, `Game time: ${this.formatTime(newTick)}`)
			}
		},
	},

	methods: {
		formatTime(ms: number) {
			const minutes = Math.floor(ms / 60000)
			const seconds = Math.floor((ms % 60000) / 1000)
			return `${minutes}:${seconds.toString().padStart(2, '0')}`
		},

		addEvent(tick: number, message: string) {
			this.events.unshift({ tick, message })
			if (this.events.length > 50) this.events.pop()
		},
	},
})
</script>

<style scoped>
.event-log {
	position: absolute;
	bottom: 20px;
	left: 20px;
	width: 300px;
	height: 200px;
	background: rgb(30 30 30 / 85%);
	backdrop-filter: blur(4px);
	border: 1px solid #333;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	pointer-events: auto;
}

.log-header {
	padding: 8px 12px;
	background: rgb(255 255 255 / 10%);
	font-weight: bold;
	color: #ddd;
	font-size: 13px;
	border-bottom: 1px solid #444;
}

.log-content {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
	font-size: 12px;
	color: #ccc;
}

.log-entry {
	margin-bottom: 4px;
	display: flex;
	gap: 8px;
}

.log-time {
	color: #888;
	font-family: monospace;
	min-width: 35px;
}

.empty-log {
	color: #666;
	font-style: italic;
	text-align: center;
	margin-top: 20px;
}

/* Scrollbar styling */
.log-content::-webkit-scrollbar {
	width: 6px;
}

.log-content::-webkit-scrollbar-track {
	background: rgb(0 0 0 / 20%);
}

.log-content::-webkit-scrollbar-thumb {
	background: #555;
	border-radius: 3px;
}
</style>
