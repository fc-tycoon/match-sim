<template>
	<div ref="root" class="match-simulator">
		<!-- Loading overlay for 3D renderers -->
		<div
			v-if="view !== '2d' && !$renderer.state.isReady"
			class="loading-overlay"
		>
			<div class="loading-content">
				<el-icon class="loading-icon">
					<Loading />
				</el-icon>
				<div class="loading-text">
					{{ $renderer.state.progressMessage || 'Loading 3D assets...' }}
				</div>
			</div>
		</div>

		<!-- Active renderer (mounted only when ready for 3D views) -->
		<component
			:is="activeRenderer"
			v-if="view === '2d' || $renderer.state.isReady"
			ref="rendererRef"
			:show-cones="showCones"
			:player-config="playerConfig"
			class="renderer-host"
			@player-click="onPlayerClick"
			@click="onBackgroundClick($event)"
		/>

		<!-- Floating Event Log -->
		<div
			ref="eventLogRef"
			class="floating-log"
			:style="eventLogStyle"
		>
			<div class="log-handle drag-handle" @mousedown="startDrag('log', $event)">
				<span>Match Events</span>
				<el-button
					type="text"
					size="small"
					@click.stop="toggleLog"
					@mousedown.stop
				>
					{{ !logExpanded ? 'Expand' : 'Collapse' }}
				</el-button>
			</div>
			<div v-show="logExpanded" class="log-body" @mousedown.stop>
				<div v-if="$events.items.length === 0" class="empty-log">
					No events yet
				</div>
				<div
					v-for="event in reversedEvents"
					:key="event.id"
					class="log-entry"
				>
					<span class="log-time">{{ formattedTimeFromTick(event.tick) }}</span>
					<span class="log-text">{{ event.message }}</span>
				</div>
			</div>
		</div>

		<!-- Player Stats -->
		<PlayerStats
			v-if="selectedPlayer"
			:player="selectedPlayer"
			:match="$match"
			:x="statsPos.x"
			:y="statsPos.y"
			@close="selectedPlayer = null"
		/>

		<!-- Floating Controls -->
		<div
			class="floating-controls drag-handle"
			:style="dragStyle"
			@mousedown="startDrag('controls', $event)"
		>
			<div class="controls-row">
				<span class="team-name">{{ $match.homeTeam }}</span>
				<span class="score">{{ $match.homeScore }} - {{ $match.awayScore }}</span>
				<span class="team-name">{{ $match.awayTeam }}</span>
			</div>
			<div class="controls-row buttons-row">
				<ElTooltip content="Start" placement="bottom" :show-after="0">
					<ElButton
						circle
						type="success"
						size="small"
						:disabled="$match.running || matchFinished"
						@click="startMatch"
						@mousedown.stop
					>
						<ElIcon><VideoPlay /></ElIcon>
					</ElButton>
				</ElTooltip>
				<ElTooltip content="Step 1 Tick" placement="bottom" :show-after="0">
					<ElButton
						circle
						type="info"
						size="small"
						:disabled="matchFinished"
						@click="stepOneTick"
						@mousedown.stop
					>
						<ElIcon><Right /></ElIcon>
					</ElButton>
				</ElTooltip>
				<ElTooltip content="Pause" placement="bottom" :show-after="0">
					<ElButton
						circle
						type="warning"
						size="small"
						:disabled="!$match.running"
						@click="pauseMatch"
						@mousedown.stop
					>
						<ElIcon><VideoPause /></ElIcon>
					</ElButton>
				</ElTooltip>
				<ElTooltip content="Reset" placement="bottom" :show-after="0">
					<ElButton
						circle
						type="danger"
						size="small"
						@click="resetMatch"
						@mousedown.stop
					>
						<ElIcon><Refresh /></ElIcon>
					</ElButton>
				</ElTooltip>
				<ElTooltip content="Settings" placement="bottom" :show-after="0">
					<ElButton
						circle
						size="small"
						@click="showSettings = true"
						@mousedown.stop
					>
						<ElIcon><Setting /></ElIcon>
					</ElButton>
				</ElTooltip>
				<ElInput
					v-model="localSeed"
					class="seed-input"
					:maxlength="16"
					placeholder="seed"
					size="small"
					@mousedown.stop
				/>
				<ElTooltip content="Randomize Seed" placement="bottom" :show-after="0">
					<ElButton
						circle
						size="small"
						@click="randomizeSeed"
						@mousedown.stop
					>
						<ElIcon><Refresh /></ElIcon>
					</ElButton>
				</ElTooltip>
				<span class="time-display">{{ formattedTime }}</span>
			</div>
			<div class="controls-row view-row">
				<ElTooltip content="2D Canvas" placement="bottom" :show-after="0">
					<ElButton
						:type="view==='2d' ? 'primary' : 'default'"
						size="small"
						@click="setView('2d')"
						@mousedown.stop
					>
						2D
					</ElButton>
				</ElTooltip>
				<ElTooltip content="3D Orthographic" placement="bottom" :show-after="0">
					<ElButton
						:type="view==='3d-o' ? 'primary' : 'default'"
						size="small"
						@click="setView('3d-o')"
						@mousedown.stop
					>
						3D-O
					</ElButton>
				</ElTooltip>
				<ElTooltip content="3D Perspective" placement="bottom" :show-after="0">
					<ElButton
						:type="view==='3d-p' ? 'primary' : 'default'"
						size="small"
						@click="setView('3d-p')"
						@mousedown.stop
					>
						3D-P
					</ElButton>
				</ElTooltip>
				<ElTooltip content="Toggle Vision Cones" placement="bottom" :show-after="0">
					<ElButton
						:type="showCones ? 'success' : 'default'"
						size="small"
						@click="showCones = !showCones"
						@mousedown.stop
					>
						Cones
					</ElButton>
				</ElTooltip>
				<ElTooltip content="Current Tick" placement="bottom" :show-after="0">
					<span class="tick-display">{{ $match.tick }}</span>
				</ElTooltip>
			</div>
			<div class="controls-row slider-row">
				<span class="slider-label">Speed</span>
				<div class="slider-container" @mousedown.stop @pointerdown.stop @touchstart.stop>
					<ElSlider
						v-model="speedSliderValue"
						:min="0"
						:max="48"
						:step="1"
						:show-tooltip="false"
						size="small"
					/>
				</div>
				<span class="speed-display">{{ formatSpeed(speed) }}</span>
				<ElButton
					size="small"
					class="max-speed-btn"
					@click="speed = 1200"
					@mousedown.stop
				>
					MAX
				</ElButton>
			</div>
		</div>

		<!-- Settings Dialog -->
		<ElDialog v-model="showSettings" width="600px" class="settings-dialog">
			<template #header>
				<div class="dialog-header">
					<span class="dialog-team-name">{{ $match.homeTeam }}</span>
					<span class="dialog-score">{{ $match.homeScore }} - {{ $match.awayScore }}</span>
					<span class="dialog-team-name">{{ $match.awayTeam }}</span>
					<span class="dialog-tick">Tick: {{ $match.tick }}</span>
				</div>
			</template>
			<div class="settings-content">
				<div class="setting-item">
					<span>Show Vision Cones</span>
					<ElSwitch v-model="showCones" />
				</div>
				<div class="setting-item">
					<span>Show Formation AABBs</span>
					<ElSwitch v-model="$settings.debug.showFormationAABB" />
				</div>
				<div class="setting-item">
					<span>Match Speed ({{ formatSpeed(speed) }})</span>
					<ElSlider
						v-model="speedSliderValue"
						:min="0"
						:max="48"
						:step="1"
						:show-tooltip="false"
					/>
				</div>
				<div class="setting-item">
					<span>Player Model</span>
					<ElRadioGroup v-model="playerConfig.modelType" size="small">
						<ElRadioButton value="primitive">
							Primitive
						</ElRadioButton>
						<ElRadioButton value="mixamo">
							Mixamo
						</ElRadioButton>
					</ElRadioGroup>
				</div>
				<div class="setting-item">
					<span>Player Scale</span>
					<ElSlider v-model="playerConfig.scale" :min="0.5" :max="2.0" :step="0.1" />
				</div>
				<div class="setting-item">
					<span>Home Team Color</span>
					<ElColorPicker v-model="homeColorHex" />
				</div>
				<div class="setting-item">
					<span>Away Team Color</span>
					<ElColorPicker v-model="awayColorHex" />
				</div>
				<div class="setting-item">
					<span>Skin Darkness</span>
					<ElSlider v-model="playerConfig.skinDarkness" :min="0" :max="1" :step="0.01" />
				</div>

				<!-- Lighting Section -->
				<ElDivider content-position="left">
					<span
						class="lighting-toggle"
						@click="lightingExpanded = !lightingExpanded"
					>
						Lighting Settings {{ lightingExpanded ? '▼' : '▶' }}
					</span>
				</ElDivider>

				<div v-show="lightingExpanded" class="lighting-section">
					<!-- Preset Selector -->
					<div class="setting-item">
						<span>Preset</span>
						<ElSelect
							v-model="lightingPreset"
							size="small"
							style="width: 140px"
						>
							<ElOption label="Day" value="day" />
							<ElOption label="Dusk" value="dusk" />
							<ElOption label="Night" value="night" />
							<ElOption label="Custom" value="custom" disabled />
						</ElSelect>
					</div>

					<!-- Shadow Quality -->
					<div class="setting-item">
						<span>Shadow Quality</span>
						<ElSelect
							v-model="shadowQuality"
							size="small"
							style="width: 140px"
						>
							<ElOption label="Low (1K)" value="low" />
							<ElOption label="Medium (2K)" value="medium" />
							<ElOption label="High (4K)" value="high" />
							<ElOption label="Ultra (8K)" value="ultra" />
						</ElSelect>
					</div>

					<!-- Spotlight Shadow Quality -->
					<div class="setting-item">
						<span>Spotlight Shadows</span>
						<ElSelect
							v-model="spotlightShadowQuality"
							size="small"
							style="width: 140px"
						>
							<ElOption label="Low (1K)" value="low" />
							<ElOption label="Medium (2K)" value="medium" />
							<ElOption label="High (4K)" value="high" />
							<ElOption label="Ultra (8K)" value="ultra" />
						</ElSelect>
					</div>

					<!-- Sky Color -->
					<div class="setting-item">
						<span>Sky Color</span>
						<ElColorPicker v-model="skyColorHex" />
					</div>

					<!-- Ambient Light -->
					<div class="setting-group">
						<div class="setting-item">
							<span>Ambient Light</span>
							<ElSwitch
								:model-value="$settings.lighting.ambient.enabled"
								@change="updateLightingValue('ambient.enabled', $event)"
							/>
						</div>
						<div v-show="$settings.lighting.ambient.enabled" class="setting-sub">
							<div class="setting-item">
								<span>Color</span>
								<ElColorPicker v-model="ambientColorHex" />
							</div>
							<div class="setting-item">
								<span>Intensity ({{ $settings.lighting.ambient.intensity.toFixed(2) }})</span>
								<ElSlider
									:model-value="$settings.lighting.ambient.intensity"
									:min="0"
									:max="2"
									:step="0.05"
									@input="updateLightingValue('ambient.intensity', $event)"
								/>
							</div>
						</div>
					</div>

					<!-- Hemisphere Light -->
					<div class="setting-group">
						<div class="setting-item">
							<span>Hemisphere Light</span>
							<ElSwitch
								:model-value="$settings.lighting.hemisphere.enabled"
								@change="updateLightingValue('hemisphere.enabled', $event)"
							/>
						</div>
						<div v-show="$settings.lighting.hemisphere.enabled" class="setting-sub">
							<div class="setting-item">
								<span>Sky Color</span>
								<ElColorPicker v-model="hemiSkyColorHex" />
							</div>
							<div class="setting-item">
								<span>Ground Color</span>
								<ElColorPicker v-model="hemiGroundColorHex" />
							</div>
							<div class="setting-item">
								<span>Intensity ({{ $settings.lighting.hemisphere.intensity.toFixed(2) }})</span>
								<ElSlider
									:model-value="$settings.lighting.hemisphere.intensity"
									:min="0"
									:max="3"
									:step="0.1"
									@input="updateLightingValue('hemisphere.intensity', $event)"
								/>
							</div>
						</div>
					</div>

					<!-- Directional (Sun) Light -->
					<div class="setting-group">
						<div class="setting-item">
							<span>Sun Light</span>
							<ElSwitch
								:model-value="$settings.lighting.directional.enabled"
								@change="updateLightingValue('directional.enabled', $event)"
							/>
						</div>
						<div v-show="$settings.lighting.directional.enabled" class="setting-sub">
							<div class="setting-item">
								<span>Color</span>
								<ElColorPicker v-model="directionalColorHex" />
							</div>
							<div class="setting-item">
								<span>Intensity ({{ $settings.lighting.directional.intensity.toFixed(2) }})</span>
								<ElSlider
									:model-value="$settings.lighting.directional.intensity"
									:min="0"
									:max="3"
									:step="0.1"
									@input="updateLightingValue('directional.intensity', $event)"
								/>
							</div>
							<div class="setting-item">
								<span>Cast Shadows</span>
								<ElSwitch
									:model-value="$settings.lighting.directional.castShadow"
									@change="updateLightingValue('directional.castShadow', $event)"
								/>
							</div>
						</div>
					</div>

					<!-- Spotlights -->
					<div class="setting-group">
						<div class="setting-item">
							<span>Stadium Spotlights</span>
							<ElSwitch
								:model-value="$settings.lighting.spotlights.enabled"
								@change="updateLightingValue('spotlights.enabled', $event)"
							/>
						</div>
						<div v-show="$settings.lighting.spotlights.enabled" class="setting-sub">
							<div class="setting-item">
								<span>Color</span>
								<ElColorPicker v-model="spotlightColorHex" />
							</div>
							<div class="setting-item">
								<span>Intensity ({{ $settings.lighting.spotlights.intensity.toFixed(0) }})</span>
								<ElSlider
									:model-value="$settings.lighting.spotlights.intensity"
									:min="0"
									:max="300"
									:step="5"
									@input="updateLightingValue('spotlights.intensity', $event)"
								/>
							</div>
							<div class="setting-item">
								<span>Cast Shadows</span>
								<ElSwitch
									:model-value="$settings.lighting.spotlights.castShadow"
									@change="updateLightingValue('spotlights.castShadow', $event)"
								/>
							</div>
							<div class="setting-item">
								<span>Cone Angle</span>
								<ElSlider
									:model-value="$settings.lighting.spotlights.angle"
									:min="0.1"
									:max="1.5"
									:step="0.05"
									@input="updateLightingValue('spotlights.angle', $event)"
								/>
							</div>
							<div class="setting-item">
								<span>Penumbra ({{ $settings.lighting.spotlights.penumbra.toFixed(2) }})</span>
								<ElSlider
									:model-value="$settings.lighting.spotlights.penumbra"
									:min="0"
									:max="1"
									:step="0.05"
									@input="updateLightingValue('spotlights.penumbra', $event)"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
			<template #footer>
				<ElButton @click="showSettings = false">
					Close
				</ElButton>
			</template>
		</ElDialog>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Team } from '@/core/Team'
