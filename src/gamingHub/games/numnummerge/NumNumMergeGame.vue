<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue'
import Header from "../../components/Header.vue";
import {useLocalStorage} from "../../composables/useLocalStorage.js";
import {useI18n} from "../../../composables/useI18n.js";
import { useScreenshot } from '../../composables/useScreenshot.js'
import Icon from "../../../components/Icon.vue";
import {NUM_NUM_MERGE_LEVELS, NUMBER_TYPES, GRID_CONFIG, GRID_UTILS} from "./numNumMergeConfig.js";
import {useRouter} from "vue-router";
import ProgressOverview from "../../components/ProgressOverview.vue";
import PerformanceStats from "../../components/PerformanceStats.vue";
import {useComboSystem} from "../../composables/useComboSystem.js";
import GameCompletedModal from "../../components/GameCompletedModal.vue";
import GameOverModal from "../../components/GameOverModal.vue";
import {ACHIEVEMENTS, REWARDS} from "../../config/achievementsConfig.js";
import {calculateLevelStars} from "../../config/levelUtils.js";
import { useInventory } from '../../composables/useInventory.js'
import ShopModal from "../../components/ShopModal.vue";
import { SHOP_ITEMS } from '../../config/shopConfig.js'

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
const { saveGameScreenshot, getScreenshotsForLevel } = useScreenshot()

// Emits
const emit = defineEmits(['game-complete', 'menu-click', 'start-game', 'profile-click', 'trophy-click', 'settings-click', 'shop-click', 'theme-change', 'language-change', 'font-size-change', 'back-to-home'])

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
	buyItem,
	removeItemFromInventory
} = useLocalStorage()
const { t } = useI18n()
const { hasItem, getItemQuantity, useConsumableItem } = useInventory()

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
const number7Position = ref(null)

// Touch/Swipe handling
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const gameBoard = ref(null)

const undoStack = ref([])
const undoRemaining = ref(gameData.player.inventory.items?.undo_move?.quantity || 0)
const showShopModal = ref(false)
const modalType = ref('purchase')

const enableScreenshotCapture = ref(false)
const currentGameScreenshotData = ref(null)

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

const undoItem = computed(() => {
	return SHOP_ITEMS.find(item => item.id === 'undo_move')
})

const playerBalance = computed(() => ({
	coins: gameData.player.coins || 0,
	diamonds: gameData.player.diamonds || 0
}))

const canAffordUndo = computed(() => {
	if (!undoItem.value) return false
	return playerBalance.value.coins >= undoItem.value.price.coins &&
			playerBalance.value.diamonds >= undoItem.value.price.diamonds
})

const canUndo = computed(() => {
	return undoStack.value.length > 0 && undoRemaining.value > 0
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

	undoStack.value = []
	undoRemaining.value = getItemQuantity('undo_move')

	// Add initial two random numbers
	addRandomNumber()
	addRandomNumber()

	if (isEndlessMode.value) {
		startSessionTimer()
	}
}

const saveStateToUndoStack = () => {
	// Speichere aktuellen Zustand vor einem Zug
	const currentState = {
		grid: grid.value.map(row => [...row]),
		score: score.value,
		moves: moves.value,
		totalMerges: totalMerges.value,
		comboState: {
			count: comboSystem.comboCount.value,
			multiplier: comboSystem.comboMultiplier.value,
			isActive: comboSystem.isComboActive.value,
			timeRemaining: comboSystem.timeRemaining.value
		}
	}

	undoStack.value.push(currentState)

	// Begrenze Undo-Stack auf 10 Züge
	if (undoStack.value.length > 10) {
		undoStack.value.shift()
	}
}

const performUndo = () => {
	if (!canUndo.value || undoStack.value.length === 0) return false

	console.log('🔄 Performing undo...')

	// Hole letzten Zustand vom Stack
	const previousState = undoStack.value.pop()

	// Stelle Zustand wieder her
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			grid.value[row][col] = previousState.grid[row][col]
		}
	}

	score.value = previousState.score
	moves.value = previousState.moves
	totalMerges.value = previousState.totalMerges

	// Combo-System wiederherstellen
	comboSystem.comboCount.value = previousState.comboState.count
	comboSystem.comboMultiplier.value = previousState.comboState.multiplier
	comboSystem.isComboActive.value = previousState.comboState.isActive
	comboSystem.timeRemaining.value = previousState.comboState.timeRemaining

	// Verwende Undo Item
	removeItemFromInventory('undo_move', 1)
	const used = useConsumableItem('undo_move')
	if (used) {
		const remaining = getItemQuantity('undo_move')
		undoRemaining.value = remaining
		const quantity = gameData.player.inventory.items?.undo_move?.quantity || 0
		console.log(`✅ Undo used! Remaining: ${remaining}`, quantity)

		// Visuelles Feedback
		const scoreElement = document.querySelector('.stat-value')
		if (scoreElement) {
			scoreElement.classList.add('undo-feedback')
			setTimeout(() => {
				scoreElement.classList.remove('undo-feedback')
			}, 500)
		}

		return true
	}

	return false
}

