<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue'
import * as Matter from 'matter-js'
import {
	FRUIT_MERGE_LEVELS,
	FRUIT_TYPES,
	PHYSICS_CONFIG,
	POINTS_CONFIG,
	RAINBOW_FRUIT_CONFIG,
	MOLD_FRUIT_CONFIG,
	BOMB_FRUIT_CONFIG
} from './fruitMergeConfig.js'
import { useRouter } from 'vue-router'
import PerformanceStats from "../../components/PerformanceStats.vue";
import {calculateLevelStars} from "../../config/levelUtils.js";
import GameCompletedModal from "../../components/GameCompletedModal.vue";
import {useComboSystem} from "../../composables/useComboSystem.js";
import { useLocalStorage } from '../../composables/useLocalStorage.js'
import { useInventory } from '../../composables/useInventory.js'
import { useI18n } from '../../../composables/useI18n.js'
import { useScreenshot } from '../../composables/useScreenshot.js'
import Header from "../../components/Header.vue";
import {REWARDS} from "../../config/achievementsConfig.js";
import {COMBO_CONFIG} from "../../config/comboConfig.js";
import { ACHIEVEMENTS } from '../../config/achievementsConfig.js'
import GameOverModal from "../../components/GameOverModal.vue";
import Icon from "../../../components/Icon.vue";
import ShopModal from "../../components/ShopModal.vue";
import { SHOP_ITEMS } from '../../config/shopConfig.js'
import CurrencyDisplay from "../../components/CurrencyDisplay.vue";

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
	addAchievement,
	hasAchievement,
	buyItem,
	removeItemFromInventory,
} = useLocalStorage()
const { t } = useI18n()
const { getItemQuantity } = useInventory()
const { saveGameScreenshot, getScreenshotsForLevel } = useScreenshot()

// Game state - using shallowRef for performance
const gameState = ref('playing') // 'playing', 'paused', 'completed', 'game-over'
const fruits = shallowRef([]) // Using shallowRef for better performance with arrays
const currentLevel = ref(props.level || 1)
const score = ref(0)
const moves = ref(0)
const nextFruitId = ref(0)

const currentLevelConfig = computed(() => FRUIT_MERGE_LEVELS[currentLevel.value])

// Physics engine references
let engine = null
let runner = null

// DOM references
const gameBoard = ref(null)
const nextFruitContainer = ref(null)
const nextFruitPosition = ref(PHYSICS_CONFIG.board.width / 2)
const isDropping = ref(false)
const dropCooldown = ref(false)

// Mouse/Touch tracking
const isHoveringBoard = ref(false)

// Next fruit system
const nextFruit = ref(null)
const nextNextFruit = ref(null)
const showNextFruit = ref(true)
const particles = shallowRef([])
const earnedAchievements = ref([])
const levelReward = ref(null)
const rewardBreakdown = ref(null)
const scorePoints = shallowRef([])
const isPhysicsPaused = ref(false)
const totalMerges = ref(0)
const sessionTime = ref(0)
const sessionTimer = ref(null)
const milestones = ref([])
const isRestoringState = ref(false)
const hasSavedState = ref(false)

const hammerMode = ref(false)
const hammerRemaining = ref(gameData.player.inventory.items?.hammer_powerup?.quantity || 0)
const selectedFruitForHammer = ref(null)
const isUsingHammer = ref(false)
const hammerCountdownTimer = ref(null)
const hammerCountdownTime = ref(0)
const hammerCountdownDuration = 5000 // 5 seconds
const isHammerCountdownActive = ref(false)

const showShopModal = ref(false)
const modalType = ref('purchase')

const moldFruitTimer = ref(null)
const moldFruitSpawnTimer = ref(null)
const moldFruitShrinkDelay = ref(false)
const currentMoldFruit = ref(null)
const moldFruitLifeRemaining = ref(0)
const moldFruitWarningActive = ref(false)
const lastMoldSpawnTime = ref(0)

const bombFruitTimer = ref(null)
const currentBombFruit = ref(null)
const bombFuseRemaining = ref(0)
const bombTickingActive = ref(false)
const lastBombSpawnTime = ref(0)
const showFruitSelector = ref(false)
const isSelectingFruit = ref(false)

const enableScreenshotCapture = ref(false)
const currentGameScreenshotData = ref(null)
const screenshotHighscoreInfo = computed(() => {
	// only calculate if gameState === 'completed'
	if (gameState.value !== 'completed') {
		return null
	}

	const levelScreenshots = getScreenshotsForLevel('fruitMerge', currentLevel.value)
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
		isFirstEver: false,
		previousBest: sortedScreenshots[0]?.score || 0,
		worstInTop5: sortedScreenshots[Math.min(4, sortedScreenshots.length - 1)]?.score || 0
	}
})

const lastRainbowSpawnTime = ref(0)

const availableFruitsForSelection = computed(() => {
	const fruits = fruitTypes.value.slice(0, 4) // First 4 fruit types

	// Add special fruits only in endless mode
	if (isEndlessMode.value ) {
		fruits.push({
			type: 'RAINBOW_FRUIT',
			name: 'Rainbow',
			size: FRUIT_TYPES.RAINBOW_FRUIT.radius * 2,
			svg: FRUIT_TYPES.RAINBOW_FRUIT.svg,
			color: FRUIT_TYPES.RAINBOW_FRUIT.color,
			rarity: 'rare',
			cost: FRUIT_TYPES.RAINBOW_FRUIT.cost,
			isRainbow: true
		})

		fruits.push({
			type: 'BOMB_FRUIT',
			name: 'Bomb',
			size: FRUIT_TYPES.BOMB_FRUIT.radius * 2,
			svg: FRUIT_TYPES.BOMB_FRUIT.svg,
			color: FRUIT_TYPES.BOMB_FRUIT.color,
			rarity: 'rare',
			cost: FRUIT_TYPES.BOMB_FRUIT.cost,
			isBomb: true
		})

		fruits.push({
			type: 'MOLD_FRUIT',
			name: 'Mold',
			size: FRUIT_TYPES.MOLD_FRUIT.radius * 2,
			svg: FRUIT_TYPES.MOLD_FRUIT.svg,
			color: FRUIT_TYPES.MOLD_FRUIT.color,
			rarity: 'rare',
			cost: FRUIT_TYPES.MOLD_FRUIT.cost,
			isMold: true
		})
	}

	if (nextFruit.value) {
		let index = fruits.findIndex(fruit => fruit.type === nextFruit.value.type)
		if (index !== -1) {
			fruits.splice(index, 1)
		}
	}

	return fruits;
})

const canAffordFruitSelection = computed(() => {
	return (cost) => playerBalance.value.diamonds >= cost.diamonds
})

const hasBombFruit = computed(() => {
	return fruits.value.some(fruit => fruit.isBomb)
})

const bombFusePercentage = computed(() => {
	if (!currentBombFruit.value || bombFuseRemaining.value <= 0) return 0
	return (bombFuseRemaining.value / BOMB_FRUIT_CONFIG.fuseTime) * 100
})

const hammerItem = computed(() => {
	return SHOP_ITEMS.find(item => item.id === 'hammer_powerup')
})

const playerBalance = computed(() => ({
	coins: gameData.player.coins || 0,
	diamonds: gameData.player.diamonds || 0
}))

const canAffordHammer = computed(() => {
	if (!hammerItem.value) return false
	return playerBalance.value.coins >= hammerItem.value.price.coins &&
			playerBalance.value.diamonds >= hammerItem.value.price.diamonds
})

// Combo system setup
const comboSystem = useComboSystem({
	minComboLength: 2,
	maxComboLength: 15,
	comboTimeout: 3000,
	baseMultiplier: 1.4,
	multiplierIncrement: 0.4
})

const fruitTypes = computed(() => {
	return Object.values(FRUIT_TYPES)
			.sort((a, b) => a.index - b.index)
			.map(fruit => ({
				size: fruit.radius * 2,
				color: fruit.color,
				level: fruit.index,
				name: fruit.type,
				svg: fruit.svg,
				scoreValue: fruit.scoreValue,
				nextType: fruit.nextType,
				radius: fruit.radius,
				type: fruit.type,
				cost: fruit.cost
			}))
})

// Game area dimensions - computed for reactivity
const boardConfig = computed(() => ({
	width: PHYSICS_CONFIG.board.width,
	height: PHYSICS_CONFIG.board.height,
	thickness: PHYSICS_CONFIG.board.thickness
}))

const gameOverTimer = ref(null)
const gameOverHeight = computed(() => {
	return PHYSICS_CONFIG.board.height - PHYSICS_CONFIG.gameOverHeight
})

const isEndlessMode = computed(() => {
	return currentLevelConfig.value.isEndless || false
})

const autoSaveTimer = ref(null)
const autoSave = () => {
	if (gameState.value !== 'playing' || isRestoringState.value) {
		return
	}

	try {
		const currentState = captureCurrentState()
		if (currentState) {
			saveLevelState('fruitMerge', currentLevel.value, currentState)
			console.log('🔄 Auto-saved game state')
		}
	} catch (error) {
		console.error('Auto-save failed:', error)
	}
}

const startAutoSave = () => {
	if (autoSaveTimer.value) {
		clearInterval(autoSaveTimer.value)
	}

	autoSaveTimer.value = setInterval(() => {
		autoSave()
	}, 15000) // Alle 15 Sekunden

	console.log('🔄 Auto-save timer started (15s interval)')
}

const stopAutoSave = () => {
	if (autoSaveTimer.value) {
		clearInterval(autoSaveTimer.value)
		autoSaveTimer.value = null
		console.log('🔄 Auto-save timer stopped')
	}
}

const openFruitSelector = () => {
	if (gameState.value !== 'playing' || !isEndlessMode.value) return
	showFruitSelector.value = true
	isSelectingFruit.value = true
}

const closeFruitSelector = () => {
	showFruitSelector.value = false
	isSelectingFruit.value = false
}

const selectFruit = (fruitData) => {
	if (!canAffordFruitSelection.value(fruitData.cost)) {
		console.log('Not enough diamonds for fruit selection')
		return
	}

	// Deduct diamonds
	gameData.player.diamonds -= fruitData.cost.diamonds

	// Create new fruit based on selection
	let newFruit
	if (fruitData.isBomb) {
		newFruit = {
			id: nextFruitId.value++,
			type: FRUIT_TYPES.BOMB_FRUIT.type,
			color: FRUIT_TYPES.BOMB_FRUIT.color,
			size: FRUIT_TYPES.BOMB_FRUIT.radius * 2,
			level: FRUIT_TYPES.BOMB_FRUIT.index,
			name: FRUIT_TYPES.BOMB_FRUIT.type,
			svg: FRUIT_TYPES.BOMB_FRUIT.svg,
			x: 0,
			y: 0,
			rotation: 0,
			body: null,
			merging: false,
			inDanger: false,
			dangerZoneStartTime: null,
			dangerZoneTime: 0,
			isBomb: true,
			fuseTime: BOMB_FRUIT_CONFIG.fuseTime,
			spawnedAt: null
		}
	} else if (fruitData.isMold) {
		newFruit = {
			id: nextFruitId.value++,
			type: FRUIT_TYPES.MOLD_FRUIT.type,
			color: FRUIT_TYPES.MOLD_FRUIT.color,
			size: FRUIT_TYPES.MOLD_FRUIT.radius * 2,
			level: FRUIT_TYPES.MOLD_FRUIT.index,
			name: FRUIT_TYPES.MOLD_FRUIT.type,
			svg: FRUIT_TYPES.MOLD_FRUIT.svg,
			x: 0,
			y: 0,
			rotation: 0,
			body: null,
			merging: false,
			inDanger: false,
			dangerZoneStartTime: null,
			dangerZoneTime: 0,
			isMold: true,
			lifespan: MOLD_FRUIT_CONFIG.lifespan,
			spawnedAt: null
		}
	} else {
		// Normal fruit selection
		const selectedFruitType = Object.values(FRUIT_TYPES).find(f => f.type === fruitData.type)
		newFruit = {
			id: nextFruitId.value++,
			type: selectedFruitType.type,
			color: selectedFruitType.color,
			size: selectedFruitType.radius * 2,
			level: selectedFruitType.index,
			name: selectedFruitType.type,
			svg: selectedFruitType.svg,
			x: 0,
			y: 0,
			rotation: 0,
			body: null,
			merging: false,
			inDanger: false,
			dangerZoneStartTime: null,
			dangerZoneTime: 0,
			isBomb: false,
			isMold: false
		}
	}

	// Update next fruit
	nextFruit.value = newFruit

	console.log(`🎯 Fruit selected: ${fruitData.name} for ${fruitData.cost} diamonds`)

	// Close selector
	closeFruitSelector()
}

const generateNextFruit = () => {
	// Check for bomb fruit spawn chance (only in endless mode)
	if (isEndlessMode.value && shouldGenerateBombFruit()) {
		return {
			id: nextFruitId.value++,
			type: FRUIT_TYPES.BOMB_FRUIT.type,
			color: FRUIT_TYPES.BOMB_FRUIT.color,
			size: FRUIT_TYPES.BOMB_FRUIT.radius * 2,
			level: FRUIT_TYPES.BOMB_FRUIT.index,
			name: FRUIT_TYPES.BOMB_FRUIT.type,
			svg: FRUIT_TYPES.BOMB_FRUIT.svg,
			x: 0,
			y: 0,
			rotation: 0,
			body: null,
			merging: false,
			inDanger: false,
			dangerZoneStartTime: null,
			dangerZoneTime: 0,
			isBomb: true,
			fuseTime: BOMB_FRUIT_CONFIG.fuseTime,
			spawnedAt: null // Will be set when dropped
		}
	}

	// Check for mold fruit spawn chance (only in endless mode)
	if (isEndlessMode.value && shouldGenerateMoldFruit()) {
		return {
			id: nextFruitId.value++,
			type: FRUIT_TYPES.MOLD_FRUIT.type,
			color: FRUIT_TYPES.MOLD_FRUIT.color,
			size: FRUIT_TYPES.MOLD_FRUIT.radius * 2,
			level: FRUIT_TYPES.MOLD_FRUIT.index,
			name: FRUIT_TYPES.MOLD_FRUIT.type,
			svg: FRUIT_TYPES.MOLD_FRUIT.svg,
			x: 0,
			y: 0,
			rotation: 0,
			body: null,
			merging: false,
			inDanger: false,
			dangerZoneStartTime: null,
			dangerZoneTime: 0,
			isMold: true,
			lifespan: MOLD_FRUIT_CONFIG.lifespan,
			spawnedAt: null // Will be set when dropped
		}
	}

	if (isEndlessMode.value && shouldGenerateRainbowFruit()) {
		return {
			id: nextFruitId.value++,
			type: FRUIT_TYPES.RAINBOW_FRUIT.type,
			color: FRUIT_TYPES.RAINBOW_FRUIT.color,
			size: FRUIT_TYPES.RAINBOW_FRUIT.radius * 2,
			level: FRUIT_TYPES.RAINBOW_FRUIT.index,
			name: FRUIT_TYPES.RAINBOW_FRUIT.type,
			svg: FRUIT_TYPES.RAINBOW_FRUIT.svg,
			x: 0,
			y: 0,
			rotation: 0,
			body: null,
			merging: false,
			inDanger: false,
			dangerZoneStartTime: null,
			dangerZoneTime: 0,
			isRainbow: true,
			spawnedAt: null
		}
	}


	// Normal fruit generation logic... (rest bleibt gleich)
	const maxStartingLevel = 4
	const randomIndex = Math.floor(Math.random() * maxStartingLevel)
	const randomFruitType = fruitTypes.value[randomIndex]

	if (!randomFruitType) {
		console.error('Could not find fruit type at index:', randomIndex)
		return null
	}

	return {
		id: nextFruitId.value++,
		type: randomFruitType.type,
		color: randomFruitType.color,
		size: randomFruitType.size,
		level: randomFruitType.level,
		name: randomFruitType.name,
		svg: randomFruitType.svg,
		x: 0,
		y: 0,
		rotation: 0,
		body: null,
		merging: false,
		inDanger: false,
		dangerZoneStartTime: null,
		dangerZoneTime: 0,
		isBomb: false,
		isMold: false
	}
}

const updateNextFruitPreview = () => {
	nextNextFruit.value = generateNextFruit()
}

const getTargetFruitSvg = () => {
	if (!currentLevelConfig.value || !currentLevelConfig.value.targetFruit) return ''

	const targetFruitName = currentLevelConfig.value.targetFruit
	const targetFruitType = Object.values(FRUIT_TYPES).find(f => f.type === targetFruitName)

	return targetFruitType ? targetFruitType.svg : ''
}

const shouldGenerateRainbowFruit = () => {
	if (!isEndlessMode.value) return false

	let currentRainbowCount = fruits.value.filter(fruit => fruit.isRainbow).length
	if (nextFruit.value?.isRainbow) {
		currentRainbowCount += 1
	}
	if (currentRainbowCount >= RAINBOW_FRUIT_CONFIG.maxConcurrent) {
		return false
	}

	const now = Date.now()
	const timeSinceLastSpawn = now - lastRainbowSpawnTime.value

	// Ensure minimum delay between rainbow spawns
	if (timeSinceLastSpawn < RAINBOW_FRUIT_CONFIG.minSpawnDelay) return false

	return Math.random() < RAINBOW_FRUIT_CONFIG.spawnChance
}

