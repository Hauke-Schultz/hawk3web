<script setup>
import {ref, onMounted, onUnmounted, computed, watch} from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../../composables/useLocalStorage.js'
import { useI18n } from '../../../composables/useI18n.js'
import { getLevelConfig, getColorForHeight, STACK_CONFIG } from './stackConfig'
import { StackEngine } from './StackEngine.js'
import Header from '../../components/Header.vue'
import Icon from '../../../components/Icon.vue'
import ProgressOverview from '../../components/ProgressOverview.vue'
import PerformanceStats from '../../components/PerformanceStats.vue'
import GameCanvas from './GameCanvas.vue'

// Props
const props = defineProps({
	level: {
		type: Number,
		default: 1
	}
})

const router = useRouter()
const { t } = useI18n()
const {
	gameData,
	updateStackMergeLevel,
	updateGameStats,
	addScore
} = useLocalStorage()

// Component refs
const gameContainer = ref(null)
const gameBoard = ref(null)

// Game state
const currentLevel = ref(props.level || 1)
const gameState = ref('playing') // 'playing', 'completed', 'gameover'
const engine = ref(null)
const updateLoopId = ref(null)

// Stats (synced with engine)
const currentHeight = ref(0)
const currentScore = ref(0)
const perfectStacks = ref(0)
const totalStacks = ref(0)
const currentCombo = ref(0)
const maxCombo = ref(0)
const sessionTime = ref(0)
const sessionTimer = ref(null)

// Game rendering state (synced with engine)
const placedBlocks = ref([])
const currentBlock = ref(null)
const fallingPieces = ref([])
const cameraOffset = ref(0)

// Computed
const currentLevelConfig = computed(() => getLevelConfig(currentLevel.value))

const isEndlessMode = computed(() => {
	return currentLevelConfig.value.targetHeight === Infinity
})

const gameProgress = computed(() => {
	if (isEndlessMode.value) return { completed: 0, total: 1, percentage: 0 }

	const target = currentLevelConfig.value.targetHeight
	const completed = Math.min(currentHeight.value, target)
	return {
		completed,
		total: target,
		percentage: Math.round((completed / target) * 100)
	}
})

const perfectPercentage = computed(() => {
	if (totalStacks.value === 0) return 0
	return Math.round((perfectStacks.value / totalStacks.value) * 100)
})

const endlessStats = computed(() => {
	if (!isEndlessMode.value || !engine.value) return null
	return engine.value.getEndlessStats()
})

const endlessStarProgress = computed(() => {
	if (!endlessStats.value) return 0
	return endlessStats.value.progress
})

const endlessCurrentStars = computed(() => {
	if (!endlessStats.value) return 0
	return endlessStats.value.stars
})

const endlessBlocksToNextStar = computed(() => {
	if (!endlessStats.value) return 0
	return endlessStats.value.blocksToNextStar
})

// Game functions
const startGame = () => {
	gameState.value = 'playing'

	// Create engine
	engine.value = new StackEngine(currentLevelConfig.value)
	engine.value.start()

	// Sync initial state
	syncEngineState()

	// Start update loop
	startUpdateLoop()

	if (isEndlessMode.value) {
		startSessionTimer()
	}

	console.log('🎮 Game started with engine')
}

// Sync engine state to reactive refs
const syncEngineState = () => {
	if (!engine.value) return

	const state = engine.value.getState()

	currentHeight.value = state.height
	currentScore.value = state.score
	perfectStacks.value = state.perfectStacks
	totalStacks.value = state.totalStacks
	currentCombo.value = state.currentCombo
	maxCombo.value = state.maxCombo
	placedBlocks.value = state.placedBlocks
	currentBlock.value = state.currentBlock
	fallingPieces.value = state.fallingPieces

	const targetOffset = engine.value.getCameraOffset()
	const currentOffset = cameraOffset.value

	cameraOffset.value = currentOffset + (targetOffset - currentOffset) * 0.15
}