const screenshotHighscoreInfo = computed(() => {
	if (gameState.value !== 'completed') {
		return null
	}

	const levelScreenshots = getScreenshotsForLevel('numNumMerge', currentLevel.value)
	// Sort screenshots by score (highest first)
	let sortedScreenshots = [...levelScreenshots].sort((a, b) => b.score - a.score)
	sortedScreenshots = sortedScreenshots.filter(screenshot => screenshot.score !== score.value)

	// Current score
	const currentScore = score.value

	// Find where current score would rank
	let rank = 1
	let beatScore = null

	for (const screenshot of sortedScreenshots) {
		if (currentScore > screenshot.score) {
			beatScore = screenshot.score
			break
		}
		rank++
	}

	// If we didn't beat any score, but we have less than 5 screenshots, we still qualify
	if (rank > sortedScreenshots.length && sortedScreenshots.length < 5) {
		rank = sortedScreenshots.length + 1
		beatScore = null // We didn't beat anyone, we're just added to the list
	}

	// Determine if this qualifies for top-5
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


const captureScreenshotData = () => {
	if (gameState.value !== 'completed') return null

	const screenshotData = {
		// Game State
		player: {
			name: gameData.player.name,
			avatar: gameData.player.avatar
		},
		level: currentLevel.value,
		score: score.value,
		moves: moves.value,
		timeElapsed: isEndlessMode.value ? sessionTime.value : 0,
		starsEarned: calculateCurrentStars(),

		// Grid state and numbers
		numbers: grid.value.flat().map((cellValue, index) => {
			const row = Math.floor(index / GRID_CONFIG.cols)
			const col = index % GRID_CONFIG.cols
			const position = GRID_UTILS.gridToPixel(row, col)

			if (cellValue > 0) {
				const numberType = Object.values(NUMBER_TYPES).find(n => n.number === cellValue)
				return {
					id: `${row}-${col}`,
					number: cellValue,
					x: position.x,
					y: position.y,
					size: GRID_CONFIG.cellSize,
					color: numberType ? numberType.color : '#eee4da',
					textColor: numberType ? numberType.textColor : '#776e65',
					fontSize: numberType ? numberType.fontSize : 'var(--font-size-lg)',
					fontWeight: numberType ? numberType.fontWeight : 'bold'
				}
			}
			return null
		}).filter(Boolean),

		// Board configuration
		boardConfig: {
			width: GRID_CONFIG.boardWidth,
			height: GRID_CONFIG.boardHeight,
			cellSize: GRID_CONFIG.cellSize,
			cellGap: GRID_CONFIG.cellGap,
			rows: GRID_CONFIG.rows,
			cols: GRID_CONFIG.cols
		},

		// Game mode
		isEndless: isEndlessMode.value,
		gameMode: isEndlessMode.value ? 'endless' : 'level',

		// Metadata
		capturedAt: new Date().toISOString(),
		gameTitle: t('numNumMerge.title')
	}

	return screenshotData
}

const handleSaveScreenshot = async (screenshotMetadata) => {
	if (!currentGameScreenshotData.value) {
		console.warn('No screenshot data available')
		return
	}

	try {
		const success = await saveGameScreenshot('numNumMerge', currentGameScreenshotData.value)

		if (success) {
			console.log('🖼️ Screenshot saved successfully!')
			// Optional: Show success feedback to user
		} else {
			console.error('Failed to save screenshot')
		}
	} catch (error) {
		console.error('Error saving screenshot:', error)
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
	undoStack.value = []
	undoRemaining.value = getItemQuantity('undo_move')
	enableScreenshotCapture.value = false
	currentGameScreenshotData.value = null
	number7Position.value = null

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

const spawnNumber7 = () => {
	// Only if no Number 7 exists and we have empty cells
	if (number7Position.value || !hasEmptyCell()) {
		console.log(`🔢 Cannot spawn Number 7: ${number7Position.value ? 'already exists' : 'no empty cells'}`)
		return false
	}

	const emptyCells = getEmptyCells()
	const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]

	setNumberAt(randomCell.row, randomCell.col, 7)
	number7Position.value = {
		row: randomCell.row,
		col: randomCell.col,
		value: 7
	}

	// Add to new tiles for animation
	newTiles.value.push({
		row: randomCell.row,
		col: randomCell.col,
		value: 7
	})

	console.log(`🔢 Number 7 spawned at (${randomCell.row}, ${randomCell.col})`)
	return true
}

// Countdown Number 7 after each move
const countdownNumber7 = () => {
	if (!number7Position.value &&
			isEndlessMode.value &&
			getEmptyCells().length > 4 &&
			Math.random() < 0.5) {
		spawnNumber7()
		return
	}
	if (!number7Position.value) return

	const { value } = number7Position.value

	// Find the countdown tile anywhere on the board
	let foundPosition = null
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			if (getNumberAt(row, col) === value) {
				foundPosition = { row, col }
				break
			}
		}
		if (foundPosition) break
	}

	if (foundPosition && value > 4) {
		const newValue = value - 1
		setNumberAt(foundPosition.row, foundPosition.col, newValue)

		// Update tracking with new position and value
		number7Position.value = {
			row: foundPosition.row,
			col: foundPosition.col,
			value: newValue
		}

		console.log(`🔢 Number countdown: ${value} → ${newValue} at (${foundPosition.row}, ${foundPosition.col})`)

		// If it became 4, remove tracking
		if (newValue === 4) {
			number7Position.value = null
			console.log(`🔢 Number countdown completed - now normal 4`)
		}
	} else {
		// Number was merged or disappeared, stop tracking
		number7Position.value = null
		console.log(`🔢 Number ${value} was merged/disappeared, stopped tracking`)
	}
}

// Check if a tile is the tracked Number 7
const isTrackedNumber7 = (row, col) => {
	if (!number7Position.value) return false

	// Check if this position contains our tracked countdown number
	const boardValue = getNumberAt(row, col)
	return boardValue === number7Position.value.value && [5, 6, 7].includes(boardValue)
}

const addRandomNumber = () => {
	const emptyCells = getEmptyCells()
	if (emptyCells.length === 0) return false

	const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
	const randomValue = currentLevelConfig.value.randomNumbers[Math.floor(Math.random() * currentLevelConfig.value.randomNumbers.length)]

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

	saveStateToUndoStack()

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

		countdownNumber7()

		if (scoreGained > 0) {
			// Trigger score pop animation
			const scoreElement = document.querySelector('.stat-value')
			if (scoreElement) {
				scoreElement.classList.add('score-pop')
				setTimeout(() => {
					scoreElement.classList.remove('score-pop')
				}, 500)
			}
		}

		setTimeout(() => {
			addRandomNumber()
			isAnimating.value = false
			mergingTiles.value = []
			checkGameStatus()
			handleAutoSave()
		}, 200)

		return true
	} else {
		isAnimating.value = false
		return false
	}
}

