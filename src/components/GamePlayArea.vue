<script setup>
import {ref, onMounted, onUnmounted, watch, nextTick, computed} from 'vue'
import Matter from 'matter-js'
import {
  PHYSICS_CONFIG,
  FRUIT_TYPES,
  LEVEL_GOALS,
  POINTS_CONFIG,
  FRUIT_SPAWN_WEIGHTS,
  COMBO_CONFIG
} from '../../config/fruitMergeGameConfig.js'
import { useLevelGoals } from '../../composables/useLevelGoals.js'
import { useComboSystem } from '../../composables/useComboSystem.js'
import LevelCompletionOverlay from '../LevelCompletionOverlay/LevelCompletionOverlay.vue'

const props = defineProps({
  currentLevel: { type: Number, required: true },
  currentSession: { type: Object, required: true },
  isGameActive: { type: Boolean, default: false },
  isGamePaused: { type: Boolean, default: false }
})

const emit = defineEmits([
  'move-made',
  'score-update',
  'game-over',
  'level-completed'
])

const fruitTypes = Object.values(FRUIT_TYPES).map(fruit => ({
  size: fruit.radius * 2,
  color: fruit.color,
  level: fruit.id,
  name: fruit.emoji.split(' ')[0],
  points: fruit.scoreValue,
  gradient: fruit.gradient,
  svg: fruit.svg
}))

const levelCompletionState = ref(null)
const showCompletionOverlay = ref(false)
const dangerZoneHeight = ref(LEVEL_GOALS[props.currentLevel]?.gameOverHeight)
const gameOver = ref(false) // ✅ HINZUGEFÜGT: Game Over State
const topViolations = ref({}) // Track violations per fruit
const gameOverDelay = 2000 // 2 Sekunden Wartezeit
const floatingScores = ref([])
const nextScoreId = ref(0)

// Level Goals Integration
const { getLevelGoal, calculateStars, getLevelCompletionData, isLevelCompleted } = useLevelGoals()

// Game State
const gameBoard = ref(null)
const fruits = ref([])
const nextFruitId = ref(0)
const nextFruit = ref(generateFruit())
const dropPosition = ref(PHYSICS_CONFIG.board.width / 2)
const canDropFruit = ref(true)
const dropCooldown = ref(false)
const isDragging = ref(false)
const gameOverCheckInterval = ref(null)
const currentHighestFruit = ref('BLUEBERRY')
const targetFruitsCreated = ref(0)

// Physics Engine
let engine = null
let runner = null
let walls = []

// Combo System Integration
const {
  comboState,
  handleComboMerge,
  resetCombo
} = useComboSystem(emit)

defineExpose({
  comboState,
  currentHighestFruit,
  targetFruitCount: computed(() => targetFruitsCreated.value)
})

// Generate New Fruit Function
function generateFruit() {
  const randomIndex = Math.floor(Math.random() * 4)
  const fruitType = fruitTypes[randomIndex]

  return {
    id: nextFruitId.value++,
    level: fruitType.level,
    size: fruitType.size,
    color: fruitType.color,
    name: fruitType.name,
    points: fruitType.points,
    x: 0,
    y: 0,
    rotation: 0,
    body: null,
    merging: false,
    isNew: false
  }
}

const getFruitSvg = (level) => {
  const fruitType = Object.values(FRUIT_TYPES).find(fruit => fruit.id === level)
  if (!fruitType) return ''
  return fruitType.svg || `<circle cx="32" cy="32" r="30" fill="${fruitType.color}"/>`
}