// Update loop
const startUpdateLoop = () => {
	const update = (timestamp) => {
		if (!engine.value || gameState.value !== 'playing') return

		// Update engine
		engine.value.update(timestamp)

		// Sync state
		syncEngineState()

		// Continue loop
		updateLoopId.value = requestAnimationFrame(update)
	}

	updateLoopId.value = requestAnimationFrame(update)
}

// Stop update loop
const stopUpdateLoop = () => {
	if (updateLoopId.value) {
		cancelAnimationFrame(updateLoopId.value)
		updateLoopId.value = null
	}
}

// Handle player input (tap/click to drop block)
const handleDrop = () => {
	if (!engine.value || gameState.value !== 'playing') return

	const result = engine.value.dropBlock()

	if (!result.success) {
		if (result.gameOver) {
			handleGameOver()
		}
		return
	}

	// Sync state after drop
	syncEngineState()

	// Check level completion
	if (result.levelComplete) {
		completeLevel()
	}

	// Visual/Audio feedback
	if (result.isPerfect) {
		console.log('✨ Perfect stack!')
		// TODO: Add perfect stack animation/sound
	}
}

// Handle keyboard/touch input
const handleKeyDown = (event) => {
	if (gameState.value !== 'playing') return

	if (event.key === ' ' || event.key === 'Enter') {
		event.preventDefault()
		handleDrop()
	}
}

const handleTouchStart = (event) => {
	if (gameState.value !== 'playing') return
	event.preventDefault()
	handleDrop()
}

// Timer functions
const startSessionTimer = () => {
	if (!isEndlessMode.value) return

	sessionTimer.value = setInterval(() => {
		sessionTime.value++
	}, 1000)
}

const stopSessionTimer = () => {
	if (sessionTimer.value) {
		clearInterval(sessionTimer.value)
		sessionTimer.value = null
	}
}

// Complete level
const completeLevel = () => {
	if (gameState.value !== 'playing') return

	gameState.value = 'completed'
	stopSessionTimer()
	stopUpdateLoop()

	if (engine.value) {
		engine.value.stop()
	}

	// Calculate statistics
	const perfectPercent = totalStacks.value > 0
			? Math.round((perfectStacks.value / totalStacks.value) * 100)
			: 0

	// Calculate stars (1-3 based on perfect percentage)
	const stars = perfectPercent >= 80 ? 3 : perfectPercent >= 60 ? 2 : 1

	// Update level statistics
	updateStackMergeLevel(currentLevel.value, {
		completed: true,
		stars: stars,
		height: currentHeight.value,
		score: currentScore.value,
		perfectPercent: perfectPercent,
		totalStacks: totalStacks.value,
		perfectStacks: perfectStacks.value,
		combo: maxCombo.value
	})

	// Check if first time completion
	const previousStats = gameData.games.stackMerge.levels[currentLevel.value]
	const isFirstTime = previousStats ? !previousStats.completed : true

	// Update game stats
	const gameStats = {
		gamesPlayed: gameData.games.stackMerge.gamesPlayed + 1,
		totalScore: gameData.games.stackMerge.totalScore + currentScore.value,
		highScore: Math.max(gameData.games.stackMerge.highScore, currentScore.value),
		maxLevel: Math.max(gameData.games.stackMerge.maxLevel, currentLevel.value),
		totalStacks: gameData.games.stackMerge.totalStacks + totalStacks.value,
		totalPerfectStacks: gameData.games.stackMerge.totalPerfectStacks + perfectStacks.value,
		bestCombo: Math.max(gameData.games.stackMerge.bestCombo, maxCombo.value),
		maxCombo: Math.max(gameData.games.stackMerge.maxCombo, maxCombo.value),
		stars: gameData.games.stackMerge.stars + stars,
		completedLevels: gameData.games.stackMerge.completedLevels + (isFirstTime ? 1 : 0)
	}

	updateGameStats('stackMerge', gameStats)
	addScore(currentScore.value)

	console.log('🏗️ Level completed!', {
		height: currentHeight.value,
		score: currentScore.value,
		perfectPercent,
		stars
	})
}

// Game over handler