const moveRight = () => {
	if (!canMoveRight() || isAnimating.value) return false

	saveStateToUndoStack()

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

		countdownNumber7()

		if (scoreGained > 0) {
			// Trigger score pop animation
			const scoreElement = document.querySelector('.stat-value')
			if (scoreElement) {
				scoreElement.classList.add('score-pop')
				setTimeout(() => {
					scoreElement.classList.remove('score-pop')
				}, 500)
			}
		}

		setTimeout(() => {
			addRandomNumber()
			isAnimating.value = false
			mergingTiles.value = []
			checkGameStatus()
			handleAutoSave()
		}, 200)

		return true
	} else {
		isAnimating.value = false
		return false
	}
}

const moveUp = () => {
	if (!canMoveUp() || isAnimating.value) return false

	saveStateToUndoStack()

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

		countdownNumber7()

		if (scoreGained > 0) {
			// Trigger score pop animation
			const scoreElement = document.querySelector('.stat-value')
			if (scoreElement) {
				scoreElement.classList.add('score-pop')
				setTimeout(() => {
					scoreElement.classList.remove('score-pop')
				}, 500)
			}
		}

		setTimeout(() => {
			addRandomNumber()
			isAnimating.value = false
			mergingTiles.value = []
			checkGameStatus()
			handleAutoSave()
		}, 200)

		return true
	} else {
		isAnimating.value = false
		return false
	}
}

const moveDown = () => {
	if (!canMoveDown() || isAnimating.value) return false

	saveStateToUndoStack()

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

		countdownNumber7()

		if (scoreGained > 0) {
			// Trigger score pop animation
			const scoreElement = document.querySelector('.stat-value')
			if (scoreElement) {
				scoreElement.classList.add('score-pop')
				setTimeout(() => {
					scoreElement.classList.remove('score-pop')
				}, 500)
			}
		}

		setTimeout(() => {
			addRandomNumber()
			isAnimating.value = false
			mergingTiles.value = []
			checkGameStatus()
			handleAutoSave()
		}, 200)

		return true
	} else {
		isAnimating.value = false
		return false
	}
}

