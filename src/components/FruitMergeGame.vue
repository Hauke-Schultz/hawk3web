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
import GameOverModal from "./GameOverModal.vue";
import Icon from "./Icon.vue";

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
const rewardBreakdown = ref(null)
const scorePoints = shallowRef([])
const isPhysicsPaused = ref(false)
const totalMerges = ref(0)
const sessionTime = ref(0)
const sessionTimer = ref(null)
const milestones = ref([])

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

const isEndlessMode = computed(() => {
	return currentLevelConfig.value.isEndless || false
})

const shouldShowGameOver = computed(() => {
	return !isEndlessMode.value // Kein Game Over im Endlos-Modus
})


const generateNextFruit = () => {
	const maxStartingLevel = isEndlessMode.value ?
			Math.min(6, Math.floor(totalMerges.value / 20) + 4) : 4
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
			// Hier könntest du später Belohnungen hinzufügen
		}
	})
}

const checkScoreMilestones = () => {
	if (!isEndlessMode.value) return

	const config = currentLevelConfig.value.endless
	if (!config) return

	config.scoreMilestones.forEach(milestone => {
		if (score.value >= milestone && !milestones.value.includes(`score_${milestone}`)) {
			milestones.value.push(`score_${milestone}`)
			console.log(`🎯 Punkte-Meilenstein erreicht: ${milestone} Punkte!`)
			// Hier könntest du später Belohnungen hinzufügen
		}
	})
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

		          if (isEndlessMode.value) {
			          totalMerges.value++
			          checkScoreMilestones()
		          }

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
				icon: 'trophy',
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
	showNextFruit.value = true

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

const backToGaming = () => {
	emit('back-to-gaming')
	cleanup()
}

const gameOver = () => {
	pausePhysics()
	stopAllFruits()
	stopGameOverChecking()
	comboSystem.cleanup()

	console.log('Game Over! Fruits reached the danger zone.')

	if (isEndlessMode.value) {
		// Endlos-Modus: Game Over wird zu Game Complete behandelt
		gameState.value = 'completed'

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

	// Update game statistics für beide Modi
	const gameStats = {
		gamesPlayed: gameData.games.fruitMerge.gamesPlayed + 1,
		totalScore: gameData.games.fruitMerge.totalScore + score.value,
		highScore: Math.max(gameData.games.fruitMerge.highScore, score.value)
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

const formatTime = (seconds) => {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getMilestoneText = (milestone) => {
	const [type, value] = milestone.split('_')

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
	      <div class="level-indicator" :class="{ 'level-indicator--endless': isEndlessMode }">
		      {{ isEndlessMode ? t('fruitMerge.endless_mode') : t('fruitMerge.level_title', { level: currentLevel }) }}
	      </div>
      </div>

      <div class="game-stats-container">
        <!-- Progress Overview -->
	      <ProgressOverview
		      v-if="!isEndlessMode"
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
			      'fruit--goal': fruit.name === currentLevelConfig.targetFruit && !isEndlessMode
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