function initPhysics() {
  engine = Matter.Engine.create({
    gravity: { x: 0, y: 0.8, scale: 0.001 },
    constraintIterations: 2,
    positionIterations: 6,
    velocityIterations: 4
  })

  runner = Matter.Runner.create({
    delta: 1000 / 60,
    isFixed: true
  })

  walls = [
    Matter.Bodies.rectangle(
      PHYSICS_CONFIG.board.width / 2,
      PHYSICS_CONFIG.board.height + PHYSICS_CONFIG.board.thickness / 2,
      PHYSICS_CONFIG.board.width,
      PHYSICS_CONFIG.board.thickness,
      {
        isStatic: true,
        label: 'wall-bottom',
        restitution: 0.3,
        friction: 0.8
      }
    ),
    Matter.Bodies.rectangle(
      -PHYSICS_CONFIG.board.thickness / 2,
      PHYSICS_CONFIG.board.height / 2,
      PHYSICS_CONFIG.board.thickness,
      PHYSICS_CONFIG.board.height,
      {
        isStatic: true,
        label: 'wall-left',
        restitution: 0.3,
        friction: 0.8
      }
    ),
    Matter.Bodies.rectangle(
      PHYSICS_CONFIG.board.width + PHYSICS_CONFIG.board.thickness / 2,
      PHYSICS_CONFIG.board.height / 2,
      PHYSICS_CONFIG.board.thickness,
      PHYSICS_CONFIG.board.height,
      {
        isStatic: true,
        label: 'wall-right',
        restitution: 0.3,
        friction: 0.8
      }
    )
  ]

  Matter.Composite.add(engine.world, walls)
  Matter.Events.on(engine, 'collisionStart', handleCollision)
  Matter.Runner.run(runner, engine)

  updateFruitPositions()
  startGameOverCheck()
}

function updateFruitPositions() {
  if (!engine || gameOver.value) return

  const fruitsToUpdate = fruits.value.filter(fruit => fruit.body)

  fruitsToUpdate.forEach(fruit => {
    const pos = fruit.body.position
    const newX = pos.x - fruit.size / 2
    const newY = pos.y - fruit.size / 2
    const newRotation = fruit.body.angle * (180 / Math.PI)

    if (Math.abs(fruit.x - newX) > 0.1 ||
      Math.abs(fruit.y - newY) > 0.1 ||
      Math.abs(fruit.rotation - newRotation) > 0.5) {
      fruit.x = newX
      fruit.y = newY
      fruit.rotation = newRotation
    }
  })

  requestAnimationFrame(updateFruitPositions)
}

function handleCollision(event) {
  const pairs = event.pairs

  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair

    if (bodyA.label.startsWith('fruit-') && bodyB.label.startsWith('fruit-')) {
      const fruitDataA = bodyA.label.split('-')
      const fruitDataB = bodyB.label.split('-')

      const idA = parseInt(fruitDataA[1])
      const idB = parseInt(fruitDataB[1])
      const levelA = parseInt(fruitDataA[2])
      const levelB = parseInt(fruitDataB[2])

      if (levelA === levelB && levelA < fruitTypes.length) {
        const fruitA = fruits.value.find(f => f.id === idA)
        const fruitB = fruits.value.find(f => f.id === idB)

        if (fruitA && fruitB && !fruitA.merging && !fruitB.merging) {
          mergeFruits(fruitA, fruitB, bodyA, bodyB)
        }
      }
    }
  })
}

function mergeFruits(fruitA, fruitB, bodyA, bodyB) {
  fruitA.merging = true
  fruitB.merging = true

  const centerX = (bodyA.position.x + bodyB.position.x) / 2
  const centerY = (bodyA.position.y + bodyB.position.y) / 2
  const baseScore = fruitA.points
  const finalScore = handleComboMerge(baseScore)
  const comboMultiplier = finalScore / baseScore
  const comboMessage = COMBO_CONFIG.comboMessage[comboState.value.current] || ''
  createFloatingScore(centerX, centerY - 20, finalScore, comboMultiplier, comboMessage)

  emit('score-update', finalScore)

  setTimeout(() => {
    Matter.Composite.remove(engine.world, bodyA)
    Matter.Composite.remove(engine.world, bodyB)

    fruits.value = fruits.value.filter(f => f.id !== fruitA.id && f.id !== fruitB.id)

    if (fruitA.level < fruitTypes.length) {
      const newFruitType = fruitTypes[fruitA.level]
      const newFruit = {
        id: nextFruitId.value++,
        level: newFruitType.level,
        size: newFruitType.size,
        color: newFruitType.color,
        name: newFruitType.name,
        points: newFruitType.points,
        x: centerX - newFruitType.size / 2,
        y: centerY - newFruitType.size / 2,
        rotation: 0,
        body: null,
        merging: false,
        isNew: true
      }

      addMergedFruit(newFruit, centerX, centerY)
      checkTargetFruitCreation(newFruit.level)
    }

    updateHighestFruit()
    checkLevelCompletion()
  }, 150)
}