const handleBuyUndoClick = () => {
	if (!undoItem.value) return

	if (!canAffordUndo.value) {
		modalType.value = 'insufficient'
	} else {
		modalType.value = 'purchase'
	}

	showShopModal.value = true
}

const handleUndoPurchaseConfirm = async () => {
	if (!undoItem.value || modalType.value !== 'purchase') {
		closeShopModal()
		return
	}

	const result = buyItem(undoItem.value)
	if (result.success) {
		setTimeout(() => {
			const newQuantity = gameData.player.inventory.items?.undo_move?.quantity || 0
			undoRemaining.value = newQuantity
			console.log(`🔄 Purchased undo! New count: ${newQuantity}`)
			closeShopModal()
		}, 200)
	}
}

const handleShopModalCancel = () => {
	closeShopModal()
}

const closeShopModal = () => {
	showShopModal.value = false
	modalType.value = 'purchase'
}

const handleAutoSave = () => {
	if (gameState.value !== 'playing' || isRestoringState.value) return

	try {
		const currentState = captureCurrentState()
		if (currentState) {
			saveLevelState('numNumMerge', currentLevel.value, currentState)
		}
	} catch (error) {
		console.error('Error auto-saving game state:', error)
	}
}

// Touch/Swipe handling
const handleTouchStart = (event) => {
	if (event.touches.length !== 1) return
	if (event.touches[0].clientY < 100) {
		event.preventDefault()
	}
	touchStartX.value = event.touches[0].clientX
	touchStartY.value = event.touches[0].clientY
}

const handleTouchMove = (event) => {
	event.preventDefault()
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
		if (isEndlessMode.value) {
			completeEndlessMode()
		} else {
			gameOver()
		}
		return
	}
}

const completeEndlessMode = () => {
	if (gameState.value !== 'playing') return

	clearLevelState('numNumMerge', currentLevel.value)
	gameState.value = 'completed'

	// Prepare screenshot data
	currentGameScreenshotData.value = captureScreenshotData()
	enableScreenshotCapture.value = true

	// Calculate endless rewards
	const endlessBaseReward = Math.floor(score.value / 10) // Base: 1 coin per 100 points
	const timeBonus = sessionTime.value >= 300 ? Math.floor(sessionTime.value / 60) * 10 : 0 // 10 coins per minute
	const mergeBonus = totalMerges.value >= 30 ? totalMerges.value * 2 : 0 // 2 coins per merge

	// Update endless mode statistics
	const endlessStats = {
		gamesPlayed: gameData.games.numNumMerge.gamesPlayed + 1,
		totalScore: gameData.games.numNumMerge.totalScore + score.value,
		highScore: Math.max(gameData.games.numNumMerge.highScore, score.value),
		stars: gameData.games.numNumMerge.stars + calculateCurrentStars(),
		maxCombo: Math.max(gameData.games.numNumMerge.maxCombo || 0, comboSystem.comboCount.value),
		totalMerges: (gameData.games.numNumMerge.totalMerges || 0) + totalMerges.value,
		// Endless specific stats
		longestSession: Math.max(gameData.games.numNumMerge.longestSession || 0, sessionTime.value),
		bestEndlessScore: Math.max(gameData.games.numNumMerge.bestEndlessScore || 0, score.value)
	}

	updateGameStats('numNumMerge', endlessStats)

	// Check endless achievements
	const achievementsBefore = [...gameData.achievements]

	const numNumAchievements = checkNumNumAchievements(gameData, currentLevel.value, grid.value, {
		maxCombo: comboSystem.comboCount.value,
		moves: moves.value,
		totalMerges: totalMerges.value,
		sessionTime: sessionTime.value,
		endlessScore: score.value
	})

	numNumAchievements.forEach(achievement => {
		const wasAdded = addAchievement(achievement)
		if (wasAdded) {
			console.log(`🎉 NumNum endless achievement unlocked: ${achievement.name}`)
		}
	})

	checkAutoAchievements()
	const achievementsAfter = [...gameData.achievements]

	earnedAchievements.value = achievementsAfter.filter(after =>
			!achievementsBefore.some(before => before.id === after.id && before.earned)
	)

	// Create reward breakdown for endless
	const endlessRewardBreakdown = [
		{
			type: 'endless_session',
			source: t('rewards.breakdown.endless_session'),
			coins: endlessBaseReward,
			diamonds: Math.floor(endlessBaseReward / 100),
			icon: 'clock',
			style: 'special'
		}
	]

	if (timeBonus > 0) {
		endlessRewardBreakdown.push({
			type: 'time_bonus',
			source: t('rewards.breakdown.time_bonus', { minutes: Math.floor(sessionTime.value / 60) }),
			coins: timeBonus,
			diamonds: 0,
			icon: 'clock',
			style: 'performance'
		})
	}

	if (mergeBonus > 0) {
		endlessRewardBreakdown.push({
			type: 'merge_bonus',
			source: t('rewards.breakdown.merge_bonus', { merges: totalMerges.value }),
			coins: mergeBonus,
			diamonds: 0,
			icon: 'num-num-merge-game',
			style: 'performance'
		})
	}

	const achievementBreakdown = earnedAchievements.value.map(achievement => ({
		type: 'achievement',
		source: t('rewards.breakdown.achievement_reward', { name: achievement.name }),
		coins: achievement.rewards.coins,
		diamonds: achievement.rewards.diamonds,
		icon: achievement.icon,
		style: 'achievement'
	}))

	const totalEndlessCoins = endlessBaseReward + timeBonus + mergeBonus + earnedAchievements.value.reduce((sum, a) => sum + a.rewards.coins, 0)
	const totalEndlessDiamonds = Math.floor(endlessBaseReward / 100) + earnedAchievements.value.reduce((sum, a) => sum + a.rewards.diamonds, 0)

	rewardBreakdown.value = {
		items: [
			...endlessRewardBreakdown,
			...achievementBreakdown
		],
		total: {
			coins: totalEndlessCoins,
			diamonds: totalEndlessDiamonds
		}
	}

	levelReward.value = {
		coins: totalEndlessCoins,
		diamonds: totalEndlessDiamonds
	}

	// Update player currency
	if (rewardBreakdown.value.total.coins > 0 || rewardBreakdown.value.total.diamonds > 0) {
		gameData.player.coins = (gameData.player.coins || 0) + rewardBreakdown.value.total.coins
		gameData.player.diamonds = (gameData.player.diamonds || 0) + rewardBreakdown.value.total.diamonds
	}

	addScore(score.value)
	updateEndlessStats()

	emit('game-complete', {
		level: currentLevel.value,
		score: score.value,
		moves: moves.value,
		sessionTime: sessionTime.value,
		totalMerges: totalMerges.value,
		coins: rewardBreakdown.value.total.coins || 0,
		diamonds: rewardBreakdown.value.total.diamonds || 0,
		completed: true,
		endless: true,
		starsEarned: calculateCurrentStars()
	})

	console.log('🎉 Endless mode completed with rewards:', rewardBreakdown.value)
}