import { PlayerModel } from '@/core/PlayerModel'
import {
	type LightingPreset,
	type LightingConfig,
	type ShadowQuality,
	getLightingPreset,
	cloneLightingConfig,
} from '@/core/LightingConfig'
import pkg from '../../package.json'
import Canvas2DRenderer from '@/components/renderers/Canvas2DRenderer.vue'
import ThreeOrthoRenderer from '@/components/renderers/ThreeOrthoRenderer.vue'
import ThreePerspectiveRenderer from '@/components/renderers/ThreePerspectiveRenderer.vue'
import PlayerStats from '@/components/PlayerStats.vue'
import {
	APP_INFO,
	STORAGE_KEYS,
} from '@/constants.ts'

export default defineComponent({
	name: 'MatchSimulator',

	components: {
		Canvas2DRenderer,
		ThreeOrthoRenderer,
		ThreePerspectiveRenderer,
		PlayerStats,
	},

	data() {
		return {
			showSettings: false,
			view: '2d',
			version: pkg.version || '0.0.0',
			pollId: null as number | null,
			selectedPlayer: null as unknown,
			statsPos: { x: 0, y: 0 },
			showCones: true,
			speed: 1.0,
			localSeed: '', // Seed for display purposes
			playerConfig: {
				homeColor: Team.COLOR_HOME,
				awayColor: Team.COLOR_AWAY,
				headColor: PlayerModel.COLOR_SKIN_BASE,
				scale: 1.0,
				skinDarkness: 0.0,
				modelType: 'primitive' as 'primitive' | 'mixamo',
			},

			// Lighting settings tab expanded state
			lightingExpanded: false,

			// Dragging & Resizing State
			controlsPos: { x: 20, y: 20 },
			eventLogPos: { x: 20, y: 150 },
			logExpanded: true,
			logWidth: 300,
			logHeight: 200,
			savedLogWidth: 300,
			savedLogHeight: 200,
			draggingElement: null as string | null,
			dragOffset: { x: 0, y: 0 },
			resizeObserver: null as ResizeObserver | null,
		}
	},

	computed: {
		activeRenderer() {
			if (this.view === '2d') return 'Canvas2DRenderer'
			if (this.view === '3d-o') return 'ThreeOrthoRenderer'
			return 'ThreePerspectiveRenderer'
		},

		formattedTime() {
			return this.formattedTimeFromTick(this.$match.tick)
		},

		/**
		 * Events in reverse order (newest first) for display.
		 */
		reversedEvents() {
			return [...this.$events.items].reverse()
		},

		matchFinished() {
			// Match is finished if we have started (tick > 0) and no events left
			const engine = this.$match.engine
			if (!engine?.realtime) return false
			return this.$match.tick > 0 && engine.realtime.scheduler.eventCount === 0
		},

		homeColorHex: {
			get() { return '#' + this.playerConfig.homeColor.toString(16).padStart(6, '0') },
			set(val: string) { this.playerConfig.homeColor = parseInt(val.replace('#', ''), 16) },
		},

		awayColorHex: {
			get() { return '#' + this.playerConfig.awayColor.toString(16).padStart(6, '0') },
			set(val: string) { this.playerConfig.awayColor = parseInt(val.replace('#', ''), 16) },
		},

		/**
		 * Non-linear speed slider mapping.
		 * Position 0-19: 0.1 to 2.0 in 0.1 steps (20 values)
		 * Position 20-28: 3.0 to 10.0 in 1.0 steps (9 values)
		 * Position 29-37: 20 to 100 in 10 steps (9 values)
		 * Position 38-48: 200 to 1200 in 100 steps (11 values)
		 */
		speedSliderValue: {
			get(): number {
				return this.speedToSliderPosition(this.speed)
			},

			set(pos: number) {
				this.speed = this.sliderPositionToSpeed(pos)
			},
		},

		dragStyle() {
			return {
				left: this.controlsPos.x + 'px',
				top: this.controlsPos.y + 'px',
			}
		},

		eventLogStyle() {
			return {
				left: this.eventLogPos.x + 'px',
				top: this.eventLogPos.y + 'px',
				width: this.logWidth + 'px',
				height: this.logExpanded ? this.logHeight + 'px' : 'auto',
				minHeight: this.logExpanded ? '100px' : '0',
			}
		},

		// ═══════════════════════════════════════════════════════════════════
		//                    L I G H T I N G   C O M P U T E D
		// ═══════════════════════════════════════════════════════════════════

		/** Current lighting configuration from settings store */
		lightingConfig(): LightingConfig {
			return this.$settings.lighting
		},

		/** Preset dropdown value - uses isCustom flag to determine display */
		lightingPreset: {
			get(): LightingPreset {
				// If manually modified, show 'custom', otherwise show the preset
				return this.$settings.lighting.isCustom ? 'custom' : this.$settings.lighting.preset
			},

			set(preset: LightingPreset) {
				if (preset !== 'custom') {
					const newConfig = getLightingPreset(preset)
					// Deep copy all properties to avoid reference issues
					this.$settings.lighting.preset = newConfig.preset
					this.$settings.lighting.isCustom = newConfig.isCustom
					this.$settings.lighting.sky.color = newConfig.sky.color
					this.$settings.lighting.ambient.enabled = newConfig.ambient.enabled
					this.$settings.lighting.ambient.color = newConfig.ambient.color
					this.$settings.lighting.ambient.intensity = newConfig.ambient.intensity
					this.$settings.lighting.hemisphere.enabled = newConfig.hemisphere.enabled
					this.$settings.lighting.hemisphere.skyColor = newConfig.hemisphere.skyColor
					this.$settings.lighting.hemisphere.groundColor = newConfig.hemisphere.groundColor
					this.$settings.lighting.hemisphere.intensity = newConfig.hemisphere.intensity
					this.$settings.lighting.directional.enabled = newConfig.directional.enabled
					this.$settings.lighting.directional.color = newConfig.directional.color
					this.$settings.lighting.directional.intensity = newConfig.directional.intensity
					this.$settings.lighting.directional.positionX = newConfig.directional.positionX
					this.$settings.lighting.directional.positionY = newConfig.directional.positionY
					this.$settings.lighting.directional.positionZ = newConfig.directional.positionZ
					this.$settings.lighting.directional.castShadow = newConfig.directional.castShadow
					this.$settings.lighting.spotlights.enabled = newConfig.spotlights.enabled
					this.$settings.lighting.spotlights.color = newConfig.spotlights.color
					this.$settings.lighting.spotlights.intensity = newConfig.spotlights.intensity
					this.$settings.lighting.spotlights.angle = newConfig.spotlights.angle
					this.$settings.lighting.spotlights.penumbra = newConfig.spotlights.penumbra
					this.$settings.lighting.spotlights.decay = newConfig.spotlights.decay
					this.$settings.lighting.spotlights.height = newConfig.spotlights.height
					this.$settings.lighting.spotlights.distance = newConfig.spotlights.distance
					this.$settings.lighting.spotlights.castShadow = newConfig.spotlights.castShadow
					this.$settings.lighting.spotlights.targetOffset = newConfig.spotlights.targetOffset
					// Force isCustom to false AFTER all changes (in case @change events fired)
					this.$nextTick(() => {
						this.$settings.lighting.isCustom = false
					})
					this.applyLighting()
				}
			},
		},

		/** Shadow quality dropdown value */
		shadowQuality: {
			get(): ShadowQuality {
				return this.$settings.shadowQuality
			},

			set(quality: ShadowQuality) {
				this.$settings.shadowQuality = quality
				this.applyShadowQuality()
				this.promptSaveShadowQuality(quality)
			},
		},

		/** Spotlight shadow quality dropdown value */
		spotlightShadowQuality: {
			get(): ShadowQuality {
				return this.$settings.lighting.spotlights.shadowQuality
			},

			set(quality: ShadowQuality) {
				this.$settings.lighting.spotlights.shadowQuality = quality
				this.applyLighting()
				this.promptSaveSpotlightShadowQuality(quality)
			},
		},

		// Sky color hex
		skyColorHex: {
			get(): string { return '#' + this.$settings.lighting.sky.color.toString(16).padStart(6, '0') },

			set(val: string) {
				this.$settings.lighting.sky.color = parseInt(val.replace('#', ''), 16)
				this.$settings.lighting.isCustom = true
				this.applyLighting()
			},
		},

		// Ambient color hex
		ambientColorHex: {
			get(): string { return '#' + this.$settings.lighting.ambient.color.toString(16).padStart(6, '0') },

			set(val: string) {
				this.$settings.lighting.ambient.color = parseInt(val.replace('#', ''), 16)
				this.$settings.lighting.isCustom = true
				this.applyLighting()
			},
		},

		// Hemisphere sky color hex
		hemiSkyColorHex: {
			get(): string { return '#' + this.$settings.lighting.hemisphere.skyColor.toString(16).padStart(6, '0') },

			set(val: string) {
				this.$settings.lighting.hemisphere.skyColor = parseInt(val.replace('#', ''), 16)
				this.$settings.lighting.isCustom = true
				this.applyLighting()
			},
		},

		// Hemisphere ground color hex
		hemiGroundColorHex: {
			get(): string { return '#' + this.$settings.lighting.hemisphere.groundColor.toString(16).padStart(6, '0') },

			set(val: string) {
				this.$settings.lighting.hemisphere.groundColor = parseInt(val.replace('#', ''), 16)
				this.$settings.lighting.isCustom = true
				this.applyLighting()
			},
		},

		// Directional color hex
		directionalColorHex: {
			get(): string { return '#' + this.$settings.lighting.directional.color.toString(16).padStart(6, '0') },

			set(val: string) {
				this.$settings.lighting.directional.color = parseInt(val.replace('#', ''), 16)
				this.$settings.lighting.isCustom = true
				this.applyLighting()
			},
		},

		// Spotlight color hex
		spotlightColorHex: {
			get(): string { return '#' + this.$settings.lighting.spotlights.color.toString(16).padStart(6, '0') },

			set(val: string) {
				this.$settings.lighting.spotlights.color = parseInt(val.replace('#', ''), 16)
				this.$settings.lighting.isCustom = true
				this.applyLighting()
			},
		},
	},

	watch: {
		speed(val) {
			const engine = this.$match.engine
			if (engine?.realtime) {
				engine.realtime.speed = val
			}
		},
	},

	created() {
		// Initialize seed and create match immediately
		this.randomizeSeed()
		this.initMatch()
	},

	mounted() {
		this.pollLoop()

		// Show welcome message
		ElMessage({
			message: `${APP_INFO.NAME} v${this.version}`,
			type: 'success',
			duration: 2000,
			showClose: false,
		})

		// Init ResizeObserver for Event Log
		this.resizeObserver = new window.ResizeObserver((entries) => {
			if (!this.logExpanded) return
			const entry = entries[0]

			let width, height
			if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
				width = entry.borderBoxSize[0].inlineSize
				height = entry.borderBoxSize[0].blockSize
			} else {
				width = entry.contentRect.width
				height = entry.contentRect.height
			}

			// Avoid updates if collapsed or too small
			if (width > 50) {
				this.logWidth = width
				this.savedLogWidth = width
			}
			if (height > 50) {
				this.logHeight = height
				this.savedLogHeight = height
			}
		})
		if (this.$refs.eventLogRef) {
			this.resizeObserver.observe(this.$refs.eventLogRef as Element)
		}

		// Global mouse listeners for dragging
		window.addEventListener('mousemove', this.onWindowMouseMove)
		window.addEventListener('mouseup', this.onWindowMouseUp)
	},


	beforeUnmount() {
		this.$match.stop()
		if (this.resizeObserver) this.resizeObserver.disconnect()
		window.removeEventListener('mousemove', this.onWindowMouseMove)
		window.removeEventListener('mouseup', this.onWindowMouseUp)
	},

	methods: {
		/**
		 * Convert slider position (0-48) to actual speed value.
		 * Non-linear mapping with different step sizes per range.
		 *
		 * @param {number} pos - Slider position (0-48)
		 * @returns {number} Speed multiplier
		 */
		sliderPositionToSpeed(pos: number): number {
			if (pos <= 19) {
				// Position 0-19: 0.1 to 2.0 in 0.1 steps
				return Math.round((0.1 + pos * 0.1) * 10) / 10
			} else if (pos <= 28) {
				// Position 20-28: 3.0 to 10.0 in 1.0 steps (pos 20 = 3, pos 28 = 10)
				return 3 + (pos - 20)
			} else if (pos <= 37) {
				// Position 29-37: 20 to 100 in 10 steps (pos 29 = 20, pos 37 = 100)
				return 20 + (pos - 29) * 10
			} else {
				// Position 38-48: 200 to 1200 in 100 steps (pos 38 = 200, pos 48 = 1200)
				return 200 + (pos - 38) * 100
			}
		},

		/**
		 * Convert actual speed value to slider position (0-48).
		 * Inverse of sliderPositionToSpeed.
		 *
		 * @param {number} speed - Speed multiplier
		 * @returns {number} Slider position (0-48)
		 */
		speedToSliderPosition(speed: number): number {
			if (speed <= 2.0) {
				// 0.1 to 2.0 → position 0-19
				return Math.round((speed - 0.1) / 0.1)
			} else if (speed <= 10) {
				// 3.0 to 10.0 → position 20-28
				return 20 + Math.round(speed - 3)
			} else if (speed <= 100) {
				// 20 to 100 → position 29-37
				return 29 + Math.round((speed - 20) / 10)
			} else {
				// 200 to 1200 → position 38-48
				return 38 + Math.round((speed - 200) / 100)
			}
		},

		/**
		 * Format speed value for display.
		 *
		 * @param {number} speed - Speed multiplier
		 * @returns {string} Formatted speed string
		 */
		formatSpeed(speed: number): string {
			if (speed < 10) {
				return 'x' + speed.toFixed(1)
			}
			return 'x' + Math.round(speed)
		},

		/**
		 * Initialize the match with current seed.
		 * Called on created() and after reset.
		 */
		initMatch() {
			const seed = parseInt(this.localSeed) || Math.floor(Math.random() * 1000000000)
			console.log('Initializing match with seed:', seed)

			// Create match via store (creates RealTimeScheduler + Match + Engine)
			this.$match.create(seed)

			const engine = this.$match.engine
			if (engine?.realtime) {
				engine.realtime.speed = this.speed
				engine.realtime.onError = (err: unknown) => {
					const error = err as Error
					console.error('Scheduler Error:', error)
					this.$events.error(`Error: ${error.message}`)
				}
			}

			// Create 3D scene with the field from match
			// This runs async - the loading overlay will show until complete
			if (this.$match.field) {
				this.$renderer.createScene(this.$match.field, this.$settings.lighting)
					.catch(err => console.error('[MatchSimulator] Failed to create 3D scene:', err))
			}

			// Schedule debug tick counters 1-10
			for (let i = 1; i <= 10; i++) {
				this.$match.scheduleDebugEvent(i, (e) => {
					this.$events.debug(`Tick ${e.tick}`)
				})
			}

			// Schedule 1-second ticker
			const scheduleTicker = () => {
				this.$match.scheduleDebugEvent(1000, (_e) => {
					this.$events.log('Match Timer: 1 Second Elapsed')
					scheduleTicker()
				})
			}
			scheduleTicker()
		},

		randomizeSeed() {
			this.localSeed = Math.floor(Math.random() * 1000000000).toString()
		},

		startMatch() {
			if (this.$match.running || this.matchFinished) return
			if (!this.$match.engine?.realtime) {
				console.error('No real-time scheduler available')
				return
			}
			this.$match.start()
		},

		pauseMatch() {
			if (!this.$match.running) return
			this.$match.stop()
		},

		/**
		 * Advance the simulation by exactly 1 tick.
		 * If the scheduler is running, stops it first.
		 */
		async stepOneTick() {
			if (this.matchFinished) {
				this.$events.warning('Match is already finished, cannot step further.')
				return
			}

			const engine = this.$match.engine
			if (!engine?.realtime) {
				console.error('No real-time scheduler available')
				return
			}

			// Stop if running
			if (this.$match.running) {
				await engine.realtime.stop()
				this.$match.running = false
			}

			// Advance by exactly 1 tick
			await engine.realtime.scheduler.advance(1)

			// Update displayed tick
			this.$match.tick = engine.realtime.scheduler.currentTick

			// Log status with remaining event count
			const eventCount = engine.realtime.scheduler.eventCount
			this.$events.info(`Stepped to tick ${this.$match.tick}. Events remaining: ${eventCount}`)
		},

		resetMatch() {
			this.$match.reset()
			this.$events.clear()
			this.randomizeSeed()
			this.initMatch()
		},

		setView(val: string) {
			this.view = val
			this.selectedPlayer = null
		},

		pollLoop() {
			// Poll scheduler tick for display (UI only)
			const engine = this.$match.engine
			if (engine?.realtime) {
				const tick = engine.realtime.scheduler.currentTick
				if (tick !== this.$match.tick) {
					this.$match.tick = tick
				}
			}
			this.pollId = requestAnimationFrame(this.pollLoop)
		},

		onPlayerClick(player: unknown, event: MouseEvent) {
			console.log('Player clicked:', (player as { id: number }).id)
			// Stop propagation to prevent background click from immediately closing it
			if (event && event.stopPropagation) event.stopPropagation()
			if (event && event.preventDefault) event.preventDefault()

			this.selectedPlayer = player
			// Position stats panel near the click, but keep it on screen
			const x = Math.min(event.clientX + 10, window.innerWidth - 220)
			const y = Math.min(event.clientY + 10, window.innerHeight - 150)
			this.statsPos = { x, y }
		},

		onBackgroundClick(event: MouseEvent) {
			// Only close if this is a genuine background click (not a click that bubbled up)
			if (event && event.defaultPrevented) {
				console.log('Background click ignored (event was handled)')
				return
			}
			console.log('Background clicked, closing player stats')
			this.selectedPlayer = null
		},

		formattedTimeFromTick(tick: number) {
			const minutes = Math.floor(tick / 60000)
			const seconds = Math.floor((tick % 60000) / 1000)
			return minutes + ':' + seconds.toString().padStart(2, '0')
		},

		// Dragging Logic
		startDrag(type: string, event: MouseEvent) {
			console.log('startDrag', type)
			this.draggingElement = type
			const pos = type === 'controls' ? this.controlsPos : this.eventLogPos
			this.dragOffset = {
				x: event.clientX - pos.x,
				y: event.clientY - pos.y,
			}
			// Prevent text selection during drag
			event.preventDefault()
		},

		onWindowMouseMove(event: MouseEvent) {
			if (!this.draggingElement) return
			// console.log('dragging', this.draggingElement)

			const x = event.clientX - this.dragOffset.x
			const y = event.clientY - this.dragOffset.y

			// Simple bounds checking (optional, but good for UX)
			const maxX = window.innerWidth - 50
			const maxY = window.innerHeight - 50
			const clampedX = Math.max(0, Math.min(x, maxX))
			const clampedY = Math.max(0, Math.min(y, maxY))

			if (this.draggingElement === 'controls') {
				this.controlsPos = { x: clampedX, y: clampedY }
			} else if (this.draggingElement === 'log') {
				this.eventLogPos = { x: clampedX, y: clampedY }
			}
		},

		onWindowMouseUp() {
			this.draggingElement = null
		},

		toggleLog() {
			this.logExpanded = !this.logExpanded
		},

		// ═══════════════════════════════════════════════════════════════════
		//                    L I G H T I N G   M E T H O D S
		// ═══════════════════════════════════════════════════════════════════

		/**
		 * Apply the current lighting configuration to the active renderer.
		 */
		applyLighting() {
			// 2D renderer doesn't use lighting
			if (this.activeRenderer === 'Canvas2DRenderer') return

			// Use $nextTick to ensure component is ready
			this.$nextTick(() => {
				// Access the renderer component via $refs
				const renderer = this.$refs.rendererRef as any
				if (renderer && typeof renderer.updateLighting === 'function') {
					renderer.updateLighting(cloneLightingConfig(this.$settings.lighting))
				}
			})
		},

		/**
		 * Apply the current shadow quality to the active renderer.
		 */
		applyShadowQuality() {
			// 2D renderer doesn't use shadows
			if (this.activeRenderer === 'Canvas2DRenderer') return

			// Use $nextTick to ensure component is ready
			this.$nextTick(() => {
				const renderer = this.$refs.rendererRef as any
				if (renderer && typeof renderer.updateShadowQuality === 'function') {
					renderer.updateShadowQuality(this.$settings.shadowQuality)
				}
			})
		},

		/**
		 * Prompt user to save shadow quality setting to localStorage.
		 *
		 * @param quality - Shadow quality level to save
		 */
		promptSaveShadowQuality(quality: ShadowQuality) {
			const qualityLabels: Record<ShadowQuality, string> = {
				low: 'Low (1K)',
				medium: 'Medium (2K)',
				high: 'High (4K)',
				ultra: 'Ultra (8K)',
			}

			ElMessageBox.confirm(
				`Save "${qualityLabels[quality]}" as your default shadow quality?`,
				'Save Setting',
				{
					confirmButtonText: 'Save',
					cancelButtonText: 'No thanks',
					type: 'info',
				},
			).then(() => {
				localStorage.setItem(STORAGE_KEYS.SHADOW_QUALITY, quality)
				ElMessage.success('Shadow quality saved')
			}).catch(() => {
				// User cancelled, no action needed
			})
		},

		/**
		 * Prompt user to save spotlight shadow quality setting to localStorage.
		 *
		 * @param quality - Shadow quality level to save
		 */
		promptSaveSpotlightShadowQuality(quality: ShadowQuality) {
			const qualityLabels: Record<ShadowQuality, string> = {
				low: 'Low (1K)',
				medium: 'Medium (2K)',
				high: 'High (4K)',
				ultra: 'Ultra (8K)',
			}

			ElMessageBox.confirm(
				`Save "${qualityLabels[quality]}" as your default spotlight shadow quality?`,
				'Save Setting',
				{
					confirmButtonText: 'Save',
					cancelButtonText: 'No thanks',
					type: 'info',
				},
			).then(() => {
				localStorage.setItem(STORAGE_KEYS.SPOTLIGHT_SHADOW_QUALITY, quality)
				ElMessage.success('Spotlight shadow quality saved')
			}).catch(() => {
				// User cancelled, no action needed
			})
		},

		/**
		 * Update a lighting value and apply changes.
		 * Used by sliders and inputs in the UI.
		 *
		 * @param path - Dot-separated path to the property (e.g., 'ambient.intensity')
		 * @param value - New value to set
		 */
		updateLightingValue(path: string, value: number | boolean) {
			const parts = path.split('.')
			let target: any = this.$settings.lighting
			for (let i = 0; i < parts.length - 1; i++) {
				target = target[parts[i]]
			}
			target[parts[parts.length - 1]] = value
			this.$settings.lighting.isCustom = true
			this.applyLighting()
		},
	},
})
</script>

