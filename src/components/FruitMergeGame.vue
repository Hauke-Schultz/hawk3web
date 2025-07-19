<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue'
import * as Matter from 'matter-js'
import {FRUIT_MERGE_LEVELS, FRUIT_TYPES, PHYSICS_CONFIG, POINTS_CONFIG} from '../config/fruitMergeConfig.js'
import PerformanceStats from "./PerformanceStats.vue";
import ProgressOverview from "./ProgressOverview.vue";
import {calculateLevelStars} from "../config/levelUtils.js";
import GameCompletedModal from "./GameCompletedModal.vue";
import {useComboSystem} from "../composables/useComboSystem.js";
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import Header from "./Header.vue";
import {REWARDS} from "../config/achievementsConfig.js";
import {COMBO_CONFIG} from "../config/comboConfig.js";

// Props
const props = defineProps({
  level: {
    type: Number,
    default: 1
  }
})

// Emits
const emit = defineEmits(['back-to-gaming', 'game-complete', 'menu-click'])

// Services
const { gameData, updateGameStats, updateLevelStats, addScore, checkGameLevelAchievements, checkAutoAchievements, getLevelStats } = useLocalStorage()
const { t } = useI18n()

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
const showNextFruit = ref(true)
const particles = shallowRef([])
const earnedAchievements = ref([])
const levelReward = ref(null)
const scorePoints = shallowRef([])
const isPhysicsPaused = ref(false)

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
        radius: fruit.radius
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