const calculateEndlessStars = () => {
	if (!isEndlessMode.value) return 0

	const config = currentLevelConfig.value.endless
	let stars = 0

	// Check score milestones
	if (score.value >= config.scoreMilestones[2]) stars = 3 // 15000 points
	else if (score.value >= config.scoreMilestones[1]) stars = 2 // 5000 points
	else if (score.value >= config.scoreMilestones[0]) stars = 1 // 2000 points

	// Check time milestones (bonus stars)
	const timeMinutes = sessionTime.value / 60
	if (timeMinutes >= 20) stars = Math.max(stars, 3)
	else if (timeMinutes >= 15) stars = Math.max(stars, 2)
	else if (timeMinutes >= 10) stars = Math.max(stars, 1)

	// Check merge milestones
	if (totalMerges.value >= 500) stars = Math.max(stars, 3)
	else if (totalMerges.value >= 200) stars = Math.max(stars, 2)
	else if (totalMerges.value >= 80) stars = Math.max(stars, 1)

	return Math.min(stars, 3)
}

const completeLevel = () => {
	if (gameState.value !== 'playing') return

	// Endless mode should use completeEndlessMode() instead
	if (isEndlessMode.value) {
		completeEndlessMode()
		return
	}

	clearLevelState('numNumMerge', currentLevel.value)
	gameState.value = 'completed'

	// Prepare screenshot data
	currentGameScreenshotData.value = captureScreenshotData()
	enableScreenshotCapture.value = true

	// Calculate rewards for regular levels
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

	// Check achievements
	const achievementsBefore = [...gameData.achievements]
	checkGameLevelAchievements('numNumMerge', currentLevel.value)

	const numNumAchievements = checkNumNumAchievements(gameData, currentLevel.value, grid.value, {
		maxCombo: comboSystem.comboCount.value,
		moves: moves.value,
		totalMerges: totalMerges.value
	})

	numNumAchievements.forEach(achievement => {
		const wasAdded = addAchievement(achievement)
		if (wasAdded) {
			console.log(`🎉 NumNum achievement unlocked: ${achievement.name}`)
		}
	})

	checkAutoAchievements()
	const achievementsAfter = [...gameData.achievements]

	earnedAchievements.value = achievementsAfter.filter(after =>
			!achievementsBefore.some(before => before.id === after.id && before.earned)
	)

	// Create reward breakdown for regular levels
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
		firstTime: isFirstTimeCompletion,
		starsEarned: starsEarned
	})

	console.log('🏆 Regular level completed with rewards:', rewardBreakdown.value)
}

