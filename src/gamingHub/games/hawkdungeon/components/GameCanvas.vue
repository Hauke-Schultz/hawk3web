<template>
  <div class="game-canvas" ref="canvasContainer">
    <canvas
      ref="canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      @click="handleCanvasClick"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useGameRenderer } from '../composables/useGameRenderer'

const props = defineProps({
  knight: {
    type: Object,
    required: true
  },
  monsters: {
    type: Array,
    default: () => []
  },
  items: {
    type: Array,
    default: () => []
  },
  attackHitbox: {
    type: Object,
    default: null
  },
  dungeonOffset: {
    type: Object,
    required: true
  },
  lockedDoorFlash: {
    type: Object,
    required: false
  },
  levelLoader: {
    type: Object,
    required: false
  },
  chestSystem: {
    type: Object,
    required: false
  },
  npcSystem: {
    type: Object,
    required: false
  }
})

const emit = defineEmits(['tileClick'])

const canvas = ref(null)
const canvasContainer = ref(null)

// 7x7 grid with 64px tiles (16px sprites * 4 scale) = 448x448
const GRID_SIZE = 7
const TILE_SIZE = 64 // 16px * 4 scale
const canvasWidth = ref(GRID_SIZE * TILE_SIZE)
const canvasHeight = ref(GRID_SIZE * TILE_SIZE)

// Blood splatter array - each splatter has gridX, gridY, pixels array, and timestamp
const bloodSplatters = ref([])

// Handle canvas click
const handleCanvasClick = (event) => {
  if (!canvas.value) return

  const rect = canvas.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  // Convert canvas coordinates to grid coordinates
  // The canvas shows a 7x7 grid centered on the knight
  const tileX = Math.floor(clickX / TILE_SIZE)
  const tileY = Math.floor(clickY / TILE_SIZE)

  // Calculate the actual grid position in the world
  // The knight is always at the center of the screen (grid position 3, 3 in the viewport)
  const centerOffset = Math.floor(GRID_SIZE / 2) // 3 for a 7x7 grid
  const worldGridX = props.knight.gridX + (tileX - centerOffset)
  const worldGridY = props.knight.gridY + (tileY - centerOffset)

  console.log(`Canvas click at (${clickX}, ${clickY}) -> Tile (${tileX}, ${tileY}) -> World grid (${worldGridX}, ${worldGridY})`)

  // Emit the tile click event with world grid coordinates
  emit('tileClick', worldGridX, worldGridY)
}

const updateCanvasSize = () => {
  // Canvas size is fixed to 7x7 grid
  // No need to update dynamically
}

// Generate random blood splatter pixels and store in array
const generateBloodSplatter = (gridX, gridY, isBoss = false) => {
  // Boss has 2x2 grid, so we create 4 splatters (one per tile)
  if (isBoss) {
    // Create splatters for each tile of the 2x2 boss
    for (let offsetY = 0; offsetY < 2; offsetY++) {
      for (let offsetX = 0; offsetX < 2; offsetX++) {
        createSingleSplatter(gridX + offsetX, gridY + offsetY, true)
      }
    }
  } else {
    createSingleSplatter(gridX, gridY, false)
  }
}

const createSingleSplatter = (gridX, gridY, isBoss) => {
  // More pixels for boss splatters
  const pixelCount = isBoss ? 25 + Math.floor(Math.random() * 16) : 15 + Math.floor(Math.random() * 11)
  const pixels = []

  for (let i = 0; i < pixelCount; i++) {
    // Random position within tile (spread around center)
    const spread = TILE_SIZE * 0.95
    const x = (Math.random() - 0.5) * spread
    const y = (Math.random() - 0.5) * spread

    // Random red shade
    const red = 180 + Math.floor(Math.random() * 75) // 180-255
    const green = Math.floor(Math.random() * 20) // 0-20
    const blue = Math.floor(Math.random() * 20) // 0-20
    const alpha = 0.7 + Math.random() * 0.3 // 0.7-1.0

    // Fixed pixel size: 4px
    const size = 8

    pixels.push({ x, y, red, green, blue, alpha, size })
  }

  // Add splatter to array with timestamp
  bloodSplatters.value.push({
    gridX,
    gridY,
    pixels,
    createdAt: performance.now()
  })
}

// Initialize renderer
const { initialize } = useGameRenderer(
  canvas,
  null, // gameState not needed for rendering
  props.knight,
  () => props.monsters,
  () => props.items,
  () => props.attackHitbox,
  props.dungeonOffset,
  props.lockedDoorFlash,
  props.levelLoader,
  props.chestSystem,
  bloodSplatters,
  props.npcSystem ? () => props.npcSystem.npcs.value : null
)

onMounted(async () => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)

  // Initialize renderer after canvas is ready
  await initialize()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
})

defineExpose({
  canvas,
  generateBloodSplatter
})
</script>

<style scoped>
.game-canvas {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  width: 100%;
  min-height: 448px;
  overflow: hidden;
  border-radius: 8px;
}

canvas {
  display: block;
  width: 448px;
  height: 448px;
  max-height: 100%;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

</style>