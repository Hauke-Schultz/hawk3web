<script setup>
import {ref, computed, onMounted, onUnmounted, nextTick, shallowRef, reactive} from 'vue'
import Matter from 'matter-js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import {PHYSICS_CONFIG, FRUIT_TYPES, FRUIT_SPAWN_WEIGHTS, FRUIT_MERGE_LEVELS} from '../config/fruitMergeConfig.js'
import { useComboSystem } from '../composables/useComboSystem.js'
import ProgressOverview from "./ProgressOverview.vue"
import GameCompletedModal from "./GameCompletedModal.vue"
import PerformanceStats from "./PerformanceStats.vue"
import GameControls from "./GameControls.vue"
import {calculateLevelStars} from "../config/levelUtils.js";

const props = defineProps({
  level: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['back-to-gaming', 'game-complete'])

// LocalStorage service
const { gameData, updateGameStats, updateLevelStats, addScore, addExperience, checkGameLevelAchievements } = useLocalStorage()

const { t } = useI18n()

// Game state
const gameState = ref('playing') // 'playing', 'paused', 'completed'
const currentLevel = ref(props.level || 1)
const score = ref(0)
const moves = ref(0)
const merges = ref(0)
const timeElapsed = ref(0)
const timer = ref(null)
const gameOverTimer = ref(null)
const earnedAchievements = ref([])

const gameField = ref(null)
const engine = ref(null)
const world = ref(null)
const walls = ref([])
const fruits = shallowRef([])
const dropFruit = ref(null)
const isDragging = ref(false)
const isDropReady = ref(false)
const isRenderingActive = ref(false)
const gameComplete = ref(false)
const lastMouseUpdate = ref(0)

const isPhysicsReady = ref(false)
const dropCooldown = ref(false)

const fruitsCreated = ref({})
const targetReached = ref(false)

const mergeEffects = ref([])
const particles = shallowRef([])

const gameOver = ref(false)

// Computed properties
const currentLevelConfig = computed(() => FRUIT_MERGE_LEVELS[currentLevel.value])
const targetFruit = computed(() => currentLevelConfig.value?.targetFruit)
const targetCount = computed(() => {
  const thresholds = currentLevelConfig.value?.starThresholds
  return thresholds ? (thresholds[1].targetCount || 1) : 1
})
const isGameComplete = computed(() => {
  const fruitsOfTargetType = fruitsCreated.value[targetFruit.value] || 0
  return fruitsOfTargetType >= targetCount.value
})

// Combo system for FruitMerge
const comboSystem = useComboSystem({
  minComboLength: 2,        // FruitMerge: 2 consecutive merges = combo
  maxComboLength: 10,       // Max 10 combo levels
  comboTimeout: 5000,       // 5 seconds to maintain combo
  baseMultiplier: 1.5,      // Higher base for merge game
  multiplierIncrement: 0.4  // More aggressive increase
})

const finalScore = computed(() => {
  if (!isGameComplete.value) return score.value

  // Add time bonus if completed
  const timeBonus = Math.max(0, 300 - timeElapsed.value) // 5 minute time bonus
  return score.value + timeBonus
})

const gameProgress = computed(() => {
  const fruitsOfTargetType = fruitsCreated.value[targetFruit.value] || 0
  return {
    completed: fruitsOfTargetType,
    total: targetCount.value,
    percentage: Math.round((fruitsOfTargetType / targetCount.value) * 100)
  }
})

const initializeGame = () => {
  console.log(`Initializing game for level ${currentLevel.value}`)
  startLevel(currentLevel.value)
}

const initializePhysics = () => {
  if (!gameField.value) return

  engine.value = Matter.Engine.create({
    gravity: { x: 0, y: 0.5, scale: 0.001 }
  })

  world.value = engine.value.world

  createWalls()
  setupCollisionEvents() // ← Neue einfache Version

  // Starte nur einen Loop
  startSingleRenderLoop() // ← Neue einfache Version

  isPhysicsReady.value = true
  console.log('Simple physics initialized')
}

const startGameOverTimer = () => {
  gameOverTimer.value = setInterval(() => {
    if (gameState.value === 'playing' && !gameOver.value) {
      checkGameOver()
    }
  }, 1000)
}

const stopGameOverTimer = () => {
  if (gameOverTimer.value) {
    clearInterval(gameOverTimer.value)
    gameOverTimer.value = null
  }
}

const startSingleRenderLoop = () => {
  if (isRenderingActive.value) return
  isRenderingActive.value = true

  const updateLoop = () => {
    if (!isRenderingActive.value) return

    // Physics update (wie in alter Version)
    Matter.Engine.update(engine.value, 1000/60)

    // Einfache DOM-Updates
    fruits.value.forEach(fruit => {
      if (fruit.element && fruit.body) {
        const { x, y } = fruit.body.position
        const rotation = fruit.body.angle

        // Direkte Style-Updates ohne Batching
        fruit.element.style.left = `${x - fruit.data.radius}px`
        fruit.element.style.top = `${y - fruit.data.radius}px`
        fruit.element.style.transform = `rotate(${rotation}rad)`
      }
    })

    // Game Over Check
    if (!gameOver.value && !gameComplete.value) {
      checkGameOver()
    }

    requestAnimationFrame(updateLoop)
  }

  requestAnimationFrame(updateLoop)
}

const setupCollisionEvents = () => {
  Matter.Events.on(engine.value, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
      const bodyA = pair.bodyA
      const bodyB = pair.bodyB

      if (bodyA.label.startsWith('fruit-') && bodyB.label.startsWith('fruit-')) {
        handleFruitCollision(bodyA, bodyB)
      }
    })
  })
}