const updateEndlessStats = () => {
	const levelResult = {
		completed: true,
		score: score.value,
		time: sessionTime.value,
		moves: moves.value,
		merges: totalMerges.value,
		stars: calculateCurrentStars()
	}
	console.log('updateEndlessStats', levelResult);
	updateLevelStats('numNumMerge', currentLevel.value, levelResult)
}

const checkNumNumAchievements = (gameData, levelNumber, finalGrid, gameStats) => {
	const achievements = []

	// Check for number milestone achievements
	const highestNumber = getHighestNumberFromGrid(finalGrid)
	const numberAchievements = ACHIEVEMENTS.definitions.filter(
			achievement =>
					achievement.trigger.type === 'number_reach' &&
					achievement.trigger.game === 'numNumMerge' &&
					achievement.trigger.number <= highestNumber
	)

	numberAchievements.forEach(achievement => {
		if (!gameData.achievements.some(a => a.id === achievement.id && a.earned)) {
			achievements.push(achievement)
		}
	})

	// Check for combo achievements
	if (gameStats.maxCombo >= 10) {
		const comboAchievement = ACHIEVEMENTS.definitions.find(a => a.id === 'numnum_combo_master')
		if (comboAchievement && !gameData.achievements.some(a => a.id === comboAchievement.id && a.earned)) {
			achievements.push(comboAchievement)
		}
	}

	// Check for moves-based achievements
	if (gameStats.moves <= 50) {
		const speedAchievement = ACHIEVEMENTS.definitions.find(a => a.id === 'numnum_speedster')
		if (speedAchievement && !gameData.achievements.some(a => a.id === speedAchievement.id && a.earned)) {
			achievements.push(speedAchievement)
		}
	}

	// Check for total merges across all games
	const totalMerges = gameData.games.numNumMerge.totalMerges || 0
	if (totalMerges >= 100) {
		const mergeAchievement = ACHIEVEMENTS.definitions.find(a => a.id === 'numnum_merge_master')
		if (mergeAchievement && !gameData.achievements.some(a => a.id === mergeAchievement.id && a.earned)) {
			achievements.push(mergeAchievement)
		}
	}

	return achievements
}

const getHighestNumberFromGrid = (grid) => {
	let highest = 0
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 4; col++) {
			if (grid[row][col] && grid[row][col] > highest) {
				highest = grid[row][col]
			}
		}
	}
	return highest
}

const gameOver = () => {
	pauseGame()
	clearLevelState('numNumMerge', currentLevel.value)

	// For endless mode, complete instead of game over
	if (isEndlessMode.value) {
		completeEndlessMode()
		return
	}

	// Regular game over logic
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

	// Check achievements for regular game over
	const numNumAchievements = checkNumNumAchievements(gameData, currentLevel.value, grid.value, {
		maxCombo: comboSystem.comboCount.value,
		moves: moves.value,
		totalMerges: totalMerges.value
	})

	numNumAchievements.forEach(achievement => {
		const wasAdded = addAchievement(achievement)
		if (wasAdded) {
			console.log(`🎉 NumNum achievement unlocked: ${achievement.name}`)
		}
	})

	checkAutoAchievements()
	addScore(score.value)
}

const pauseGame = () => {
	if (gameState.value === 'playing') {
		gameState.value = 'paused'
		stopSessionTimer()
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
	const levelNumber = currentLevel.value
	const previousLevelStats = getLevelStats('numNumMerge', currentLevel.value)
	const isFirstTimeCompletion = !previousLevelStats?.completed
	const starsEarned = calculateCurrentStars()

	// Determine difficulty multiplier (nur für Regular-Levels)
	let difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.easy
	if (levelNumber >= 4) {
		difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.hard
	} else if (levelNumber >= 2) {
		difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.medium
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
			icon: 'completion',
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
			icon: 'perfect',
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
	if (isEndlessMode.value) {
		return calculateEndlessStars()
	}

	if (!gameProgress.value.completed) return 0

	return calculateLevelStars(
			{ score: score.value, moves: moves.value, completed: true },
			currentLevelConfig.value
	)
}

const isTargetTile = (row, col) => {
	return grid.value[row][col] === getTargetNumber()
}

// Save/Restore system
const captureCurrentState = () => {
	if (gameState.value !== 'playing') return null

	const currentState = {
		score: score.value,
		moves: moves.value,
		sessionTime: sessionTime.value,
		totalMerges: totalMerges.value,

		undoStack: undoStack.value.map(state => ({
			grid: state.grid.map(row => [...row]),
			score: state.score,
			moves: state.moves,
			totalMerges: state.totalMerges,
			comboState: { ...state.comboState }
		})),

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

		number7Data: number7Position.value,

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

		number7Position.value = savedState.number7Data || null

		if (savedState.undoStack && Array.isArray(savedState.undoStack)) {
			undoStack.value = savedState.undoStack.map(state => ({
				grid: state.grid.map(row => [...row]),
				score: state.score,
				moves: state.moves,
				totalMerges: state.totalMerges,
				comboState: { ...state.comboState }
			}))
		} else {
			undoStack.value = []
		}

		// Update undo count
		undoRemaining.value = getItemQuantity('undo_move')

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

const getTileStyle = (value) => {
	if (!value) return {}

	// Regular numbers
	const numberType = Object.values(NUMBER_TYPES).find(type => type.number === value)
	if (!numberType) return {}

	return {
		backgroundColor: numberType.color,
		color: numberType.textColor,
		fontSize: numberType.fontSize,
		fontWeight: numberType.fontWeight
	}
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
	if (gameBoard.value) {
		gameBoard.value.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
	}
	document.addEventListener('contextmenu', (e) => e.preventDefault())
})

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeyDown)
	document.removeEventListener('contextmenu', (e) => e.preventDefault())
	stopSessionTimer()
	comboSystem.cleanup()
})

