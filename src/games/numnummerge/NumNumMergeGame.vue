<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue'
import Header from "../../components/Header.vue";
import {useLocalStorage} from "../../composables/useLocalStorage.js";
import {useI18n} from "../../composables/useI18n.js";
import Icon from "../../components/Icon.vue";
import {NUM_NUM_MERGE_LEVELS, NUMBER_TYPES, GRID_CONFIG} from "./numNumMergeConfig.js";
import {useRouter} from "vue-router";
import ProgressOverview from "../../components/ProgressOverview.vue";
import PerformanceStats from "../../components/PerformanceStats.vue";
import {useComboSystem} from "../../composables/useComboSystem.js";
import GameCompletedModal from "../../components/GameCompletedModal.vue";
import GameOverModal from "../../components/GameOverModal.vue";
import {REWARDS} from "../../config/achievementsConfig.js";
import {calculateLevelStars} from "../../config/levelUtils.js";

// Props
const props = defineProps({
	playerProfile: {
		type: Object,
		required: true
	},
	currentTheme: {
		type: String,
		default: 'default'
	},
	level: {
		type: Number,
		default: 1
	}
})

const router = useRouter()

// Emits
const emit = defineEmits(['game-complete', 'menu-click', 'start-game', 'profile-click', 'trophy-click', 'settings-click', 'about-click', 'shop-click', 'theme-change', 'language-change', 'font-size-change', 'back-to-home'])

// Services
const {
	gameData,
	updateGameStats,
	updateLevelStats,
	addScore,
	checkGameLevelAchievements,
	checkAutoAchievements,
	getLevelStats,
	saveLevelState,
	loadLevelState,
	clearLevelState,
	hasLevelState,
	addAchievement,
} = useLocalStorage()
const { t } = useI18n()

// Game State
const score = ref(0)
const moves = ref(0)
const gameState = ref('playing') // 'playing', 'paused', 'completed', 'game-over'
const currentLevel = ref(props.level || 1)
const currentLevelConfig = computed(() => NUM_NUM_MERGE_LEVELS[currentLevel.value])

// Grid State (4x4 grid)
const grid = ref([
	[null, null, null, null],
	[null, null, null, null],
	[null, null, null, null],
	[null, null, null, null]
])

// Animation state
const movingTiles = ref([])
const mergingTiles = ref([])
const newTiles = ref([])
const isAnimating = ref(false)

// Game progress tracking
const sessionTime = ref(0)
const sessionTimer = ref(null)
const totalMerges = ref(0)
const earnedAchievements = ref([])
const levelReward = ref(null)
const rewardBreakdown = ref(null)
const hasSavedState = ref(false)
const isSaving = ref(false)
const isRestoringState = ref(false)

// Touch/Swipe handling
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const gameBoard = ref(null)

// Combo system setup
const comboSystem = useComboSystem({
	minComboLength: 2,
	maxComboLength: 15,
	comboTimeout: 3000,
	baseMultiplier: 1.4,
	multiplierIncrement: 0.4
})

// Computed properties
const isEndlessMode = computed(() => {
	return currentLevelConfig.value.isEndless || false
})

const gameProgress = computed(() => {
	const targetNumber = getTargetNumber()
	const hasReachedTarget = hasNumber(targetNumber)

	return {
		completed: hasReachedTarget ? 1 : 0,
		total: 1,
		percentage: hasReachedTarget ? 100 : 0
	}
})

const canMove = computed(() => {
	// Check if any move is possible
	return canMoveUp() || canMoveDown() || canMoveLeft() || canMoveRight()
})

const isGameOver = computed(() => {
	return !canMove.value && !hasEmptyCell()
})

// Grid helper functions
const hasNumberAt = (row, col) => {
	return grid.value[row][col] !== null
}

const getNumberAt = (row, col) => {
	return grid.value[row][col]
}

const setNumberAt = (row, col, value) => {
	grid.value[row][col] = value
}

const hasEmptyCell = () => {
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			if (grid.value[row][col] === null) return true
		}
	}
	return false
}

const getEmptyCells = () => {
	const emptyCells = []
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			if (grid.value[row][col] === null) {
				emptyCells.push({ row, col })
			}
		}
	}
	return emptyCells
}

const hasNumber = (targetNumber) => {
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			if (grid.value[row][col] === targetNumber) return true
		}
	}
	return false
}

const getTargetNumber = () => {
	const levelConfig = currentLevelConfig.value
	if (!levelConfig.targetNum) return 2048

	const numberType = Object.values(NUMBER_TYPES).find(type => type.type === levelConfig.targetNum)
	return numberType ? numberType.number : 2048
}