const shouldGenerateMoldFruit = () => {
	if (!isEndlessMode.value) return false
	let currentMoldCount = fruits.value.filter(fruit => fruit.isMold).length
	if (nextFruit.value?.isMold) {
		currentMoldCount += 1
	}
	if (currentMoldCount >= MOLD_FRUIT_CONFIG.maxConcurrent) {
		return false
	}

	const now = Date.now()
	const timeSinceLastSpawn = now - lastMoldSpawnTime.value

	// Ensure minimum delay between mold spawns
	if (timeSinceLastSpawn < MOLD_FRUIT_CONFIG.minSpawnDelay) return false

	return Math.random() < MOLD_FRUIT_CONFIG.spawnChance
}

const shouldGenerateBombFruit = () => {
	if (!isEndlessMode.value) return false
	let currentBombCount = fruits.value.filter(fruit => fruit.isBomb).length
	if (nextFruit.value?.isBomb) {
		currentBombCount += 1
	}
	if (currentBombCount >= BOMB_FRUIT_CONFIG.maxConcurrent) {
		return false
	}

	const now = Date.now()
	const timeSinceLastSpawn = now - lastBombSpawnTime.value

	// Ensure minimum delay between bomb spawns
	if (timeSinceLastSpawn < BOMB_FRUIT_CONFIG.minSpawnDelay) return false

	return Math.random() < BOMB_FRUIT_CONFIG.spawnChance
}

const startSessionTimer = () => {
	if (!isEndlessMode.value) return

	sessionTimer.value = setInterval(() => {
		sessionTime.value++
		checkTimeMilestones()
	}, 1000)
}

const stopSessionTimer = () => {
	if (sessionTimer.value) {
		clearInterval(sessionTimer.value)
		sessionTimer.value = null
	}
}

const checkTimeMilestones = () => {
	const config = currentLevelConfig.value.endless
	if (!config) return

	config.timeCheckpoints.forEach(checkpoint => {
		if (sessionTime.value === checkpoint && !milestones.value.includes(`time_${checkpoint}`)) {
			milestones.value.push(`time_${checkpoint}`)
			console.log(`🕐 Zeit-Meilenstein erreicht: ${Math.floor(checkpoint / 60)} Minuten!`)
		}
	})

	// Check for time-based achievements
	checkEndlessAchievements()
}

const checkScoreMilestones = () => {
	if (!isEndlessMode.value) return

	const config = currentLevelConfig.value.endless
	if (!config) return

	config.scoreMilestones.forEach(milestone => {
		if (score.value >= milestone && !milestones.value.includes(`score_${milestone}`)) {
			milestones.value.push(`score_${milestone}`)
			console.log(`🎯 Punkte-Meilenstein erreicht: ${milestone} Punkte!`)
		}
	})

	// Check for score-based achievements
	checkEndlessAchievements()
}

// Update next fruit position based on mouse/touch coordinates
const updateNextFruitPosition = (clientX) => {
	if (!gameBoard.value || !nextFruit.value) return

	const rect = gameBoard.value.getBoundingClientRect()
	const relativeX = clientX - rect.left

	// Constrain position within bounds (considering fruit radius)
	const fruitRadius = nextFruit.value.size / 2
	const minX = fruitRadius + boardConfig.value.thickness / 4
	const maxX = boardConfig.value.width - fruitRadius - boardConfig.value.thickness / 4
	nextFruitPosition.value = Math.max(minX, Math.min(maxX, relativeX))
}

// Mouse event handlers
const handleMouseMove = (event) => {
	if (!isHoveringBoard.value) return
	updateNextFruitPosition(event.clientX)
}

const handleMouseEnter = () => {
	isHoveringBoard.value = true
}

const handleMouseLeave = () => {
	isHoveringBoard.value = false
}

// Touch event handlers
const handleTouchMove = (event) => {
	if (event.touches.length > 0) {
		event.preventDefault() // Prevent scrolling
		updateNextFruitPosition(event.touches[0].clientX)
	}
}

const handleTouchStart = (event) => {
	if (event.touches.length > 0) {
		updateNextFruitPosition(event.touches[0].clientX)
	}
}

// Drop fruit
const dropFruit = (targetX = nextFruitPosition.value) => {
	if (isDropping.value || dropCooldown.value || !nextFruit.value) return

	// Original drop logic...
	isDropping.value = true
	dropCooldown.value = true

	const fruit = nextFruit.value
	const fruitConfig = fruit.isMold ? FRUIT_TYPES.MOLD_FRUIT :
			fruit.isBomb ? FRUIT_TYPES.BOMB_FRUIT :
					Object.values(FRUIT_TYPES).find(f => f.index === fruit.level)

	const radius = fruitConfig ? fruitConfig.radius : fruit.size / 2

	const body = Matter.Bodies.circle(
			targetX,
			-30,
			radius,
			{
				restitution: fruit.isMold ? 0.4 : (fruit.isBomb ? 0.3 : 0.6),
				friction: fruit.isMold ? 0.06 : 0.05,
				frictionAir: 0.008,
				density: fruit.isMold ? 0.002 : (fruit.isBomb ? 0.001 : 0.001),
				label: `fruit-${fruit.id}-${fruit.color}-${fruit.level}${fruit.isMold ? '-mold' : ''}${fruit.isBomb ? '-bomb' : ''}`,
				render: {
					sprite: {
						xScale: 1,
						yScale: 1
					}
				}
			}
	)

	fruit.body = body
	fruit.x = targetX - fruit.size / 2
	fruit.y = -30 - fruit.size / 2

	Matter.Composite.add(engine.world, body)
	fruits.value = [...fruits.value, fruit]

	if (fruit.isBomb) {
		fruit.spawnedAt = Date.now()
		startBombFuseTimer(fruit)
		lastBombSpawnTime.value = Date.now()
		console.log(`💣 Bomb fruit dropped! Fuse timer started: ${BOMB_FRUIT_CONFIG.fuseTime/1000}s`)
	}

	if (fruit.isMold) {
		fruit.spawnedAt = Date.now()
		currentMoldFruit.value = fruit
		lastMoldSpawnTime.value = Date.now()
		startMoldFruitLifecycle(fruit)
		console.log(`🟫 Mold fruit dropped! Lifecycle started: ${MOLD_FRUIT_CONFIG.lifespan/1000}s`)
	}

	moves.value++

	setTimeout(() => {
		nextFruit.value = nextNextFruit.value
		nextNextFruit.value = generateNextFruit()
		isDropping.value = false
		dropCooldown.value = false
	}, PHYSICS_CONFIG.dropCooldown)
}

const startBombFuseTimer = (bombFruit) => {
	currentBombFruit.value = bombFruit
	bombFuseRemaining.value = BOMB_FRUIT_CONFIG.fuseTime
	bombTickingActive.value = false

	console.log('💣 Starting bomb fuse timer:', {
		fruitId: bombFruit.id,
		fuseTime: BOMB_FRUIT_CONFIG.fuseTime / 1000,
		spawnedAt: new Date(bombFruit.spawnedAt).toLocaleTimeString()
	})

	bombFruitTimer.value = setInterval(() => {
		bombFuseRemaining.value -= 100

		// Start danger ticking in last 3 seconds
		if (bombFuseRemaining.value <= 3000 && !bombTickingActive.value) {
			bombTickingActive.value = true
			console.log('💣 Bomb entering danger phase!')
		}

		// Explode when fuse runs out
		if (bombFuseRemaining.value <= 0) {
			explodeBomb(bombFruit)
		}
	}, 100) // Update every 100ms for smooth countdown
}

const explodeBomb = (bombFruit) => {
	if (!bombFruit || !bombFruit.body) return

	const bombX = bombFruit.body.position.x
	const bombY = bombFruit.body.position.y

	console.log(`💥 BOMB EXPLOSION at (${Math.round(bombX)}, ${Math.round(bombY)})!`)

	// Find fruits within explosion radius
	const fruitsInRadius = fruits.value.filter(fruit => {
		if (fruit.id === bombFruit.id || !fruit.body) return false

		const distance = Math.sqrt(
				Math.pow(fruit.body.position.x - bombX, 2) +
				Math.pow(fruit.body.position.y - bombY, 2)
		)

		return distance <= BOMB_FRUIT_CONFIG.explosionRadius
	})

	// Calculate bonus score
	const bonusScore = fruitsInRadius.length * BOMB_FRUIT_CONFIG.bonusPerFruit
	if (bonusScore > 0) {
		score.value += bonusScore
		console.log(`💥 Explosion bonus: +${bonusScore} points for ${fruitsInRadius.length} fruits destroyed`)
	}

	// Create explosion effects
	createExplosionEffect(bombX, bombY, fruitsInRadius.length)
	createScorePoint(bombX, bombY, bonusScore, 1, 0)

	// Remove bomb and fruits in radius
	const fruitsToRemove = [...fruitsInRadius, bombFruit]
	fruitsToRemove.forEach(fruit => {
		if (fruit.body) {
			Matter.Composite.remove(engine.world, fruit.body)
			console.log(`💥 Fruit removed by explosion: ${fruit.name} (ID: ${fruit.id})`, fruits.value)
		}
	})

	// Update fruits array
	fruits.value = fruits.value.filter(fruit =>
			!fruitsToRemove.some(removed => removed.id === fruit.id)
	)

	// Trigger screen shake
	triggerScreenShake()

	// Cleanup bomb state
	removeBombFruit()
}

const createExplosionEffect = (x, y, destroyedCount) => {
	const particleCount = Math.min(BOMB_FRUIT_CONFIG.explosionEffect.particles + destroyedCount, 30)

	for (let i = 0; i < particleCount; i++) {
		const angle = (i / particleCount) * Math.PI * 2
		const distance = 50 + Math.random() * 60
		const particleX = Math.cos(angle) * distance + (Math.random() - 0.5) * 40
		const particleY = Math.sin(angle) * distance + (Math.random() - 0.5) * 40

		const particle = {
			id: `explosion-${Date.now()}-${i}`,
			x: x,
			y: y,
			targetX: particleX,
			targetY: particleY,
			type: 'bomb_explosion',
			backgroundColor: i % 3 === 0 ? '#FF4444' : (i % 3 === 1 ? '#FF6B6B' : '#FFD700'),
			duration: BOMB_FRUIT_CONFIG.explosionEffect.duration,
			size: 4 + Math.random() * 6
		}

		particles.value.push(particle)

		setTimeout(() => {
			particles.value = particles.value.filter(p => p.id !== particle.id)
		}, BOMB_FRUIT_CONFIG.explosionEffect.duration)
	}
}

const triggerScreenShake = () => {
	// Simple screen shake implementation
	const gameBoard = document.querySelector('.game-board')
	if (gameBoard) {
		gameBoard.style.animation = `screenShake ${BOMB_FRUIT_CONFIG.screenShakeDuration}ms ease-in-out`

		setTimeout(() => {
			gameBoard.style.animation = ''
		}, BOMB_FRUIT_CONFIG.screenShakeDuration)
	}
}

const removeBombFruit = () => {
	// Clear timers and reset state
	if (bombFruitTimer.value) {
		clearInterval(bombFruitTimer.value)
		bombFruitTimer.value = null
	}

	currentBombFruit.value = null
	bombFuseRemaining.value = 0
	bombTickingActive.value = false
	syncBodies();
}

const syncBodies = () => {
	// Synchronize Matter.js world with fruits array
	const validFruitIds = fruits.value.map(fruit => fruit.id)
	console.log('💣 Valid fruit IDs:', validFruitIds)

	// Find and remove orphaned physics bodies
	const allBodies = Matter.Composite.allBodies(engine.world)
	const bodiesToRemove = []

	allBodies.forEach(body => {
		if (body.label.startsWith('fruit-')) {
			// Extract fruit ID from label: "fruit-123-color-level" → 123
			const labelParts = body.label.split('-')
			const bodyFruitId = parseInt(labelParts[1])

			// If this physics body doesn't have a corresponding visual fruit, remove it
			if (!validFruitIds.includes(bodyFruitId)) {
				bodiesToRemove.push(body)
				console.log(`💥 Orphaned physics body found: ${body.label} (ID: ${bodyFruitId})`)
			}
		}
	})

	// Remove orphaned bodies
	if (bodiesToRemove.length > 0) {
		bodiesToRemove.forEach(body => {
			Matter.Composite.remove(engine.world, body)
			console.log(`🗑️ Removed orphaned physics body: ${body.label}`)
		})
		console.log(`💣 Cleaned up ${bodiesToRemove.length} orphaned physics bodies`)
	}
}

const activateHammerMode = () => {
	if (!isEndlessMode.value) {
		console.log('Hammer only available in endless mode')
		return false
	}

	const quantity = gameData.player.inventory.items?.hammer_powerup?.quantity || 0
	if (quantity <= 0) {
		console.log('No hammers available')
		return false
	}

	hammerMode.value = true
	isDropping.value = true // Prevent normal dropping
	console.log(`🔨 Hammer mode activated! Remaining hammers: ${quantity}`)
	return true
}

const deactivateHammerMode = () => {
	// Cancel any active countdown
	cancelHammerSelection()

	setTimeout(() => {
		hammerMode.value = false
		isDropping.value = false
	}, 100)

	const remainingHammers = getItemQuantity('hammer_powerup')
	console.log(`🔨 Hammer mode deactivated. Remaining hammers: ${remainingHammers}`)
}

const handleFruitClick = (fruit) => {
	// Prevent multiple selections during countdown
	if (isUsingHammer.value) return

	if (hammerMode.value && fruit) {
		// If same fruit clicked during countdown, cancel selection
		if (selectedFruitForHammer.value === fruit.id && isHammerCountdownActive.value) {
			cancelHammerSelection()
			return
		}

		// If different fruit clicked during countdown, switch selection
		if (isHammerCountdownActive.value && selectedFruitForHammer.value !== fruit.id) {
			cancelHammerSelection()
			// Small delay to ensure clean state transition
			setTimeout(() => {
				selectFruitForHammer(fruit)
			}, 100)
			return
		}

		// Normal fruit selection (no countdown active)
		if (!isHammerCountdownActive.value) {
			selectFruitForHammer(fruit)
		}
	}
}

const selectFruitForHammer = (fruit) => {
	console.log(`🔨 Fruit selected for hammer: ${fruit.name} (ID: ${fruit.id})`)
	selectedFruitForHammer.value = fruit.id
	startHammerCountdown(fruit)
}

const startHammerCountdown = (fruit) => {
	isHammerCountdownActive.value = true
	hammerCountdownTime.value = hammerCountdownDuration

	console.log(`🔨 Starting 5-second countdown for fruit: ${fruit.name}`)

	hammerCountdownTimer.value = setInterval(() => {
		hammerCountdownTime.value -= 100

		// Execute hammer when countdown reaches 0
		if (hammerCountdownTime.value <= 0) {
			executeHammerStrike(fruit)
		}
	}, 100) // Update every 100ms for smooth progress
}

const cancelHammerSelection = () => {
	if (hammerCountdownTimer.value) {
		clearInterval(hammerCountdownTimer.value)
		hammerCountdownTimer.value = null
	}

	isHammerCountdownActive.value = false
	hammerCountdownTime.value = 0
	selectedFruitForHammer.value = null

	console.log('🔨 Hammer selection cancelled')
}

const executeHammerStrike = (fruit) => {
	console.log(`🔨 Executing hammer strike on: ${fruit.name} (ID: ${fruit.id})`)

	isUsingHammer.value = true

	// Clear countdown state
	cancelHammerSelection()

	const centerX = fruit.body ? fruit.body.position.x : fruit.x + fruit.size / 2
	const centerY = fruit.body ? fruit.body.position.y : fruit.y + fruit.size / 2

	if (fruit.isMold) {
		// Apply negative score for removing mold fruit
		score.value = Math.max(0, score.value + MOLD_FRUIT_CONFIG.scoreEffect)
		createScorePoint(centerX, centerY, MOLD_FRUIT_CONFIG.scoreEffect, 1, 0)
		removeMoldFruit(fruit, 'hammered')
	} else {
		// Normal fruit destruction
		createDestructionEffect(centerX, centerY, fruit)
		Matter.Composite.remove(engine.world, fruit.body)
		fruits.value = fruits.value.filter(f => f.id !== fruit.id)
	}

	// Use hammer from inventory
	removeItemFromInventory('hammer_powerup', 1)
	const remaining = getItemQuantity('hammer_powerup')
	hammerRemaining.value = remaining

	// Reset states
	isUsingHammer.value = false
	deactivateHammerMode()
	syncBodies()
}

const createDestructionEffect = (x, y, fruit) => {
	// Create explosion particles
	const particleCount = 12
	for (let i = 0; i < particleCount; i++) {
		const angle = (i / particleCount) * Math.PI * 2
		const distance = 60 + Math.random() * 40
		const particleX = Math.cos(angle) * distance
		const particleY = Math.sin(angle) * distance

		const particle = {
			id: `destroy-${Date.now()}-${i}`,
			x: x,
			y: y,
			targetX: particleX,
			targetY: particleY,
			type: 'destruction',
			backgroundColor: '#FF4444',
			duration: 800,
			size: 4 + Math.random() * 4
		}

		particles.value.push(particle)

		setTimeout(() => {
			particles.value = particles.value.filter(p => p.id !== particle.id)
		}, 800)
	}
}

// Handle board click/touch for dropping
const handleBoardClick = (event) => {
	if (dropCooldown.value || isDropping.value) return

	// Get the correct clientX based on event type
	let clientX
	if (event.type === 'touchend' && event.changedTouches.length > 0) {
		clientX = event.changedTouches[0].clientX
	} else {
		clientX = event.clientX
	}

	updateNextFruitPosition(clientX)
	dropFruit(nextFruitPosition.value)
}