// Watchers
watch(() => props.level, (newLevel) => {
	currentLevel.value = newLevel
	initializeGame()
})
watch(() => gameData.player.inventory.items?.undo_move?.quantity, (newQuantity) => {
	undoRemaining.value = newQuantity || 0
	console.log('🔄 Undo quantity updated:', undoRemaining.value)
}, { immediate: true })
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

				<div class="undo-control">
					<button
						class="btn btn--small btn--circle control-btn"
						:class="{
			        'btn--success': canUndo,
			      }"
						@click="undoRemaining > 0 ? performUndo() : handleBuyUndoClick()"
						:title="canUndo ? t('numNumMerge.undo_move') : t('numNumMerge.no_undos')"
					>
						<span class="undo-icon">↩️</span>
						<span v-if="undoRemaining > 0" class="notification-badge">{{ undoRemaining }}</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Game Board -->
		<div
			class="game-container"
			@touchstart.passive="handleTouchStart"
			@touchmove.prevent="handleTouchMove"
			@touchend.passive="handleTouchEnd"
		>
			<div
				ref="gameBoard"
				class="game-board"
				:class="{
					'game-board--endless': isEndlessMode,
					'game-board--animating': isAnimating
				}"
			>
				<!-- Endless Mode Info Overlay -->
				<div v-if="isEndlessMode" class="endless-overlay">
					<div class="stars-preview">
						<Icon
							v-for="starIndex in 3"
							:key="starIndex"
							:name="starIndex <= calculateCurrentStars() ? 'star-filled' : 'star'"
							size="16"
							:class="{
			          'star--earned': starIndex <= calculateCurrentStars(),
			          'star--empty': starIndex > calculateCurrentStars()
			        }"
						/>
					</div>
				</div>
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
						    'grid-cell--merging': isMergingTile(rowIndex, colIndex),
						    'grid-cell--target-reached': isTargetTile(rowIndex, colIndex),
						  }"
						>
							<div
								v-if="hasNumberAt(rowIndex, colIndex)"
								class="cell-number"
								:class="{
							    'cell-number--countdown': isTrackedNumber7(rowIndex, colIndex)
							  }"
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
				game-name="numNumMerge"
				:level="currentLevel"
				:game-title="t('numNumMerge.title')"
				:final-score="score"
				:time-elapsed="isEndlessMode ? sessionTime : 0"
				:moves="moves"
				:matches="totalNumbers"
				:total-pairs="totalNumbers"
				:stars-earned="calculateCurrentStars()"
				:show-stars="true"
				:new-achievements="earnedAchievements"
				:show-achievements="true"
				:show-reward="true"
				:reward="levelReward"
				:show-completion-phases="true"
				:enable-phase-transition="true"
				:show-next-level="!isEndlessMode"
				:next-level-label="isEndlessMode ? t('numNumMerge.play_again') : t('numNumMerge.next_level')"
				:play-again-label="t('numNumMerge.play_again')"
				:back-to-games-label="t('numNumMerge.back_to_levels')"
				:game-state="currentGameScreenshotData"
				:high-score-info="screenshotHighscoreInfo"
				:show-reward-breakdown="true"
				:reward-breakdown="rewardBreakdown"
				:enable-screenshot="enableScreenshotCapture"
				:auto-save-screenshot="true"
				@save-screenshot="handleSaveScreenshot"
				@next-level="nextLevel"
				@play-again="resetGame"
				@back-to-games="backToGaming"
				@close="backToGaming"
		/>

		<!-- Game Over Modal -->
		<GameOverModal
				v-if="!isEndlessMode"
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

		<ShopModal
				:visible="showShopModal"
				:item="undoItem"
				:player-balance="playerBalance"
				:type="modalType"
				@confirm="handleUndoPurchaseConfirm"
				@cancel="handleShopModalCancel"
				@close="closeShopModal"
		/>

		<div class="button-row">
			<button
				class="btn btn--small btn--danger"
				@click="handleTryAgain()"
			>
				<Icon name="refresh" size="16" class="icon--left" />
				{{ t('numNumMerge.try_again') }}
			</button>
		</div>
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
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
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
	overscroll-behavior: contain;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&--animating {
		.grid-cell {
			transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		}
	}

	&--endless {
		.num-grid {
			box-shadow: inset 0 0 8px var(--primary-color);
		}
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
	background-color: var(--card-bg);
	border-radius: var(--border-radius-lg);
	padding: var(--space-12) var(--space-4);
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
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

	&--occupied {
		background-color: transparent;
	}

	&--new {
		.cell-number {
			animation: tileAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		}
	}

	&--merging {
		.cell-number {
			animation: tileMerge 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		}
	}

	&--target-reached {
		.cell-number {
			box-shadow: 0 0 2px 6px var(--success-color);
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
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	transform-origin: center;
}

.score-pop {
	animation: scorePop 0.5s ease-out;
}

.combo-display {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&.combo-active {
		transform: scale(1.05);
		color: var(--warning-color);
		text-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
	}
}

.endless-overlay {
	position: absolute;
	top: var(--space-3);
	right: var(--space-4);
	z-index: 10;
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.stars-preview {
	display: flex;
	gap: var(--space-1);
	background-color: rgba(0, 0, 0, 0.7);
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-md);
}


.undo-control {
	display: flex;
	align-items: center;
	justify-content: center;

	.undo-icon {
		font-size: var(--font-size-lg);
	}
}

.control-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--space-2);
	position: relative;
	min-width: var(--space-12);
	height: var(--space-12);

	&:hover {
		transform: translateY(-1px);
	}
}