const createWalls = () => {
  if (!gameField.value) return

  // Feste Größe verwenden
  const width = PHYSICS_CONFIG.board.width
  const height = PHYSICS_CONFIG.board.height
  const thickness = PHYSICS_CONFIG.board.thickness

  // Boden
  const ground = Matter.Bodies.rectangle(
    width / 2,
    height - thickness / 2,
    width,
    thickness,
    {
      isStatic: true,
      label: 'ground',
      restitution: PHYSICS_CONFIG.walls.restitution,
      friction: PHYSICS_CONFIG.walls.friction
    }
  )

  // Linke Wand
  const leftWall = Matter.Bodies.rectangle(
    thickness / 2,
    height / 2,
    thickness,
    height,
    {
      isStatic: true,
      label: 'leftWall',
      restitution: PHYSICS_CONFIG.walls.restitution,
      friction: PHYSICS_CONFIG.walls.friction
    }
  )

  // Rechte Wand
  const rightWall = Matter.Bodies.rectangle(
    width - thickness / 2,
    height / 2,
    thickness,
    height,
    {
      isStatic: true,
      label: 'rightWall',
      restitution: PHYSICS_CONFIG.walls.restitution,
      friction: PHYSICS_CONFIG.walls.friction
    }
  )

  walls.value = [ground, leftWall, rightWall]
  Matter.World.add(world.value, walls.value)
}

const getRandomFruit = () => {
  const weights = FRUIT_SPAWN_WEIGHTS
  const random = Math.random()
  let cumulative = 0

  for (const [fruitType, weight] of Object.entries(weights)) {
    cumulative += weight
    if (random <= cumulative) {
      return FRUIT_TYPES[fruitType]
    }
  }

  // Fallback zur ersten Frucht
  return FRUIT_TYPES.BLUEBERRY
}

const generateNewDropFruit = () => {
  if (dropCooldown.value) return

  const fruit = getRandomFruit()
  dropFruit.value = {
    ...fruit,
    id: `drop-${Date.now()}`,
    x: 50,
    y: 10,
    isDropping: false
  }

  isDropReady.value = true
}

const updateDropPosition = (event) => {
  const now = Date.now()
  if (now - lastMouseUpdate.value < 16) return // 60fps throttling
  lastMouseUpdate.value = now

  if (!isDropReady.value || !gameField.value) return

  const fieldRect = gameField.value.getBoundingClientRect()
  const relativeX = ((event.clientX - fieldRect.left) / PHYSICS_CONFIG.board.width) * 100

  const fruitRadius = dropFruit.value?.radius || 20
  const paddingPercent = (fruitRadius / PHYSICS_CONFIG.board.width) * 100
  const clampedX = Math.max(paddingPercent, Math.min(100 - paddingPercent, relativeX))

  if (dropFruit.value) {
    dropFruit.value.x = clampedX
  }
}