const canDropFruit = computed(() => {
	return gameState.value === 'playing' && !isDropping.value && !dropCooldown.value && nextFruit.value
})

// Initialize physics engine with performance optimizations
const initPhysics = () => {
	console.log('Initializing physics engine...')

	// Create engine with optimized settings like in OldFruitMergeGame
	engine = Matter.Engine.create({
		gravity: { x: 0, y: 0.5, scale: 0.001 }
	})

	// Create world boundaries (walls) - no top wall by default
	createWalls(false)

	// Create and start runner
	runner = Matter.Runner.create()
	Matter.Runner.run(runner, engine)

	Matter.Events.on(engine, 'collisionStart', handleCollision)

	startAutoSave()
	console.log('Physics engine initialized successfully')
}

// Create boundary walls
const createWalls = (includeTopWall = false) => {
	const { width, height, thickness } = boardConfig.value

	const walls = [
		// Bottom wall
		Matter.Bodies.rectangle(
				width / 2,
				height + thickness / 2,
				width,
				thickness,
				{
					isStatic: true,
					label: 'wall-bottom',
					restitution: 0.1
				}
		),
		// Left wall
		Matter.Bodies.rectangle(
				-thickness / 2,
				height / 2,
				thickness,
				height,
				{
					isStatic: true,
					label: 'wall-left',
					restitution: 0.1
				}
		),
		// Right wall
		Matter.Bodies.rectangle(
				width + thickness / 2,
				height / 2,
				thickness,
				height,
				{
					isStatic: true,
					label: 'wall-right',
					restitution: 0.1
				}
		)
	]

	if (includeTopWall) {
		walls.push(
				Matter.Bodies.rectangle(
						width / 2,
						-thickness / 2,
						width,
						thickness,
						{ isStatic: true, label: 'wall-top', restitution: 0.3 }
				)
		)
	}

	Matter.Composite.add(engine.world, walls)
}

const handleCollision = (event) => {
	const pairs = event.pairs

	for (let i = 0; i < pairs.length; i++) {
		const pair = pairs[i]
		const bodyA = pair.bodyA
		const bodyB = pair.bodyB

		// Check if both bodies are fruits
		if (bodyA.label.startsWith('fruit-') && bodyB.label.startsWith('fruit-')) {
			// Extract information from labels
			const labelPartsA = bodyA.label.split('-')
			const labelPartsB = bodyB.label.split('-')

			const idA = parseInt(labelPartsA[1])
			const idB = parseInt(labelPartsB[1])
			const levelA = parseInt(labelPartsA[3])
			const levelB = parseInt(labelPartsB[3])

			// Check for mold fruit collision
			const isMoldA = bodyA.label.includes('mold')
			const isMoldB = bodyB.label.includes('mold')

			// Mold fruits don't merge with anything
			if (isMoldA || isMoldB) {
				if (isMoldA) {
					const fruitA = fruits.value.find(f => f.id === idA)
					if (fruitA && !moldFruitShrinkDelay.value) {
						moldFruitShrinkDelay.value = true;
						fruitA.size = Math.max(fruitA.size - 2, MOLD_FRUIT_CONFIG.minSize)
						Matter.Body.scale(fruitA.body, (fruitA.size / (fruitA.size + 1)), (fruitA.size / (fruitA.size + 1)))
						setTimeout(() => {
							moldFruitShrinkDelay.value = false;
						}, 1000);
						if (fruitA.size <= MOLD_FRUIT_CONFIG.minSize) {
							removeMoldFruit(fruitA, 'natural')
						}
					}
				}

				continue
			}

			// Check for rainbow fruit collision - rainbow can merge with ANY fruit
			const isRainbowA = bodyA.label.includes('rainbow')
			const isRainbowB = bodyB.label.includes('rainbow')

			if (isRainbowA || isRainbowB) {
				const rainbowFruit = isRainbowA ? fruits.value.find(f => f.id === idA) : fruits.value.find(f => f.id === idB)
				const normalFruit = isRainbowA ? fruits.value.find(f => f.id === idB) : fruits.value.find(f => f.id === idA)

				if (rainbowFruit && normalFruit && !rainbowFruit.merging && !normalFruit.merging && !normalFruit.isMold && !normalFruit.isBomb) {
					rainbowFruit.merging = true

					const centerX = (bodyA.position.x + bodyB.position.x) / 2
					const centerY = (bodyA.position.y + bodyB.position.y) / 2

					// Remove both fruits from physics world
					Matter.Composite.remove(engine.world, bodyA)
					Matter.Composite.remove(engine.world, bodyB)

					fruits.value = fruits.value.filter(f => f.id !== idA && f.id !== idB)

					// Create next level fruit from the normal fruit
					const normalFruitType = Object.values(FRUIT_TYPES).find(f => f.index === normalFruit.level)
					if (normalFruitType) {
						const comboResult = comboSystem.addCombo()
						const baseScore = normalFruitType.scoreValue
						const rainbowBonus = Math.round(baseScore * RAINBOW_FRUIT_CONFIG.bonusMultiplier)
						const comboMultipliedScore = Math.round(rainbowBonus * comboResult.multiplier)

						score.value += comboMultipliedScore
						checkEndlessAchievements()
						checkScoreMilestones()

						const nextFruitType = Object.values(FRUIT_TYPES).find(f => f.index === normalFruit.level + 1)

						createRainbowMergeEffects(centerX, centerY, nextFruitType)
						createScorePoint(centerX, centerY, comboMultipliedScore, comboResult.multiplier, comboResult.comboLevel)

						if (nextFruitType) {
							const newFruit = {
								id: nextFruitId.value++,
								color: nextFruitType.color,
								size: nextFruitType.radius * 2,
								level: nextFruitType.index,
								name: nextFruitType.type,
								svg: nextFruitType.svg,
								x: centerX - nextFruitType.radius,
								y: centerY - nextFruitType.radius,
								rotation: 0,
								body: null,
								merging: false,
								isRainbow: false
							}

							addMergedFruit(newFruit, centerX, centerY)

							if (isEndlessMode.value) {
								totalMerges.value++
								checkScoreMilestones()
								checkEndlessAchievements()
							}

							// Check level completion
							if (newFruit.name === currentLevelConfig.value.targetFruit) {
								console.log(`🎯 Level goal reached with rainbow merge! Created ${newFruit.name}`)
								setTimeout(() => {
									showNextFruit.value = false
									nextFruit.value = null
									pausePhysics()
									stopAllFruits()
								}, PHYSICS_CONFIG.stopPhysicsDelay)
								return
							}
						}
					}

					// Update rainbow spawn tracking
					lastRainbowSpawnTime.value = Date.now()
				}
				continue // Skip normal merge logic
			}

			// Regular merge logic for non-mold fruits
			if (levelA === levelB) {
				const fruitA = fruits.value.find(f => f.id === idA)
				const fruitB = fruits.value.find(f => f.id === idB)

				if (fruitA && fruitB && !fruitA.merging && !fruitB.merging && !fruitA.isMold && !fruitB.isMold) {
					// Original merge logic continues...
					fruitA.merging = true

					const centerX = (bodyA.position.x + bodyB.position.x) / 2
					const centerY = (bodyA.position.y + bodyB.position.y) / 2

					Matter.Composite.remove(engine.world, bodyA)
					Matter.Composite.remove(engine.world, bodyB)

					fruits.value = fruits.value.filter(f => f.id !== idA && f.id !== idB)

					const currentFruitType = Object.values(FRUIT_TYPES).find(f => f.index === levelA)
					if (currentFruitType) {
						const comboResult = comboSystem.addCombo()
						const baseScore = currentFruitType.scoreValue
						const comboMultipliedScore = Math.round(baseScore * comboResult.multiplier)
						score.value += comboMultipliedScore
						checkEndlessAchievements()
						checkScoreMilestones()

						const nextFruitType = Object.values(FRUIT_TYPES).find(f => f.index === levelA + 1)

						createMergeVisualEffects(centerX, centerY, nextFruitType)
						createScorePoint(centerX, centerY, comboMultipliedScore, comboResult.multiplier, comboResult.comboLevel)

						if (nextFruitType) {
							const newFruit = {
								id: nextFruitId.value++,
								color: nextFruitType.color,
								size: nextFruitType.radius * 2,
								level: nextFruitType.index,
								name: nextFruitType.type,
								svg: nextFruitType.svg,
								x: centerX - nextFruitType.radius,
								y: centerY - nextFruitType.radius,
								rotation: 0,
								body: null,
								merging: false,
								isMold: false // Ensure merged fruits are not mold
							}

							addMergedFruit(newFruit, centerX, centerY)

							if (isEndlessMode.value) {
								totalMerges.value++
								checkScoreMilestones()
								checkEndlessAchievements()
							}

							if (newFruit.name === currentLevelConfig.value.targetFruit) {
								console.log(`🎯 Level goal reached! Created ${newFruit.name}`)
								setTimeout(() => {
									showNextFruit.value = false
									nextFruit.value = null
									pausePhysics()
									stopAllFruits()
								}, PHYSICS_CONFIG.stopPhysicsDelay)
								return
							}
						}
					}
				}
			}
		}
	}
}

const createRainbowMergeEffects = (mergeX, mergeY, newFruitType) => {
	createRainbowParticles(mergeX, mergeY, newFruitType)
	createRainbowRipple(mergeX, mergeY)
}

const createRainbowParticles = (x, y, fruitType) => {
	const particleCount = Math.min(fruitType.index + 5, 25)
	const colors = RAINBOW_FRUIT_CONFIG.mergeEffect.colors

	for (let i = 0; i < particleCount; i++) {
		const angle = (i / particleCount) * Math.PI * 2
		const distance = 60 + Math.random() * 40
		const particleX = Math.cos(angle) * distance + (Math.random() - 0.5) * 30
		const particleY = Math.sin(angle) * distance + (Math.random() - 0.5) * 30

		const particle = {
			id: `rainbow-${Date.now()}-${i}`,
			x: x,
			y: y,
			targetX: particleX,
			targetY: particleY,
			type: 'rainbow_merge',
			backgroundColor: colors[i % colors.length],
			duration: RAINBOW_FRUIT_CONFIG.mergeEffect.duration,
			size: 4 + Math.random() * 6
		}

		particles.value.push(particle)

		setTimeout(() => {
			particles.value = particles.value.filter(p => p.id !== particle.id)
		}, RAINBOW_FRUIT_CONFIG.mergeEffect.duration)
	}
}

const createRainbowRipple = (x, y) => {
	const ripple = {
		id: `rainbow-ripple-${Date.now()}`,
		x: x,
		y: y,
		targetX: 0,
		targetY: 0,
		type: 'rainbow_ripple',
		backgroundColor: 'transparent',
		duration: 1500,
		size: 20
	}

	particles.value.push(ripple)

	setTimeout(() => {
		particles.value = particles.value.filter(p => p.id !== ripple.id)
	}, 1500)
}

const checkScoreAchievements = () => {
	const achievementsBefore = [...gameData.achievements]

	// Score-basierte Achievements für alle Modi
	const scoreThresholds = [5000, 15000, 35000, 50000, 100000]
	scoreThresholds.forEach(threshold => {
		if (score.value >= threshold) {
			checkSpecificAchievement(`score_${threshold}`)
		}
	})

	// Check if new achievements were earned
	const achievementsAfter = [...gameData.achievements]
	const newAchievements = achievementsAfter.filter(after =>
			!achievementsBefore.some(before => before.id === after.id && before.earned)
	)

	// Add new achievements to current session
	if (newAchievements.length > 0) {
		earnedAchievements.value.push(...newAchievements)
		console.log(`🏆 ${newAchievements.length} new score achievements unlocked!`)
	}
}

const createScorePoint = (x, y, points, multiplier, level) => {
	const scorePoint = {
		id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		x: x,
		y: y + POINTS_CONFIG.START_OFFSET_Y,
		points: points,
		multiplier: multiplier,
		opacity: 1,
		translateY: 0,
		scale: 1,
		comboColor: COMBO_CONFIG.comboColor[level] || COMBO_CONFIG.comboColor[0],
		duration: POINTS_CONFIG.DURATION
	}

	scorePoints.value.push(scorePoint)

	const startTime = Date.now()
	const animate = () => {
		const elapsed = Date.now() - startTime
		const progress = Math.min(elapsed / POINTS_CONFIG.DURATION, 1)

		if (scorePoints.value.includes(scorePoint)) {
			// Ease-out animation
			const easeOut = 1 - Math.pow(1 - progress, 3)

			scorePoint.translateY = -POINTS_CONFIG.MAX_DISTANCE * easeOut
			scorePoint.opacity = Math.max(0, 1 - progress)
			scorePoint.scale = 1 + (progress * 0.2) // Slight scale up

			if (progress < 1) {
				requestAnimationFrame(animate)
			} else {
				// Remove score point after animation
				scorePoints.value = scorePoints.value.filter(p => p.id !== scorePoint.id)
			}
		}
	}

	requestAnimationFrame(animate)
}

const addMergedFruit = (fruit, x, y) => {
	const fruitConfig = Object.values(FRUIT_TYPES).find(f => f.index === fruit.level)
	const radius = fruitConfig ? fruitConfig.radius : fruit.size / 2

	const fruitBody = Matter.Bodies.circle(
			x,
			y,
			radius,
			{
				restitution: 0.3,
				friction: 0.05,
				frictionAir: 0.005,
				density: 0.001,
				label: `fruit-${fruit.id}-${fruit.color}-${fruit.level}`,
				render: {
					sprite: {
						xScale: 1,
						yScale: 1
					}
				}
			}
	)

	// Combo-Effekt
	if (comboSystem.isComboActive.value && comboSystem.comboCount.value >= 2) {
		fruit.comboEffect = true
		setTimeout(() => {
			if (fruits.value.includes(fruit)) {
				fruit.comboEffect = false
			}
		}, 1000)
	}

	fruit.body = fruitBody
	fruit.inDanger = false
	fruit.dangerZoneStartTime = null
	fruit.dangerZoneTime = 0

	Matter.Body.setVelocity(fruitBody, {
		x: (Math.random() - 0.5) * 2,
		y: -1
	})
	Matter.Composite.add(engine.world, fruitBody)

	fruits.value = [...fruits.value, fruit]
}

const pausePhysics = () => {
	if (engine && runner) {
		Matter.Runner.stop(runner)
		isPhysicsPaused.value = true
		console.log('Physics paused')
	}
}

const stopAllFruits = () => {
	// Stop all fruit bodies immediately
	fruits.value.forEach(fruit => {
		if (fruit.body) {
			Matter.Body.setVelocity(fruit.body, { x: 0, y: 0 })
			Matter.Body.setAngularVelocity(fruit.body, 0)
			Matter.Sleeping.set(fruit.body, true)
		}
	})
}

const createMergeVisualEffects = (mergeX, mergeY, newFruitType) => {
	createMergeParticles(mergeX, mergeY, newFruitType)
}

const createMergeParticles = (x, y, fruitType) => {
	const particleCount = Math.min(fruitType.index + 2, 10)

	for (let i = 0; i < particleCount; i++) {
		const angle = (i / particleCount) * Math.PI * 2
		const distance = 40 + Math.random() * 30
		const particleX = Math.cos(angle) * distance + (Math.random() - 0.5) * 20
		const particleY = Math.sin(angle) * distance + (Math.random() - 0.5) * 20

		const particle = {
			id: `particle-${Date.now()}-${i}`,
			x: x,
			y: y,
			targetX: particleX,
			targetY: particleY,
			type: fruitType.type,
			backgroundColor: fruitType.sparkleColor,
			duration: PHYSICS_CONFIG.sparkleDelay,
			size: 2 + Math.random() * 4
		}

		particles.value.push(particle)

		// Remove particle after animation
		setTimeout(() => {
			particles.value = particles.value.filter(p => p.id !== particle.id)
		}, PHYSICS_CONFIG.sparkleDelay)
	}
}

// Update fruit visual positions based on physics bodies
const updateFruitPositions = () => {
	if (!fruits.value.length) return

	for (const fruit of fruits.value) {
		if (fruit.body && fruit.body.position) {
			// Smooth position updates to prevent visual glitches
			const targetX = fruit.body.position.x - fruit.size / 2
			const targetY = fruit.body.position.y - fruit.size / 2

			// Only update if position actually changed significantly
			if (Math.abs(fruit.x - targetX) > 0.5 || Math.abs(fruit.y - targetY) > 0.5) {
				fruit.x = targetX
				fruit.y = targetY
			}

			// Update rotation
			fruit.rotation = fruit.body.angle * (180 / Math.PI)
		}
	}
}

const gameProgress = computed(() => {
	const targetFruitType = currentLevelConfig.value.targetFruit
	const targetCount = 1
	const currentCount = fruits.value.filter(fruit =>
			fruit.name === targetFruitType && !fruit.merging
	).length
	return {
		completed: Math.min(currentCount, targetCount),
		total: targetCount,
		percentage: Math.round((Math.min(currentCount, targetCount) / targetCount) * 100)
	}
})

// Check if level is completed
const isLevelComplete = computed(() => {
	const levelConfig = currentLevelConfig.value
	if (!levelConfig) return false

	const targetFruitType = levelConfig.targetFruit
	const targetCount = 1

	const currentCount = fruits.value.filter(fruit =>
			fruit.name === targetFruitType && !fruit.merging
	).length

	return currentCount >= targetCount
})

// Game loop for updating positions
let animationFrame = null
const gameLoop = () => {
	updateFruitPositions()
	updateFruitDangerStatus()
	animationFrame = requestAnimationFrame(gameLoop)
}