.buy-undo-btn {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-1);
	position: relative;
	height: 100%;

	.undo-price {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-1);
		font-size: var(--font-size-xs);
		line-height: 1;
	}

	.price-coins,
	.price-diamonds {
		display: flex;
		align-items: center;
		gap: 2px;
		white-space: nowrap;
	}

	&:hover {
		transform: translateY(-1px);
	}
}

.undo-feedback {
	animation: undoFeedback 0.5s ease-out;
}

.cell-number--countdown {
	position: relative;
	animation: countdownGlow 2s infinite alternate;
}

@keyframes countdownGlow {
	0% { box-shadow: 0 0 8px rgba(255, 107, 107, 0.3); }
	100% { box-shadow: 0 0 15px rgba(255, 107, 107, 0.7); }
}

// Animations
@keyframes tileAppear {
	0% {
		transform: scale(0);
		opacity: 0;
	}
	60% {
		transform: scale(1.15);
		opacity: 0.9;
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
	25% {
		transform: scale(0.95);
	}
	50% {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
	75% {
		transform: scale(1.05);
	}
	100% {
		transform: scale(1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
}

@keyframes tileSlide {
	0% {
		transform: translateX(0) translateY(0);
	}
	100% {
		transform: translateX(var(--slide-x, 0)) translateY(var(--slide-y, 0));
	}
}

@keyframes scorePop {
	0% {
		transform: scale(1);
		color: var(--text-color);
	}
	50% {
		transform: scale(1.1);
		color: var(--success-color);
	}
	100% {
		transform: scale(1);
		color: var(--text-color);
	}
}

@keyframes levelComplete {
	0% {
		transform: scale(1) rotate(0deg);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	25% {
		transform: scale(1.05) rotate(1deg);
		box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
	}
	50% {
		transform: scale(1.1) rotate(-1deg);
		box-shadow: 0 6px 16px rgba(79, 70, 229, 0.5);
	}
	75% {
		transform: scale(1.05) rotate(0.5deg);
		box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
	}
	100% {
		transform: scale(1) rotate(0deg);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

@keyframes undoFeedback {
	0% {
		transform: scale(1);
		color: var(--text-color);
	}
	50% {
		transform: scale(1.1);
		color: var(--info-color);
	}
	100% {
		transform: scale(1);
		color: var(--text-color);
	}
}

// Touch feedback
@media (hover: none) {
	.game-container,
	.game-board {
		user-select: none;
		-webkit-user-select: none;
	}

	.grid-cell {
		touch-action: none;
	}
}
</style>