function addMergedFruit(fruit, x, y) {
  const fruitBody = Matter.Bodies.circle(x, y, fruit.size / 2, {
    restitution: 0.4,
    friction: 0.6,
    frictionAir: 0.01,
    density: 0.001,
    label: `fruit-${fruit.id}-${fruit.level}`
  })

  fruit.body = fruitBody
  Matter.Body.setVelocity(fruitBody, { x: 0, y: -1 })
  Matter.Composite.add(engine.world, fruitBody)
  fruits.value.push(fruit)

  setTimeout(() => {
    fruit.isNew = false
  }, 500)
}

function dropFruit(event) {
  if (!canDropFruit.value || dropCooldown.value || !isDragging.value) {
    isDragging.value = false
    return
  }

  event.preventDefault()
  isDragging.value = false

  const newFruit = { ...nextFruit.value }

  const safeDropX = Math.max(
    newFruit.size / 2 + PHYSICS_CONFIG.board.thickness,
    Math.min(PHYSICS_CONFIG.board.width - newFruit.size / 2 - PHYSICS_CONFIG.board.thickness, dropPosition.value)
  )

  addFruitToWorld(newFruit, safeDropX, -newFruit.size)
}

function addFruitToWorld(fruit, x, y) {
  dropCooldown.value = true
  canDropFruit.value = false

  const fruitBody = Matter.Bodies.circle(x, y, fruit.size / 2, {
    restitution: 0.5,
    friction: 0.7,
    frictionAir: 0.01,
    density: 0.001,
    label: `fruit-${fruit.id}-${fruit.level}`
  })

  fruit.body = fruitBody
  fruit.x = x - fruit.size / 2
  fruit.y = y - fruit.size / 2
  fruit.isNew = true

  Matter.Composite.add(engine.world, fruitBody)
  fruits.value.push(fruit)
  updateHighestFruit()

  nextFruit.value = generateFruit()
  emit('move-made')

  setTimeout(() => {
    dropCooldown.value = false
    canDropFruit.value = true
    fruit.isNew = false
  }, PHYSICS_CONFIG.dropCooldown)
}

function updateHighestFruit() {
  if (fruits.value.length === 0) {
    currentHighestFruit.value = 'BLUEBERRY'
    return
  }

  // Finde höchste Frucht
  const fruitLevels = fruits.value.map(f => f.level)
  const highestLevel = Math.max(...fruitLevels, 1)

  // Finde entsprechenden Frucht-Key
  const fruitKey = Object.keys(FRUIT_TYPES).find(key => FRUIT_TYPES[key].id === highestLevel)
  if (fruitKey) {
    currentHighestFruit.value = fruitKey
  }
}

function checkTargetFruitCreation(newFruitLevel) {
  const goal = getLevelGoal(props.currentLevel)
  if (!goal) return

  const targetFruitType = FRUIT_TYPES[goal.targetFruit]
  if (!targetFruitType) return

  if (newFruitLevel === targetFruitType.id) {
    targetFruitsCreated.value++
    console.log(`🎯 Target fruit created! Total: ${targetFruitsCreated.value}/${goal.starThresholds[1]?.targetCount || 1}`)
  }
}