// Game initialization
const initializeGame = () => {
	// Check for saved state first
	const savedState = loadLevelState('numNumMerge', currentLevel.value)
	hasSavedState.value = !!savedState

	if (savedState && !isRestoringState.value) {
		console.log(`Found saved state for level ${currentLevel.value}`)
		const restored = restoreGameState(savedState)
		if (restored) {
			console.log('✅ Game state restored successfully')
			return
		}
	}

	// Initialize fresh game
	console.log('🆕 Starting fresh game')
	resetGame()

	// Add initial numbers based on level config
	const initialNumbers = currentLevelConfig.value.initialNumbers || ['NUM_2', 'NUM_2']
	initialNumbers.forEach(() => {
		addRandomNumber()
	})

	if (isEndlessMode.value) {
		startSessionTimer()
	}
}

const resetGame = () => {
	// Clear saved state
	clearLevelState('numNumMerge', currentLevel.value)

	// Reset game state
	score.value = 0
	moves.value = 0
	totalMerges.value = 0
	sessionTime.value = 0
	gameState.value = 'playing'
	earnedAchievements.value = []
	levelReward.value = null
	rewardBreakdown.value = null
	hasSavedState.value = false

	// Clear grid
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			grid.value[row][col] = null
		}
	}

	// Clear animations
	movingTiles.value = []
	mergingTiles.value = []
	newTiles.value = []
	isAnimating.value = false

	// Reset combo system
	comboSystem.resetCombo()

	if (isEndlessMode.value) {
		stopSessionTimer()
		startSessionTimer()
	}
}

const addRandomNumber = () => {
	const emptyCells = getEmptyCells()
	if (emptyCells.length === 0) return false

	const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
	const randomValue = Math.random() < 0.9 ? 2 : 4 // 90% chance of 2, 10% chance of 4

	setNumberAt(randomCell.row, randomCell.col, randomValue)

	// Add to new tiles for animation
	newTiles.value.push({
		row: randomCell.row,
		col: randomCell.col,
		value: randomValue
	})

	// Clear new tiles after animation
	setTimeout(() => {
		newTiles.value = []
	}, 300)

	return true
}

// Movement functions
const canMoveLeft = () => {
	for (let row = 0; row < 4; row++) {
		for (let col = 1; col < 4; col++) {
			if (grid.value[row][col] !== null) {
				// Can move if there's an empty space to the left
				if (grid.value[row][col - 1] === null) return true
				// Can merge with tile to the left
				if (grid.value[row][col - 1] === grid.value[row][col]) return true
			}
		}
	}
	return false
}

const canMoveRight = () => {
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 3; col++) {
			if (grid.value[row][col] !== null) {
				// Can move if there's an empty space to the right
				if (grid.value[row][col + 1] === null) return true
				// Can merge with tile to the right
				if (grid.value[row][col + 1] === grid.value[row][col]) return true
			}
		}
	}
	return false
}

const canMoveUp = () => {
	for (let row = 1; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			if (grid.value[row][col] !== null) {
				// Can move if there's an empty space above
				if (grid.value[row - 1][col] === null) return true
				// Can merge with tile above
				if (grid.value[row - 1][col] === grid.value[row][col]) return true
			}
		}
	}
	return false
}

const canMoveDown = () => {
	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 4; col++) {
			if (grid.value[row][col] !== null) {
				// Can move if there's an empty space below
				if (grid.value[row + 1][col] === null) return true
				// Can merge with tile below
				if (grid.value[row + 1][col] === grid.value[row][col]) return true
			}
		}
	}
	return false
}

const moveLeft = () => {
	if (!canMoveLeft() || isAnimating.value) return false

	isAnimating.value = true
	let moved = false
	let scoreGained = 0

	for (let row = 0; row < 4; row++) {
		const line = grid.value[row].filter(cell => cell !== null)
		const newLine = []
		const merged = []

		for (let i = 0; i < line.length; i++) {
			if (i < line.length - 1 && line[i] === line[i + 1] && !merged[i] && !merged[i + 1]) {
				// Merge tiles
				const mergedValue = line[i] * 2
				newLine.push(mergedValue)
				merged[i] = true
				merged[i + 1] = true

				// Add score and combo
				const comboResult = comboSystem.addCombo()
				const baseScore = mergedValue
				const comboScore = Math.round(baseScore * comboResult.multiplier)
				scoreGained += comboScore
				totalMerges.value++

				// Track merge animation
				mergingTiles.value.push({
					row: row,
					col: newLine.length - 1,
					value: mergedValue,
					oldValue: line[i]
				})

				i++ // Skip next tile as it was merged
			} else if (!merged[i]) {
				newLine.push(line[i])
			}
		}

		// Fill with nulls
		while (newLine.length < 4) {
			newLine.push(null)
		}

		// Check if row changed
		for (let col = 0; col < 4; col++) {
			if (grid.value[row][col] !== newLine[col]) {
				moved = true
			}
		}

		grid.value[row] = newLine
	}

	if (moved) {
		score.value += scoreGained
		moves.value++

		setTimeout(() => {
			addRandomNumber()
			isAnimating.value = false
			mergingTiles.value = []
			checkGameStatus()
		}, 150)

		return true
	} else {
		isAnimating.value = false
		return false
	}
}