<style scoped>
.match-simulator {
	position: relative;
	width: 100%;
	height: 100vh;
	overflow: hidden;
	background: #111;
}

/* Loading overlay for 3D renderers */
.loading-overlay {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgb(17 17 17 / 95%);
	z-index: 50;
}

.loading-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	color: #fff;
}

.loading-icon {
	font-size: 48px;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.loading-text {
	font-size: 16px;
	color: #aaa;
}

.renderer-host {
	position: absolute;
	inset: 0;
}

.floating-controls {
	position:absolute;
	background:rgb(30 30 30 / 85%);
	backdrop-filter: blur(4px);
	border:1px solid #333;
	border-radius:8px;
	padding:6px 10px;
	font-size:12px;
	user-select:none;
	min-width:320px;
	z-index: 100;
}

.floating-log {
	position:absolute;
	background:rgb(30 30 30 / 85%);
	backdrop-filter: blur(4px);
	border:1px solid #333;
	border-radius:8px;
	font-size:12px;
	user-select:none;
	z-index: 90;
	display: flex;
	flex-direction: column;
	resize: both;
	overflow: hidden;
	min-width: 200px;
}

.log-handle {
	padding: 6px 10px;
	border-bottom: 1px solid #333;
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-shrink: 0;
}

.drag-handle {
	cursor: grab;
}

.drag-handle:active {
	cursor: grabbing;
}

.log-body {
	flex: 1;
	overflow-y: auto;
	padding: 6px 10px;
	background: rgb(0 0 0 / 20%);
}

.empty-log {
	color: #666;
	font-style: italic;
	text-align: center;
	padding: 10px;
}

.log-entry {
	display: flex;
	gap: 8px;
	margin-bottom: 4px;
	font-family: monospace;
}

.log-time {
	color: #888;
	min-width: 40px;
}

.log-text {
	color: #ddd;
}

.controls-row {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 6px;
}

.controls-row:last-child {
	margin-bottom: 0;
}

.team-name {
	font-weight: bold;
	color: #fff;
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.team-name:first-child {
	text-align: right;
}

.team-name:last-of-type {
	text-align: left;
}

.score {
	font-size: 14px;
	font-weight: bold;
	color: #4ade80;
	background: #000;
	padding: 2px 6px;
	border-radius: 4px;
	flex-shrink: 0;
}

.tick-display {
	font-family: monospace;
	font-size: 11px;
	color: #888;
	background: #1a1a1a;
	padding: 2px 6px;
	border-radius: 4px;
	min-width: 70px;
	text-align: right;
}

.buttons-row {
	justify-content: center;
}

.view-row {
	justify-content: center;
}

.slider-row {
	margin-top: 4px;
}

.slider-label {
	width: 40px;
	color: #aaa;
}

.slider-container {
	flex: 1;
	padding: 0 10px;
}

.seed-input {
	width: 80px;
}

.time-display {
	font-family: monospace;
	font-size: 14px;
	color: #fff;
	margin-left: auto;
}

.speed-display {
	font-family: monospace;
	font-size: 11px;
	color: #aaa;
	min-width: 45px;
	text-align: right;
	margin-left: 4px;
}

.lighting-toggle {
	cursor: pointer;
	user-select: none;
	color: var(--el-color-primary);
}

.lighting-toggle:hover {
	text-decoration: underline;
}

/* MAX Speed Button */
.max-speed-btn {
	padding: 4px 8px !important;
	font-size: 10px !important;
	min-height: 20px !important;
	height: 20px !important;
	line-height: 1 !important;
	margin-left: 4px;
}

/* Settings Dialog Styles */
:global(.settings-dialog) {
	display: flex;
	flex-direction: column;
	margin-top: 8vh !important;
}

:global(.settings-dialog .el-dialog__body) {
	padding: 10px 20px !important;
}

.settings-content {
	max-height: 60vh;
	overflow: auto;
	padding-right: 16px; /* Reserve space for scrollbar */
}

/* Custom Scrollbar for settings */
.settings-content::-webkit-scrollbar {
	width: 8px;
}

.settings-content::-webkit-scrollbar-track {
	background: #1f2937;
	border-radius: 4px;
}

.settings-content::-webkit-scrollbar-thumb {
	background: #4b5563;
	border-radius: 4px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
	background: #6b7280;
}

.setting-group {
	margin-bottom: 24px;
}

.setting-item {
	display: flex;
	align-items: center;
	margin-bottom: 16px;
	min-height: 32px;
}

.setting-item > span {
	width: 160px;
	flex-shrink: 0;
	font-size: 14px;
	color: #d1d5db;
	margin-right: 16px;
	line-height: 1.2;
}

/* Flex grow for controls */
.setting-item > .el-slider,
.setting-item > .el-select,
.setting-item > .el-input,
.setting-item > .el-switch,
.setting-item > .el-radio-group,
.setting-item > .el-color-picker {
	flex-grow: 1;
	width: auto;
}

/* Fix for ElSlider in flex container causing horizontal overflow */
.setting-item > .el-slider {
	min-width: 0; /* Critical for flexbox to allow shrinking */
	margin-right: 8px;
}

/* Sub-settings indentation */
.setting-sub {
	margin-left: 12px;
	padding-left: 16px;
	border-left: 2px solid #374151;
	margin-top: 8px;
	margin-bottom: 16px;
	padding-top: 8px;
}

</style>