function createFloatingScore(x, y, points, comboMultiplier = 1, comboMessage = '') {
  const scoreId = nextScoreId.value++

  const floatingScore = {
    id: scoreId,
    x: x,
    y: y,
    startY: y,
    points: points,
    comboMultiplier: comboMultiplier,
    isCombo: comboMultiplier > 1,
    comboMessage: comboMessage,
    opacity: 1,
    scale: 1,
    animationProgress: 0
  }

  floatingScores.value.push(floatingScore)

  // Animation starten
  animateFloatingScore(floatingScore)

  // Score nach Animation entfernen
  setTimeout(() => {
    removeFloatingScore(scoreId)
  }, POINTS_CONFIG.DURATION)
}

function animateFloatingScore(score) {
  const startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / POINTS_CONFIG.DURATION, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    score.y = score.startY - (easeOut * POINTS_CONFIG.MAX_DISTANCE) // Von startY aus 60px nach oben
    score.opacity = 1 - (progress * progress) // Fade out mit ease
    score.scale = 1 + (easeOut * 0.3) // Leicht vergrößern
    score.animationProgress = progress
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  requestAnimationFrame(animate)
}

function removeFloatingScore(scoreId) {
  const index = floatingScores.value.findIndex(score => score.id === scoreId)
  if (index > -1) {
    floatingScores.value.splice(index, 1)
  }
}

function startDrag(event) {
  if (!canDropFruit.value || dropCooldown.value) return

  event.preventDefault()
  isDragging.value = true
  handleDrag(event)
}

function handleDrag(event) {
  if (!isDragging.value) return

  event.preventDefault()

  const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0
  const boardRect = gameBoard.value.getBoundingClientRect()
  const relativeX = clientX - boardRect.left

  const minX = nextFruit.value.size / 2 + PHYSICS_CONFIG.board.thickness
  const maxX = PHYSICS_CONFIG.board.width - nextFruit.value.size / 2 - PHYSICS_CONFIG.board.thickness

  dropPosition.value = Math.max(minX, Math.min(maxX, relativeX))
}

// ✅ KORRIGIERTE Game Over Funktionen
function startGameOverCheck() {
  gameOverCheckInterval.value = setInterval(() => {
    if (gameOver.value) return

    const currentTime = Date.now()

    // Check each fruit for danger zone violations
    for (const fruit of fruits.value) {
      if (!fruit.body) continue

      const fruitY = fruit.body.position.y
      const fruitRadius = fruit.size / 2
      const velocity = Math.abs(fruit.body.velocity.y)

      const isInDangerZone = (fruitY - fruitRadius) <= dangerZoneHeight.value
      const isStable = velocity < 0.8 // Frucht bewegt sich kaum noch

      if (isInDangerZone && isStable) {
        // Start tracking violation time
        if (!topViolations.value[fruit.id]) {
          topViolations.value[fruit.id] = currentTime
        }

        // Check if violation lasted long enough
        if (currentTime - topViolations.value[fruit.id] >= gameOverDelay) {
          triggerGameOver()
          return
        }
      } else {
        // Remove violation if fruit moved away
        if (topViolations.value[fruit.id]) {
          delete topViolations.value[fruit.id]
        }
      }
    }

    // Clean up violations for removed fruits
    Object.keys(topViolations.value).forEach(fruitId => {
      if (!fruits.value.some(f => f.id.toString() === fruitId)) {
        delete topViolations.value[fruitId]
      }
    })
  }, 200) // Weniger häufige Prüfung
}

