<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue'
import * as Matter from 'matter-js'
import {useLocalStorage} from '../composables/useLocalStorage.js'
import {useI18n} from '../composables/useI18n.js'
import {FRUIT_TYPES, PHYSICS_CONFIG} from '../config/fruitMergeConfig.js'

// Props
const props = defineProps({
  level: {
    type: Number,
    default: 1
  }
})

// Emits
const emit = defineEmits(['back-to-gaming', 'game-complete'])

// Services
const { } = useLocalStorage()
const { t } = useI18n()

// Game state - using shallowRef for performance
const gameState = ref('playing') // 'playing', 'paused', 'completed', 'game-over'
const fruits = shallowRef([]) // Using shallowRef for better performance with arrays
const currentLevel = ref(props.level || 1)
const score = ref(0)
const moves = ref(0)
const nextFruitId = ref(0)

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

const topBoundary = computed(() => {
  return Math.max(30, 100 - (currentLevel.value - 1) * 5)
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
    merging: false
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

// Drop fruit function (unified for click and touch)
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

    setTimeout(() => {
      dropCooldown.value = false
    }, 600)
  }, 500)
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
          fruitB.merging = true

          // Calculate center position for the new fruit
          const centerX = (bodyA.position.x + bodyB.position.x) / 2
          const centerY = (bodyA.position.y + bodyB.position.y) / 2

          // Remove the old fruits after delay
          setTimeout(() => {
            // Remove bodies from the physics world
            Matter.Composite.remove(engine.world, bodyA)
            Matter.Composite.remove(engine.world, bodyB)

            // Remove fruits from the array
            fruits.value = fruits.value.filter(f => f.id !== idA && f.id !== idB)

            // Find current fruit type in config
            const currentFruitType = Object.values(FRUIT_TYPES).find(f => f.index === levelA)
            if (currentFruitType) {
              // Add score based on the fruit's actual score value
              score.value += currentFruitType.scoreValue

              // Find next fruit type
              const nextFruitType = Object.values(FRUIT_TYPES).find(f => f.index === levelA + 1)

              if (nextFruitType) {
                const newFruit = {
                  id: nextFruitId.value++,
                  color: nextFruitType.color,
                  size: nextFruitType.radius * 2,
                  level: nextFruitType.index,
                  name: nextFruitType.type,
                  svg: nextFruitType.svg,
                  x: centerX,
                  y: centerY,
                  rotation: 0,
                  body: null,
                  merging: false
                }

                // Add the new fruit to the world
                addMergedFruit(newFruit, centerX, centerY)
              }
            }
          }, 100) // Small delay for better visual effect
        }
      }
    }
  }
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

  fruit.body = fruitBody
  Matter.Composite.add(engine.world, fruitBody)
  fruits.value = [...fruits.value, fruit]
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

// Game loop for updating positions
let animationFrame = null
const gameLoop = () => {
  updateFruitPositions()
  animationFrame = requestAnimationFrame(gameLoop)
}

// Cleanup function
const cleanup = () => {
  console.log('Cleaning up physics engine...')

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
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
}

// Initialize game
const initGame = async () => {
  await nextTick()

  initPhysics()
  nextFruit.value = generateNextFruit()
  gameLoop()

  console.log('Game initialized')
}

// Watchers
watch(() => props.level, (newLevel) => {
  currentLevel.value = newLevel
})

// Lifecycle
onMounted(() => {
  initGame()
})

onUnmounted(() => {
  cleanup()
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
      <div class="game-stats">
        <div class="stat">
          <span class="stat-label">{{ t('stats.score') }}</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">{{ t('stats.moves') }}</span>
          <span class="stat-value">{{ moves }}</span>
        </div>
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
        <!-- Top boundary indicator -->
        <div
          class="top-boundary-line"
          :style="{ top: `${topBoundary}px` }"
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

        <!-- Rendered Fruits -->
        <div
            v-for="fruit in fruits"
            :key="fruit.id"
            class="fruit"
            :class="{
              'merging': fruit.merging
            }"
            :style="{
            left: `${fruit.x}px`,
            top: `${fruit.y}px`,
            width: `${fruit.size}px`,
            height: `${fruit.size}px`,
            transform: `rotate(${fruit.rotation}deg)`,
            zIndex: fruit.merging ? 10 : 1
          }"
        >
          <div class="fruit-svg" v-html="fruit.svg"></div>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
.fruit-merge-game {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  min-height: calc(100vh - 80px);
  max-width: 400px;
  margin: 0 auto;
}

// Game Header
.game-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-align: center;
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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

.game-stats {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
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
  width: 100%;
  height: 50px;
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
  width: 2px;
  background: var(--primary-color);
  opacity: 0.8;
  transform: translateX(-50%);
  z-index: 10;
}

// Game Board
.game-board {
  position: relative;
  background: linear-gradient(180deg, #00000000 0%, #000000aa 50%, #808080aa 100%);
  border: 3px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  cursor: crosshair;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--primary-color);
  }
}

.top-boundary-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #ff4757, #ff6348);
  z-index: 5;
  box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
}

// Fruits
.fruit {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  transition: opacity 0.3s ease;

  &.merging {
    opacity: 0.8;
    transform-origin: center;
    animation: mergeAnimation 0.5s ease-out;
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

// Animations
@keyframes mergeAnimation {
  0% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.2) rotate(180deg);
  }
  100% {
    transform: scale(0) rotate(360deg);
    opacity: 0;
  }
}

// Touch-specific improvements
@media (hover: none) {
  .game-board {
    border-color: var(--primary-color);
  }
}
</style>