// Cleanup function
const cleanup = () => {
	console.log('Cleaning up physics engine...')

	if (animationFrame) {
		cancelAnimationFrame(animationFrame)
		animationFrame = null
	}

	if (hammerCountdownTimer.value) {
		clearInterval(hammerCountdownTimer.value)
		hammerCountdownTimer.value = null
	}

	stopGameOverChecking()
	stopAutoSave()

	// Clean up mold fruit timers
	if (moldFruitTimer.value) {
		clearInterval(moldFruitTimer.value)
		moldFruitTimer.value = null
	}
	if (moldFruitSpawnTimer.value) {
		clearInterval(moldFruitSpawnTimer.value)
		moldFruitSpawnTimer.value = null
	}

	if (runner) {
		Matter.Runner.stop(runner)
		runner = null
	}

	if (engine) {
		Matter.Events.off(engine, 'collisionStart', handleCollision)
		Matter.World.clear(engine.world, false)
		Matter.Engine.clear(engine)
		engine = null
	}

	fruits.value = []
	isPhysicsPaused.value = false
}

// Initialize game
const initGame = async () => {
	await nextTick()

	// Check for saved state first
	const savedState = loadLevelState('fruitMerge', currentLevel.value)
	hasSavedState.value = !!savedState

	if (savedState && !isRestoringState.value) {
		console.log(`Found saved state for level ${currentLevel.value}`)
		const restored = await restoreGameState(savedState)

		if (restored) {
			console.log('✅ Game state restored successfully')
			return // State restored successfully
		} else {
			console.log('❌ Failed to restore state, starting fresh game')
		}
	}

	// Initialize fresh game if no saved state or restoration failed
	console.log('🆕 Starting fresh game')
	initPhysics()
	nextFruit.value = generateNextFruit()
	updateNextFruitPreview()
	gameLoop()

	// Game Over Checking für ALLE Modi starten
	startGameOverChecking()

	if (isEndlessMode.value) {
		startSessionTimer() // Additional session timer for endless mode
		console.log('Endless mode initialized with game over checking')
	}

	console.log('Game initialized')
}