const startDragging = (event) => {
  if (!isDropReady.value) return

  isDragging.value = true
  updateDropPosition(event)
}

const continueDragging = (event) => {
  if (!isDragging.value || !isDropReady.value) return

  updateDropPosition(event)
}

const dropFruitIntoField = () => {
  if (!isDragging.value || !isDropReady.value || !dropFruit.value) return

  isDragging.value = false
  isDropReady.value = false
  dropCooldown.value = true

  createPhysicalFruit(dropFruit.value)

  dropFruit.value = null
  dropCooldown.value = true

  setTimeout(() => {
    dropCooldown.value = false
    generateNewDropFruit()
  }, PHYSICS_CONFIG.dropCooldown)

  moves.value++
}

const createMergeVisualEffects = (mergeX, mergeY, newFruitType) => {
  createMergeParticles(mergeX, mergeY, newFruitType)
}

const createMergeParticles = (x, y, fruitType) => {
  const particleCount = Math.min(fruitType.index + 2, 8)

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
      size: 4 + Math.random() * 4
    }

    particles.value.push(particle)

    // Remove particle after animation
    setTimeout(() => {
      particles.value = particles.value.filter(p => p.id !== particle.id)
    }, PHYSICS_CONFIG.sparkleDelay)
  }
}

const createPhysicalFruit = (fruitData, customX = null, customY = null) => {
  if (!gameField.value || !world.value) return

  const width = PHYSICS_CONFIG.board.width
  const height = PHYSICS_CONFIG.board.height

  const absoluteX = customX !== null ? customX : (fruitData.x / 100) * width
  const absoluteY = customY !== null ? customY : (fruitData.y / 100) * height

  const body = Matter.Bodies.circle(
    absoluteX,
    absoluteY,
    fruitData.radius,
    {
      label: `fruit-${fruitData.id}`,
      restitution: PHYSICS_CONFIG.fruit.restitution,
      friction: PHYSICS_CONFIG.fruit.friction,
      frictionAir: PHYSICS_CONFIG.fruit.frictionAir,
      density: PHYSICS_CONFIG.fruit.density,
      sleepThreshold: 300,
      collisionFilter: PHYSICS_CONFIG.fruit.collisionFilter,
      render: { fillStyle: fruitData.color },
      fruitType: fruitData.type,
      fruitData: {
        ...fruitData,
        id: fruitData.id,
        type: fruitData.type
      }
    }
  )

  // HTML Element erstellen
  const fruitElement = createFruitElement(fruitData)

  Matter.World.add(world.value, body)

  const fruitObject = {
    body: body,
    data: fruitData,
    element: fruitElement,
    id: fruitData.id,
    lastX: null,
    lastY: null,
    lastRotation: null
  }

  fruits.value.push(fruitObject)

  const container = gameField.value.querySelector('.fruits-container')
  if (container) {
    container.appendChild(fruitElement)
  }

  // Apply pop effect for merged fruits
  if (fruitData.id.startsWith('merged-')) {
    setTimeout(() => {
      if (body) {
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 2,
          y: -3
        })
      }
    }, 50)
  }

  console.log('Optimized fruit created:', fruitData.emoji, 'at', absoluteX, absoluteY)
}