const handleGameOver = () => {
	if (gameState.value !== 'playing') return

	gameState.value = 'gameover'
	stopSessionTimer()
	stopUpdateLoop()

	if (engine.value) {
		engine.value.stop()
	}

	// For endless mode
	if (isEndlessMode.value) {
		// GEÄNDERT: Use endless star calculation
		const { calculateEndlessStars } = require('./stackHelpers.js')
		const stars = calculateEndlessStars(currentHeight.value)
		const perfectPercent = totalStacks.value > 0
				? Math.round((perfectStacks.value / totalStacks.value) * 100)
				: 0

		updateStackMergeLevel(currentLevel.value, {
			completed: true,
			stars: stars,
			height: currentHeight.value,
			score: currentScore.value,
			perfectPercent: perfectPercent,
			totalStacks: totalStacks.value,
			perfectStacks: perfectStacks.value,
			combo: maxCombo.value
		})

		console.log('🏗️ Endless mode ended!', {
			height: currentHeight.value,
			score: currentScore.value,
			stars: stars,
			progress: Math.round((currentHeight.value / 100) * 100) + '%'
		})
	} else {
		// Regular level game over (keine Änderung)
		const perfectPercent = totalStacks.value > 0
				? Math.round((perfectStacks.value / totalStacks.value) * 100)
				: 0
	}

	// Update game stats (bleibt gleich)
	const gameStats = {
		gamesPlayed: gameData.games.stackMerge.gamesPlayed + 1,
		totalScore: gameData.games.stackMerge.totalScore + currentScore.value,
		highScore: Math.max(gameData.games.stackMerge.highScore, currentScore.value),
		totalStacks: gameData.games.stackMerge.totalStacks + totalStacks.value,
		totalPerfectStacks: gameData.games.stackMerge.totalPerfectStacks + perfectStacks.value,
		bestCombo: Math.max(gameData.games.stackMerge.bestCombo, maxCombo.value),
		maxCombo: Math.max(gameData.games.stackMerge.maxCombo, maxCombo.value)
	}

	updateGameStats('stackMerge', gameStats)
	addScore(currentScore.value)
}

// Navigation
const backToLevelSelection = () => {
	stopUpdateLoop()
	router.push('/games/stackmerge')
}

const handleMenuClick = () => {
	stopUpdateLoop()
	router.push('/')
}

const handleTryAgain = () => {
	stopUpdateLoop()
	startGame()
}

const nextLevel = () => {
	if (currentLevel.value < 6) {
		currentLevel.value++
		router.push(`/games/stackmerge/${currentLevel.value}`)
		stopUpdateLoop()
		startGame()
	} else {
		backToLevelSelection()
	}
}

// Lifecycle
onMounted(() => {
	startGame()

	// Add event listeners
	document.addEventListener('keydown', handleKeyDown)

	if (gameBoard.value) {
		gameBoard.value.addEventListener('touchstart', handleTouchStart, { passive: false })
		gameBoard.value.addEventListener('click', handleDrop)
	}
})

onUnmounted(() => {
	stopSessionTimer()
	stopUpdateLoop()

	if (engine.value) {
		engine.value.stop()
	}

	// Remove event listeners
	document.removeEventListener('keydown', handleKeyDown)

	if (gameBoard.value) {
		gameBoard.value.removeEventListener('touchstart', handleTouchStart)
		gameBoard.value.removeEventListener('click', handleDrop)
	}
})

// Watch level changes
watch(() => props.level, (newLevel) => {
	currentLevel.value = newLevel
	stopUpdateLoop()
	startGame()
})
</script>

