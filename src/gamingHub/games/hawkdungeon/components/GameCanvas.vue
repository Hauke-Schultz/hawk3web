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
const canvasWidth = ref(375)
const canvasHeight = ref(667)

const updateCanvasSize = () => {
  if (canvasContainer.value) {
    canvasWidth.value = canvasContainer.value.clientWidth
    canvasHeight.value = canvasContainer.value.clientHeight
  }
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
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 120px;
  background: #2a2a2a;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
</style>