const completeLevel = () => {
	if (gameState.value !== 'playing') return

	// Clear saved state on completion
	clearLevelState('fruitMerge', currentLevel.value)
	console.log(`Cleared saved state for completed level ${currentLevel.value}`)

	gameState.value = 'completed'

	// Prepare screenshot data
	currentGameScreenshotData.value = captureScreenshotData()
	enableScreenshotCapture.value = true

	// Calculate level rewards
	const rewardCalculation = calculateLevelReward()
	levelReward.value = rewardCalculation

	// Calculate stars after updating stats
	const starsEarned = calculateCurrentStars()

	// Update level statistics
	const levelResult = {
		completed: true,
		score: score.value,
		moves: moves.value,
		stars: starsEarned,
	}

	// Check if this is first time completion
	const previousLevelStats = getLevelStats('fruitMerge', currentLevel.value)
	const isFirstTimeCompletion = !previousLevelStats?.completed

	updateLevelStats('fruitMerge', currentLevel.value, levelResult)

	// Update game statistics
	const gameStats = {
		gamesPlayed: gameData.games.fruitMerge.gamesPlayed + 1,
		totalScore: gameData.games.fruitMerge.totalScore + score.value,
		highScore: Math.max(gameData.games.fruitMerge.highScore, score.value),
		starsEarned: gameData.games.fruitMerge.starsEarned + starsEarned,
		completedLevels: gameData.games.fruitMerge.completedLevels + (isFirstTimeCompletion ? 1 : 0),
		maxLevel: Math.max(gameData.games.fruitMerge.maxLevel, currentLevel.value),
		maxCombo: Math.max(
				gameData.games.fruitMerge.maxCombo || 0,
				comboSystem.comboCount.value
		)
	}

	console.log('gameStats', gameStats)
	updateGameStats('fruitMerge', gameStats)

	// Add currency rewards to player
	if (levelReward.value.coins > 0 || levelReward.value.diamonds > 0) {
		gameData.player.coins = (gameData.player.coins || 0) + levelReward.value.coins
		gameData.player.diamonds = (gameData.player.diamonds || 0) + levelReward.value.diamonds
	}

	// Check for achievements and track new ones
	const achievementsBefore = [...gameData.achievements]
	checkGameLevelAchievements('fruitMerge', currentLevel.value)
	checkAutoAchievements()
	const achievementsAfter = [...gameData.achievements]

	// Find newly earned achievements and add to breakdown
	earnedAchievements.value = achievementsAfter.filter(after =>
			!achievementsBefore.some(before => before.id === after.id && before.earned)
	)

	// Add achievement rewards to breakdown
	const achievementBreakdown = earnedAchievements.value.map(achievement => ({
		type: 'achievement',
		source: t('rewards.breakdown.achievement_reward', { name: achievement.name }),
		coins: achievement.rewards.coins,
		diamonds: achievement.rewards.diamonds,
		icon: achievement.icon,
		style: 'achievement'
	}))

	// Create final breakdown with all rewards
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

	// Add currency rewards to player
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

const calculateLevelReward = () => {
	if (isEndlessMode.value) {
		// Endlos-Modus Belohnungs-Berechnung
		const starsEarned = calculateCurrentStars()

		const breakdown = []
		let totalCoins = 0
		let totalDiamonds = 0

		// Base Endlos-Belohnung
		const baseCoins = 50 + Math.floor(score.value / 1000) * 10 // 50 + 10 pro 1000 Punkte
		const baseDiamonds = Math.floor(sessionTime.value / 300) // 1 Diamant pro 5 Minuten

		breakdown.push({
			type: 'base',
			source: t('rewards.breakdown.endless_session'),
			coins: baseCoins,
			diamonds: baseDiamonds,
			icon: 'trophy',
			style: 'default'
		})
		totalCoins += baseCoins
		totalDiamonds += baseDiamonds

		// Zeit-basierte Belohnung
		if (sessionTime.value >= 300) { // Mindestens 5 Minuten
			const timeBonus = Math.floor(sessionTime.value / 60) * 5 // 5 Münzen pro Minute
			breakdown.push({
				type: 'time',
				source: t('rewards.breakdown.time_bonus', { minutes: Math.floor(sessionTime.value / 60) }),
				coins: timeBonus,
				diamonds: 0,
				icon: 'star',
				style: 'performance'
			})
			totalCoins += timeBonus
		}

		// Merge-basierte Belohnung
		if (totalMerges.value >= 20) {
			const mergeBonus = Math.floor(totalMerges.value / 10) * 15 // 15 Münzen pro 10 Merges
			breakdown.push({
				type: 'merges',
				source: t('rewards.breakdown.merge_bonus', { merges: totalMerges.value }),
				coins: mergeBonus,
				diamonds: 0,
				icon: 'fruit-merge-game',
				style: 'special'
			})
			totalCoins += mergeBonus
		}

		// Stern-basierte Belohnung
		if (starsEarned > 0) {
			const starCoins = starsEarned * 100 // 100 Münzen pro Stern
			const starDiamonds = starsEarned // 1 Diamant pro Stern
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

		return {
			coins: totalCoins,
			diamonds: totalDiamonds,
			breakdown: breakdown
		}
	} else {
		if (!isLevelComplete.value) return { coins: 0, diamonds: 0, breakdown: [] }

		const levelConfig = currentLevelConfig.value
		const levelNumber = currentLevel.value
		const previousLevelStats = getLevelStats('fruitMerge', currentLevel.value)
		const isFirstTimeCompletion = !previousLevelStats?.completed
		const starsEarned = calculateCurrentStars()

		// Determine difficulty tier
		let difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.easy
		let difficultyName = 'Easy Level'
		if (levelNumber >= 4) {
			difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.hard
			difficultyName = 'Hard Level'
		} else if (levelNumber >= 2) {
			difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.medium
			difficultyName = 'Medium Level'
		}

		// Detailed breakdown array
		const breakdown = []
		let totalCoins = 0
		let totalDiamonds = 0

		// 1. Difficulty multiplier info (informational only)
		if (difficultyMultiplier > 1) {
			breakdown.push({
				type: 'multiplier',
				source: t('rewards.breakdown.difficulty_multiplier', {
					difficulty: difficultyName,
					multiplier: difficultyMultiplier
				}),
				coins: 0,
				diamonds: 0,
				icon: 'star',
				style: 'info',
				isInfo: true
			})
		}

		// 2. Base reward
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

		// 3. First time completion bonus
		if (isFirstTimeCompletion) {
			const firstTimeCoins = Math.round(REWARDS.levelCompletion.firstTime.coins * difficultyMultiplier)
			const firstTimeDiamonds = REWARDS.levelCompletion.firstTime.diamonds
			breakdown.push({
				type: 'firstTime',
				source: t('rewards.breakdown.first_time_completion'),
				coins: firstTimeCoins,
				diamonds: firstTimeDiamonds,
				icon: 'star-filled',
				style: 'special'
			})
			totalCoins += firstTimeCoins
			totalDiamonds += firstTimeDiamonds
		}

		// 4. Star-based bonus
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

		// 5. Perfect bonus (3 stars)
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
}

const checkGameOver = () => {
	if (gameState.value !== 'playing') return false

	const restingFruitsInDangerZone = fruits.value.filter(fruit => {
		if (!fruit.body || fruit.merging) return false

		const inDangerZone = fruit.body.position.y <= gameOverHeight.value
		const velocity = Math.sqrt(
				fruit.body.velocity.x * fruit.body.velocity.x +
				fruit.body.velocity.y * fruit.body.velocity.y
		)
		const isResting = velocity < 0.5
		const hasBeenInDangerLongEnough = fruit.dangerZoneTime > 1000 // 1 Sekunde

		return inDangerZone && isResting && hasBeenInDangerLongEnough
	}).length

	if (restingFruitsInDangerZone >= PHYSICS_CONFIG.fruitsInDanger) {
		console.log(`Game Over triggered! ${restingFruitsInDangerZone} fruits in danger zone`)
		gameOver()
		return true
	}

	return false
}

const startGameOverChecking = () => {
	if (gameOverTimer.value) clearInterval(gameOverTimer.value)
	gameOverTimer.value = setInterval(() => {
		checkGameOver()
	}, PHYSICS_CONFIG.gameOverCheckInterval)

	console.log('Game Over checking started for', isEndlessMode.value ? 'Endless Mode' : 'Normal Level')
}

const stopGameOverChecking = () => {
	if (gameOverTimer.value) {
		clearInterval(gameOverTimer.value)
		gameOverTimer.value = null
	}
}

const updateFruitDangerStatus = () => {
	const currentTime = Date.now()

	fruits.value.forEach(fruit => {
		if (!fruit.body) return

		const inDangerZone = fruit.body.position.y <= gameOverHeight.value

		if (inDangerZone) {
			if (!fruit.inDanger) {
				fruit.dangerZoneStartTime = currentTime
				fruit.dangerZoneTime = 0
			} else {
				fruit.dangerZoneTime = currentTime - fruit.dangerZoneStartTime
			}
			fruit.inDanger = true
		} else {
			fruit.inDanger = false
			fruit.dangerZoneStartTime = null
			fruit.dangerZoneTime = 0
		}
	})
}

const calculateCurrentStars = () => {
	if (isEndlessMode.value) {
		const thresholds = currentLevelConfig.value.starThresholds
		if (!thresholds) return 0

		// Check for 3 stars first (most demanding)
		if (score.value >= thresholds[3].score || totalMerges.value >= thresholds[3].merges) {
			return 3
		}

		// Check for 2 stars
		if (score.value >= thresholds[2].score || totalMerges.value >= thresholds[2].merges) {
			return 2
		}

		// Check for 1 star
		if (score.value >= thresholds[1].score || totalMerges.value >= thresholds[1].merges) {
			return 1
		}

		return 0
	} else {
		if (!isLevelComplete.value) return 0
		return calculateLevelStars(
				{ score: score.value, moves: moves.value, completed: true },
				currentLevelConfig.value
		)
	}
}

const nextLevel = () => {
	if (currentLevel.value < Object.keys(FRUIT_MERGE_LEVELS).length) {
		currentLevel.value++
		startLevel(currentLevel.value)
		router.push(`/games/fruitmerge/${currentLevel.value}`)
	} else {
		backToGaming()
	}
}

const startLevel = (level) => {
	currentLevel.value = level
	resetGame()
}

const resetGame = () => {
	cleanup()
	comboSystem.resetCombo()
	isPhysicsPaused.value = false
	initGame()
	gameState.value = 'playing'
	score.value = 0
	moves.value = 0
	nextFruitId.value = 0
	nextNextFruit.value = null
	particles.value = []
	scorePoints.value = []
	levelReward.value = null
	showNextFruit.value = true
	hasSavedState.value = false
	cancelHammerSelection()
	hammerMode.value = false
	selectedFruitForHammer.value = null
	isUsingHammer.value = false
	isHammerCountdownActive.value = false
	enableScreenshotCapture.value = false
	currentGameScreenshotData.value = null

	// Reset mold fruit state
	if (moldFruitTimer.value) {
		clearInterval(moldFruitTimer.value)
		moldFruitTimer.value = null
	}
	if (moldFruitSpawnTimer.value) {
		clearInterval(moldFruitSpawnTimer.value)
		moldFruitSpawnTimer.value = null
	}
	currentMoldFruit.value = null
	moldFruitLifeRemaining.value = 0
	moldFruitWarningActive.value = false
	lastMoldSpawnTime.value = 0

	if (isEndlessMode.value) {
		totalMerges.value = 0
		sessionTime.value = 0
		milestones.value = []
		stopSessionTimer()
		startSessionTimer()
	}
}

const handleTryAgain = () => {
	resetGame()
	gameState.value = 'playing'
}

const handleMenuSaveGame = () => {
	if (gameState.value === 'playing' && !isRestoringState.value) {
		const currentState = captureCurrentState()
		if (currentState) {
			saveLevelState('fruitMerge', currentLevel.value, currentState)
		}
	}
}

const handleBuyHammerClick = () => {
	if (!hammerItem.value) return

	if (!canAffordHammer.value) {
		modalType.value = 'insufficient'
	} else {
		modalType.value = 'purchase'
	}

	showShopModal.value = true
}

const handleHammerPurchaseConfirm = async () => {
	if (!hammerItem.value || modalType.value !== 'purchase') {
		closeShopModal()
		return
	}

	buyItem(hammerItem.value)

	setTimeout(() => {
		const newQuantity = gameData.player.inventory.items?.hammer_powerup?.quantity || 0
		hammerRemaining.value = newQuantity
		console.log(`🔨 Purchase hammer count: ${newQuantity}`)
		closeShopModal()

		// Auto-activate hammer mode after successful purchase
		if (newQuantity > 0 && isEndlessMode.value) {
			activateHammerMode()
			console.log('🔨 Hammer mode auto-activated after purchase')
		}
	}, 200)
}

const handleShopModalCancel = () => {
	closeShopModal()
}

const handleSaveScreenshot = async (screenshotMetadata) => {
	if (!currentGameScreenshotData.value) {
		console.warn('No screenshot data available')
		return
	}

	try {
		const success = await saveGameScreenshot('fruitMerge', currentGameScreenshotData.value)

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

const closeShopModal = () => {
	showShopModal.value = false
	modalType.value = 'purchase'
}

const backToGaming = () => {
	router.push('/games/fruitmerge');
}

const gameOver = () => {
	pausePhysics()
	stopAllFruits()
	stopGameOverChecking()
	comboSystem.cleanup()
	clearLevelState('fruitMerge', currentLevel.value)

	console.log('Game Over! Fruits reached the danger zone.')

	if (isEndlessMode.value) {
		// Endlos-Modus: Game Over wird zu Game Complete behandelt
		gameState.value = 'completed'

		// Prepare screenshot data
		currentGameScreenshotData.value = captureScreenshotData()
		enableScreenshotCapture.value = true

		// Calculate level rewards für Endlos-Modus
		const rewardCalculation = calculateLevelReward()
		levelReward.value = rewardCalculation

		// Check for achievements and track new ones
		const achievementsBefore = [...gameData.achievements]
		checkGameLevelAchievements('fruitMerge', currentLevel.value)
		checkAutoAchievements()
		const achievementsAfter = [...gameData.achievements]

		// Find newly earned achievements
		earnedAchievements.value = achievementsAfter.filter(after =>
				!achievementsBefore.some(before => before.id === after.id && before.earned)
		)

		// Add achievement rewards to breakdown
		const achievementBreakdown = earnedAchievements.value.map(achievement => ({
			type: 'achievement',
			source: t('rewards.breakdown.achievement_reward', { name: achievement.name }),
			coins: achievement.rewards.coins,
			diamonds: achievement.rewards.diamonds,
			icon: achievement.icon,
			style: 'achievement'
		}))

		// Create final breakdown with all rewards
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

		// Add currency rewards to player
		if (rewardBreakdown.value.total.coins > 0 || rewardBreakdown.value.total.diamonds > 0) {
			gameData.player.coins = (gameData.player.coins || 0) + rewardBreakdown.value.total.coins
			gameData.player.diamonds = (gameData.player.diamonds || 0) + rewardBreakdown.value.total.diamonds
		}

		// Update endless mode session stats
		updateEndlessStats()

		console.log('Endless session completed! Showing results...')
	} else {
		// Normale Level: Normales Game Over
		gameState.value = 'gameOver'
	}

	const gameStats = {
		gamesPlayed: gameData.games.fruitMerge.gamesPlayed + 1,
		totalScore: gameData.games.fruitMerge.totalScore + score.value,
		highScore: Math.max(gameData.games.fruitMerge.highScore, score.value),
		stars: Math.max(gameData.games.fruitMerge.stars, calculateCurrentStars()),
	}

	updateGameStats('fruitMerge', gameStats)
	addScore(score.value)
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

	// Update level statistics für Endlos-Modus
	updateLevelStats('fruitMerge', currentLevel.value, levelResult)

	// Update overall game statistics mit Endlos-spezifischen Daten
	const gameStats = {
		gamesPlayed: gameData.games.fruitMerge.gamesPlayed + 1,
		totalScore: gameData.games.fruitMerge.totalScore + score.value,
		highScore: Math.max(gameData.games.fruitMerge.highScore, score.value),
		starsEarned: gameData.games.fruitMerge.starsEarned + calculateCurrentStars(),
		totalMerges: (gameData.games.fruitMerge.totalMerges || 0) + totalMerges.value,
		maxCombo: Math.max(
				gameData.games.fruitMerge.maxCombo || 0,
				comboSystem.comboCount.value
		)
	}

	updateGameStats('fruitMerge', gameStats)

	emit('game-complete', {
		level: currentLevel.value,
		score: score.value,
		time: sessionTime.value,
		moves: moves.value,
		merges: totalMerges.value,
		coins: levelReward.value?.coins || 0,
		diamonds: levelReward.value?.diamonds || 0,
		completed: true,
		isEndless: true
	})
}

const captureCurrentState = () => {
	if (gameState.value !== 'playing') return null

	const currentState = {
		// Existing game progress...
		score: score.value,
		moves: moves.value,
		timeElapsed: sessionTime.value,
		totalMerges: totalMerges.value,
		sessionTime: sessionTime.value,
		milestones: [...milestones.value],

		// Existing combo system state...
		comboData: {
			count: comboSystem.comboCount.value,
			level: comboSystem.comboLevel.value,
			multiplier: comboSystem.comboMultiplier.value,
			isActive: comboSystem.isComboActive.value,
			timeRemaining: comboSystem.timeRemaining.value
		},

		// Enhanced fruits state with complete mold and bomb support
		fruitsState: fruits.value.map(fruit => ({
			id: fruit.id,
			type: fruit.type,
			color: fruit.color,
			size: fruit.size,
			level: fruit.level,
			name: fruit.name,
			svg: fruit.svg,
			x: fruit.x,
			y: fruit.y,
			rotation: fruit.rotation,
			merging: fruit.merging,
			inDanger: fruit.inDanger,
			dangerZoneTime: fruit.dangerZoneTime,

			// Bomb fruit specific data
			isBomb: fruit.isBomb || false,
			fuseTime: fruit.fuseTime || null,
			spawnedAt: fruit.spawnedAt || null,

			// Mold fruit specific data
			isMold: fruit.isMold || false,
			lifespan: fruit.lifespan || null,

			// Physics body state
			bodyPosition: fruit.body ? {
				x: fruit.body.position.x,
				y: fruit.body.position.y
			} : null,
			bodyVelocity: fruit.body ? {
				x: fruit.body.velocity.x,
				y: fruit.body.velocity.y
			} : null,
			bodyAngle: fruit.body ? fruit.body.angle : 0,
			bodyAngularVelocity: fruit.body ? fruit.body.angularVelocity : 0
		})),

		// Comprehensive Mold Fruit System State
		moldFruitState: {
			hasMoldFruit: hasMoldFruit.value,
			currentMoldFruitId: currentMoldFruit.value ? currentMoldFruit.value.id : null,
			moldFruitWarningActive: moldFruitWarningActive.value,
			lastMoldSpawnTime: lastMoldSpawnTime.value,

			// Calculate precise remaining time for mold fruit
			moldFruitRemainingTime: currentMoldFruit.value && currentMoldFruit.value.spawnedAt ?
					Math.max(0, (currentMoldFruit.value.spawnedAt + MOLD_FRUIT_CONFIG.lifespan) - Date.now()) : 0
		},

		// Comprehensive Bomb Fruit System State
		bombFruitState: {
			hasBombFruit: hasBombFruit.value,
			currentBombFruitId: currentBombFruit.value ? currentBombFruit.value.id : null,
			bombTickingActive: bombTickingActive.value,
			lastBombSpawnTime: lastBombSpawnTime.value,

			// Calculate precise remaining fuse time for bomb fruit
			bombFuseRemainingTime: currentBombFruit.value && currentBombFruit.value.spawnedAt ?
					Math.max(0, (currentBombFruit.value.spawnedAt + BOMB_FRUIT_CONFIG.fuseTime) - Date.now()) : 0
		},

		// Existing next fruit and game settings...
		nextFruitState: nextFruit.value ? {
			id: nextFruit.value.id,
			type: nextFruit.value.type,
			color: nextFruit.value.color,
			size: nextFruit.value.size,
			level: nextFruit.value.level,
			name: nextFruit.value.name,
			svg: nextFruit.value.svg,
			isBomb: nextFruit.value.isBomb || false,
			isMold: nextFruit.value.isMold || false
		} : null,

		nextNextFruitState: nextNextFruit.value ? {
			id: nextNextFruit.value.id,
			type: nextNextFruit.value.type,
			color: nextNextFruit.value.color,
			size: nextNextFruit.value.size,
			level: nextNextFruit.value.level,
			name: nextNextFruit.value.name,
			svg: nextNextFruit.value.svg,
			isBomb: nextNextFruit.value.isBomb || false,
			isMold: nextNextFruit.value.isMold || false
		} : null,

		nextFruitId: nextFruitId.value,
		gameStateValue: gameState.value,
		savedAt: new Date().toISOString(),
		version: '1.2' // Updated version for enhanced mold/bomb support
	}

	console.log('💾 Capturing enhanced game state:', {
		hasMoldFruit: currentState.moldFruitState.hasMoldFruit,
		moldFruitId: currentState.moldFruitState.currentMoldFruitId,
		moldTimeRemaining: Math.floor(currentState.moldFruitState.moldFruitRemainingTime / 1000),
		hasBombFruit: currentState.bombFruitState.hasBombFruit,
		bombFruitId: currentState.bombFruitState.currentBombFruitId,
		bombTimeRemaining: Math.floor(currentState.bombFruitState.bombFuseRemainingTime / 1000)
	})

	return currentState
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
		score: score.value,
		moves: moves.value,
		timeElapsed: isEndlessMode.value ? sessionTime.value : 0,
		starsEarned: calculateCurrentStars(),

		// Fruit positions and data
		fruits: fruits.value.map(fruit => ({
			id: fruit.id,
			type: fruit.type,
			x: fruit.x,
			y: fruit.y,
			size: fruit.size,
			svg: fruit.svg,
			color: fruit.color,
			rotation: fruit.rotation,
			level: fruit.level
		})),

		// Board configuration
		boardConfig: {
			width: boardConfig.value.width,
			height: boardConfig.value.height
		},

		// Game mode
		isEndless: isEndlessMode.value,
		gameMode: isEndlessMode.value ? 'endless' : 'level',

		// Metadata
		capturedAt: new Date().toISOString(),
		gameTitle: t('fruitMerge.title')
	}

	return screenshotData
}

const restoreGameState = async (savedState) => {
	if (!savedState || !['1.0', '1.1', '1.2'].includes(savedState.version)) {
		console.warn('Invalid or incompatible saved state version:', savedState.version)
		return false
	}

	try {
		console.log('🔄 Restoring enhanced game state with mold/bomb support...', savedState)
		isRestoringState.value = true

		// Stop current game
		cleanup()

		// Restore basic game data
		score.value = savedState.score || 0
		moves.value = savedState.moves || 0
		sessionTime.value = savedState.timeElapsed || savedState.sessionTime || 0
		nextFruitId.value = savedState.nextFruitId || 0
		gameState.value = savedState.gameStateValue || 'playing'

		// Restore endless mode specific data
		if (isEndlessMode.value) {
			totalMerges.value = savedState.totalMerges || 0
			milestones.value = [...(savedState.milestones || [])]
		}

		// Initialize physics
		await nextTick()
		initPhysics()
		await new Promise(resolve => setTimeout(resolve, 100))

		// Restore combo system
		if (savedState.comboData) {
			comboSystem.comboCount.value = savedState.comboData.count || 0
			comboSystem.comboMultiplier.value = savedState.comboData.multiplier || 1
			comboSystem.isComboActive.value = savedState.comboData.isActive || false
			comboSystem.timeRemaining.value = savedState.comboData.timeRemaining || 0
		}

		// Clear existing special fruit references
		currentMoldFruit.value = null
		currentBombFruit.value = null
		moldFruitLifeRemaining.value = 0
		bombFuseRemaining.value = 0
		moldFruitWarningActive.value = false
		bombTickingActive.value = false

		// Restore fruits with enhanced mold/bomb support
		if (savedState.fruitsState && savedState.fruitsState.length > 0) {
			fruits.value = []

			for (let i = 0; i < savedState.fruitsState.length; i++) {
				const fruitState = savedState.fruitsState[i]

				const restoredFruit = {
					id: fruitState.id,
					type: fruitState.type,
					color: fruitState.color,
					size: fruitState.size,
					level: fruitState.level,
					name: fruitState.name,
					svg: fruitState.svg,
					x: fruitState.x,
					y: fruitState.y,
					rotation: fruitState.rotation,
					body: null,
					merging: fruitState.merging || false,
					inDanger: fruitState.inDanger || false,
					dangerZoneStartTime: null,
					dangerZoneTime: fruitState.dangerZoneTime || 0,

					// Restore bomb fruit properties
					isBomb: fruitState.isBomb || false,
					fuseTime: fruitState.fuseTime || null,
					spawnedAt: fruitState.spawnedAt || null,

					// Restore mold fruit properties
					isMold: fruitState.isMold || false,
					lifespan: fruitState.lifespan || null
				}

				// Create physics body with correct type and properties
				if (fruitState.bodyPosition) {
					let fruitConfig

					if (restoredFruit.isMold) {
						fruitConfig = FRUIT_TYPES.MOLD_FRUIT
					} else if (restoredFruit.isBomb) {
						fruitConfig = FRUIT_TYPES.BOMB_FRUIT
					} else {
						fruitConfig = Object.values(FRUIT_TYPES).find(f => f.index === fruitState.level)
					}

					const radius = fruitConfig ? fruitConfig.radius : fruitState.size / 2

					// Create appropriate label for special fruits
					let label = `fruit-${fruitState.id}-${fruitState.color}-${fruitState.level}`
					if (restoredFruit.isMold) {
						label += '-mold'
					} else if (restoredFruit.isBomb) {
						label += '-bomb'
					}

					const body = Matter.Bodies.circle(
							fruitState.bodyPosition.x,
							fruitState.bodyPosition.y,
							radius,
							{
								restitution: restoredFruit.isMold ? 0.4 : (restoredFruit.isBomb ? 0.3 : 0.3),
								friction: restoredFruit.isMold ? 0.06 : 0.05,
								frictionAir: 0.005,
								density: restoredFruit.isMold ? 0.002 : (restoredFruit.isBomb ? 0.001 : 0.001),
								label: label,
								render: {
									sprite: {
										xScale: 1,
										yScale: 1
									}
								}
							}
					)

					// Restore physics properties with dampening
					setTimeout(() => {
						if (fruitState.bodyVelocity) {
							const dampedVelocity = {
								x: fruitState.bodyVelocity.x * 0.3,
								y: fruitState.bodyVelocity.y * 0.3
							}
							Matter.Body.setVelocity(body, dampedVelocity)
						}
						if (fruitState.bodyAngle) {
							Matter.Body.setAngle(body, fruitState.bodyAngle)
						}
						if (fruitState.bodyAngularVelocity) {
							Matter.Body.setAngularVelocity(body, fruitState.bodyAngularVelocity * 0.3)
						}
					}, 50 * i)

					restoredFruit.body = body
					Matter.Composite.add(engine.world, body)

					// Update visual position
					restoredFruit.x = fruitState.bodyPosition.x - fruitState.size / 2
					restoredFruit.y = fruitState.bodyPosition.y - fruitState.size / 2
				}

				fruits.value.push(restoredFruit)
			}
		}

		// Restore Bomb Fruit System State (Enhanced for v1.2)
		if (savedState.bombFruitState && savedState.version === '1.2') {
			const bombState = savedState.bombFruitState

			// Restore bomb fruit references and timers
			lastBombSpawnTime.value = bombState.lastBombSpawnTime || 0

			if (bombState.hasBombFruit && bombState.currentBombFruitId) {
				// Find the restored bomb fruit
				const bombFruit = fruits.value.find(f =>
						f.id === bombState.currentBombFruitId && f.isBomb
				)

				if (bombFruit && bombState.bombFuseRemainingTime > 0) {
					currentBombFruit.value = bombFruit
					bombFuseRemaining.value = bombState.bombFuseRemainingTime
					bombTickingActive.value = bombState.bombTickingActive || false

					// Restart bomb fuse timer with remaining time
					restartBombFuseTimer(bombFruit, bombState.bombFuseRemainingTime)

					console.log('💣 Bomb Fruit restored with', Math.floor(bombState.bombFuseRemainingTime / 1000), 'seconds remaining')
				} else {
					console.log('💥 Bomb Fruit expired during save/restore')
				}
			}
		}

		// Restore Mold Fruit System State (Enhanced for v1.2)
		if (savedState.moldFruitState && ['1.1', '1.2'].includes(savedState.version)) {
			const moldState = savedState.moldFruitState

			// Restore mold fruit references
			lastMoldSpawnTime.value = moldState.lastMoldSpawnTime || 0

			if (moldState.hasMoldFruit && moldState.currentMoldFruitId) {
				// Find the restored mold fruit
				const moldFruit = fruits.value.find(f =>
						f.id === moldState.currentMoldFruitId && f.isMold
				)

				if (moldFruit && moldState.moldFruitRemainingTime > 0) {
					currentMoldFruit.value = moldFruit
					moldFruitLifeRemaining.value = moldState.moldFruitRemainingTime
					moldFruitWarningActive.value = moldState.moldFruitWarningActive || false

					// Restart mold fruit lifecycle with remaining time
					restartMoldFruitLifecycle(moldFruit, moldState.moldFruitRemainingTime)

					console.log('🟫 Mold Fruit restored with', Math.floor(moldState.moldFruitRemainingTime / 1000), 'seconds remaining')
				} else {
					console.log('🟫 Mold Fruit expired during save/restore')
				}
			}
		}

		// Restore next fruits with special fruit support
		if (savedState.nextFruitState) {
			nextFruit.value = {
				...savedState.nextFruitState,
				isBomb: savedState.nextFruitState.isBomb || false,
				isMold: savedState.nextFruitState.isMold || false
			}
		} else {
			nextFruit.value = generateNextFruit()
		}

		// Restore next next fruit preview with special fruit support
		if (savedState.nextNextFruitState) {
			nextNextFruit.value = {
				...savedState.nextNextFruitState,
				isBomb: savedState.nextNextFruitState.isBomb || false,
				isMold: savedState.nextNextFruitState.isMold || false
			}
		} else {
			updateNextFruitPreview()
		}

		// Start timers and game loop after everything is restored
		setTimeout(() => {
			if (isEndlessMode.value) {
				startSessionTimer()
			}
			startGameOverChecking()
			gameLoop()
		}, 200)

		console.log(`✅ Enhanced game state restored successfully. Score: ${score.value}, Mold: ${currentMoldFruit.value ? 'Active' : 'None'}, Bomb: ${currentBombFruit.value ? 'Active' : 'None'}`)
		return true

	} catch (error) {
		console.error('Error restoring enhanced game state:', error)
		resetGame()
		return false
	} finally {
		isRestoringState.value = false
	}
}

const restartBombFuseTimer = (bombFruit, remainingTime) => {
	currentBombFruit.value = bombFruit
	bombFuseRemaining.value = remainingTime

	// Determine if should start in ticking phase
	if (remainingTime <= 3000) {
		bombTickingActive.value = true
	}

	console.log('💣 Restarting bomb fuse timer with', Math.floor(remainingTime / 1000), 'seconds remaining')

	bombFruitTimer.value = setInterval(() => {
		bombFuseRemaining.value -= 100

		// Start danger ticking in last 3 seconds
		if (bombFuseRemaining.value <= 3000 && !bombTickingActive.value) {
			bombTickingActive.value = true
			console.log('💣 Restored bomb entering danger phase!')
		}

		// Explode when fuse runs out
		if (bombFuseRemaining.value <= 0) {
			explodeBomb(bombFruit)
		}
	}, 100) // Update every 100ms for smooth countdown
}

const getMilestoneText = (milestone) => {
	const [type, value] = milestone.split('_')
	const achievement = ACHIEVEMENTS.definitions.find(a => a.id === milestone)
	if (achievement) {
		return t(`achievements.definitions.${achievement.id}.name`)
	}

	switch (type) {
		case 'score':
			return t('fruitMerge.endless.milestone_score', { score: value })
		case 'time':
			const minutes = Math.floor(parseInt(value) / 60)
			return t('fruitMerge.endless.milestone_time', { minutes })
		case 'combo':
			return t('fruitMerge.endless.milestone_combo', { combo: value })
		default:
			return milestone
	}
}

const checkEndlessAchievements = () => {
	if (!isEndlessMode.value) return

	const achievementsBefore = [...gameData.achievements]

	// Score-basierte Achievements
	const scoreThresholds = [2000, 5000, 15000, 35000]
	scoreThresholds.forEach(threshold => {
		if (score.value >= threshold) {
			checkSpecificAchievement(`score_${threshold}`)
		}
	})

	// Zeit-basierte Achievements
	const timeThresholds = [10, 300, 600, 1200, 1800]
	timeThresholds.forEach(threshold => {
		if (sessionTime.value >= threshold) {
			checkSpecificAchievement(`time_${threshold}`)
		}
	})

	// Stern-basierte Achievements
	const currentStars = calculateCurrentStars()
	if (currentStars >= 1 && !hasAchievement('endless_bronze')) {
		checkSpecificAchievement('endless_bronze')
	}
	if (currentStars >= 2 && !hasAchievement('endless_silver')) {
		checkSpecificAchievement('endless_silver')
	}
	if (currentStars >= 3 && !hasAchievement('endless_gold')) {
		checkSpecificAchievement('endless_gold')
	}

	// Check if new achievements were earned
	const achievementsAfter = [...gameData.achievements]
	const newAchievements = achievementsAfter.filter(after =>
			!achievementsBefore.some(before => before.id === after.id && before.earned)
	)

	// Add new achievements to current session
	if (newAchievements.length > 0) {
		earnedAchievements.value.push(...newAchievements)
		console.log(`🏆 ${newAchievements.length} new achievements unlocked!`)
	}
}

const checkSpecificAchievement = (achievementId) => {
	if (hasAchievement(achievementId)) return

	const achievement = ACHIEVEMENTS.definitions.find(a => a.id === achievementId)
	if (achievement) {
		const wasAdded = addAchievement(achievement)
		if (wasAdded) {
			console.log(`🎉 Endless achievement unlocked: ${achievement.name}`)

			// Add to milestones for visual feedback
			if (!milestones.value.includes(`${achievementId}`)) {
				milestones.value.push(`${achievementId}`)
			}
		}
	}
}

const handleMenuClick = () => {
	emit('menu-click')
}


const hasMoldFruit = computed(() => {
	return fruits.value.some(fruit => fruit.isMold)
})

// Mold Fruit Spawn Logic
const shouldSpawnMoldFruit = () => {
	if (!isEndlessMode.value) return false
	if (hasMoldFruit.value) return false

	const now = Date.now()
	const timeSinceLastSpawn = now - lastMoldSpawnTime.value

	// Ensure minimum delay between spawns
	if (timeSinceLastSpawn < MOLD_FRUIT_CONFIG.minSpawnDelay) return false

	// Random chance with increasing probability over time
	const baseChance = MOLD_FRUIT_CONFIG.spawnChance
	const timeMultiplier = Math.min(2, timeSinceLastSpawn / MOLD_FRUIT_CONFIG.maxSpawnDelay)
	const adjustedChance = baseChance * timeMultiplier

	return Math.random() < adjustedChance
}


const createMoldSpawnEffect = (x, y) => {
	const particleCount = MOLD_FRUIT_CONFIG.spawnEffect.particles

	for (let i = 0; i < particleCount; i++) {
		const angle = (i / particleCount) * Math.PI * 2
		const distance = 30 + Math.random() * 20
		const particleX = Math.cos(angle) * distance
		const particleY = Math.sin(angle) * distance

		const particle = {
			id: `mold-spawn-${Date.now()}-${i}`,
			x: x,
			y: y,
			targetX: particleX,
			targetY: particleY,
			type: 'mold_spawn',
			backgroundColor: MOLD_FRUIT_CONFIG.spawnEffect.color,
			duration: MOLD_FRUIT_CONFIG.spawnEffect.duration,
			size: 3 + Math.random() * 3
		}

		particles.value.push(particle)

		setTimeout(() => {
			particles.value = particles.value.filter(p => p.id !== particle.id)
		}, MOLD_FRUIT_CONFIG.spawnEffect.duration)
	}
}

const restartMoldFruitLifecycle = (moldFruit, remainingTime) => {
	moldFruitLifeRemaining.value = remainingTime

	moldFruitTimer.value = setInterval(() => {
		moldFruitLifeRemaining.value -= 100

		// Start warning flash in last minute
		if (moldFruitLifeRemaining.value <= MOLD_FRUIT_CONFIG.warningFlashTime) {
			moldFruitWarningActive.value = true
		}

		// Remove mold fruit when lifespan expires
		if (moldFruitLifeRemaining.value <= 0) {
			removeMoldFruit(moldFruit, 'expired')
		}
	}, 100)

	console.log('🔄 Mold Fruit circular timer restarted with', Math.floor(remainingTime / 1000), 'seconds remaining')
}

const startMoldFruitLifecycle = (moldFruit) => {
	moldFruitLifeRemaining.value = MOLD_FRUIT_CONFIG.lifespan

	console.log('🟫 Starting mold fruit lifecycle with circular timer:', {
		fruitId: moldFruit.id,
		lifespan: MOLD_FRUIT_CONFIG.lifespan / 1000,
		spawnedAt: new Date(moldFruit.spawnedAt).toLocaleTimeString()
	})

	moldFruitTimer.value = setInterval(() => {
		moldFruitLifeRemaining.value -= 100

		// Start warning flash in last minute
		if (moldFruitLifeRemaining.value <= MOLD_FRUIT_CONFIG.warningFlashTime) {
			if (!moldFruitWarningActive.value) {
				moldFruitWarningActive.value = true
				console.log('⚠️ Mold fruit entering warning phase!')
			}
		}

		// Remove mold fruit when lifespan expires
		if (moldFruitLifeRemaining.value <= 0) {
			removeMoldFruit(moldFruit, 'expired')
		}
	}, 100) // Keep 100ms for smooth circular progress
}

const removeMoldFruit = (moldFruit, reason = 'removed') => {
	if (!moldFruit || !moldFruit.body) return

	const centerX = moldFruit.body.position.x
	const centerY = moldFruit.body.position.y

	// Create disappear effect
	createMoldDisappearEffect(centerX, centerY, reason)

	// Remove from physics world
	Matter.Composite.remove(engine.world, moldFruit.body)

	// Remove from fruits array
	fruits.value = fruits.value.filter(f => f.id !== moldFruit.id)

	// Clear timers and reset state
	if (moldFruitTimer.value) {
		clearInterval(moldFruitTimer.value)
		moldFruitTimer.value = null
	}

	currentMoldFruit.value = null
	moldFruitLifeRemaining.value = 0
	moldFruitWarningActive.value = false
	syncBodies();

	const reasonText = reason === 'expired' ? 'disappeared' : 'removed'
	console.log(`🟫 Mold Fruit ${reasonText}!`)
}

const createMoldDisappearEffect = (x, y, reason) => {
	const particleCount = MOLD_FRUIT_CONFIG.disappearEffect.particles
	const effectColor = reason === 'expired' ? '#4CAF50' : '#FF5722'

	for (let i = 0; i < particleCount; i++) {
		const angle = (i / particleCount) * Math.PI * 2
		const distance = 40 + Math.random() * 30
		const particleX = Math.cos(angle) * distance
		const particleY = Math.sin(angle) * distance

		const particle = {
			id: `mold-disappear-${Date.now()}-${i}`,
			x: x,
			y: y,
			targetX: particleX,
			targetY: particleY,
			type: 'mold_disappear',
			backgroundColor: effectColor,
			duration: MOLD_FRUIT_CONFIG.disappearEffect.duration,
			size: 4 + Math.random() * 4
		}

		particles.value.push(particle)

		setTimeout(() => {
			particles.value = particles.value.filter(p => p.id !== particle.id)
		}, MOLD_FRUIT_CONFIG.disappearEffect.duration)
	}
}

const shouldShowTimer = (fruit) => {
	if (fruit.isBomb && currentBombFruit.value && currentBombFruit.value.id === fruit.id) {
		return true
	}
	if (fruit.isMold && currentMoldFruit.value && currentMoldFruit.value.id === fruit.id) {
		return true
	}
	return false
}

const getTimerClasses = (fruit) => {
	return {
		'fruit-timer-circle--mold': fruit.isMold,
		'fruit-timer-circle--bomb': fruit.isBomb,
		'fruit-timer-circle--warning': fruit.isMold && moldFruitWarningActive.value,
		'fruit-timer-circle--ticking': fruit.isBomb && bombTickingActive.value
	}
}

const shouldShowCountdown = (fruit) => {
	if (fruit.isBomb && bombTickingActive.value) {
		return true
	}
	if (fruit.isMold && moldFruitWarningActive.value) {
		return true
	}
	return false
}

const getCountdownClasses = (fruit) => {
	return {
		'timer-countdown-indicator--mold': fruit.isMold,
		'timer-countdown-indicator--bomb': fruit.isBomb
	}
}

const getCountdownStyles = (fruit) => {
	const size = fruit.isBomb ? 24 : 20
	const fontSize = Math.max(fruit.isBomb ? 10 : 8, fruit.size * 0.15)
	const offset = fruit.isBomb ? -8 : -6

	return {
		fontSize: `${fontSize}px`,
		top: `${offset}px`,
		right: `${offset}px`,
		width: `${size}px`,
		height: `${size}px`
	}
}

const getCountdownValue = (fruit) => {
	if (fruit.isBomb) {
		return Math.ceil(bombFuseRemaining.value / 1000)
	}
	if (fruit.isMold) {
		return Math.ceil(moldFruitLifeRemaining.value / 1000)
	}
	return 0
}

const getTimerProgress = (fruit) => {
	if (fruit.isBomb) {
		return (bombFuseRemaining.value / BOMB_FRUIT_CONFIG.fuseTime) * 100
	}
	if (fruit.isMold) {
		return (moldFruitLifeRemaining.value / MOLD_FRUIT_CONFIG.lifespan) * 100
	}
	return 0
}

const getTimerBackgroundColor = (fruit) => {
	if (fruit.isBomb) {
		return 'rgba(255, 68, 68, 0.3)'
	}
	if (fruit.isMold) {
		return 'rgba(76, 175, 80, 0.3)'
	}
	return 'rgba(255, 255, 255, 0.3)'
}

const getTimerProgressColor = (fruit) => {
	if (fruit.isBomb) {
		return bombTickingActive.value ? '#FF0000' : '#FF4444'
	}
	if (fruit.isMold) {
		return moldFruitWarningActive.value ? '#FF5722' : '#4CAF50'
	}
	return '#4CAF50'
}


// Watchers
watch(() => props.level, (newLevel) => {
	currentLevel.value = newLevel
})

// Watch for level completion
watch(isLevelComplete, (newValue) => {
	if (newValue && gameState.value === 'playing') {
		setTimeout(() => {
			completeLevel()
		}, PHYSICS_CONFIG.showCompletionDelay)
	}
})

// Lifecycle
onMounted(() => {
	initGame()
})

onUnmounted(() => {
	cleanup()
	comboSystem.cleanup()
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
	<main class="fruit-merge-game">
		<!-- Game Header -->
		<div class="game-header">
			<div class="game-info">
				<h2 class="game-title">{{ t('fruitMerge.title') }}</h2>
				<div class="level-indicator" :class="{ 'level-indicator--endless': isEndlessMode }">
					{{ isEndlessMode ? t('fruitMerge.endless_mode') : t('fruitMerge.level_title', { level: currentLevel }) }}
				</div>
			</div>

			<div class="game-stats-container">
				<div class="next-next-fruit-preview">
					<div class="preview-label">{{ t('fruitMerge.next_fruit') }}</div>
					<div
						v-if="nextNextFruit && showNextFruit"
						class="next-next-fruit"
						:style="{
							width: `${nextNextFruit.size * 0.6}px`,
							height: `${nextNextFruit.size * 0.6}px`
						}"
					>
						<div class="fruit-svg" v-html="nextNextFruit.svg"></div>
					</div>
				</div>

				<div v-if="!isEndlessMode" class="goal-fruit-display">
					<div class="goal-label">
						{{ t('fruitMerge.target') }}
						<div class="goal-progress">
							{{ gameProgress.completed }}/{{ gameProgress.total }}
						</div>
					</div>
					<div
						class="goal-fruit"
						:class="{ 'goal-fruit--completed': isLevelComplete }"
					>
						<div
							class="goal-fruit-svg"
							v-html="getTargetFruitSvg()"
						></div>
					</div>
				</div>

				<!-- Game Performance Stats -->
				<PerformanceStats
					:score="score"
					:time-elapsed="isEndlessMode ? sessionTime : 0"
					:moves="moves"
					:matches="fruits.length"
					:total-pairs="fruits.length"
					:combo-count="comboSystem.comboLevel.value"
					:combo-multiplier="comboSystem.comboMultiplier.value"
					:max-combo="gameData.games.fruitMerge.maxCombo || 0"
					:combo-time-remaining="comboSystem.timeRemaining.value"
					:combo-time-max="comboSystem.config.comboTimeout"
					:is-combo-active="comboSystem.isComboActive.value"
					layout="horizontal"
					theme="card"
					size="normal"
					:show-score="true"
					:show-time="isEndlessMode"
					:show-moves="false"
					:show-matches="false"
					:show-combo="true"
					:score-label="t('stats.score')"
					:time-label="t('stats.time')"
					:moves-label="t('stats.moves')"
					:combo-label="t('stats.combo')"
				/>
				<div v-if="isEndlessMode" class="hammer-control">
					<button
						v-if="hammerRemaining > 0"
						class="btn btn--small btn--circle hammer-btn"
						:class="{
							'btn--warning': !hammerMode,
							'btn--danger': hammerMode
						}"
						@click="hammerMode ? deactivateHammerMode() : activateHammerMode()"
						:title="hammerMode ? t('fruitMerge.deactivate_hammer') : t('fruitMerge.activate_hammer')"
					>
						<span class="hammer-icon">🔨</span>
						<span class="notification-badge">{{ hammerRemaining }}</span>
					</button>

					<button
							v-if="hammerRemaining === 0 && hammerItem"
							class="btn btn--small buy-hammer-btn"
							:class="{
							'btn--success': canAffordHammer,
							'btn--ghost': !canAffordHammer
						}"
							@click="handleBuyHammerClick"
							:title="t('fruitMerge.no_hammers')"
					>
						<span class="hammer-icon">🔨</span>
						<div class="hammer-price">
							<span v-if="hammerItem.price.coins > 0" class="price-coins">
								💰{{ hammerItem.price.coins }}
							</span>
							<span v-if="hammerItem.price.diamonds > 0" class="price-diamonds">
								💎{{ hammerItem.price.diamonds }}
							</span>
						</div>
					</button>
				</div>
			</div>
		</div>

		<!-- Game Board Container -->
		<div class="game-container">
			<!-- Next Fruit Preview -->
			<div
					ref="nextFruitContainer"
					class="next-fruit-preview"
					:class="{ 'next-fruit-preview--clickable': isEndlessMode }"
					@mousemove="handleMouseMove"
					@mouseenter="handleMouseEnter"
					@mouseleave="handleMouseLeave"
					@touchmove.passive="handleTouchMove"
					@touchstart.passive="handleTouchStart"
					@click="isEndlessMode ? openFruitSelector() : null"
			>
				<div
					v-if="nextFruit && showNextFruit"
					class="next-fruit"
					:class="{
			      'next-fruit--disabled': !canDropFruit,
			      'next-fruit--special': nextFruit.isBomb || nextFruit.isMold
			    }"
					:style="{
			      width: `${nextFruit.size}px`,
			      height: `${nextFruit.size}px`,
			      left: `${nextFruitPosition - nextFruit.size / 2}px`,
			      transform: 'translateY(-50%)',
			      opacity: canDropFruit ? 1 : 0
			    }"
				>
					<div class="fruit-svg" v-html="nextFruit.svg"></div>
					<div v-if="isEndlessMode" class="fruit-selection-hint">
						<Icon name="settings" size="12" />
					</div>
				</div>
			</div>

			<!-- Physics Game Board -->
			<div
				ref="gameBoard"
				class="game-board"
				:class="{ 'game-board--endless': isEndlessMode }"
				:style="{
			    width: `${boardConfig.width}px`,
			    height: `${boardConfig.height}px`
			  }"
				@click="handleBoardClick"
				@touchend.prevent="handleBoardClick"
				@mousemove="handleMouseMove"
				@mouseenter="handleMouseEnter"
				@mouseleave="handleMouseLeave"
				@touchmove.passive="handleTouchMove"
			>
				<div
					class="danger-zone"
					:class="{ 'danger-zone--endless': isEndlessMode }"
					:style="{
			      height: `${gameOverHeight}px`,
			      top: '0px'
			    }"
				></div>

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
				<!-- Drop indicator line -->
				<div
						v-if="canDropFruit"
						class="drop-line"
						:style="{
            left: `${nextFruitPosition}px`,
            height: `${boardConfig.height}px`
          }"
				></div>

				<!-- Fruits -->
				<div
					v-for="fruit in fruits"
					:key="fruit.id"
					class="fruit"
					:class="{
				    'fruit--combo': fruit.comboEffect,
				    'fruit--danger': fruit.inDanger,
				    'fruit--goal': fruit.name === currentLevelConfig.targetFruit && !isEndlessMode,
				    'fruit--hammer-target': hammerMode && !isUsingHammer && !fruit.merging && !isHammerCountdownActive,
				    'fruit--hammer-selected': selectedFruitForHammer === fruit.id && isHammerCountdownActive,
				    'fruit--hammer-countdown': selectedFruitForHammer === fruit.id && isHammerCountdownActive,
				    'fruit--destroying': selectedFruitForHammer === fruit.id && isUsingHammer,
				    'fruit--mold': fruit.isMold,
				    'fruit--mold-warning': fruit.isMold && moldFruitWarningActive,
				    'fruit--bomb': fruit.isBomb,
				    'fruit--bomb-ticking': fruit.isBomb && bombTickingActive,
				    'fruit--rainbow': fruit.isRainbow,
				    'fruit--rainbow-shimmer': fruit.isRainbow
				  }"
					:style="{
				    left: `${fruit.x}px`,
				    top: `${fruit.y}px`,
				    width: `${fruit.size}px`,
				    height: `${fruit.size}px`,
				    transform: `rotate(${fruit.rotation}deg)`,
				    zIndex: selectedFruitForHammer === fruit.id ? 15 : (fruit.isRainbow ? 12 : (fruit.inDanger ? 5 : (fruit.isMold ? 8 : (fruit.isBomb ? 10 : (hammerMode ? 10 : 1)))))
				  }"
					@click.stop="handleFruitClick(fruit)"
					@touchend.stop="handleFruitClick(fruit)"
				>
					<div class="fruit-svg" v-html="fruit.svg"></div>

					<!-- Enhanced Hammer Countdown Indicator -->
					<div
						v-if="selectedFruitForHammer === fruit.id && isHammerCountdownActive"
						class="hammer-countdown-overlay"
					>
						<!-- Countdown Circle Progress -->
						<svg class="hammer-countdown-svg" :width="fruit.size" :height="fruit.size">
							<!-- Background ring -->
							<circle
								:cx="fruit.size / 2"
								:cy="fruit.size / 2"
								:r="(fruit.size / 2) - 4"
								fill="none"
								stroke="rgba(239, 68, 68, 0.3)"
								stroke-width="6"
							/>
							<!-- Progress ring -->
							<circle
								:cx="fruit.size / 2"
								:cy="fruit.size / 2"
								:r="(fruit.size / 2) - 4"
								fill="none"
								stroke="#EF4444"
								stroke-width="6"
								stroke-linecap="round"
								class="hammer-countdown-progress"
								:style="{
				          '--progress': (hammerCountdownTime / hammerCountdownDuration) * 100,
				          '--radius': (fruit.size / 2) - 4,
				          '--circumference': 2 * Math.PI * ((fruit.size / 2) - 4)
				        }"
							/>
						</svg>

						<!-- Countdown Number -->
						<div class="hammer-countdown-number">
							{{ Math.ceil(hammerCountdownTime / 1000) }}
						</div>

						<!-- Hammer Icon -->
						<div class="hammer-countdown-icon">🔨</div>
					</div>

					<!-- Unified Timer Circle for both Bomb and Mold -->
					<div
						v-if="shouldShowTimer(fruit)"
						class="fruit-timer-circle"
						:class="getTimerClasses(fruit)"
					>
						<!-- SVG positioned exactly on fruit border -->
						<svg class="timer-svg" :width="fruit.size" :height="fruit.size">
							<!-- Background ring -->
							<circle
								:cx="fruit.size / 2"
								:cy="fruit.size / 2"
								:r="(fruit.size / 2) - 2"
								fill="none"
								:stroke="getTimerBackgroundColor(fruit)"
								stroke-width="4"
							/>

							<!-- Progress ring -->
							<circle
								:cx="fruit.size / 2"
								:cy="fruit.size / 2"
								:r="(fruit.size / 2) - 2"
								fill="none"
								:stroke="getTimerProgressColor(fruit)"
								stroke-width="4"
								stroke-linecap="round"
								class="timer-progress-ring"
								:style="{
				          '--progress': getTimerProgress(fruit),
				          '--radius': (fruit.size / 2) - 2,
				          '--circumference': 2 * Math.PI * ((fruit.size / 2) - 2)
				        }"
							/>
						</svg>

						<!-- Unified countdown indicator -->
						<div
							v-if="shouldShowCountdown(fruit)"
							class="timer-countdown-indicator"
							:class="getCountdownClasses(fruit)"
							:style="getCountdownStyles(fruit)"
						>
							{{ getCountdownValue(fruit) }}
						</div>
					</div>
				</div>

				<!-- Merge Particles Container -->
				<div class="merge-particles-container">
					<div
						v-for="particle in particles"
						:key="particle.id"
						class="merge-particle"
						:class="`particle--${particle.type.toLowerCase()}`"
						:style="{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              '--particle-x': `${particle.targetX}px`,
              '--particle-y': `${particle.targetY}px`,
              '--particle-color': particle.backgroundColor,
              animationDuration: `${particle.duration}ms`,
              backgroundColor: particle.backgroundColor,
              width: `${particle.size || 6}px`,
              height: `${particle.size || 6}px`
            }"
					></div>
				</div>
				<!-- Score Points Container -->
				<div class="score-points-container">
					<div
						v-for="scorePoint in scorePoints"
						:key="scorePoint.id"
						class="score-point"
						:style="{
	            left: `${scorePoint.x}px`,
	            top: `${scorePoint.y}px`,
	            transform: `translate(-50%, ${scorePoint.translateY}px) scale(${scorePoint.scale})`,
	            opacity: scorePoint.opacity,
	            color: scorePoint.comboColor,
	            pointerEvents: 'none',
	            zIndex: 50
	          }"
					>
						+{{ scorePoint.points }}
					</div>
				</div>
			</div>
			<div v-if="isEndlessMode" class="milestone-notifications">
				<transition-group name="milestone" tag="div" class="milestone-container">
					<div
						v-for="milestone in milestones.slice(-3)"
						:key="milestone"
						class="milestone-notification"
					>
						<Icon name="trophy" size="16" />
						<span>{{ getMilestoneText(milestone) }}</span>
					</div>
				</transition-group>
			</div>
		</div>
		<!-- Game Completed State -->
		<GameCompletedModal
				:visible="gameState === 'completed'"
				:level="currentLevel"
				:game-title="t('fruitMerge.title')"
				:final-score="score"
				:time-elapsed="isEndlessMode ? sessionTime : 0"
				:moves="moves"
				:matches="fruits.length"
				:total-pairs="fruits.length"
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
				:show-next-level="!isEndlessMode"
				:next-level-label="isEndlessMode ? t('fruitMerge.play_again') : t('fruitMerge.next_level')"
				:play-again-label="t('fruitMerge.play_again')"
				:back-to-games-label="t('fruitMerge.back_to_levels')"
				:enable-screenshot="enableScreenshotCapture"
				:game-state="currentGameScreenshotData"
				:high-score-info="screenshotHighscoreInfo"
				:auto-save-screenshot="true"
				@save-screenshot="handleSaveScreenshot"
				@next-level="nextLevel"
				@play-again="resetGame"
				@back-to-games="backToGaming"
				@close="backToGaming"
		/>
		<!-- Game Over State -->
		<GameOverModal
				v-if="!isEndlessMode"
				:visible="gameState === 'gameOver'"
				:level="currentLevel"
				:game-title="t('fruitMerge.title')"
				:final-score="score"
				:game-over-icon="'💥'"
				:try-again-label="t('fruitMerge.try_again')"
				:back-to-games-label="t('fruitMerge.back_to_levels')"
				@try-again="handleTryAgain"
				@back-to-games="backToGaming"
				@close="backToGaming"
		/>
		<!-- In-Game Shop Modal -->
		<ShopModal
				:visible="showShopModal"
				:item="hammerItem"
				:player-balance="playerBalance"
				:type="modalType"
				@confirm="handleHammerPurchaseConfirm"
				@cancel="handleShopModalCancel"
				@close="closeShopModal"
		/>
		<!-- Fruit Selection Modal -->
		<Teleport to="body">
			<div
				v-if="showFruitSelector"
				class="fruit-selector-overlay"
				@click="closeFruitSelector"
			>
				<div
					class="fruit-selector-modal"
					@click.stop
					role="dialog"
					aria-modal="true"
					:aria-labelledby="t('fruitMerge.select_fruit')"
				>
					<!-- Modal Header -->
					<div class="fruit-selector-header">
						<h3 class="fruit-selector-title">{{ t('fruitMerge.select_next_fruit') }}</h3>
						<button
							class="btn btn--circle-ghost"
							@click="closeFruitSelector"
							:aria-label="t('common.close')"
						>
							<Icon name="close" size="20" />
						</button>
					</div>

					<!-- Modal Content -->
					<div class="fruit-selector-content">
						<div class="fruit-category">
							<div class="fruit-grid">
								<div
									v-for="fruit in availableFruitsForSelection"
									:key="fruit.type"
									class="fruit-option"
									:class="{
		                'fruit-option--affordable': canAffordFruitSelection(fruit.cost),
		                'fruit-option--expensive': !canAffordFruitSelection(fruit.cost),
		                'fruit-option--special': fruit.rarity === 'rare'
		              }"
									@click="selectFruit(fruit)"
								>
									<div class="fruit-option-icon" v-html="fruit.svg" :style="`width:${fruit.size}px;`"></div>
									<div class="fruit-option-name" v-if="fruit.type">{{ t(`fruitMerge.fruits.${fruit.type.toLowerCase()}`) }}</div>
									<div class="fruit-option-cost">
										<CurrencyDisplay
											:diamonds="fruit.cost.diamonds"
											:show-coins="false"
											layout="horizontal"
											size="small"
											variant="compact"
											:format-numbers="true"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Teleport>
	</main>