function triggerGameOver() {
  if (gameOver.value) return

  gameOver.value = true
  canDropFruit.value = false

  resetCombo()

  // Stoppe alle Physics
  if (runner) {
    Matter.Runner.stop(runner)
  }

  // Stoppe Game Over Check
  if (gameOverCheckInterval.value) {
    clearInterval(gameOverCheckInterval.value)
    gameOverCheckInterval.value = null
  }

  console.log('💀 Game Over triggered')

  // Erstelle Game Over State für Overlay
  const gameOverData = {
    type: 'game_over',
    rewardData: {
      totalCoins: 0,
      totalDiamonds: 0,
      bonusCoins: 0,
      bonusDiamonds: 0,
      breakdown: {
        baseReward: 0,
        starBonus: 0,
        perfectBonus: 0
      }
    },
    achievements: [],
    completionData: {
      completed: false,
      stars: 0,
      progress: 0,
      message: 'Game Over - Try Again!',
      finalScore: props.currentSession?.score || 0,
      totalMoves: props.currentSession?.moves || 0,
      timeMs: Date.now() - (props.currentSession?.startTime || Date.now())
    },
    stars: 0,
    levelId: props.currentLevel
  }

  // Setze Completion State und zeige Overlay
  levelCompletionState.value = gameOverData
  showCompletionOverlay.value = true

  // Emit Game Over Event
  emit('game-over', {
    finalScore: props.currentSession?.score || 0,
    fruitsDropped: fruits.value.length,
    highestLevel: Math.max(...fruits.value.map(f => f.level), 0)
  })
}

// Level Completion Check
function checkLevelCompletion() {
  if (gameOver.value) return false

  const goal = getLevelGoal(props.currentLevel)
  if (!goal) return false

  // Finde höchste erreichte Frucht
  const fruitLevels = fruits.value.map(f => f.level)
  const highestFruit = Math.max(...fruitLevels, 0)
  const currentScore = props.currentSession?.score || 0
  const targetFruitCount = targetFruitsCreated.value

  // Prüfe ob Level-Ziel erreicht wurde
  if (isLevelCompleted(props.currentLevel, Object.keys(FRUIT_TYPES).find(key => FRUIT_TYPES[key].id === highestFruit), targetFruitCount)) {
    const currentMoves = props.currentSession?.moves || 0
    const gameTime = Date.now() - (props.currentSession?.startTime || Date.now())

    completeLevelWithRewards(highestFruit, currentScore, currentMoves, gameTime, targetFruitCount)
    return true
  }

  return false
}

function completeLevelWithRewards(highestFruit, finalScore, totalMoves, timeMs, fruitCount = 1) {
  console.log(`🎉 Level ${props.currentLevel} completed!`)

  const highestFruitKey = Object.keys(FRUIT_TYPES).find(key => FRUIT_TYPES[key].id === highestFruit)
  const stars = calculateStars(props.currentLevel, finalScore, totalMoves)

  // Restliche Logik bleibt gleich, aber score wird durch fruit ersetzt
  const rewardData = {
    totalCoins: calculateCoinReward(stars),
    totalDiamonds: calculateDiamondReward(stars),
    bonusCoins: 0,
    bonusDiamonds: 0,
    breakdown: {
      baseReward: calculateCoinReward(1),
      starBonus: calculateCoinReward(stars) - calculateCoinReward(1),
      perfectBonus: stars === 3 ? calculateDiamondReward(3) : 0
    }
  }

  const achievements = []
  if (stars === 3) {
    achievements.push({
      type: 'perfect_level',
      title: 'Perfect Clear!',
      description: `Completed Level ${props.currentLevel} with 3 stars!`
    })
  }

  const completionData = getLevelCompletionData(props.currentLevel, finalScore, totalMoves, timeMs)
  levelCompletionState.value = {
    type: 'level_completion',
    rewardData,
    achievements,
    completionData,
    stars: stars,
    levelId: props.currentLevel
  }

  showCompletionOverlay.value = true

  emit('level-completed', {
    levelId: props.currentLevel,
    stars,
    score: finalScore,
    moves: totalMoves,
    timeMs
  })
}

function calculateCoinReward(stars) {
  const baseReward = Math.max(50, props.currentLevel * 25)
  return baseReward + ((stars - 1) * 25)
}

function calculateDiamondReward(stars) {
  return stars === 3 ? Math.floor(props.currentLevel / 3) + 1 : 0
}

function handleBackToLevels() {
  showCompletionOverlay.value = false
  levelCompletionState.value = null
  emit('back-to-level-selection')
}

// Watch für Game State Changes
watch(() => props.isGamePaused, (paused) => {
  if (paused) {
    Matter.Runner.stop(runner)
    canDropFruit.value = false
  } else if (!gameOver.value) { // ✅ Nur fortsetzen wenn nicht Game Over
    Matter.Runner.run(runner, engine)
    canDropFruit.value = true
  }
})