const moveRight = () => {
	if (!canMoveRight() || isAnimating.value) return false

	isAnimating.value = true
	let moved = false
	let scoreGained = 0

	for (let row = 0; row < 4; row++) {
		const line = grid.value[row].filter(cell => cell !== null).reverse()
		const newLine = []
		const merged = []

		for (let i = 0; i < line.length; i++) {
			if (i < line.length - 1 && line[i] === line[i + 1] && !merged[i] && !merged[i + 1]) {
				// Merge tiles
				const mergedValue = line[i] * 2
				newLine.push(mergedValue)
				merged[i] = true
				merged[i + 1] = true

				// Add score and combo
				const comboResult = comboSystem.addCombo()
				const baseScore = mergedValue
				const comboScore = Math.round(baseScore * comboResult.multiplier)
				scoreGained += comboScore
				totalMerges.value++

				// Track merge animation
				mergingTiles.value.push({
					row: row,
					col: 3 - (newLine.length - 1),
					value: mergedValue,
					oldValue: line[i]
				})

				i++ // Skip next tile as it was merged
			} else if (!merged[i]) {
				newLine.push(line[i])
			}
		}

		// Fill with nulls and reverse back
		while (newLine.length < 4) {
			newLine.push(null)
		}
		newLine.reverse()

		// Check if row changed
		for (let col = 0; col < 4; col++) {
			if (grid.value[row][col] !== newLine[col]) {
				moved = true
			}
		}

		grid.value[row] = newLine
	}

	if (moved) {
		score.value += scoreGained
		moves.value++

		setTimeout(() => {
			addRandomNumber()
			isAnimating.value = false
			mergingTiles.value = []
			checkGameStatus()
		}, 150)

		return true
	} else {
		isAnimating.value = false
		return false
	}
}

const moveUp = () => {
	if (!canMoveUp() || isAnimating.value) return false

	isAnimating.value = true
	let moved = false
	let scoreGained = 0

	for (let col = 0; col < 4; col++) {
		const line = []
		for (let row = 0; row < 4; row++) {
			if (grid.value[row][col] !== null) {
				line.push(grid.value[row][col])
			}
		}

		const newLine = []
		const merged = []

		for (let i = 0; i < line.length; i++) {
			if (i < line.length - 1 && line[i] === line[i + 1] && !merged[i] && !merged[i + 1]) {
				// Merge tiles
				const mergedValue = line[i] * 2
				newLine.push(mergedValue)
				merged[i] = true
				merged[i + 1] = true

				// Add score and combo
				const comboResult = comboSystem.addCombo()
				const baseScore = mergedValue
				const comboScore = Math.round(baseScore * comboResult.multiplier)
				scoreGained += comboScore
				totalMerges.value++

				// Track merge animation
				mergingTiles.value.push({
					row: newLine.length - 1,
					col: col,
					value: mergedValue,
					oldValue: line[i]
				})

				i++ // Skip next tile as it was merged
			} else if (!merged[i]) {
				newLine.push(line[i])
			}
		}

		// Update grid column
		for (let row = 0; row < 4; row++) {
			const newValue = row < newLine.length ? newLine[row] : null
			if (grid.value[row][col] !== newValue) {
				moved = true
			}
			grid.value[row][col] = newValue
		}
	}

	if (moved) {
		score.value += scoreGained
		moves.value++

		setTimeout(() => {
			addRandomNumber()
			isAnimating.value = false
			mergingTiles.value = []
			checkGameStatus()
		}, 150)

		return true
	} else {
		isAnimating.value = false
		return false
	}
}

const moveDown = () => {
	if (!canMoveDown() || isAnimating.value) return false

	isAnimating.value = true
	let moved = false
	let scoreGained = 0

	for (let col = 0; col < 4; col++) {
		const line = []
		for (let row = 3; row >= 0; row--) {
			if (grid.value[row][col] !== null) {
				line.push(grid.value[row][col])
			}
		}

		const newLine = []
		const merged = []

		for (let i = 0; i < line.length; i++) {
			if (i < line.length - 1 && line[i] === line[i + 1] && !merged[i] && !merged[i + 1]) {
				// Merge tiles
				const mergedValue = line[i] * 2
				newLine.push(mergedValue)
				merged[i] = true
				merged[i + 1] = true

				// Add score and combo
				const comboResult = comboSystem.addCombo()
				const baseScore = mergedValue
				const comboScore = Math.round(baseScore * comboResult.multiplier)
				scoreGained += comboScore
				totalMerges.value++

				// Track merge animation
				mergingTiles.value.push({
					row: 3 - (newLine.length - 1),
					col: col,
					value: mergedValue,
					oldValue: line[i]
				})

				i++ // Skip next tile as it was merged
			} else if (!merged[i]) {
				newLine.push(line[i])
			}
		}

		// Update grid column from bottom
		for (let row = 3; row >= 0; row--) {
			const index = 3 - row
			const newValue = index < newLine.length ? newLine[index] : null
			if (grid.value[row][col] !== newValue) {
				moved = true
			}
			grid.value[row][col] = newValue
		}
	}

	if (moved) {
		score.value += scoreGained
		moves.value++

		setTimeout(() => {
			addRandomNumber()
			isAnimating.value = false
			mergingTiles.value = []
			checkGameStatus()
		}, 150)

		return true
	} else {
		isAnimating.value = false
		return false
	}
}

