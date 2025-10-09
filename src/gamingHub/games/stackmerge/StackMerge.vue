<script setup>
import {ref, onMounted, onUnmounted, computed, watch} from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../../composables/useLocalStorage.js'
import { useI18n } from '../../../composables/useI18n.js'
import { getLevelConfig, getColorForHeight, STACK_CONFIG } from './stackConfig'
import { useScreenshot } from '../../composables/useScreenshot.js'
import { StackEngine } from './StackEngine.js'
import Header from '../../components/Header.vue'
import Icon from '../../../components/Icon.vue'
import ProgressOverview from '../../components/ProgressOverview.vue'
import PerformanceStats from '../../components/PerformanceStats.vue'
import GameCompletedModal from '../../components/GameCompletedModal.vue'
import GameOverModal from '../../components/GameOverModal.vue'
import GameCanvas from './GameCanvas.vue'
import {calculateEndlessStars} from "./stackHelpers.js";
import {ACHIEVEMENTS} from "../../config/achievementsConfig.js";

// Props
const props = defineProps({
	level: {
		type: Number,
		default: 1
	}
})

const router = useRouter()
const { t } = useI18n()
const { saveGameScreenshot, getScreenshotsForLevel } = useScreenshot()
const {
	gameData,
	updateStackMergeLevel,
	updateGameStats,
	addScore,
	checkGameLevelAchievements,
	checkAutoAchievements,
	addAchievement
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

const showCompletedModal = ref(false)
const showGameOverModal = ref(false)
const earnedAchievements = ref([])
const levelReward = ref(null)
const rewardBreakdown = ref(null)
const enableScreenshotCapture = ref(false)
const currentGameScreenshotData = ref(null)

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

const screenshotHighscoreInfo = computed(() => {
	if (gameState.value !== 'completed' && gameState.value !== 'gameover') {
		return {
			isNewHighScore: false,
			rank: null,
			totalScreenshots: 0,
			beatScore: null,
			isTopList: false,
			isFirstEver: false,
			previousBest: 0,
			worstInTop5: 0
		}
	}


	if (!enableScreenshotCapture.value) {
		return {
			isNewHighScore: false,
			rank: null,
			totalScreenshots: 0,
			beatScore: null,
			isTopList: false,
			isFirstEver: false,
			previousBest: 0,
			worstInTop5: 0
		}
	}

	const levelScreenshots = getScreenshotsForLevel('stackMerge', currentLevel.value)
	let sortedScreenshots = [...levelScreenshots].sort((a, b) => b.score - a.score)

	const scoreValue = currentScore.value ?? 0
	sortedScreenshots = sortedScreenshots.filter(screenshot => screenshot.score !== scoreValue)

	let rank = 1
	let beatScore = null

	for (const screenshot of sortedScreenshots) {
		if (scoreValue > screenshot.score) {
			beatScore = screenshot.score
			break
		}
		rank++
	}

	if (rank > sortedScreenshots.length && sortedScreenshots.length < 5) {
		rank = sortedScreenshots.length + 1
		beatScore = null
	}

	const isNewHighScore = rank <= 5
	const isTopList = rank <= Math.min(5, sortedScreenshots.length + 1)

	return {
		isNewHighScore,
		rank: isNewHighScore ? rank : null,
		totalScreenshots: sortedScreenshots.length,
		beatScore,
		isTopList,
		isFirstEver: sortedScreenshots.length === 0,
		previousBest: sortedScreenshots[0]?.score || 0,
		worstInTop5: sortedScreenshots[Math.min(4, sortedScreenshots.length - 1)]?.score || 0
	}
})

// Check StackMerge specific achievements
const checkStackMergeAchievements = () => {
	const achievements = []

	// Check perfect combo achievement
	if (maxCombo.value >= 10) {
		const comboAchievement = ACHIEVEMENTS.definitions.find(a => a.id === 'perfect_combo_10')
		if (comboAchievement && !gameData.achievements.some(a => a.id === 'perfect_combo_10' && a.earned)) {
			achievements.push(comboAchievement)
		}
	}

	// Check endless height achievement (only in endless mode)
	if (isEndlessMode.value && currentHeight.value >= 90) {
		const heightAchievement = ACHIEVEMENTS.definitions.find(a => a.id === 'endless_height_90')
		if (heightAchievement && !gameData.achievements.some(a => a.id === 'endless_height_90' && a.earned)) {
			achievements.push(heightAchievement)
		}
	}

	// Unlock achievements
	achievements.forEach(achievement => {
		const wasAdded = addAchievement(achievement)
		if (wasAdded) {
			console.log(`🏆 StackMerge Achievement unlocked: ${achievement.name}`)
			earnedAchievements.value.push(achievement)
		}
	})
}

// Game functions
const startGame = () => {
	gameState.value = 'playing'
	earnedAchievements.value = []

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

	// Prepare screenshot data
	currentGameScreenshotData.value = captureScreenshotData()
	enableScreenshotCapture.value = true

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

	// Check level completion achievements
	checkGameLevelAchievements('stackMerge', currentLevel.value)

	// Check StackMerge specific achievements
	checkStackMergeAchievements()

	// Check auto achievements (for total stacks)
	checkAutoAchievements()

	// Check if first time completion
	const previousStats = gameData.games.stackMerge.levels[currentLevel.value]
	const isFirstTime = previousStats ? !previousStats.completed : true

	// Calculate level reward
	const baseLevelReward = currentLevel.value * 50 // 50 coins per level
	const starMultiplier = stars * 0.5 // +50% per star
	const perfectBonus = perfectPercent >= 80 ? 100 : 0

	const totalCoins = Math.round(baseLevelReward * (1 + starMultiplier)) + perfectBonus
	const totalDiamonds = stars >= 3 ? 3 : stars >= 2 ? 2 : 1

	// Create reward breakdown
	const breakdown = []

	// Base completion
	breakdown.push({
		type: 'base',
		source: t('rewards.breakdown.base_completion'),
		coins: baseLevelReward,
		diamonds: 0,
		icon: 'completion',
		style: 'default'
	})

	// Star performance
	if (stars > 0) {
		breakdown.push({
			type: 'stars',
			source: t('rewards.breakdown.star_performance', { stars }),
			coins: Math.round(baseLevelReward * starMultiplier),
			diamonds: totalDiamonds,
			icon: 'star-filled',
			style: 'performance'
		})
	}

	// Perfect bonus
	if (perfectBonus > 0) {
		breakdown.push({
			type: 'perfect',
			source: t('rewards.breakdown.perfect_performance'),
			coins: perfectBonus,
			diamonds: 0,
			icon: 'trophy',
			style: 'perfect'
		})
	}

	// Add achievement rewards to breakdown
	if (earnedAchievements.value.length > 0) {
		earnedAchievements.value.forEach(achievement => {
			breakdown.push({
				type: 'achievement',
				source: t('rewards.breakdown.achievement_reward', { name: t(`achievements.definitions.${achievement.id}.name`) }),
				coins: achievement.rewards.coins,
				diamonds: achievement.rewards.diamonds,
				icon: 'trophy',
				style: 'achievement'
			})
		})

		// Add achievement rewards to totals
		const achievementCoins = earnedAchievements.value.reduce((sum, a) => sum + a.rewards.coins, 0)
		const achievementDiamonds = earnedAchievements.value.reduce((sum, a) => sum + a.rewards.diamonds, 0)

		rewardBreakdown.value = {
			items: breakdown,
			total: {
				coins: totalCoins + achievementCoins,
				diamonds: totalDiamonds + achievementDiamonds
			}
		}

		levelReward.value = {
			coins: totalCoins + achievementCoins,
			diamonds: totalDiamonds + achievementDiamonds
		}

		// Update player currency with achievements
		gameData.player.coins = (gameData.player.coins || 0) + totalCoins + achievementCoins
		gameData.player.diamonds = (gameData.player.diamonds || 0) + totalDiamonds + achievementDiamonds
	} else {
		rewardBreakdown.value = {
			items: breakdown,
			total: {
				coins: totalCoins,
				diamonds: totalDiamonds
			}
		}

		levelReward.value = {
			coins: totalCoins,
			diamonds: totalDiamonds
		}

		// Update player currency
		gameData.player.coins = (gameData.player.coins || 0) + totalCoins
		gameData.player.diamonds = (gameData.player.diamonds || 0) + totalDiamonds
	}

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

	// Show modal
	showCompletedModal.value = true

	console.log('🏗️ Level completed with achievements!', {
		height: currentHeight.value,
		score: currentScore.value,
		perfectPercent,
		stars,
		achievements: earnedAchievements.value.length,
		reward: rewardBreakdown.value
	})
}

const captureScreenshotData = () => {
	if (gameState.value !== 'completed') return null

	const screenshotData = {
		// Game State
		player: {
			name: gameData.player.name,
			avatar: gameData.player.avatar
		},
		level: currentLevel.value,
		score: currentScore.value,
		moves: currentHeight.value,
		timeElapsed: isEndlessMode.value ? sessionTime.value : 0,
		starsEarned: isEndlessMode.value ? endlessCurrentStars.value : calculateStars(),

		// Blocks state
		blocks: placedBlocks.value.map(block => ({
			x: block.x,
			y: block.y,
			width: block.width,
			height: block.height,
			color: block.color
		})),

		// Board configuration
		boardConfig: {
			width: 375,
			height: 400,
			blockHeight: 40
		},

		// Game mode
		isEndless: isEndlessMode.value,
		gameMode: isEndlessMode.value ? 'endless' : 'level',

		// Metadata
		capturedAt: new Date().toISOString(),
		gameTitle: t('stackMerge.title')
	}

	return screenshotData
}

const calculateStars = () => {
	if (totalStacks.value === 0) return 0
	const perfectPercent = Math.round((perfectStacks.value / totalStacks.value) * 100)
	return perfectPercent >= 80 ? 3 : perfectPercent >= 60 ? 2 : 1
}

const handleSaveScreenshot = async (screenshotMetadata) => {
	if (!currentGameScreenshotData.value) {
		console.warn('No screenshot data available')
		return
	}

	try {
		const success = await saveGameScreenshot('stackMerge', currentGameScreenshotData.value)

		if (success) {
			console.log('🖼️ Screenshot saved successfully!')
		} else {
			console.error('Failed to save screenshot')
		}
	} catch (error) {
		console.error('Error saving screenshot:', error)
	}
}

const completeEndlessMode = () => {
	if (gameState.value !== 'playing' || !isEndlessMode.value) return

	gameState.value = 'completed'

	// Prepare screenshot data
	currentGameScreenshotData.value = captureScreenshotData()
	enableScreenshotCapture.value = true

	stopSessionTimer()
	stopUpdateLoop()

	if (engine.value) {
		engine.value.stop()
	}

	showCompletedModal.value = true
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

	// Check achievements for endless mode
	checkStackMergeAchievements()
	checkAutoAchievements()

	// Calculate endless rewards
	const heightBonus = Math.floor(currentHeight.value / 10) * 50 // 50 coins per 10 blocks
	const scoreBonus = Math.floor(currentScore.value / 100) * 10 // 10 coins per 100 points
	const perfectBonus = perfectPercent >= 80 ? 200 : perfectPercent >= 60 ? 100 : 0
	const starReward = stars * 100 // 100 coins per star

	const totalCoins = heightBonus + scoreBonus + perfectBonus + starReward
	const totalDiamonds = stars + (perfectPercent >= 80 ? 2 : 0)

	levelReward.value = {
		coins: totalCoins,
		diamonds: totalDiamonds
	}

	const rewardItems = []

	// Height bonus
	if (heightBonus > 0) {
		rewardItems.push({
			type: 'height',
			source: t('rewards.breakdown.height_bonus', { height: currentHeight.value }),
			coins: heightBonus,
			diamonds: 0,
			icon: 'arrow-up',
			style: 'performance'
		})
	}

	// Score bonus
	if (scoreBonus > 0) {
		rewardItems.push({
			type: 'score',
			source: t('rewards.breakdown.score_bonus', { score: currentScore.value }),
			coins: scoreBonus,
			diamonds: 0,
			icon: 'star',
			style: 'performance'
		})
	}

	// Perfect bonus
	if (perfectBonus > 0) {
		rewardItems.push({
			type: 'perfect',
			source: t('rewards.breakdown.perfect_performance'),
			coins: perfectBonus,
			diamonds: 0,
			icon: 'trophy',
			style: 'perfect'
		})
	}

	// Star reward
	if (stars > 0) {
		rewardItems.push({
			type: 'stars',
			source: t('rewards.breakdown.star_performance', { stars }),
			coins: starReward,
			diamonds: totalDiamonds,
			icon: 'star-filled',
			style: 'special'
		})
	}

	// Add achievement rewards
	if (earnedAchievements.value.length > 0) {
		earnedAchievements.value.forEach(achievement => {
			rewardItems.push({
				type: 'achievement',
				source: t('rewards.breakdown.achievement_reward', { name: t(`achievements.definitions.${achievement.id}.name`) }),
				coins: achievement.rewards.coins,
				diamonds: achievement.rewards.diamonds,
				icon: 'trophy',
				style: 'achievement'
			})
		})

		const achievementCoins = earnedAchievements.value.reduce((sum, a) => sum + a.rewards.coins, 0)
		const achievementDiamonds = earnedAchievements.value.reduce((sum, a) => sum + a.rewards.diamonds, 0)

		rewardBreakdown.value = {
			items: rewardItems,
			total: {
				coins: totalCoins + achievementCoins,
				diamonds: totalDiamonds + achievementDiamonds
			}
		}

		levelReward.value = {
			coins: totalCoins + achievementCoins,
			diamonds: totalDiamonds + achievementDiamonds
		}

		gameData.player.coins = (gameData.player.coins || 0) + totalCoins + achievementCoins
		gameData.player.diamonds = (gameData.player.diamonds || 0) + totalDiamonds + achievementDiamonds
	} else {
		rewardBreakdown.value = {
			items: rewardItems,
			total: {
				coins: totalCoins,
				diamonds: totalDiamonds
			}
		}

		gameData.player.coins = (gameData.player.coins || 0) + totalCoins
		gameData.player.diamonds = (gameData.player.diamonds || 0) + totalDiamonds
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
	showCompletedModal.value = true
}

// Game over handler
const handleGameOver = () => {
	if (gameState.value !== 'playing') return

	// For endless mode, complete instead of game over
	if (isEndlessMode.value) {
		completeEndlessMode()
		return
	}

	gameState.value = 'gameover'

	stopSessionTimer()
	stopUpdateLoop()

	if (engine.value) {
		engine.value.stop()
	}

	// Check achievements even on game over
	checkStackMergeAchievements()
	checkAutoAchievements()

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

	showGameOverModal.value = true
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

const handleModalNextLevel = () => {
	showCompletedModal.value = false
	nextLevel()
}

const handleModalPlayAgain = () => {
	showCompletedModal.value = false
	showGameOverModal.value = false
	handleTryAgain()
}

const handleModalBackToLevels = () => {
	showCompletedModal.value = false
	showGameOverModal.value = false
	backToLevelSelection()
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

		<!-- Game Completed Modal -->
		<GameCompletedModal
				:visible="showCompletedModal"
				:level="currentLevel"
				:game-title="t('stackMerge.title')"
				:final-score="currentScore"
				:time-elapsed="isEndlessMode ? sessionTime : 0"
				:moves="currentHeight"
				:matches="perfectStacks"
				:total-pairs="totalStacks"
				:stars-earned="isEndlessMode ? endlessCurrentStars : (perfectPercentage >= 80 ? 3 : perfectPercentage >= 60 ? 2 : 1)"
				:show-stars="true"
				:show-completion-phases="true"
				:reward="levelReward"
				:show-reward="true"
				:reward-breakdown="rewardBreakdown"
				:show-reward-breakdown="true"
				:show-next-level="!isEndlessMode && currentLevel < 6"
				:show-play-again="true"
				:show-back-to-games="true"
				:next-level-label="t('stackMerge.nextLevel')"
				:play-again-label="t('common.play_again')"
				:back-to-games-label="t('common.back_to_levels')"
				:game-state="currentGameScreenshotData"
				:high-score-info="screenshotHighscoreInfo"
				:enable-screenshot="enableScreenshotCapture"
				:auto-save-screenshot="true"
				game-name="stackMerge"
				@save-screenshot="handleSaveScreenshot"
				@next-level="handleModalNextLevel"
				@play-again="handleModalPlayAgain"
				@back-to-games="handleModalBackToLevels"
				@close="handleModalBackToLevels"
		/>

		<!-- Game Over Modal -->
		<GameOverModal
				v-if="!isEndlessMode"
				:visible="showGameOverModal"
				:level="currentLevel"
				:game-title="t('stackMerge.title')"
				:final-score="currentScore"
				:game-over-icon="'💥'"
				:try-again-label="t('common.try_again')"
				:back-to-games-label="t('common.back_to_levels')"
				@try-again="handleModalPlayAgain"
				@back-to-games="handleModalBackToLevels"
				@close="handleModalBackToLevels"
		/>
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

// Touch feedback
@media (hover: none) {
	.game-container,
	.game-board {
		user-select: none;
		-webkit-user-select: none;
	}
}
</style>