watch(() => props.isGameActive, (active) => {
  if (!active) {
    canDropFruit.value = false
  }
})

onMounted(async () => {
  await nextTick()
  dropPosition.value = PHYSICS_CONFIG.board.width / 2

  // Reset target fruit counter for new game
  targetFruitsCreated.value = 0

  initPhysics()
})

onUnmounted(() => {
  if (gameOverCheckInterval.value) {
    clearInterval(gameOverCheckInterval.value)
  }

  if (runner) {
    Matter.Runner.stop(runner)
  }

  if (engine) {
    Matter.Events.off(engine)
    Matter.World.clear(engine.world)
    Matter.Engine.clear(engine)
  }

  resetCombo()

  topViolations.value = {}
})
</script>

<template>
  <div class="game-play-area">
    <div class="game-play-area__game-container">
      <div class="game-play-area__physics">
        <!-- Next Fruit Indicator -->
        <div class="next-fruit-indicator">
          <div
            v-if="nextFruit && canDropFruit && !isDragging && !gameOver"
            class="next-fruit-preview"
            :style="{
              left: `${dropPosition}px`,
              width: `${nextFruit.size}px`,
              height: `${nextFruit.size}px`
            }"
          >
            <div
              class="fruit-svg-container"
              v-html="getFruitSvg(nextFruit.level)"
            />
          </div>
        </div>

        <!-- Game Board -->
        <div
          ref="gameBoard"
          class="game-board"
          @mousedown="startDrag"
          @mousemove="handleDrag"
          @mouseup="dropFruit"
          @mouseleave="dropFruit"
          @touchstart="startDrag"
          @touchmove="handleDrag"
          @touchend="dropFruit"
        >
          <div
            v-if="isDragging && !gameOver"
            class="drop-guide"
            :style="{ left: `${dropPosition}px` }"
          ></div>

          <!-- Game Over Line -->
          <div
            class="game-play-area__game-over-line"
            :class="{
              'game-play-area__game-over-line--danger': gameOver
            }"
            :style="{ top: `${dangerZoneHeight}px` }"
          ></div>

          <!-- Physics Fruits -->
          <div
            v-for="fruit in fruits"
            :key="fruit.id"
            class="fruit"
            :class="{
              'merging': fruit.merging,
              'new-fruit': fruit.isNew,
              'danger-fruit': fruit.body && (fruit.body.position.y - fruit.size/2) <= dangerZoneHeight && Math.abs(fruit.body.velocity.y) < 0.8,
              'warning-fruit': fruit.body && (fruit.body.position.y - fruit.size/2) <= dangerZoneHeight && Math.abs(fruit.body.velocity.y) >= 0.8
            }"
            :style="{
              left: `${fruit.x}px`,
              top: `${fruit.y}px`,
              width: `${fruit.size}px`,
              height: `${fruit.size}px`,
              transform: `rotate(${fruit.rotation}deg)`
            }"
          >
            <div
              class="fruit-svg-container"
              v-html="getFruitSvg(fruit.level)"
            />
          </div>
          <div
            v-for="score in floatingScores"
            :key="score.id"
            class="floating-score"
            :class="{
              'floating-score--combo': score.isCombo
            }"
            :style="{
              left: `${score.x}px`,
              top: `${score.y}px`,
              opacity: score.opacity,
              transform: `translate(-50%, -50%) scale(${score.scale})`
            }"
          >
            <div
              v-if="score.comboMessage"
              class="floating-score__combo-message"
            >
              {{ score.comboMessage }}
            </div>
            <div
              v-if="score.isCombo"
              class="floating-score__combo"
            >
              {{ score.comboMultiplier.toFixed(1) }}x
            </div>
            <div class="floating-score__points">
              +{{ score.points }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Level Completion/Game Over Overlay -->
    <LevelCompletionOverlay
      v-if="showCompletionOverlay && levelCompletionState"
      :level-completion-state="levelCompletionState"
      :current-session="currentSession"
      :current-level="currentLevel"
      :max-level="9"
      @back-to-levels="handleBackToLevels"
    />
  </div>
</template>

<style scoped lang="scss">
.game-play-area {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 60vh;
  user-select: none;

  &__physics {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__game-over-line {
    position: absolute;
    left: 20px;
    right: 20px;
    height: 3px;
    background: linear-gradient(90deg,
      transparent 0%,
      #e74c3c 20%,
      #e74c3c 80%,
      transparent 100%
    );
    z-index: 30;
    box-shadow: 0 0 10px rgba(231, 76, 60, 0.6);
    pointer-events: none;
    transition: all 0.3s ease;

    &--danger {
      background: linear-gradient(90deg,
        transparent 0%,
        #c0392b 20%,
        #c0392b 80%,
        transparent 100%
      );
      animation: game-over-critical 0.3s ease-in-out infinite;
      box-shadow: 0 0 25px rgba(192, 57, 43, 1);
      height: 4px;
    }
  }
}

.fruit-svg-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  }
}