// Touch/Swipe handling
const handleTouchStart = (event) => {
	if (event.touches.length !== 1) return

	touchStartX.value = event.touches[0].clientX
	touchStartY.value = event.touches[0].clientY
}

const handleTouchEnd = (event) => {
	if (event.changedTouches.length !== 1) return

	touchEndX.value = event.changedTouches[0].clientX
	touchEndY.value = event.changedTouches[0].clientY

	handleSwipe()
}

const handleSwipe = () => {
	const deltaX = touchEndX.value - touchStartX.value
	const deltaY = touchEndY.value - touchStartY.value
	const minSwipeDistance = 50

	if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
		return // Not a swipe
	}

	if (Math.abs(deltaX) > Math.abs(deltaY)) {
		// Horizontal swipe
		if (deltaX > 0) {
			moveRight()
		} else {
			moveLeft()
		}
	} else {
		// Vertical swipe
		if (deltaY > 0) {
			moveDown()
		} else {
			moveUp()
		}
	}
}

// Keyboard handling
const handleKeyDown = (event) => {
	if (gameState.value !== 'playing' || isAnimating.value) return

	switch (event.key) {
		case 'ArrowLeft':
		case 'a':
		case 'A':
			event.preventDefault()
			moveLeft()
			break
		case 'ArrowRight':
		case 'd':
		case 'D':
			event.preventDefault()
			moveRight()
			break
		case 'ArrowUp':
		case 'w':
		case 'W':
			event.preventDefault()
			moveUp()
			break
		case 'ArrowDown':
		case 's':
		case 'S':
			event.preventDefault()
			moveDown()
			break
	}
}

// Game status checking
const checkGameStatus = () => {
	// Check win condition (for non-endless levels)
	if (!isEndlessMode.value) {
		const targetNumber = getTargetNumber()
		if (hasNumber(targetNumber)) {
			completeLevel()
			return
		}
	}

	// Check game over condition
	if (isGameOver.value) {
		gameOver()
		return
	}
}

const completeLevel = () => {
	if (gameState.value !== 'playing') return

	clearLevelState('numNumMerge', currentLevel.value)
	gameState.value = 'completed'

	// Calculate rewards
	const rewardCalculation = calculateLevelReward()
	levelReward.value = rewardCalculation

	// Calculate stars
	const starsEarned = calculateCurrentStars()

	// Update level statistics
	const levelResult = {
		completed: true,
		score: score.value,
		moves: moves.value,
		stars: starsEarned,
	}

	// Check if first time completion
	const previousLevelStats = getLevelStats('numNumMerge', currentLevel.value)
	const isFirstTimeCompletion = !previousLevelStats?.completed

	updateLevelStats('numNumMerge', currentLevel.value, levelResult)

	// Update game statistics
	const gameStats = {
		gamesPlayed: gameData.games.numNumMerge.gamesPlayed + 1,
		totalScore: gameData.games.numNumMerge.totalScore + score.value,
		highScore: Math.max(gameData.games.numNumMerge.highScore, score.value),
		stars: gameData.games.numNumMerge.stars + starsEarned,
		completedLevels: gameData.games.numNumMerge.completedLevels + (isFirstTimeCompletion ? 1 : 0),
		maxLevel: Math.max(gameData.games.numNumMerge.maxLevel, currentLevel.value),
		maxCombo: Math.max(gameData.games.numNumMerge.maxCombo || 0, comboSystem.comboCount.value),
		totalMerges: (gameData.games.numNumMerge.totalMerges || 0) + totalMerges.value
	}

	updateGameStats('numNumMerge', gameStats)

	// Add currency rewards
	if (levelReward.value.coins > 0 || levelReward.value.diamonds > 0) {
		gameData.player.coins = (gameData.player.coins || 0) + levelReward.value.coins
		gameData.player.diamonds = (gameData.player.diamonds || 0) + levelReward.value.diamonds
	}

	// Check achievements
	const achievementsBefore = [...gameData.achievements]
	checkGameLevelAchievements('numNumMerge', currentLevel.value)
	checkAutoAchievements()
	const achievementsAfter = [...gameData.achievements]

	earnedAchievements.value = achievementsAfter.filter(after =>
			!achievementsBefore.some(before => before.id === after.id && before.earned)
	)

	// Create reward breakdown
	const achievementBreakdown = earnedAchievements.value.map(achievement => ({
		type: 'achievement',
		source: t('rewards.breakdown.achievement_reward', { name: achievement.name }),
		coins: achievement.rewards.coins,
		diamonds: achievement.rewards.diamonds,
		icon: achievement.icon,
		style: 'achievement'
	}))

	rewardBreakdown.value = {
		items: [
			...rewardCalculation.breakdown,
			...achievementBreakdown
		],
		total: {
			coins: rewardCalculation.coins + earnedAchievements.value.reduce((sum, a) => sum + a.rewards.coins, 0),
			diamonds: rewardCalculation.diamonds + earnedAchievements.value.reduce((sum, a) => sum + a.rewards.diamonds, 0)
		}
	}

	// Update player currency
	if (rewardBreakdown.value.total.coins > 0 || rewardBreakdown.value.total.diamonds > 0) {
		gameData.player.coins = (gameData.player.coins || 0) + rewardBreakdown.value.total.coins
		gameData.player.diamonds = (gameData.player.diamonds || 0) + rewardBreakdown.value.total.diamonds
	}

	addScore(score.value)

	emit('game-complete', {
		level: currentLevel.value,
		score: score.value,
		moves: moves.value,
		coins: levelReward.value?.coins || 0,
		diamonds: levelReward.value?.diamonds || 0,
		completed: true,
		firstTime: isFirstTimeCompletion
	})
}