const createFruitElement = (fruitData) => {
  const element = document.createElement('div')
  element.className = 'physics-fruit'
  element.id = `fruit-${fruitData.id}`

  const size = fruitData.radius * 2
  element.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    pointer-events: none;
    z-index: 10;
    will-change: transform;
    transform: translateZ(0);
    backface-visibility: hidden;
    contain: layout style paint size;
    transition: opacity 0.15s ease;
  `

  element.innerHTML = fruitData.svg
  return element
}

const checkGameOver = () => {
  if (gameOver.value || gameState.value !== 'playing' || !isPhysicsReady.value) {
    return false
  }

  const warningHeight = PHYSICS_CONFIG.warningZone
  let fruitsInDanger = 0

  for (let i = 0; i < fruits.value.length && fruitsInDanger < PHYSICS_CONFIG.fruitsInDanger; i++) {
    const fruit = fruits.value[i]
    if (!fruit.body) continue

    if (fruit.body.position.y < warningHeight) {
      fruitsInDanger++

      if (fruit.element && !fruit.element.classList.contains('fruit-warning')) {
        fruit.element.classList.add('fruit-warning')
      }

      if (fruitsInDanger >= 3) {
        triggerGameOver()
        return true
      }
    } else {
      if (fruit.element && fruit.element.classList.contains('fruit-warning')) {
        fruit.element.classList.remove('fruit-warning')
      }
    }
  }

  return false
}

const triggerGameOver = () => {
  if (gameOver.value) return

  console.log('Game Over triggered!')
  gameOver.value = true
  gameState.value = 'gameOver'

  // Alle Timer stoppen
  stopTimer()
  stopGameOverTimer()
  comboSystem.cleanup()

  canDropFruit.value = false
  showNextFruit.value = false

  fruits.value.forEach(fruit => {
    if (fruit.element) {
      fruit.element.classList.add('fruit-game-over')
    }
  })
}

const handleTryAgain = () => {
  gameOver.value = false

  fruits.value.forEach(fruit => {
    if (fruit.element) {
      fruit.element.classList.remove('fruit-warning', 'fruit-game-over')
    }
  })

  startLevel(currentLevel.value)
}

const handleMouseDown = (event) => {
  if (!isPhysicsReady.value) return
  startDragging(event)
}

const handleMouseMove = (event) => {
  if (!isPhysicsReady.value) return
  continueDragging(event)
}

const handleMouseUp = () => {
  if (!isPhysicsReady.value) return
  dropFruitIntoField()
}

const handleMouseLeave = () => {
  isDragging.value = false
}

const handleFruitCollision = (fruitA, fruitB) => {
  // Get fruit data from physics bodies
  const fruitDataA = fruitA.fruitData
  const fruitDataB = fruitB.fruitData

  // Check if fruits are the same type and can merge
  if (fruitDataA.type === fruitDataB.type && fruitDataA.nextType) {
    // Prevent multiple merges on same fruits
    const fruitObjectA = fruits.value.find(f => f.id === fruitDataA.id)
    const fruitObjectB = fruits.value.find(f => f.id === fruitDataB.id)

    if (fruitObjectA?.merging || fruitObjectB?.merging) return

    // Mark fruits as merging
    if (fruitObjectA) fruitObjectA.merging = true
    if (fruitObjectB) fruitObjectB.merging = true

    // Calculate merge position (center between two fruits)
    const mergeX = (fruitA.position.x + fruitB.position.x) / 2
    const mergeY = (fruitA.position.y + fruitB.position.y) / 2

    // Remove old fruits after short delay for visual effect
    setTimeout(() => {
      performFruitMerge(fruitA, fruitB, fruitDataA, fruitDataB, mergeX, mergeY)
    }, 150)
  }
}

const performFruitMerge = (bodyA, bodyB, fruitDataA, fruitDataB, mergeX, mergeY) => {
  // Remove physics bodies
  Matter.Composite.remove(world.value, [bodyA, bodyB])

  // Remove fruit objects from array
  fruits.value = fruits.value.filter(f =>
    f.id !== fruitDataA.id && f.id !== fruitDataB.id
  )

  // Remove DOM elements with fade effect
  const elementA = document.getElementById(`fruit-${fruitDataA.id}`)
  const elementB = document.getElementById(`fruit-${fruitDataB.id}`)

  if (elementA) {
    elementA.style.opacity = '0'
    elementA.style.transform = 'scale(0.8)'
    setTimeout(() => elementA.remove(), 150)
  }
  if (elementB) {
    elementB.style.opacity = '0'
    elementB.style.transform = 'scale(0.8)'
    setTimeout(() => elementB.remove(), 150)
  }

  // Get next fruit type from configuration
  const nextFruitType = FRUIT_TYPES[fruitDataA.nextType]
  if (!nextFruitType) return

  // Create visual effects BEFORE creating new fruit
  createMergeVisualEffects(mergeX, mergeY, nextFruitType)

  // Create new merged fruit with pop effect
  const mergedFruit = {
    id: `merged-${Date.now()}-${Math.random()}`,
    type: nextFruitType.type,
    emoji: nextFruitType.emoji,
    radius: nextFruitType.radius,
    nextType: nextFruitType.nextType,
    color: nextFruitType.color,
    svg: nextFruitType.svg,
    scoreValue: nextFruitType.scoreValue,
    merging: false
  }

  // Add merged fruit to physics world with pop effect
  const spawnY = mergeY - PHYSICS_CONFIG.popEffect.spawnOffset
  createPhysicalFruit(mergedFruit, mergeX, spawnY)

  // Apply upward pop force after configurable delay
  setTimeout(() => {
    const newFruitBody = fruits.value.find(f => f.id === mergedFruit.id)?.body
    if (newFruitBody) {
      // Konfigurierbare Pop-Kraft
      Matter.Body.setVelocity(newFruitBody, {
        x: (Math.random() - 0.5) * PHYSICS_CONFIG.popEffect.horizontalVariation,
        y: PHYSICS_CONFIG.popEffect.upwardForce
      })
    }
  }, PHYSICS_CONFIG.popEffect.delay)

  // Update game statistics
  const baseScore = nextFruitType.scoreValue
  handleFruitMerge(nextFruitType.type, baseScore)

  console.log(`Merged ${fruitDataA.type} + ${fruitDataB.type} → ${nextFruitType.type}`)
}

const checkLevelCompletion = () => {
  const targetType = targetFruit.value
  const requiredCount = targetCount.value
  const currentCount = fruitsCreated.value[targetType] || 0

  console.log(`Level check: ${currentCount}/${requiredCount} ${targetType} created`)

  if (currentCount >= requiredCount && !targetReached.value) {
    targetReached.value = true
    console.log(`Level completed! Target reached: ${currentCount}/${requiredCount}`)

    // Add visual feedback delay before completing
    setTimeout(() => {
      completeGame()
    }, 1000)
  }
}

const cleanupPhysics = () => {
  isRenderingActive.value = false

  // Stoppe Timer
  stopGameOverTimer()

  // Cleanup Physics
  if (engine.value) {
    Matter.Events.off(engine.value)
    Matter.World.clear(engine.value.world)
    Matter.Engine.clear(engine.value)
  }

  // DOM cleanup
  const container = gameField.value?.querySelector('.fruits-container')
  if (container) {
    container.innerHTML = ''
  }

  // Reset state
  fruits.value = []
  walls.value = []
  dropFruit.value = null
  isDragging.value = false
  isDropReady.value = false
  isPhysicsReady.value = false
  gameOver.value = false
}

const dropFruitSvg = computed(() => {
  if (!dropFruit.value) return ''
  return dropFruit.value.svg
})

const startTimer = () => {
  timer.value = setInterval(() => {
    timeElapsed.value++
  }, 1000)
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

// Game actions
const handleFruitMerge = (fruitType, points) => {
  // Add combo for successful merge
  const comboResult = comboSystem.addCombo()
  console.log('Combo added:', comboResult)

  // Calculate score with combo multiplier
  const comboMultipliedScore = Math.round(points * comboResult.multiplier)
  score.value += comboMultipliedScore

  // Track merge statistics
  merges.value++

  // Track created fruits (zentrale Zählung hier)
  if (!fruitsCreated.value[fruitType]) {
    fruitsCreated.value[fruitType] = 0
  }
  fruitsCreated.value[fruitType]++

  console.log(`Created ${fruitType}, total: ${fruitsCreated.value[fruitType]}`)

  // Check if game is complete
  checkLevelCompletion()
}

const completeGame = () => {
  stopTimer()
  comboSystem.cleanup()
  gameState.value = 'completed'

  // Calculate final score
  const gameScore = finalScore.value
  score.value = gameScore

  // Prepare level completion data
  const levelResult = {
    completed: true,
    score: gameScore,
    time: timeElapsed.value,
    moves: moves.value
  }

  // Update level statistics
  updateLevelStats('fruitMerge', currentLevel.value, levelResult)

  // Update overall game statistics
  const gameStats = {
    gamesPlayed: gameData.games.fruitMerge.gamesPlayed + 1,
    totalScore: gameData.games.fruitMerge.totalScore + gameScore,
    highScore: Math.max(gameData.games.fruitMerge.highScore, gameScore),
    totalMerges: gameData.games.fruitMerge.totalMerges + merges.value,
    maxLevel: Math.max(gameData.games.fruitMerge.maxLevel, currentLevel.value)
  }

  updateGameStats('fruitMerge', gameStats)

  // Check for achievements and track new ones
  const achievementsBefore = [...gameData.achievements]
  checkLevelAchievements()
  const achievementsAfter = [...gameData.achievements]

  // Find newly earned achievements
  const newAchievements = achievementsAfter.filter(after =>
    !achievementsBefore.some(before => before.id === after.id && before.earned)
  )
  earnedAchievements.value = newAchievements

  addScore(gameScore)
  addExperience(75) // More XP for FruitMerge

  // Check for achievements
  checkLevelAchievements()

  emit('game-complete', {
    level: currentLevel.value,
    score: gameScore,
    time: timeElapsed.value,
    moves: moves.value
  })
}

const checkLevelAchievements = () => {
  checkGameLevelAchievements('fruitMerge', currentLevel.value)
}

const resetGame = () => {
  startLevel(currentLevel.value);
}

const pauseGame = () => {
  if (gameState.value === 'playing') {
    stopTimer()
    gameState.value = 'paused'
  }
}

const resumeGame = () => {
  if (gameState.value === 'paused') {
    startTimer()
    gameState.value = 'playing'
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

const startLevel = (levelNumber) => {
  console.log(`Starting level ${levelNumber}`)

  // Alle Timer stoppen
  stopTimer()
  stopGameOverTimer()
  comboSystem.resetCombo()

  // Physics cleanup
  cleanupPhysics()

  // Reset all game state
  fruitsCreated.value = {}
  targetReached.value = false
  gameComplete.value = false
  gameOver.value = false // Game Over State zurücksetzen
  score.value = 0
  moves.value = 0
  merges.value = 0
  timeElapsed.value = 0
  gameState.value = 'playing'
  earnedAchievements.value = []

  // Reset visual effects
  mergeEffects.value = []
  particles.value = []

  // Reset drop system
  dropFruit.value = null
  isDragging.value = false
  isDropReady.value = false
  dropCooldown.value = false

  // Start both timers
  startTimer()
  startGameOverTimer() // Game Over Timer starten

  // Initialize physics for the level
  nextTick(() => {
    setTimeout(() => {
      initializePhysics()
      setTimeout(() => {
        generateNewDropFruit()
      }, 200)
    }, 100)
  })
}

const backToGaming = () => {
  stopTimer()
  emit('back-to-gaming')
}

const calculateCurrentStars = () => {
  if (!isGameComplete.value) return 0
  return calculateLevelStars(
    { score: finalScore.value, moves: moves.value, completed: true },
    currentLevelConfig.value
  )
}

const handleTouchStart = (event) => {
  event.preventDefault()
  startDragging(event.touches[0])
}

const handleTouchMove = (event) => {
  event.preventDefault()
  continueDragging(event.touches[0])
}

const handleTouchEnd = (event) => {
  event.preventDefault()
  dropFruitIntoField()
}

// Lifecycle hooks
onMounted(() => {
  initializeGame()
})

onUnmounted(() => {
  stopTimer()
  stopGameOverTimer()
  comboSystem.cleanup()
  cleanupPhysics()
})
</script>

<template>
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
          :total-stars="gameProgress.totalStars"
          :max-stars="gameProgress.maxStars"
          theme="warning"
          size="small"
          :levels-label="targetFruit"
          :show-stars="false"
          :show-percentage="true"
          :complete-label="t('fruitMerge.target')"
        />

        <!-- Game Performance Stats -->
        <PerformanceStats
          :score="score"
          :time-elapsed="timeElapsed"
          :moves="moves"
          :matches="merges"
          :total-pairs="targetCount"
          :combo-count="comboSystem.comboCount.value"
          :combo-multiplier="comboSystem.comboMultiplier.value"
          :max-combo="gameData.games.fruitMerge.maxCombo || 0"
          :combo-time-remaining="comboSystem.timeRemaining.value"
          :combo-time-max="comboSystem.config.comboTimeout"
          :is-combo-active="comboSystem.isComboActive.value"
          layout="horizontal"
          theme="card"
          size="normal"
          :show-score="true"
          :show-time="true"
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

    <!-- Game Playing State -->
    <div v-if="gameState === 'playing' || gameState === 'paused'" class="game-board">
      <!-- Game Controls -->
      <GameControls
        :game-state="gameState"
        :pause-label="t('controls.pause')"
        :resume-label="t('controls.resume')"
        :reset-label="t('controls.reset')"
        :back-label="t('common.back')"
        @pause-game="pauseGame"
        @resume-game="resumeGame"
        @reset-game="resetGame"
        @back-to-gaming="backToGaming"
      />

      <!-- Game Field -->
      <div class="game-field">
        <!-- Physik Spielfeld -->
        <div
          ref="gameField"
          class="physics-field"
          :class="{
            'physics-ready': isPhysicsReady,
            'dragging': isDragging,
            'drop-ready': isDropReady
          }"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <!-- Früchte Container -->
          <div class="fruits-container">
            <!-- Physik-Früchte werden hier dynamisch eingefügt -->
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

          <!-- Drop Frucht -->
          <div
            v-if="dropFruit && isDropReady"
            class="drop-fruit"
            :class="{ 'is-dragging': isDragging }"
            :style="{
              left: `${dropFruit.x}%`,
              top: `${dropFruit.y}%`,
              width: `${dropFruit.radius * 2}px`,
              height: `${dropFruit.radius * 2}px`
            }"
          >
            <div class="fruit-svg-container drop-svg" v-html="dropFruitSvg"></div>
          </div>

          <!-- Drop Guidelines -->
          <div v-if="isDragging" class="drop-guidelines">
            <div class="drop-line" :style="{ left: `${dropFruit.x}%` }"></div>
          </div>

          <!-- Game Over Warning Zone -->
          <div
            class="warning-zone"
            :style="{ height: `${currentLevelConfig.gameOverHeight}px` }"
          ></div>
        </div>
      </div>
    </div>
    <div class="demo-controls">
      <div class="drop-info">
        <p v-if="dropFruit">
          Nächste: {{ dropFruit.emoji }} ({{ dropFruit.radius * 2 }}px)
        </p>
        <p v-else-if="dropCooldown" class="cooldown-text">
          Cooldown aktiv...
        </p>
        <p v-else class="waiting-text">
          Bereit zum Droppen
        </p>
        <p class="game-info">
          Früchte: {{ fruits.length }} | Ziel: {{ targetFruit }}
        </p>
      </div>

      <div class="demo-buttons">
        <button class="btn btn--small" @click="generateNewDropFruit" :disabled="!isPhysicsReady || dropCooldown">
          Neue Frucht
        </button>
        <button class="btn btn--small" @click="() => { fruits.forEach(f => { if(f.element) f.element.remove(); Matter.World.remove(world, f.body) }); fruits.splice(0) }">
          Feld leeren
        </button>
      </div>
    </div>
    <!-- Game Completed State -->
    <GameCompletedModal
      :visible="gameState === 'completed' || gameState === 'gameOver'"
      :level="currentLevel"
      :game-title="t('fruitMerge.title')"
      :final-score="finalScore"
      :time-elapsed="timeElapsed"
      :moves="moves"
      :matches="merges"
      :total-pairs="targetCount"
      :stars-earned="calculateCurrentStars()"
      :show-stars="gameState === 'completed'"
      :new-achievements="earnedAchievements"
      :show-achievements="gameState === 'completed'"
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

<style lang="scss">
.fruit-merge-game {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  min-height: calc(100vh - 80px);
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
}

.game-stats-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

// Game Board
.game-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
  position: relative;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-secondary);
}

.placeholder-content h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.placeholder-content p {
  font-size: var(--font-size-base);
  margin: 0;
}

.target-info {
  background-color: var(--warning-color);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}


// Game Field
.game-field {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  position: relative;
  overflow: hidden;
  min-height: 320px;
}

.physics-field {
  // Exakt die Größe aus PHYSICS_CONFIG
  width: 280px;
  height: 320px;
  position: relative;
  background: linear-gradient(to bottom,
    transparent 0%,
    transparent 70%,
    rgba(245, 158, 11, 0.1) 85%,
    rgba(239, 68, 68, 0.1) 100%
  );
  border: 2px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;

  &.physics-ready {
    cursor: crosshair;
  }

  &.drop-ready {
    cursor: pointer;
  }

  &.dragging {
    cursor: grabbing;
  }
}

.physics-fruit {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  transform: translateZ(0);
  will-change: transform;
  contain: layout style paint size;
  transition: none;

  &.fruit-sleeping {
    will-change: auto;
  }
}

.fruit-svg-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    shape-rendering: optimizeSpeed;
    image-rendering: optimizeSpeed;
  }
}

// Drop SVG spezifische Styles
.drop-svg {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  transition: filter 0.2s ease;

  .is-dragging & {
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3));
  }

  svg {
    animation: dropBob 2s ease-in-out infinite;
  }
}

@keyframes dropBob {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
}

.fruits-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transform: translateZ(0);
  will-change: transform;
  contain: layout style paint;
}

// Drop Zone
.drop-zone {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.drop-indicator {
  width: 40px;
  height: 40px;
  border: 2px dashed var(--warning-color);
  border-radius: 50%;
  background-color: rgba(245, 158, 11, 0.1);
  animation: dropPulse 2s infinite;
}

.drop-fruit {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 20;
  transition: all 0.1s ease;

  &.is-dragging {
    transition: none;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }
}

.fruit-visual {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 20%;
    width: 30%;
    height: 30%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    filter: blur(4px);
  }
}

.fruit-emoji {
  font-size: 1.2em;
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

// Drop Guidelines
.drop-guidelines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 15;
}

.drop-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom,
    var(--warning-color) 0%,
    transparent 30%,
    transparent 70%,
    var(--warning-color) 100%
  );
  transform: translateX(-50%);
  opacity: 0.6;
  animation: dropLineGlow 1s infinite alternate;
}

@keyframes dropLineGlow {
  from { opacity: 0.4; }
  to { opacity: 0.8; }
}

// Warning Zone
.warning-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom,
    rgba(239, 68, 68, 0.0) 0%,
    rgba(239, 68, 68, 0.15) 100%
  );
  border-bottom: 2px dashed var(--error-color);
  pointer-events: none;
  z-index: 5;
}

// Loading State anpassen
.field-loading {
  width: 280px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  background-color: var(--bg-secondary);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-secondary);
  padding: var(--space-4);
  text-align: center;
}

// Loading State
.field-loading {
  padding: var(--space-6);
  text-align: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-secondary);
}

.loading-content h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.loading-content p {
  font-size: var(--font-size-base);
  margin: 0;
}

@keyframes dropLineGlow {
  from { opacity: 0.4; }
  to { opacity: 0.8; }
}

// Warning Zone erweitern
.warning-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom,
    rgba(239, 68, 68, 0.0) 0%,
    rgba(239, 68, 68, 0.1) 100%
  );
  border-bottom: 1px dashed var(--error-color);
  pointer-events: none;
  z-index: 5;
}

.fruit-warning {
  animation: warningPulse 1s infinite;
  filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8));
}

.fruit-game-over {
  opacity: 0.6;
  filter: grayscale(50%);
}

@keyframes warningPulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 12px rgba(239, 68, 68, 1));
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
  width: 8px;
  height: 8px;
  border-radius: 50%;
  z-index: 45;
  animation: particlePop 2s cubic-bezier(0.02, 0.91, 1, 1.37) forwards;
  box-shadow:
    0 0 6px rgba(0, 0, 0, 1),
    0 0 12px rgba(255, 255, 255, 0.5),
    0 0 18px var(--particle-color, #FFD700);
}

@keyframes particlePop {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(3);
  }
  25% {
    opacity: 1;
    transform: translate(calc(var(--particle-x) * 0.4), calc(var(--particle-y) * 0.4)) scale(1.5);
  }
  100% {
    opacity: 0;
    transform: translate(var(--particle-x), var(--particle-y)) scale(0.2);
  }
}

// Demo Controls
.demo-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
  max-width: 280px;
  margin: 0 auto;
}

.drop-info {
  text-align: center;
  font-size: var(--font-size-sm);

  p {
    margin: var(--space-1) 0;
  }

  .cooldown-text {
    color: var(--warning-color);
    font-weight: var(--font-weight-bold);
  }

  .waiting-text {
    color: var(--success-color);
    font-weight: var(--font-weight-bold);
  }

  .game-info {
    color: var(--text-muted);
    font-size: var(--font-size-xs);
  }
}

.demo-buttons {
  display: flex;
  gap: var(--space-2);
}
</style>