.next-fruit-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  position: relative;
  width: 100%;
  min-height: 50px;

  .fruit-svg-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

.game-board {
  width: 300px;
  height: 400px;
  border: 3px solid var(--card-border, #e0e0e0);
  border-radius: 12px;
  background-color: var(--game-board-bg);
  overflow: hidden;
  position: relative;
  cursor: crosshair;
  touch-action: none;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(180deg, rgba(255, 0, 0, 0.1) 0%, transparent 100%);
    pointer-events: none;
    z-index: 1;
  }
}

.drop-guide {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #ff4444 0%, transparent 100%);
  transform: translateX(-1px);
  z-index: 2;
  pointer-events: none;
}

.next-fruit-preview {
  position: absolute;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-50%);
  z-index: 3;
  transition: opacity 0.2s ease;
}

.fruit {
  position: absolute;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
  will-change: transform;
  overflow: hidden;

  &.merging {
    transform: scale(1.1);
    opacity: 0.9;
    animation: merge-pulse 0.3s ease-in-out;
  }

  &.new-fruit {
    animation: fruit-appear 0.5s ease-out;
  }

  &.danger-fruit {
    filter: brightness(1.2) drop-shadow(0 0 8px rgba(231, 76, 60, 0.8));
  }

  &.warning-fruit {
    filter: brightness(1.1) drop-shadow(0 0 5px rgba(255, 193, 7, 0.6));
  }
}

.floating-score {
  position: absolute;
  pointer-events: none;
  z-index: 50;
  font-weight: bold;
  text-align: center;
  will-change: transform, opacity;

  &__points {
    font-size: 18px;
    line-height: 1;
    color: var(--success-color);
    text-shadow:
      1px 1px 2px rgba(0, 0, 0, 0.8),
      -1px -1px 2px rgba(255, 255, 255, 0.3);
    margin-bottom: 2px;
  }

  &__combo-message {
    font-size: 12px;
    line-height: 1;
    color: var(--mood-three-color);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }

  &__combo {
    font-size: 12px;
    line-height: 1;
    color: var(--mood-two-color);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }

  &--combo {
    .floating-score__points {
      color: var(--mood-one-color);
      font-size: 18px;
      animation: combo-pulse 0.3s ease-out;
    }
  }
}

@keyframes combo-pulse {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .floating-score {
    &__points {
      font-size: 16px;
    }

    &__combo {
      font-size: 10px;
    }

    &--combo .floating-score__points {
      font-size: 18px;
    }
  }
}

@keyframes merge-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1.1); }
}

@keyframes fruit-appear {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes game-over-critical {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

// Responsive Design
@media (max-width: 768px) {
  .game-play-area__game-container {
    width: 100%;
    max-width: 320px;
    margin: 0 10px;
  }

  .game-board {
    cursor: default;
  }

  .next-fruit-preview {
    opacity: 0.6;
  }
}
</style>