const gameOver = () => {
	pauseGame()
	clearLevelState('numNumMerge', currentLevel.value)
	gameState.value = 'game-over'

	// Update game statistics even for game over
	const gameStats = {
		gamesPlayed: gameData.games.numNumMerge.gamesPlayed + 1,
		totalScore: gameData.games.numNumMerge.totalScore + score.value,
		highScore: Math.max(gameData.games.numNumMerge.highScore, score.value),
		maxCombo: Math.max(gameData.games.numNumMerge.maxCombo || 0, comboSystem.comboCount.value),
		totalMerges: (gameData.games.numNumMerge.totalMerges || 0) + totalMerges.value
	}

	updateGameStats('numNumMerge', gameStats)
	addScore(score.value)
}

const pauseGame = () => {
	if (gameState.value === 'playing') {
		gameState.value = 'paused'
		stopSessionTimer()
	}
}

const resumeGame = () => {
	if (gameState.value === 'paused') {
		gameState.value = 'playing'
		if (isEndlessMode.value) {
			startSessionTimer()
		}
	}
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

// Reward calculation
const calculateLevelReward = () => {
	const levelConfig = currentLevelConfig.value
	const levelNumber = currentLevel.value
	const previousLevelStats = getLevelStats('numNumMerge', currentLevel.value)
	const isFirstTimeCompletion = !previousLevelStats?.completed
	const starsEarned = calculateCurrentStars()

	// Determine difficulty multiplier
	let difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.easy
	let difficultyName = 'Easy Level'
	if (levelNumber >= 4) {
		difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.hard
		difficultyName = 'Hard Level'
	} else if (levelNumber >= 2) {
		difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.medium
		difficultyName = 'Medium Level'
	}

	const breakdown = []
	let totalCoins = 0
	let totalDiamonds = 0

	// Base reward
	const baseCoins = Math.round(REWARDS.levelCompletion.base.coins * difficultyMultiplier)
	const baseDiamonds = REWARDS.levelCompletion.base.diamonds
	if (baseCoins > 0 || baseDiamonds > 0) {
		breakdown.push({
			type: 'base',
			source: t('rewards.breakdown.base_completion'),
			coins: baseCoins,
			diamonds: baseDiamonds,
			icon: 'trophy',
			style: 'default'
		})
		totalCoins += baseCoins
		totalDiamonds += baseDiamonds
	}

	// First time completion bonus
	if (isFirstTimeCompletion) {
		const firstTimeCoins = Math.round(REWARDS.levelCompletion.firstTime.coins * difficultyMultiplier)
		const firstTimeDiamonds = REWARDS.levelCompletion.firstTime.diamonds
		breakdown.push({
			type: 'firstTime',source: t('rewards.breakdown.first_time_completion'),
			coins: firstTimeCoins,
			diamonds: firstTimeDiamonds,
			icon: 'star-filled',
			style: 'special'
		})
		totalCoins += firstTimeCoins
		totalDiamonds += firstTimeDiamonds
	}

// Star-based bonus
	if (starsEarned > 0) {
		const starBonus = REWARDS.levelCompletion.stars[starsEarned]
		if (starBonus) {
			const starCoins = Math.round(starBonus.coins * difficultyMultiplier)
			const starDiamonds = starBonus.diamonds
			breakdown.push({
				type: 'stars',
				source: t('rewards.breakdown.star_performance', { stars: starsEarned }),
				coins: starCoins,
				diamonds: starDiamonds,
				icon: 'star-filled',
				style: 'performance'
			})
			totalCoins += starCoins
			totalDiamonds += starDiamonds
		}
	}

// Perfect bonus (3 stars)
	if (starsEarned === 3) {
		const perfectBonusCoins = Math.round(totalCoins * REWARDS.levelCompletion.perfectBonus)
		breakdown.push({
			type: 'perfect',
			source: t('rewards.breakdown.perfect_performance'),
			coins: perfectBonusCoins,
			diamonds: 0,
			icon: 'trophy',
			style: 'perfect'
		})
		totalCoins += perfectBonusCoins
	}

	return {
		coins: totalCoins,
		diamonds: totalDiamonds,
		breakdown: breakdown
	}
}

const calculateCurrentStars = () => {
	if (!gameProgress.value.completed) return 0

	return calculateLevelStars(
			{ score: score.value, moves: moves.value, completed: true },
			currentLevelConfig.value
	)
}

// Save/Restore system
const captureCurrentState = () => {
	if (gameState.value !== 'playing') return null

	const currentState = {
		// Game progress
		score: score.value,
		moves: moves.value,
		sessionTime: sessionTime.value,
		totalMerges: totalMerges.value,

		// Grid state
		gridState: grid.value.map(row => [...row]),

		// Combo system state
		comboData: {
			count: comboSystem.comboCount.value,
			level: comboSystem.comboLevel.value,
			multiplier: comboSystem.comboMultiplier.value,
			isActive: comboSystem.isComboActive.value,
			timeRemaining: comboSystem.timeRemaining.value
		},

		// Game settings
		gameStateValue: gameState.value,

		// Timestamp
		savedAt: new Date().toISOString(),
		version: '1.0'
	}

	return currentState
}

const restoreGameState = (savedState) => {
	if (!savedState || savedState.version !== '1.0') {
		console.warn('Invalid or incompatible saved state')
		return false
	}

	try {
		console.log('Restoring game state...', savedState)
		isRestoringState.value = true

		// Restore basic game data
		score.value = savedState.score || 0
		moves.value = savedState.moves || 0
		sessionTime.value = savedState.sessionTime || 0
		totalMerges.value = savedState.totalMerges || 0
		gameState.value = savedState.gameStateValue || 'playing'

		// Restore grid state
		if (savedState.gridState) {
			for (let row = 0; row < 4; row++) {
				for (let col = 0; col < 4; col++) {
					grid.value[row][col] = savedState.gridState[row][col]
				}
			}
		}

		// Restore combo system
		if (savedState.comboData) {
			comboSystem.comboCount.value = savedState.comboData.count || 0
			comboSystem.comboMultiplier.value = savedState.comboData.multiplier || 1
			comboSystem.isComboActive.value = savedState.comboData.isActive || false
			comboSystem.timeRemaining.value = savedState.comboData.timeRemaining || 0
		}

		// Start timers if needed
		if (isEndlessMode.value && gameState.value === 'playing') {
			startSessionTimer()
		}

		console.log(`Game state restored successfully. Score: ${score.value}, Moves: ${moves.value}`)
		return true

	} catch (error) {
		console.error('Error restoring game state:', error)
		resetGame()
		return false
	} finally {
		isRestoringState.value = false
	}
}

const handleManualSave = async () => {
	if (gameState.value !== 'playing' || isSaving.value) return

	isSaving.value = true

	try {
		const currentState = captureCurrentState()
		if (currentState) {
			saveLevelState('numNumMerge', currentLevel.value, currentState)
			console.log(`✅ Game manually saved for level ${currentLevel.value}`)

			setTimeout(() => {
				isSaving.value = false
			}, 800)
		}
	} catch (error) {
		console.error('Error saving game state:', error)
		isSaving.value = false
	}
}

// Helper functions for tile styling
const getTileClass = (value) => {
	if (!value) return ''
	return 'cell-number'
}

const getTileStyle = (value) => {
	if (!value) return {}

	const numberType = Object.values(NUMBER_TYPES).find(type => type.number === value)
	if (!numberType) return {}

	const baseStyle = {
		backgroundColor: numberType.color,
		color: numberType.textColor,
		fontSize: `${numberType.fontSize}px`,
		fontWeight: numberType.fontWeight
	}

	// Spezielle Effekte für höhere Zahlen
	if (numberType.glowEffect) {
		const glowIntensity = 8 + (numberType.index - 7) * 2
		baseStyle.boxShadow = `0 0 ${glowIntensity}px ${numberType.color}80`
	}

	// Spezial-Animationen
	if (numberType.specialEffect === 'pulse' && numberType.number === 2048) {
		baseStyle.animation = 'tile2048Glow 1s ease-in-out infinite alternate'
	}

	if (numberType.specialEffect === 'elite') {
		baseStyle.boxShadow = '0 0 20px rgba(60, 58, 50, 0.9)'
	}

	if (numberType.specialEffect === 'legendary') {
		baseStyle.boxShadow = '0 0 25px rgba(0, 0, 0, 1)'
	}

	return baseStyle
}

const isNewTile = (row, col) => {
	return newTiles.value.some(tile => tile.row === row && tile.col === col)
}

const isMergingTile = (row, col) => {
	return mergingTiles.value.some(tile => tile.row === row && tile.col === col)
}

// Event handlers
const handleMenuClick = () => {
	emit('menu-click')
}

const handleMenuSaveGame = () => {
	if (gameState.value === 'playing' && !isRestoringState.value) {
		const currentState = captureCurrentState()
		if (currentState) {
			saveLevelState('numNumMerge', currentLevel.value, currentState)
			console.log(`✅ Game manually saved via menu for level ${currentLevel.value}`)
		}
	}
	emit('save-game')
}

const nextLevel = () => {
	if (currentLevel.value < Object.keys(NUM_NUM_MERGE_LEVELS).length) {
		currentLevel.value++
		router.push(`/games/numnummerge/${currentLevel.value}`)
		initializeGame()
	} else {
		backToGaming()
	}
}

const handleTryAgain = () => {
	resetGame()
	initializeGame()
}

const backToGaming = () => {
	router.push('/games/numnummerge')
}

// Lifecycle
onMounted(() => {
	initializeGame()
	document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeyDown)
	stopSessionTimer()
	comboSystem.cleanup()
})