<template>
	<Header
			:game-data="gameData"
			:player="gameData.player"
			:achievements="gameData.achievements"
			:show-menu-button="true"
			@menu-click="handleMenuClick"
	/>

	<main class="stack-merge-game">
		<!-- Game Header -->
		<div class="game-header">
			<div class="game-info">
				<h2 class="game-title">{{ t('stackMerge.title') }}</h2>
				<div class="level-indicator" :class="{ 'level-indicator--endless': isEndlessMode }">
					{{ isEndlessMode ? t('stackMerge.endless_mode') : t('stackMerge.level_title', { level: currentLevel }) }}
				</div>
			</div>

			<div class="game-stats-container">
				<!-- Progress Overview (only for regular levels) -->
				<ProgressOverview
						v-if="!isEndlessMode"
						:completed="gameProgress.completed"
						:total="gameProgress.total"
						theme="danger"
						size="small"
						:levels-label="currentLevelConfig.targetHeight.toString()"
						:show-stars="false"
						:show-percentage="false"
						:complete-label="t('stackMerge.target')"
				/>

				<!-- Performance Stats -->
				<PerformanceStats
						:score="currentScore"
						:time-elapsed="isEndlessMode ? sessionTime : 0"
						:moves="currentHeight"
						:matches="perfectStacks"
						:total-pairs="totalStacks"
						:combo-count="currentCombo"
						:combo-multiplier="1"
						:max-combo="maxCombo"
						:combo-time-remaining="0"
						:combo-time-max="3000"
						:is-combo-active="currentCombo > 1"
						layout="horizontal"
						theme="card"
						size="normal"
						:show-score="true"
						:show-time="isEndlessMode"
						:show-moves="true"
						:show-matches="false"
						:show-combo="true"
						:score-label="t('stats.score')"
						:time-label="t('stats.time')"
						:moves-label="t('stackMerge.height')"
						:combo-label="t('stats.combo')"
				/>
			</div>
		</div>

		<!-- Game Board Container -->
		<div class="game-container" ref="gameContainer">
			<div
					ref="gameBoard"
					class="game-board"
					:class="{
          'game-board--endless': isEndlessMode,
          'game-board--playing': gameState === 'playing'
        }"
			>
				<!-- Endless Mode Info Overlay -->
				<div v-if="isEndlessMode" class="endless-overlay">
					<div class="stats-preview">
						<!-- Star Progress -->
						<span class="stat-item">
							<Icon
									v-for="starIndex in 3"
									:key="starIndex"
									:name="starIndex <= endlessCurrentStars ? 'star-filled' : 'star'"
									size="16"
									:class="{
									'star--earned': starIndex <= endlessCurrentStars,
									'star--empty': starIndex > endlessCurrentStars
								}"
							/>
						</span>

						<!-- Progress Percentage -->
						<span class="stat-item stat-item--progress">
							{{ endlessStarProgress }}%
						</span>

						<!-- Blocks to Next Star -->
						<span v-if="!endlessStats?.isMaxStars" class="stat-item stat-item--next">
							+{{ endlessBlocksToNextStar }} → ⭐
						</span>
					</div>
				</div>

				<!-- Tap Instruction -->
				<div v-if="gameState === 'playing' && totalStacks === 0" class="tap-instruction">
					<p>{{ t('stackMerge.tapToStack') }}</p>
				</div>

				<!-- Game Canvas Component -->
				<GameCanvas
						:blocks="placedBlocks"
						:current-block="currentBlock"
						:falling-pieces="fallingPieces"
						:camera-offset="cameraOffset"
						:game-state="gameState"
				/>
			</div>
		</div>

		<!-- Game Over Overlay -->
		<div v-if="gameState === 'gameover'" class="gameover-overlay">
			<h2>{{ isEndlessMode ? '🏗️ Tower Collapsed!' : t('stackMerge.gameOver') }}</h2>
			<div class="gameover-stats">
				<p>{{ t('stackMerge.finalHeight') }}: {{ currentHeight }}</p>
				<p>{{ t('stackMerge.finalScore') }}: {{ currentScore }}</p>
				<p>{{ t('stackMerge.perfectStacks') }}: {{ perfectStacks }}/{{ totalStacks }} ({{ perfectPercentage }}%)</p>

				<!-- Endless Mode: Show Star Progress -->
				<div v-if="isEndlessMode" class="endless-final-stats">
					<p class="progress-text">{{ t('stackMerge.progress') }}: {{ Math.round((currentHeight / 100) * 100) }}%</p>
					<div class="stars-display">
						<Icon
							v-for="starIndex in 3"
							:key="starIndex"
							:name="starIndex <= endlessCurrentStars ? 'star-filled' : 'star'"
							size="32"
							:class="{
								'star--earned': starIndex <= endlessCurrentStars
							}"
						/>
					</div>
					<p v-if="currentHeight < 100" class="next-milestone">
						{{ endlessBlocksToNextStar }} blocks to next star!
					</p>
					<p v-else class="max-stars">
						🎉 Maximum Stars Achieved!
					</p>
				</div>

				<p v-if="isEndlessMode">
					{{ t('stackMerge.timeElapsed') }}: {{ Math.floor(sessionTime / 60) }}:{{ String(sessionTime % 60).padStart(2, '0') }}
				</p>
			</div>
			<button @click="handleTryAgain" class="btn btn--primary">
				{{ t('common.retry') }}
			</button>
			<button @click="backToLevelSelection" class="btn btn--ghost">
				{{ t('common.menu') }}
			</button>
		</div>

		<!-- Completed Overlay -->
		<div v-if="gameState === 'completed'" class="gameover-overlay">
			<h2>🎉 {{ t('stackMerge.levelComplete') }}</h2>
			<div class="gameover-stats">
				<p>{{ t('stackMerge.finalHeight') }}: {{ currentHeight }}</p>
				<p>{{ t('stackMerge.finalScore') }}: {{ currentScore }}</p>
				<p>{{ t('stackMerge.perfectStacks') }}: {{ perfectStacks }}/{{ totalStacks }} ({{ perfectPercentage }}%)</p>
				<div class="stars-display">
					<Icon
							v-for="starIndex in 3"
							:key="starIndex"
							:name="starIndex <= (perfectPercentage >= 80 ? 3 : perfectPercentage >= 60 ? 2 : 1) ? 'star-filled' : 'star'"
							size="32"
							:class="{
              'star--earned': starIndex <= (perfectPercentage >= 80 ? 3 : perfectPercentage >= 60 ? 2 : 1)
            }"
					/>
				</div>
			</div>
			<button v-if="!isEndlessMode && currentLevel < 6" @click="nextLevel" class="btn btn--primary">
				{{ t('stackMerge.nextLevel') }}
			</button>
			<button @click="handleTryAgain" class="btn btn--primary">
				{{ t('common.retry') }}
			</button>
			<button @click="backToLevelSelection" class="btn btn--ghost">
				{{ t('common.menu') }}
			</button>
		</div>

		<!-- Action Buttons -->
		<div class="button-row">
			<button class="btn btn--small btn--danger" @click="handleTryAgain">
				<Icon name="refresh" size="16" class="icon--left" />
				{{ t('stackMerge.restart') }}
			</button>
		</div>
	</main>