</template>

<style lang="scss" scoped>
.fruit-merge-game {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding: var(--space-4);
	min-height: calc(100vh - 80px);
	max-width: 440px;
	margin: 0 auto;
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
	background-color: var(--warning-color);
	color: white;
	padding: var(--space-1) var(--space-3);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	align-self: center;
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
}

// Next Fruit Preview
.next-fruit-preview {
	position: relative;
	width: 320px;
	height: 76px;
}

.next-fruit {
	position: absolute;
	top: 50%;
	border-radius: 50%;
	pointer-events: none;
	z-index: 2;

	&--disabled {
		filter: grayscale(50%);
	}
}

// Next Next Fruit Preview
.next-next-fruit-preview {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	padding: var(--space-3);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-1);
	z-index: 5;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	width: 67px;
}

.preview-label {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
	letter-spacing: 0.05em;
	line-height: 1;
}

.next-next-fruit {
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 40px;
	max-height: 40px;
	transition: all 0.1s ease;
}

.next-next-fruit-placeholder {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background-color: var(--bg-secondary);
	border: 2px dashed var(--card-border);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--text-muted);
}

.drop-line {
	position: absolute;
	top: 0;
	width: 1px;
	background: var(--primary-color);
	opacity: 0.8;
	transform: translateX(-3px);
	z-index: 10;
}

