<template>
  <div class="game-canvas" ref="canvasContainer">
    <canvas
      ref="canvas"
      :width="canvasWidth"
      :height="canvasHeight"
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
  }
})

const canvas = ref(null)
const canvasContainer = ref(null)

// 7x7 grid with 64px tiles (16px sprites * 4 scale) = 448x448
const GRID_SIZE = 7
const TILE_SIZE = 64 // 16px * 4 scale
const canvasWidth = ref(GRID_SIZE * TILE_SIZE)
const canvasHeight = ref(GRID_SIZE * TILE_SIZE)

const updateCanvasSize = () => {
  // Canvas size is fixed to 7x7 grid
  // No need to update dynamically
}

// Initialize renderer
const { initialize } = useGameRenderer(
  canvas,
  null, // gameState not needed for rendering
  props.knight,
  () => props.monsters,
  () => props.items,
  () => props.attackHitbox,
  props.dungeonOffset
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
  canvas
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