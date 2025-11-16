<template>
	<div class="match-simulator">
		<div class="toolbar">
			<ElRow :gutter="20" align="middle" class="toolbar-content">
				<ElCol :span="12">
					<h2>FC Tycoon 2027 - Match Simulator</h2>
				</ElCol>
				<ElCol :span="12" class="text-right">
					<ElButton @click="showSettings = true">
						<ElIcon><Setting /></ElIcon>
						Settings
					</ElButton>
				</ElCol>
			</ElRow>
		</div>

		<div class="main-content">
			<div ref="fieldContainer" class="field-container">
				<!-- Three.js canvas will be inserted here -->
			</div>

			<div class="controls-panel">
				<ElCard>
					<template #header>
						<strong>Match Controls</strong>
					</template>

					<div class="control-group">
						<ElButton
							type="success"
							:disabled="isMatchRunning"
							@click="startMatch"
						>
							<ElIcon><VideoPlay /></ElIcon>
							Start Match
						</ElButton>
						<ElButton
							type="warning"
							:disabled="!isMatchRunning"
							@click="pauseMatch"
						>
							<ElIcon><VideoPause /></ElIcon>
							Pause
						</ElButton>
						<ElButton
							type="danger"
							:disabled="!isMatchRunning"
							@click="stopMatch"
						>
							<ElIcon><Close /></ElIcon>
							Stop
						</ElButton>
					</div>

					<ElDivider />

					<div class="info-group">
						<div class="info-item">
							<label>Match Time:</label>
							<span>{{ matchTime }}'</span>
						</div>
						<div class="info-item">
							<label>Score:</label>
							<span>{{ homeScore }} - {{ awayScore }}</span>
						</div>
					</div>

					<ElDivider />

					<div class="toggle-group">
						<label>Camera View:</label>
						<ElRadioGroup v-model="cameraView" @change="onCameraChange">
							<ElRadioButton value="orthographic">
								2D Top-Down
							</ElRadioButton>
							<ElRadioButton value="perspective">
								3D Perspective
							</ElRadioButton>
						</ElRadioGroup>
					</div>
				</ElCard>
			</div>
		</div>

		<ElDialog
			v-model="showSettings"
			title="Settings"
			width="500px"
		>
			<div class="settings-content">
				<p>Settings panel - Coming soon!</p>
			</div>
			<template #footer>
				<ElButton @click="showSettings = false">
					Close
				</ElButton>
			</template>
		</ElDialog>
	</div>
</template>

<script>
export default {
	name: 'MatchSimulator',

	data() {
		return {
			isMatchRunning: false,
			matchTime: 0,
			homeScore: 0,
			awayScore: 0,
			cameraView: 'orthographic',
			showSettings: false,
		}
	},

	mounted() {
		this.initThreeJS()
	},

	beforeUnmount() {
		this.cleanupThreeJS()
	},

	methods: {
		/**
		 * Initialize Three.js scene
		 *
		 * @returns {void}
		 */
		initThreeJS() {
			// TODO: Initialize Three.js scene with orthographic camera
			console.log('Initializing Three.js scene...')
		},

		/**
		 * Cleanup Three.js resources
		 *
		 * @returns {void}
		 */
		cleanupThreeJS() {
			// TODO: Cleanup Three.js scene, renderer, etc.
			console.log('Cleaning up Three.js scene...')
		},

		/**
		 * Start match simulation
		 *
		 * @returns {void}
		 */
		startMatch() {
			this.isMatchRunning = true
			console.log('Match started')
		},

		/**
		 * Pause match simulation
		 *
		 * @returns {void}
		 */
		pauseMatch() {
			this.isMatchRunning = false
			console.log('Match paused')
		},

		/**
		 * Stop match simulation
		 *
		 * @returns {void}
		 */
		stopMatch() {
			this.isMatchRunning = false
			this.matchTime = 0
			this.homeScore = 0
			this.awayScore = 0
			console.log('Match stopped')
		},

		/**
		 * Handle camera view change
		 *
		 * @returns {void}
		 */
		onCameraChange() {
			console.log('Camera view changed to:', this.cameraView)
			// TODO: Switch between orthographic and perspective camera
		},
	},
}
</script>

<style scoped>
.match-simulator {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100vh;
}

.toolbar {
	flex-shrink: 0;
	background-color: #1e1e1e;
	border-bottom: 1px solid #333;
}

.toolbar-content {
	padding: 15px 20px;
}

.text-right {
	text-align: right;
}

.main-content {
	display: flex;
	flex: 1;
	overflow: hidden;
}

.field-container {
	flex: 1;
	background-color: #2d2d2d;
	position: relative;
}

.controls-panel {
	width: 350px;
	flex-shrink: 0;
	padding: 20px;
	background-color: #1e1e1e;
	overflow-y: auto;
}

.control-group {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.info-group {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.info-item {
	display: flex;
	justify-content: space-between;
	padding: 8px;
	background-color: rgba(255, 255, 255, 0.05);
	border-radius: 4px;
}

.info-item label {
	font-weight: bold;
	color: #4fc3f7;
}

.toggle-group {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.toggle-group label {
	font-weight: bold;
	color: #4fc3f7;
}

.settings-content {
	padding: 20px;
}
</style>