const generateNextFruit = () => {
  const maxStartingLevel = 4
  const randomIndex = Math.floor(Math.random() * maxStartingLevel)
  const randomFruitType = fruitTypes.value[randomIndex]

  if (!randomFruitType) {
    console.error('Could not find fruit type at index:', randomIndex)
    return null
  }

  return {
    id: nextFruitId.value++,
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
    dangerZoneTime: 0
  }
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

  console.log(`Dropping fruit at x: ${targetX}`)

  isDropping.value = true
  dropCooldown.value = true

  const fruit = nextFruit.value
  const fruitConfig = Object.values(FRUIT_TYPES).find(f => f.index === fruit.level)
  const radius = fruitConfig ? fruitConfig.radius : fruit.size / 2

  const body = Matter.Bodies.circle(
      targetX,
      -30,
      radius,
      {
        restitution: 0.6,
        friction: 0.05,
        frictionAir: 0.008,
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

  fruit.body = body
  fruit.x = targetX - fruit.size / 2
  fruit.y = -30 - fruit.size / 2

  Matter.Composite.add(engine.world, body)
  fruits.value = [...fruits.value, fruit]

  moves.value++

  setTimeout(() => {
    nextFruit.value = generateNextFruit()
    isDropping.value = false
    dropCooldown.value = false
  }, PHYSICS_CONFIG.dropCooldown)
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
      // Extract information from labels: fruit-{id}-{color}-{level}
      const labelPartsA = bodyA.label.split('-')
      const labelPartsB = bodyB.label.split('-')

      const idA = parseInt(labelPartsA[1])
      const idB = parseInt(labelPartsB[1])
      const levelA = parseInt(labelPartsA[3])
      const levelB = parseInt(labelPartsB[3])

      // If fruits have the same level, merge them
      if (levelA === levelB) {
        // Find the fruit objects
        const fruitA = fruits.value.find(f => f.id === idA)
        const fruitB = fruits.value.find(f => f.id === idB)

        // Only merge if both fruits exist and aren't already merging
        if (fruitA && fruitB && !fruitA.merging && !fruitB.merging) {
          console.log(`Merging level ${levelA} fruits: ${fruitA.name} + ${fruitB.name}`)

          // Mark fruits as merging to prevent multiple merges
          fruitA.merging = true

          // Calculate center position for the new fruit
          const centerX = (bodyA.position.x + bodyB.position.x) / 2
          const centerY = (bodyA.position.y + bodyB.position.y) / 2

          console.log(`Merging fruits at center: (${centerX}, ${centerY}) bodyA: ${bodyA.position.x}, ${bodyA.position.y} bodyB: ${bodyB.position.x}, ${bodyB.position.y}`)
          // Remove bodies from the physics world
          Matter.Composite.remove(engine.world, bodyA)
          Matter.Composite.remove(engine.world, bodyB)

          // Remove fruits from the array
          fruits.value = fruits.value.filter(f => f.id !== idA && f.id !== idB)

          // Find current fruit type in config
          const currentFruitType = Object.values(FRUIT_TYPES).find(f => f.index === levelA)
          if (currentFruitType) {
            // Add combo for successful merge
            const comboResult = comboSystem.addCombo()

            // Calculate score with combo multiplier
            const baseScore = currentFruitType.scoreValue
            const comboMultipliedScore = Math.round(baseScore * comboResult.multiplier)
            score.value += comboMultipliedScore

            // Find next fruit type
            const nextFruitType = Object.values(FRUIT_TYPES).find(f => f.index === levelA + 1)

            createMergeVisualEffects(centerX, centerY, nextFruitType);
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
			          merging: false
		          }

		          // Add the new fruit to the world
		          addMergedFruit(newFruit, centerX, centerY)

		          // Check if this merge completes the level goal
		          if (newFruit.name === currentLevelConfig.value.targetFruit) {
			          console.log(`🎯 Level goal reached! Created ${newFruit.name}`)

			          // Stop physics
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

const resumePhysics = () => {
	if (engine && runner && isPhysicsPaused.value) {
		Matter.Runner.run(runner, engine)
		isPhysicsPaused.value = false
		console.log('Physics resumed')
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
      fruit.x = fruit.body.position.x - fruit.size / 2
      fruit.y = fruit.body.position.y - fruit.size / 2
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

	stopGameOverChecking()

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

  initPhysics()
  nextFruit.value = generateNextFruit()
  gameLoop()
  startGameOverChecking()

  console.log('Game initialized')
}

const completeLevel = () => {
	if (gameState.value !== 'playing') return

	gameState.value = 'completed'

	// Calculate level rewards
	const rewardCalculation = calculateLevelReward()
	levelReward.value = rewardCalculation

	// Update level statistics
	const levelResult = {
		completed: true,
		score: score.value,
		moves: moves.value
	}

	// Check if this is first time completion
	const previousLevelStats = getLevelStats('fruitMerge', currentLevel.value)
	const isFirstTimeCompletion = !previousLevelStats?.completed

	// Calculate stars after updating stats
	const starsEarned = calculateCurrentStars()

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

	// Find newly earned achievements
	earnedAchievements.value = achievementsAfter.filter(after =>
			!achievementsBefore.some(before => before.id === after.id && before.earned)
	)

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
	if (!isLevelComplete.value) return { coins: 0, diamonds: 0 }

	const levelConfig = currentLevelConfig.value
	const levelNumber = currentLevel.value

	// Determine difficulty tier
	let difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.easy
	if (levelNumber >= 4) {
		difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.hard
	} else if (levelNumber >= 2) {
		difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.medium
	}

	// Base reward
	let totalCoins = Math.round(REWARDS.levelCompletion.base.coins * difficultyMultiplier)
	let totalDiamonds = REWARDS.levelCompletion.base.diamonds

	// Check if this is first time completion
	const previousLevelStats = getLevelStats('fruitMerge', currentLevel.value)
	const isFirstTimeCompletion = !previousLevelStats?.completed

	if (isFirstTimeCompletion) {
		totalCoins += Math.round(REWARDS.levelCompletion.firstTime.coins * difficultyMultiplier)
		totalDiamonds += REWARDS.levelCompletion.firstTime.diamonds
	}

	// Star-based bonus
	const starsEarned = calculateCurrentStars()
	if (starsEarned > 0) {
		const starBonus = REWARDS.levelCompletion.stars[starsEarned]
		if (starBonus) {
			totalCoins += Math.round(starBonus.coins * difficultyMultiplier)
			totalDiamonds += starBonus.diamonds
		}
	}

	// Perfect bonus (3 stars)
	if (starsEarned === 3) {
		totalCoins = Math.round(totalCoins * (1 + REWARDS.levelCompletion.perfectBonus))
	}

	return {
		coins: totalCoins,
		diamonds: totalDiamonds,
		breakdown: {
			base: Math.round(REWARDS.levelCompletion.base.coins * difficultyMultiplier),
			firstTime: isFirstTimeCompletion ? Math.round(REWARDS.levelCompletion.firstTime.coins * difficultyMultiplier) : 0,
			stars: starsEarned > 0 ? Math.round(REWARDS.levelCompletion.stars[starsEarned]?.coins * difficultyMultiplier || 0) : 0,
			perfect: starsEarned === 3 ? Math.round(totalCoins * REWARDS.levelCompletion.perfectBonus) : 0,
			difficulty: difficultyMultiplier
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
  if (!isLevelComplete.value) return 0
  return calculateLevelStars(
      { score: score.value, moves: moves.value, completed: true },
      currentLevelConfig.value
  )
}

const nextLevel = () => {
  if (currentLevel.value < Object.keys(FRUIT_MERGE_LEVELS).length) {
    currentLevel.value++
    startLevel(currentLevel.value)
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
	particles.value = []
	scorePoints.value = []
	levelReward.value = null
}

const handleTryAgain = () => {
  resetGame()
  gameState.value = 'playing'
}

const backToGaming = () => {
  emit('back-to-gaming')
  cleanup()
}

const gameOver = () => {
	pausePhysics()
	stopAllFruits()
	gameState.value = 'gameOver'
	stopGameOverChecking()
	comboSystem.cleanup()

	console.log('Game Over! Fruits reached the danger zone.')

  const gameStats = {
    gamesPlayed: gameData.games.fruitMerge.gamesPlayed + 1,
    totalScore: gameData.games.fruitMerge.totalScore + score.value,
    highScore: Math.max(gameData.games.fruitMerge.highScore, score.value)
  }

  updateGameStats('fruitMerge', gameStats)
  addScore(score.value)
}

const handleMenuClick = () => {
	emit('menu-click')
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
		:show-profile="true"
		:show-menu-button="true"
		@menu-click="handleMenuClick"
	/>
  <main class="fruit-merge-game">
    <!-- Game Header -->
    <div class="game-header">
      <div class="game-info">
        <h2 class="game-title">{{ t('fruitMerge.title') }}</h2>
        <div class="level-indicator">{{ t('fruitMerge.level_title', { level: currentLevel }) }}</div>
      </div>

      <div class="game-stats-container">
        <!-- Progress Overview -->
        <ProgressOverview
          :completed="gameProgress.completed"
          :total="gameProgress.total"
          theme="warning"
          size="small"
          :levels-label="currentLevelConfig.targetFruit"
          :show-stars="false"
          :show-percentage="false"
          :complete-label="t('fruitMerge.target')"
        />

        <!-- Game Performance Stats -->
        <PerformanceStats
          :score="score"
          :time-elapsed="0"
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
          :show-time="false"
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

    <!-- Game Board Container -->
    <div class="game-container">
      <!-- Next Fruit Preview -->
      <div
        ref="nextFruitContainer"
        class="next-fruit-preview"
        @mousemove="handleMouseMove"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @touchmove.passive="handleTouchMove"
        @touchstart.passive="handleTouchStart"
      >
        <div
          v-if="nextFruit && showNextFruit"
          class="next-fruit"
          :class="{ 'next-fruit--disabled': !canDropFruit }"
          :style="{
            width: `${nextFruit.size}px`,
            height: `${nextFruit.size}px`,
            left: `${nextFruitPosition - nextFruit.size / 2}px`,
            transform: 'translateY(-50%)',
            opacity: canDropFruit ? 1 : 0
          }"
        >
          <div class="fruit-svg" v-html="nextFruit.svg"></div>
        </div>
      </div>

      <!-- Physics Game Board -->
      <div
        ref="gameBoard"
        class="game-board"
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
          :style="{
            height: `${gameOverHeight}px`,
            top: '0px'
          }"
        ></div>
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
            'fruit--goal': fruit.name === currentLevelConfig.targetFruit
          }"
          :style="{
            left: `${fruit.x}px`,
            top: `${fruit.y}px`,
            width: `${fruit.size}px`,
            height: `${fruit.size}px`,
            transform: `rotate(${fruit.rotation}deg)`,
            zIndex: fruit.inDanger ? 5 : 1
          }"
        >
          <div class="fruit-svg" v-html="fruit.svg"></div>
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
    </div>
    <!-- Game Completed State -->
    <GameCompletedModal
      :visible="gameState === 'completed' || gameState === 'gameOver'"
      :level="currentLevel"
      :game-title="t('fruitMerge.title')"
      :final-score="score"
      :time-elapsed="0"
      :moves="moves"
      :matches="fruits.length"
      :total-pairs="fruits.length"
      :stars-earned="calculateCurrentStars()"
      :show-stars="gameState === 'completed'"
      :new-achievements="earnedAchievements"
      :show-achievements="true"
      :show-reward="gameState === 'completed'"
      :reward="levelReward"
      :game-over-mode="gameState === 'gameOver'"
      :game-over-title="t('fruitMerge.game_over')"
      :game-over-message="t('fruitMerge.game_over_message')"
      :game-over-icon="'💥'"
      :next-level-label="t('fruitMerge.next_level')"
      :play-again-label="t('fruitMerge.play_again')"
      :try-again-label="t('fruitMerge.try_again')"
      :back-to-games-label="t('fruitMerge.back_to_levels')"
      @next-level="nextLevel"
      @play-again="resetGame"
      @try-again="handleTryAgain"
      @back-to-games="backToGaming"
      @close="backToGaming"
    />
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
  pointer-events: none;
  transition: opacity 0.3s ease;

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
  }

	&--goal {
		box-shadow: 0 0 2px 6px var(--success-color);
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