</template>

<style lang="scss" scoped>
.stack-merge-game {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding: var(--space-4);
	min-height: calc(100vh - 80px);
	touch-action: manipulation;
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	user-select: none;
	overscroll-behavior: contain;
}

// Game Header
.game-header {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.game-info {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.game-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.level-indicator {
	background-color: var(--danger-color);
	color: white;
	padding: var(--space-1) var(--space-3);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	align-self: center;

	&--endless {
		background: linear-gradient(135deg, var(--danger-color), var(--warning-color));
		animation: endlessGlow 2s ease-in-out infinite alternate;
	}
}

.game-stats-container {
	display: flex;
	flex-direction: row;
	gap: var(--space-2);
	justify-content: space-between;
}

// Game Container
.game-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	position: relative;
	flex: 1;
	touch-action: manipulation;
	overscroll-behavior: contain;
	user-select: none;
}

.game-board {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
	width: 100%;
	gap: var(--space-4);
	position: relative;
	touch-action: manipulation;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;

	&--playing {
		cursor: pointer;
	}

	&--endless {
		border: 2px solid var(--danger-color);
		border-radius: var(--border-radius-lg);
		padding: var(--space-2);
	}
}

// Tap Instruction
.tap-instruction {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 5;
	pointer-events: none;
	animation: pulse 2s ease-in-out infinite;

	p {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		color: rgba(255, 255, 255, 0.8);
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
		margin: 0;
	}
}

// Endless Mode Overlay
.endless-overlay {
	position: absolute;
	top: var(--space-3);
	right: var(--space-4);
	z-index: 10;
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.stats-preview {
	display: flex;
	gap: var(--space-2);
	background-color: rgba(0, 0, 0, 0.7);
	padding: var(--space-2) var(--space-3);
	border-radius: var(--border-radius-md);
}

.stat-item {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: white;
}

// Overlays
.gameover-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.95);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-4);
	z-index: 100;
	padding: var(--space-4);

	h2 {
		font-size: var(--font-size-2xl);
		margin-bottom: var(--space-2);
		color: white;
	}
}

