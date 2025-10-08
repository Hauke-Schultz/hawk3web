<script setup>
import {ref, onMounted, onUnmounted, computed} from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../../composables/useLocalStorage.js'
import { useI18n } from '../../../composables/useI18n.js'
import { getLevelConfig } from './stackConfig'
import Header from '../../components/Header.vue'
import Icon from '../../../components/Icon.vue'
import ProgressOverview from '../../components/ProgressOverview.vue'
import PerformanceStats from '../../components/PerformanceStats.vue'

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

// Stats
const currentHeight = ref(0)
const currentScore = ref(0)
const perfectStacks = ref(0)
const totalStacks = ref(0)
const currentCombo = ref(0)
const maxCombo = ref(0)
const sessionTime = ref(0)
const sessionTimer = ref(null)

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

// Game functions
const startGame = () => {
	gameState.value = 'playing'
	currentHeight.value = 0
	currentScore.value = 0
	perfectStacks.value = 0
	totalStacks.value = 0
	currentCombo.value = 0
	maxCombo.value = 0
	sessionTime.value = 0

	if (isEndlessMode.value) {
		startSessionTimer()
	}

	// TODO: Initialize game engine (Step 4)
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

	// Calculate statistics
	const perfectPercent = totalStacks.value > 0
			? Math.round((perfectStacks.value / totalStacks.value) * 100)
			: 0

	// For endless mode, treat game over as completion
	if (isEndlessMode.value) {
		const stars = perfectPercent >= 80 ? 3 : perfectPercent >= 60 ? 2 : 1

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
	}

	// Update game stats
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

	console.log('🏗️ Game over!', {
		height: currentHeight.value,
		score: currentScore.value,
		perfectPercent
	})
}

// Navigation
const backToLevelSelection = () => {
	router.push('/games/stackmerge')
}

const handleMenuClick = () => {
	router.push('/')
}

const handleTryAgain = () => {
	startGame()
}

const nextLevel = () => {
	if (currentLevel.value < 6) {
		currentLevel.value++
		router.push(`/games/stackmerge/${currentLevel.value}`)
		startGame()
	} else {
		backToLevelSelection()
	}
}

// Lifecycle
onMounted(() => {
	startGame()
})

onUnmounted(() => {
	stopSessionTimer()
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
          'game-board--animating': false
        }"
			>
				<!-- Endless Mode Info Overlay -->
				<div v-if="isEndlessMode" class="endless-overlay">
					<div class="stats-preview">
            <span class="stat-item">
              <Icon name="star-filled" size="16" />
              {{ perfectPercentage }}%
            </span>
					</div>
				</div>

				<!-- Canvas Placeholder -->
				<div class="canvas-container">
					<!-- TODO: Add GameCanvas component (Step 3) -->
					<div class="placeholder-canvas">
						<p>{{ t('stackMerge.tapToStack') }}</p>
						<p class="placeholder-hint">{{ t('stackMerge.comingSoon') }}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Game Over Overlay -->
		<div v-if="gameState === 'gameover'" class="gameover-overlay">
			<h2>{{ t('stackMerge.gameOver') }}</h2>
			<div class="gameover-stats">
				<p>{{ t('stackMerge.finalHeight') }}: {{ currentHeight }}</p>
				<p>{{ t('stackMerge.finalScore') }}: {{ currentScore }}</p>
				<p>{{ t('stackMerge.perfectStacks') }}: {{ perfectStacks }}/{{ totalStacks }} ({{ perfectPercentage }}%)</p>
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

	&--endless {
		.canvas-container {
			box-shadow: inset 0 0 8px var(--danger-color);
		}
	}

	&--animating {
		.canvas-container {
			transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		}
	}
}

.canvas-container {
	width: 100%;
	height: 500px;
	background-color: var(--card-bg);
	border-radius: var(--border-radius-lg);
	padding: var(--space-4);
	box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.1);
	position: relative;
	overflow: hidden;
}

.placeholder-canvas {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	font-size: var(--font-size-xl);
	color: rgba(255, 255, 255, 0.5);
	background: linear-gradient(180deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.15));
	border-radius: var(--border-radius-md);

	p {
		margin: 0;
	}
}

.placeholder-hint {
	font-size: var(--font-size-sm);
	opacity: 0.7;
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

// Animations
@keyframes endlessGlow {
	0% {
		box-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
	}
	100% {
		box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
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