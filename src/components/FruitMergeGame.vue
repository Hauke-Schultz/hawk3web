<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, shallowRef, watch } from 'vue'
import * as Matter from 'matter-js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import { PHYSICS_CONFIG, FRUIT_TYPES, FRUIT_SPAWN_WEIGHTS } from '../config/fruitMergeConfig.js'

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
const nextFruitPosition = ref(PHYSICS_CONFIG.board.width / 2)
const isDropping = ref(false)
const dropCooldown = ref(false)

// Next fruit system
const nextFruit = ref(null)
const showNextFruit = ref(true)

// Convert FRUIT_TYPES object to array format like in OldFruitMergeGame
const fruitTypes = [
  {
    size: 32, color: '#9C27B0', level: 1, name: 'Blueberry',
    svg: FRUIT_TYPES.BLUEBERRY.svg
  },
  {
    size: 38, color: '#E91E63', level: 2, name: 'Strawberry',
    svg: FRUIT_TYPES.STRAWBERRY.svg
  },
  {
    size: 42, color: '#FFEB3B', level: 3, name: 'Grape',
    svg: FRUIT_TYPES.GRAPE.svg
  },
  {
    size: 48, color: '#FF9800', level: 4, name: 'Orange',
    svg: FRUIT_TYPES.ORANGE.svg
  },
  {
    size: 56, color: '#8BC34A', level: 5, name: 'Apple',
    svg: FRUIT_TYPES.APPLE.svg
  },
  {
    size: 64, color: '#FFAB91', level: 6, name: 'Peach',
    svg: FRUIT_TYPES.PEACH.svg
  },
  {
    size: 72, color: '#FF9800', level: 7, name: 'Pineapple',
    svg: FRUIT_TYPES.PINEAPPLE.svg
  },
  {
    size: 80, color: '#8b4513', level: 8, name: 'Coconut',
    svg: FRUIT_TYPES.COCONUT.svg
  },
  {
    size: 88, color: '#F48FB1', level: 9, name: 'Melon',
    svg: FRUIT_TYPES.MELON.svg
  }
]

// Game area dimensions - computed for reactivity
const boardConfig = computed(() => ({
  width: PHYSICS_CONFIG.board.width,
  height: PHYSICS_CONFIG.board.height,
  thickness: PHYSICS_CONFIG.board.thickness
}))

// Top boundary based on level (more challenging = lower boundary)
const topBoundary = computed(() => {
  return Math.max(30, 100 - (currentLevel.value - 1) * 5)
})

// Generate new fruit for dropping (only levels 1-5 like in original)
const generateNextFruit = () => {
  const maxStartingLevel = 5
  const randomIndex = Math.floor(Math.random() * maxStartingLevel)
  const randomFruitType = fruitTypes[randomIndex]

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

  // Add collision event listener for fruit merging
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

// Handle collisions for fruit merging - adapted from OldFruitMergeGame
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
      if (levelA === levelB && levelA < fruitTypes.length) {
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

            // Add score based on the level
            score.value += levelA * 10

            // Create new fruit of the next level if not already at max level
            if (levelA < fruitTypes.length) {
              const nextLevelIndex = levelA // Current level is 1-based, array is 0-based
              const nextFruitType = fruitTypes[nextLevelIndex]

              const newFruit = {
                id: nextFruitId.value++,
                color: nextFruitType.color,
                size: nextFruitType.size,
                level: levelA + 1, // Next level number
                name: nextFruitType.name,
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
          }, 100) // Small delay for better visual effect
        }
      }
    }
  }
}

// Add a merged fruit to the world at a specific position
const addMergedFruit = (fruit, x, y) => {
  const fruitBody = Matter.Bodies.circle(
      x,
      y,
      fruit.size / 2,
      {
        restitution: 0.3, // Bounciness
        friction: 0.05,   // Reduced friction
        frictionAir: 0.005, // Reduced air friction
        density: 0.001,    // Density for weight
        label: `fruit-${fruit.id}-${fruit.color}-${fruit.level}`, // Correct label format
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

// Drop next fruit
const dropFruit = (targetX = nextFruitPosition.value) => {
  if (isDropping.value || dropCooldown.value || !nextFruit.value) return

  console.log(`Dropping fruit at x: ${targetX}`)

  isDropping.value = true
  dropCooldown.value = true

  // Create physics body for the fruit
  const fruit = nextFruit.value
  const body = Matter.Bodies.circle(
      targetX,
      -30, // Start above the board
      fruit.size / 2,
      {
        restitution: 0.6,
        friction: 0.05,
        frictionAir: 0.008,
        density: 0.001,
        label: `fruit-${fruit.id}-${fruit.color}-${fruit.level}`, // Correct label format
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

  // Add to physics world and fruits array
  Matter.Composite.add(engine.world, body)
  fruits.value = [...fruits.value, fruit]

  // Increment moves counter
  moves.value++

  // Generate next fruit and reset states
  setTimeout(() => {
    nextFruit.value = generateNextFruit()
    isDropping.value = false

    setTimeout(() => {
      dropCooldown.value = false
    }, 600) // Drop cooldown like in original
  }, 500)
}

// Handle click/touch to drop fruit
const handleBoardClick = (event) => {
  if (dropCooldown.value || isDropping.value) return

  const rect = gameBoard.value.getBoundingClientRect()
  const x = event.clientX - rect.left

  // Constrain drop position within bounds
  const thickness = boardConfig.value.thickness
  const fruitRadius = nextFruit.value ? nextFruit.value.size / 2 : 20
  const minX = fruitRadius + thickness / 4
  const maxX = boardConfig.value.width - fruitRadius - thickness / 4
  const targetX = Math.max(minX, Math.min(maxX, x))

  dropFruit(targetX)
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
      <div v-if="nextFruit && showNextFruit" class="next-fruit-preview">
        <div
            class="next-fruit"
            :style="{
            width: `${nextFruit.size}px`,
            height: `${nextFruit.size}px`,
            left: `${nextFruitPosition - nextFruit.size / 2}px`
          }"
        >
          <div class="fruit-svg" v-html="nextFruit.svg"></div>
        </div>
        <!-- Drop indicator line -->
        <div
            class="drop-line"
            :style="{ left: `${nextFruitPosition}px` }"
        ></div>
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
      >
        <!-- Top boundary indicator -->
        <div
            class="top-boundary-line"
            :style="{ top: `${topBoundary}px` }"
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
  height: 60px;
  border: 2px dashed var(--card-border);
  border-radius: var(--border-radius-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
}

.next-fruit {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 50%;
  cursor: grab;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-50%) scale(1.05);
  }
}

.drop-line {
  position: absolute;
  top: 100%;
  width: 2px;
  height: 20px;
  background: var(--primary-color);
  opacity: 0.6;
  transform: translateX(-50%);
}

// Game Board
.game-board {
  position: relative;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 3px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  cursor: crosshair;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);

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

// Responsive Design
@media (max-width: 480px) {
  .fruit-merge-game {
    padding: var(--space-2);
  }

  .game-stats {
    gap: var(--space-2);
  }

  .stat-value {
    font-size: var(--font-size-base);
  }
}
</style>