.gameover-stats {
	text-align: center;
	font-size: var(--font-size-lg);
	margin-bottom: var(--space-4);
	color: white;

	p {
		margin: var(--space-2) 0;
	}
}

.stars-display {
	display: flex;
	gap: var(--space-2);
	justify-content: center;
	margin-top: var(--space-3);
}

.star--earned {
	color: var(--warning-color);
	filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.6));
}

// Buttons
.button-row {
	display: flex;
	gap: var(--space-2);
	justify-content: center;
	margin-top: var(--space-2);
}

.btn {
	padding: var(--space-3) var(--space-6);
	border-radius: var(--border-radius-lg);
	font-size: var(--font-size-base);
	font-weight: 600;
	cursor: pointer;
	border: none;
	display: flex;
	align-items: center;
	gap: var(--space-2);
	transition: all 0.2s ease;

	&--primary {
		background: var(--primary-color);
		color: white;

		&:hover {
			background: var(--primary-hover);
			transform: translateY(-1px);
		}
	}

	&--ghost {
		background: transparent;
		border: 2px solid rgba(255, 255, 255, 0.3);
		color: white;

		&:hover {
			border-color: rgba(255, 255, 255, 0.5);
			transform: translateY(-1px);
		}
	}

	&--danger {
		background: var(--danger-color);
		color: white;

		&:hover {
			background: #dc2626;
			transform: translateY(-1px);
		}
	}

	&--small {
		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-sm);
	}
}

.icon--left {
	margin-right: var(--space-1);
}


.stats-preview {
	display: flex;
	gap: var(--space-2);
	background-color: rgba(0, 0, 0, 0.8);
	padding: var(--space-2) var(--space-3);
	border-radius: var(--border-radius-md);
	align-items: center;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: white;

	&--progress {
		color: var(--warning-color);
		font-size: var(--font-size-base);
	}

	&--next {
		color: rgba(255, 255, 255, 0.7);
		font-size: var(--font-size-xs);
	}
}

.star--earned {
	color: var(--warning-color);
	filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.6));
}

.star--empty {
	color: rgba(255, 255, 255, 0.3);
}

// Animations
@keyframes endlessGlow {
	0% {
		box-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
	}
	100% {
		box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
	}
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1);
	}
	50% {
		opacity: 0.7;
		transform: translate(-50%, -50%) scale(1.05);
	}
}

.endless-final-stats {
	margin-top: var(--space-4);
	padding: var(--space-4);
	background: rgba(239, 68, 68, 0.1);
	border-radius: var(--border-radius-lg);
	border: 2px solid var(--danger-color);

	.progress-text {
		font-size: var(--font-size-xl);
		color: var(--warning-color);
		font-weight: var(--font-weight-bold);
		margin-bottom: var(--space-2);
	}

	.next-milestone {
		font-size: var(--font-size-sm);
		color: rgba(255, 255, 255, 0.7);
		margin-top: var(--space-2);
	}

	.max-stars {
		font-size: var(--font-size-lg);
		color: var(--warning-color);
		font-weight: var(--font-weight-bold);
		margin-top: var(--space-2);
		animation: pulse 2s ease-in-out infinite;
	}
}

// Touch feedback
@media (hover: none) {
	.game-container,
	.game-board {
		user-select: none;
		-webkit-user-select: none;
	}
}
</style>