.danger-zone {
	position: absolute;
	left: 0;
	width: 100%;
	background: linear-gradient(180deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%);
	border-bottom: 2px dashed var(--error-color);
	z-index: 3;
	opacity: 0.7;
	transition: opacity 0.3s ease;

	&:hover {
		opacity: 0.9;
	}
}

// Game Board
.game-board {
	position: relative;
	background: linear-gradient(180deg, #00000000 0%, #000000aa 50%, #808080aa 100%);
	border-radius: var(--border-radius-lg);
	overflow: hidden;
	cursor: crosshair;
	box-shadow: 0 0 2px 2px var(--card-border);
	transition: border-color 0.2s ease;

	&:hover {
		box-shadow: 0 0 2px 2px var(--primary-color);
	}
}

// Fruits
.fruit {
	position: absolute;
	border-radius: 50%;
	pointer-events: none; // Standard: keine Events
	transition: opacity 0.3s ease;

	// Nur im Hammer-Modus klickbar machen
	&.fruit--hammer-target {
		pointer-events: auto; // Events aktivieren!
		cursor: crosshair !important;

		&:hover {
			filter: brightness(1.3);
			box-shadow: 0 0 20px var(--error-color);
		}
	}

	&--combo {
		animation: comboSparkle 1s ease-out;
		box-shadow: 0 0 20px var(--warning-color);
	}

	&--danger {
		animation: dangerPulse 1s ease-in-out infinite alternate;
		box-shadow: 0 0 15px var(--error-color);
		filter: brightness(1.2) saturate(1.3);
		border: 2px solid var(--error-color);
		border-radius: 50%;

		.fruit-timer-circle {
			display: none;
		}
	}

	&--goal {
		box-shadow: 0 0 2px 6px var(--success-color);
	}

	&--destroying {
		pointer-events: none !important;
		animation: destroyAnimation 0.3s ease-out forwards;
	}
}

.fruit-svg {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;

	:deep(svg) {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}
}


// Merge Animation Effects
.merge-particles-container {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: 45;
	overflow: hidden;
}

.fruit-merge-effect {
	position: absolute;
	pointer-events: none;
	z-index: 50;
}

.merge-particle {
	contain: strict;
	pointer-events: none;
	will-change: transform, opacity;
	position: absolute;
	width: 6px;
	height: 6px;
	border-radius: 50%;
	z-index: 45;
	animation: particlePop 1400ms linear forwards;
	box-shadow:
			0 0 6px rgba(0, 0, 0, 1),
			0 0 8px rgba(255, 255, 255, 0.5),
			0 0 12px var(--particle-color, #FFD700);
}

// Score Points System
.score-points-container {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: 50;
	overflow: hidden;
}

.score-point {
	position: absolute;
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	text-shadow:
			0 0 4px rgba(0, 0, 0, 0.8),
			0 0 8px rgba(0, 0, 0, 0.6),
			0 2px 4px rgba(0, 0, 0, 0.4);
	white-space: nowrap;
	pointer-events: none;
	will-change: transform, opacity;
	user-select: none;
	display: flex;
	align-items: center;
	gap: var(--space-1);

	// Glow effect based on combo color
	filter: drop-shadow(0 0 6px currentColor);
}

.score-multiplier {
	font-size: var(--font-size-sm);
	opacity: 0.8;
	background: rgba(0, 0, 0, 0.3);
	padding: var(--space-0) var(--space-1);
	border-radius: var(--border-radius-sm);
	margin-left: var(--space-1);
}

.level-indicator--endless {
	background: linear-gradient(135deg, var(--warning-color), var(--primary-color));
	color: white;
	animation: endlessGlow 2s ease-in-out infinite alternate;
}

.game-board--endless {
	border: 2px solid var(--success-color);
	box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
}

.endless-progress {
	display: flex;
	gap: var(--space-3);
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-2);
}

.endless-stat {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-1);
	min-width: 60px;
}

.endless-label {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	text-transform: uppercase;
	font-weight: var(--font-weight-bold);
	line-height: 1;
}

.endless-value {
	font-size: var(--font-size-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	line-height: 1;
}

.endless-overlay {
	position: absolute;
	top: var(--space-2);
	right: var(--space-2);
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

.milestone-notifications {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 100;
	pointer-events: none;
	width: 100%;
	display: flex;
	justify-content: center;
}

.milestone-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	max-width: 280px;
	width: 100%;
}

.milestone-notification {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	background: linear-gradient(135deg, var(--success-color), var(--primary-color));
	color: white;
	padding: var(--space-3) var(--space-4);
	border-radius: var(--border-radius-lg);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 0 20px rgba(16, 185, 129, 0.3);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.2);
	text-align: center;
	white-space: nowrap;
}

// Vue Transition Animations
.milestone-enter-active {
	animation: milestoneSlideIn 0.8s ease-out;
}

.milestone-leave-active {
	animation: milestoneFadeUp 1.2s ease-in forwards;
}

.milestone-move {
	transition: transform 0.6s ease;
}

// CSS-Only Animations
@keyframes milestoneSlideIn {
	0% {
		opacity: 0;
		transform: translateY(30px) scale(0.8);
	}
	20% {
		opacity: 1;
		transform: translateY(-10px) scale(1.1);
	}
	40% {
		transform: translateY(5px) scale(0.95);
	}
	60% {
		transform: translateY(-2px) scale(1.02);
	}
	80% {
		transform: translateY(1px) scale(0.99);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes milestoneFadeUp {
	0% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	20% {
		opacity: 0.9;
		transform: translateY(-10px) scale(1.02);
	}
	100% {
		opacity: 0;
		transform: translateY(-50px) scale(0.8);
	}
}

// Optional: Stagger animation for multiple notifications
.milestone-notification:nth-child(1) {
	animation-delay: 0ms;
}

.milestone-notification:nth-child(2) {
	animation-delay: 100ms;
}

.milestone-notification:nth-child(3) {
	animation-delay: 200ms;
}

// Goal Fruit Display
.goal-fruit-display {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-1);
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-3);
	min-width: 80px;
}

.goal-label {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
	display: flex;
	gap: var(--space-2);
	text-transform: uppercase;
	letter-spacing: 0.05em;
	line-height: 1;
}

.goal-fruit {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(245, 158, 11, 0.1);
	transition: all 0.3s ease;

	&--completed {
		border-color: var(--success-color);
		background-color: rgba(16, 185, 129, 0.2);
		animation: goalPulse 1.5s ease-in-out infinite;
	}
}

.goal-fruit-svg {
	width: 100%;
	height: 100%;
	border-radius: 50%;

	:deep(svg) {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}
}

.goal-progress {
	font-size: var(--font-size-xs);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	line-height: 1;
}

// Goal Animation
@keyframes goalPulse {
	0%, 100% {
		transform: scale(1);
		box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
	}
}

// Enhanced visual effects
.milestone-notification::before {
	content: '';
	position: absolute;
	top: -2px;
	left: -2px;
	right: -2px;
	bottom: -2px;
	background: linear-gradient(45deg,
			var(--success-color),
			var(--primary-color),
			var(--warning-color),
			var(--success-color)
	);
	border-radius: var(--border-radius-lg);
	z-index: -1;
	opacity: 0;
	animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
	0%, 100% {
		opacity: 0;
	}
	50% {
		opacity: 0.6;
	}
}