// Watchers
watch(() => props.level, (newLevel) => {
	currentLevel.value = newLevel
	initializeGame()
})
</script>
<template>
	<Header
			:game-data="gameData"
			:player="gameData.player"
			:achievements="gameData.achievements"
			:show-menu-button="true"
			@menu-click="handleMenuClick"
			@save-game="handleMenuSaveGame"
	/>
	<main class="num-num-merge-game">
		<!-- Game Header -->
		<div class="game-header">
			<div class="game-info">
				<h2 class="game-title">{{ t('numNumMerge.title') }}</h2>
				<div class="level-indicator" :class="{ 'level-indicator--endless': isEndlessMode }">
					{{ isEndlessMode ? t('numNumMerge.endless_mode') : t('numNumMerge.level_title', { level: currentLevel }) }}
				</div>
				<div v-if="gameState === 'playing'" class="manual-save">
					<button
							class="btn btn--small"
							@click="handleManualSave"
							:disabled="isSaving"
							:title="t('numNumMerge.save_game')"
					>
						<Icon :name="isSaving ? 'loading' : 'save'" size="22" />
					</button>
				</div>
			</div>

			<div class="game-stats-container">
				<!-- Progress Overview -->
				<ProgressOverview
						v-if="!isEndlessMode"
						:completed="gameProgress.completed"
						:total="gameProgress.total"
						theme="info"
						size="small"
						:levels-label="getTargetNumber().toString()"
						:show-stars="false"
						:show-percentage="false"
						:complete-label="t('numNumMerge.target')"
				/>

				<!-- Game Performance Stats -->
				<PerformanceStats
						:score="score"
						:time-elapsed="isEndlessMode ? sessionTime : 0"
						:moves="moves"
						:matches="totalMerges"
						:total-pairs="0"
						:combo-count="comboSystem.comboLevel.value"
						:combo-multiplier="comboSystem.comboMultiplier.value"
						:max-combo="gameData.games.numNumMerge.maxCombo || 0"
						:combo-time-remaining="comboSystem.timeRemaining.value"
						:combo-time-max="comboSystem.config.comboTimeout"
						:is-combo-active="comboSystem.isComboActive.value"
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
						:moves-label="t('stats.moves')"
						:combo-label="t('stats.combo')"
				/>
			</div>
		</div>

		<!-- Game Board -->
		<div class="game-container">
			<div
					ref="gameBoard"
					class="game-board"
					:class="{
				'game-board--endless': isEndlessMode,
				'game-board--animating': isAnimating
			}"
					@touchstart.passive="handleTouchStart"
					@touchend.passive="handleTouchEnd"
			>

				<!-- Grid -->
				<div class="num-grid">
					<div
							v-for="(row, rowIndex) in 4"
							:key="`row-${rowIndex}`"
							class="grid-row"
					>
						<div
								v-for="(col, colIndex) in 4"
								:key="`cell-${rowIndex}-${colIndex}`"
								class="grid-cell"
								:class="{
							'grid-cell--occupied': hasNumberAt(rowIndex, colIndex),
							'grid-cell--new': isNewTile(rowIndex, colIndex),
							'grid-cell--merging': isMergingTile(rowIndex, colIndex)
						}"
						>
							<div
									v-if="hasNumberAt(rowIndex, colIndex)"
									class="cell-number"
									:class="getTileClass(getNumberAt(rowIndex, colIndex))"
									:style="getTileStyle(getNumberAt(rowIndex, colIndex))"
							>
								{{ getNumberAt(rowIndex, colIndex) }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Game Completed Modal -->
		<GameCompletedModal
				:visible="gameState === 'completed'"
				:level="currentLevel"
				:game-title="t('numNumMerge.title')"
				:final-score="score"
				:time-elapsed="isEndlessMode ? sessionTime : 0"
				:moves="moves"
				:matches="totalMerges"
				:total-pairs="0"
				:stars-earned="calculateCurrentStars()"
				:show-stars="true"
				:new-achievements="earnedAchievements"
				:show-achievements="true"
				:show-reward="true"
				:reward="levelReward"
				:show-reward-breakdown="true"
				:reward-breakdown="rewardBreakdown"
				:show-completion-phases="true"
				:enable-phase-transition="true"
				:show-next-level="!isEndlessMode && currentLevel < Object.keys(NUM_NUM_MERGE_LEVELS).length"
				:next-level-label="t('numNumMerge.next_level')"
				:play-again-label="t('numNumMerge.play_again')"
				:back-to-games-label="t('numNumMerge.back_to_levels')"
				@next-level="nextLevel"
				@play-again="handleTryAgain"
				@back-to-games="backToGaming"
				@close="backToGaming"
		/>

		<!-- Game Over Modal -->
		<GameOverModal
				:visible="gameState === 'game-over'"
				:level="currentLevel"
				:game-title="t('numNumMerge.title')"
				:final-score="score"
				:game-over-icon="'🎯'"
				:try-again-label="t('numNumMerge.try_again')"
				:back-to-games-label="t('numNumMerge.back_to_levels')"
				@try-again="handleTryAgain"
				@back-to-games="backToGaming"
				@close="backToGaming"
		/>
	</main>
</template>
<style lang="scss" scoped>
.num-num-merge-game {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding: var(--space-4);
	min-height: calc(100vh - 80px);
	touch-action: manipulation;
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	overscroll-behavior: contain;
	overscroll-behavior-y: contain;
	-webkit-tap-highlight-color: transparent;
	-webkit-overflow-scrolling: touch;
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

.game-header,
.game-stats-container {
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	touch-action: manipulation;
}

.level-indicator {
	background-color: var(--info-color);
	color: white;
	padding: var(--space-1) var(--space-3);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	align-self: center;

	&--endless {
		background: linear-gradient(135deg, var(--info-color), var(--primary-color));
		animation: endlessGlow 2s ease-in-out infinite alternate;
	}
}

.manual-save {
	display: flex;
	align-items: center;
	justify-content: center;
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
	overscroll-behavior: contain;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;

	&--endless {
		border: 2px solid var(--primary-color);
		box-shadow: 0 0 15px rgba(79, 70, 229, 0.3);
	}

	&--animating {
		.grid-cell {
			transition: all 0.15s ease;
		}
	}
}

.game-grid {
	touch-action: manipulation;
	-webkit-touch-callout: none;
	-webkit-user-drag: none;
	-moz-user-drag: none;
	user-drag: none;
}

.num-grid {
	display: grid;
	grid-template-rows: repeat(4, 1fr);
	gap: var(--space-2);
	width: 100%;
	max-width: 320px;
	background-color: var(--card-bg);
	border-radius: var(--border-radius-lg);
	padding: var(--space-2);
	box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.1);
}

.number-tile {
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	touch-action: manipulation;
	-webkit-tap-highlight-color: transparent;
}

.grid-row {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: var(--space-2);
}

.grid-cell {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	aspect-ratio: 1;
	position: relative;
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-sm);
	transition: all 0.15s ease;

	&--occupied {
		background-color: transparent;
	}

	&--new {
		.cell-number {
			animation: tileAppear 0.3s ease-out;
		}
	}

	&--merging {
		.cell-number {
			animation: tileMerge 0.15s ease-out;
		}
	}
}

.cell-number {
	font-family: var(--font-family-base), monospace;
	font-weight: var(--font-weight-bold);
	border-radius: var(--border-radius-sm);
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: all 0.15s ease;
}


// Animations
@keyframes tileAppear {
	0% {
		transform: scale(0);
		opacity: 0;
	}
	50% {
		transform: scale(1.1);
		opacity: 0.8;
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes tileMerge {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.1);
	}
	100% {
		transform: scale(1);
	}
}

@keyframes tile2048Glow {
	0% {
		box-shadow: 0 0 15px rgba(237, 194, 46, 0.8);
	}
	100% {
		box-shadow: 0 0 25px rgba(237, 194, 46, 1);
	}
}

@keyframes endlessGlow {
	0% {
		box-shadow: 0 0 5px rgba(79, 70, 229, 0.3);
	}
	100% {
		box-shadow: 0 0 15px rgba(79, 70, 229, 0.6);
	}
}

// Touch feedback
@media (hover: none) {
	.game-board {
		user-select: none;
		-webkit-user-select: none;
	}

	.grid-cell {
		touch-action: none;
	}
}
</style>