// Auto-remove animation (CSS-only timing)
.milestone-notification {
	animation:
			milestoneSlideIn 0.8s ease-out,
			milestoneAutoFade 4s ease-in-out 3s forwards;
}

.hammer-control {
	display: flex;
	align-items: center;
	justify-content: center;

	.hammer-icon {
		font-size: var(--font-size-lg);
	}

	.hammer-count {
		margin-left: var(--space-1);
		background-color: var(--error-color);
		color: white;
		padding: 0 var(--space-1);
		border-radius: var(--border-radius-sm);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
	}
}

.hammer-btn {
	display: flex;
	align-items: center;
	gap: 0;
	padding: var(--space-1);
	position: relative;
}

.buy-hammer-btn {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-1);
	position: relative;
	height: 100%;

	.hammer-price {
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

.fruit--hammer-target {
	pointer-events: auto !important;
	cursor: crosshair !important;
	border: 2px dashed var(--warning-color);
	border-radius: 50%;

	&:hover {
		filter: brightness(1.2);
		box-shadow: 0 0 15px var(--warning-color);
		transform: scale(1.05);
	}

	.fruit-timer-circle {
		display: none;
	}
}

.fruit--destroying {
	animation: destroyAnimation 0.3s ease-out forwards;
}


.fruit--hammer-selected {
	pointer-events: auto !important;
	cursor: pointer !important;
	border-radius: 50%;
	box-shadow: 0 0 25px var(--error-color);
	animation: hammerSelectedPulse 0.5s ease-in-out infinite alternate;
}

.fruit--hammer-countdown {
	position: relative;
	z-index: 15 !important;
}

// Hammer Countdown Overlay
.hammer-countdown-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	z-index: 20;
}

.hammer-countdown-svg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	transform: rotate(-90deg);
	filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.4));
}

.hammer-countdown-progress {
	stroke-dasharray: var(--circumference);
	stroke-dashoffset: calc(var(--circumference) - (var(--progress) / 100) * var(--circumference));
	transition: stroke-dashoffset 0.1s linear;
	transform-origin: center;
}

.hammer-countdown-number {
	position: absolute;
	background: rgba(239, 68, 68, 0.95);
	color: white;
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	font-size: 14px;
	line-height: 1;
	border: 2px solid white;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	animation: hammerCountdownPulse 0.3s ease-in-out infinite;
}

.hammer-countdown-icon {
	position: absolute;
	top: -12px;
	right: -12px;
	font-size: 18px;
	animation: hammerIconBounce 1s ease-in-out infinite;
}

@keyframes hammerSelectedPulse {
	0% {
		box-shadow: 0 0 20px var(--error-color);
		transform: scale(1);
	}
	100% {
		box-shadow: 0 0 30px var(--error-color);
		transform: scale(1.02);
	}
}

@keyframes hammerCountdownPulse {
	0% {
		transform: scale(1);
		background: rgba(239, 68, 68, 0.9);
	}
	50% {
		transform: scale(1.1);
		background: rgba(239, 68, 68, 1);
	}
	100% {
		transform: scale(1);
		background: rgba(239, 68, 68, 0.9);
	}
}

@keyframes hammerIconBounce {
	0%, 100% {
		transform: scale(1) rotate(-10deg);
	}
	50% {
		transform: scale(1.2) rotate(10deg);
	}
}

// Mobile Touch Optimization
@media (hover: none) {
	.fruit--hammer-target {
		border-width: 3px;

		&:active {
			transform: scale(1.1);
			filter: brightness(1.3);
		}
	}

	.hammer-countdown-overlay {
		// Slightly larger touch areas on mobile
		margin: -4px;
	}
}

@keyframes destroyAnimation {
	0% {
		transform: scale(1) rotate(0deg);
		opacity: 1;
	}
	50% {
		transform: scale(1.2) rotate(180deg);
		opacity: 0.8;
	}
	100% {
		transform: scale(0) rotate(360deg);
		opacity: 0;
	}
}

// Mold Fruit specific styles
.fruit--mold {
	box-shadow: 0 0 8px rgba(93, 64, 55, 0.6);
	animation: moldPulse 3s ease-in-out infinite alternate;
}

.fruit--mold-warning {
	animation: moldWarning 0.5s ease-in-out infinite alternate !important;
	box-shadow: 0 0 15px #FF5722;
}

.mold-timer-circle {
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: none;
	z-index: 15;
	border-radius: 50%;
	width: 100%;
	height: 100%;
}

.mold-timer-svg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	transform: rotate(-90deg); /* Start progress from top */
	filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.4));
}

.mold-progress-ring {
	stroke-dasharray: var(--circumference);
	stroke-dashoffset: calc(var(--circumference) - (var(--progress) / 100) * var(--circumference));
	transition: stroke-dashoffset 0.1s linear, stroke 0.3s ease;
	transform-origin: center;
}

.mold-time-indicator {
	position: absolute;
	background: rgba(255, 87, 34, 0.95);
	color: white;
	border-radius: 50%;
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	font-size: 8px;
	line-height: 1;
	border: 1px solid white;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
	animation: countdownPulse 1s ease-in-out infinite;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	touch-action: manipulation;
}

.particle--mold_spawn {
	background-color: #5D4037 !important;
	border-radius: 50% !important;
	box-shadow: 0 0 6px #5D4037;
}

.particle--mold_disappear {
	border-radius: 50% !important;
	box-shadow: 0 0 8px currentColor;
}

.particle--destruction {
	background-color: #FF4444 !important;
	box-shadow: 0 0 10px #FF4444;
}

.fruit--bomb {
	box-shadow: 0 0 12px rgba(255, 68, 68, 0.6);
	animation: bombPulse 2s ease-in-out infinite alternate;
}

.fruit--bomb-ticking {
	animation: bombDangerPulse 0.3s ease-in-out infinite alternate !important;
	box-shadow: 0 0 20px #FF0000;
}

.bomb-timer-circle {
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: none;
	z-index: 15;
	border-radius: 50%;
	width: 100%;
	height: 100%;
}

.bomb-timer-svg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	transform: rotate(-90deg); /* Start progress from top */
	filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.4));
}

.bomb-progress-ring {
	stroke-dasharray: var(--circumference);
	stroke-dashoffset: calc(var(--circumference) - (var(--progress) / 100) * var(--circumference));
	transition: stroke-dashoffset 0.1s linear, stroke 0.3s ease;
	transform-origin: center;
}

.bomb-countdown-indicator {
	position: absolute;
	background: rgba(255, 0, 0, 0.95);
	color: white;
	border-radius: 50%;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	font-size: 10px;
	line-height: 1;
	border: 2px solid white;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
	animation: bombCountdownPulse 0.5s ease-in-out infinite;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	touch-action: manipulation;
}

// Bomb particle effects
.particle--bomb_explosion {
	border-radius: 50% !important;
	box-shadow: 0 0 12px currentColor;
}

.fruit-timer-circle {
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: none;
	z-index: 15;
	border-radius: 50%;
	width: 100%;
	height: 100%;

	// Mold specific styles
	&--mold {
		// Base mold styling if needed
	}

	// Bomb specific styles
	&--bomb {
		// Base bomb styling if needed
	}

	// Warning state (mold)
	&--warning {
		// Warning specific styling
	}

	// Ticking state (bomb)
	&--ticking {
		// Ticking specific styling
	}
}

.timer-svg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	transform: rotate(-90deg); /* Start progress from top */
	filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.4));
}

.timer-progress-ring {
	stroke-dasharray: var(--circumference);
	stroke-dashoffset: calc(var(--circumference) - (var(--progress) / 100) * var(--circumference));
	transition: stroke-dashoffset 0.1s linear, stroke 0.3s ease;
	transform-origin: center;
}

.timer-countdown-indicator {
	position: absolute;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	line-height: 1;
	border: 2px solid white;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	touch-action: manipulation;

	&--mold {
		background: rgba(255, 87, 34, 0.95);
		color: white;
		animation: countdownPulse 1s ease-in-out infinite;
	}

	&--bomb {
		background: rgba(255, 0, 0, 0.95);
		color: white;
		animation: bombCountdownPulse 0.5s ease-in-out infinite;
	}
}

.next-fruit-preview--clickable {
	cursor: pointer;

	&:hover {
		transform: scale(1.02);
		transition: transform 0.2s ease;
	}
}

.next-fruit--special {
	position: relative;

	&::after {
		content: '✨';
		position: absolute;
		top: -8px;
		right: -8px;
		font-size: 16px;
		animation: sparkle 2s ease-in-out infinite;
	}
}

.fruit-selection-hint {
	position: absolute;
	bottom: -2px;
	right: -2px;
	background-color: var(--primary-color);
	border-radius: 50%;
	width: 18px;
	height: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	opacity: 0;

	.next-fruit-preview:hover & {
		animation: pulse 2s infinite;
	}
}

.selection-instruction {
	position: absolute;
	bottom: -20px;
	left: 50%;
	transform: translateX(-50%);
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	white-space: nowrap;
	text-align: center;
}

// Fruit Selector Modal
.fruit-selector-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.75);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.2s ease;
}

.fruit-selector-modal {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	border: 1px solid var(--card-border);
	max-width: 90%;
	width: 340px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.5);
	animation: slideIn 0.3s ease;
}

.fruit-selector-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--space-2) var(--space-3);
	border-bottom: 1px solid var(--card-border);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
}

.fruit-selector-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.fruit-selector-content {
	display: flex;
	flex-direction: column;
	padding: var(--space-1);
}

.current-balance {
	display: flex;
	justify-content: center;
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.fruit-category {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.category-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
	text-align: center;
}

.fruit-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--space-2);
}

.fruit-option {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2);
	background-color: var(--card-bg);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;

	&--affordable {
		&:hover {
			border-color: var(--success-color);
			background-color: var(--card-bg-hover);
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
		}
	}

	&--expensive {
		opacity: 0.5;
		cursor: not-allowed;

		&:hover {
			border-color: var(--error-color);
			box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
		}
	}

	&--special {
		background: linear-gradient(135deg, var(--card-bg), rgba(139, 92, 246, 0.1));
		border-color: var(--primary-color);

		&.fruit-option--affordable:hover {
			border-color: var(--primary-color);
			box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
		}
	}
}

.fruit-option-icon {
	width: 40px;
	height: 68px;
	display: flex;
	align-items: center;
	justify-content: center;

	:deep(svg) {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}
}

.fruit-option-name {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	text-align: center;
	line-height: 1.2;
}

.fruit-option-rarity {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);

	&.rarity--common {
		background-color: var(--info-color);
		color: white;
	}

	&.rarity--rare {
		background-color: var(--primary-color);
		color: white;
	}

	&.rarity--epic {
		background-color: var(--warning-color);
		color: white;
	}
}

.fruit-option-cost {
	display: flex;
	align-items: center;
	gap: var(--space-1);
}

.cost-diamonds {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--primary-color);
	display: flex;
	align-items: center;
	gap: var(--space-1);
}

.fruit-option-description {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	text-align: center;
	line-height: 1.3;
	margin-top: var(--space-1);
}
.fruit--rainbow {
	position: relative;
	box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
	animation: rainbowPulse 3s ease-in-out infinite alternate;

	&::before {
		content: '';
		position: absolute;
		top: -4px;
		left: -4px;
		right: -4px;
		bottom: -4px;
		border-radius: 50%;
		background: conic-gradient(
						from 0deg,
						#FF6B6B 0deg,
						#FFD93D 60deg,
						#6BCF7F 120deg,
						#4ECDC4 180deg,
						#45B7D1 240deg,
						#96CEB4 300deg,
						#FF6B6B 360deg
		);
		z-index: -1;
		animation: rainbowRotate 4s linear infinite;
	}

	&::after {
		content: '✨';
		position: absolute;
		top: -8px;
		right: -8px;
		font-size: 16px;
		animation: sparkle 2s ease-in-out infinite;
		z-index: 10;
	}
}

.fruit--rainbow-shimmer {
	filter: brightness(1.2) saturate(1.3);
}

.particle--rainbow_merge {
	border-radius: 50% !important;
	box-shadow: 0 0 15px currentColor;
	animation: rainbowParticleFloat 2.5s ease-out forwards;
}

.particle--rainbow_ripple {
	border: 3px solid #FFD700;
	border-radius: 50%;
	animation: rainbowRipple 1.5s ease-out forwards;
}

// Rainbow Animations
@keyframes rainbowPulse {
	0% {
		filter: brightness(1) saturate(1) hue-rotate(0deg);
		transform: scale(1);
	}
	100% {
		filter: brightness(1.3) saturate(1.5) hue-rotate(180deg);
		transform: scale(1.05);
	}
}

@keyframes rainbowRotate {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

@keyframes sparkle {
	0%, 100% {
		opacity: 0.7;
		transform: scale(1);
	}
	50% {
		opacity: 1;
		transform: scale(1.3);
	}
}

@keyframes rainbowParticleFloat {
	0% {
		opacity: 1;
		transform: translate(0, 0) scale(1);
	}
	100% {
		opacity: 0;
		transform: translate(var(--particle-x), var(--particle-y)) scale(0.3);
	}
}

@keyframes rainbowRipple {
	0% {
		opacity: 1;
		transform: scale(1);
	}
	100% {
		opacity: 0;
		transform: scale(8);
	}
}

// Animations
@keyframes sparkle {
	0%, 100% {
		opacity: 1;
		transform: scale(1);
	}
	50% {
		opacity: 0.5;
		transform: scale(1.2);
	}
}

@keyframes pulse {
	0% {
		transform: scale(1);
		opacity: 1;
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

// Unified animations
@keyframes countdownPulse {
	0% {
		transform: scale(1);
		opacity: 0.9;
	}
	50% {
		transform: scale(1.1);
		opacity: 1;
	}
	100% {
		transform: scale(1);
		opacity: 0.9;
	}
}

@keyframes bombCountdownPulse {
	0% {
		transform: scale(1);
		background: rgba(255, 0, 0, 0.9);
	}
	50% {
		transform: scale(1.2);
		background: rgba(255, 0, 0, 1);
	}
	100% {
		transform: scale(1);
		background: rgba(255, 0, 0, 0.9);
	}
}

// Animations
@keyframes bombPulse {
	0% {
		filter: brightness(1) saturate(1);
		transform: scale(1);
	}
	100% {
		filter: brightness(1.2) saturate(1.3);
		transform: scale(1.03);
	}
}

@keyframes bombDangerPulse {
	0% {
		box-shadow: 0 0 20px #FF0000;
		transform: scale(1);
	}
	100% {
		box-shadow: 0 0 30px #FF0000;
		transform: scale(1.05);
	}
}

@keyframes bombCountdownPulse {
	0% {
		transform: scale(1);
		background: rgba(255, 0, 0, 0.9);
	}
	50% {
		transform: scale(1.2);
		background: rgba(255, 0, 0, 1);
	}
	100% {
		transform: scale(1);
		background: rgba(255, 0, 0, 0.9);
	}
}

// Screen Shake Animation
@keyframes screenShake {
	0% { transform: translate(0px, 0px) rotate(0deg); }
	10% { transform: translate(-2px, -1px) rotate(-0.5deg); }
	20% { transform: translate(-1px, 0px) rotate(0.5deg); }
	30% { transform: translate(2px, 1px) rotate(0deg); }
	40% { transform: translate(0px, -1px) rotate(0.5deg); }
	50% { transform: translate(-1px, 1px) rotate(-0.5deg); }
	60% { transform: translate(-2px, 0px) rotate(0deg); }
	70% { transform: translate(1px, 0px) rotate(-0.5deg); }
	80% { transform: translate(-1px, -1px) rotate(0.5deg); }
	90% { transform: translate(1px, 1px) rotate(0deg); }
	100% { transform: translate(0px, 0px) rotate(0deg); }
}

// Animations
@keyframes moldPulse {
	0% {
		filter: brightness(1) saturate(1);
		transform: scale(1);
	}
	100% {
		filter: brightness(1.1) saturate(1.2);
		transform: scale(1.02);
	}
}

@keyframes countdownPulse {
	0% {
		transform: scale(1);
		background: rgba(255, 87, 34, 0.9);
	}
	50% {
		transform: scale(1.1);
		background: rgba(255, 87, 34, 1);
	}
	100% {
		transform: scale(1);
		background: rgba(255, 87, 34, 0.9);
	}
}

@keyframes milestoneAutoFade {
	0% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	20% {
		opacity: 0.9;
		transform: translateY(-5px) scale(1.01);
	}
	100% {
		opacity: 0;
		transform: translateY(-40px) scale(0.85);
	}
}

@keyframes particlePop {
	0% {
		opacity: 0;
		transform: translate(0, 0) scale(2);
	}
	20% {
		opacity: 1;
		transform: translate(calc(var(--particle-x) * 0.4), calc(var(--particle-y) * 0.4)) scale(1.5);
	}
	80% {
		opacity: 1;
	}
	100% {
		opacity: 0;
		transform: translate(var(--particle-x), var(--particle-y)) scale(0.4);
	}
}

@keyframes comboSparkle {
	0%, 100% {
		filter: brightness(1);
	}
	50% {
		filter: brightness(1.3);
	}
}

@keyframes dangerPulse {
	0% {
		box-shadow: 0 0 15px var(--error-color);
		transform: scale(1);
	}
	100% {
		box-shadow: 0 0 25px var(--error-color);
		transform: scale(1.05);
	}
}

// Touch-specific improvements
@media (hover: none) {
	.game-board {
		border-color: var(--primary-color);
	}
}
</style>