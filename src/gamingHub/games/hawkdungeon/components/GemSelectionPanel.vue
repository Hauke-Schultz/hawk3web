<template>
  <Transition name="panel-slide">
    <div v-if="visible" class="gem-selection-panel">
      <div class="panel-header">
        <h3 class="panel-title">Select Gem to Socket</h3>
        <button class="close-button" @click="handleClose">✕</button>
      </div>

      <div class="gem-grid">
        <div
          v-for="gem in availableGems"
          :key="gem.type"
          class="gem-card"
          :style="{ borderColor: gemConfig[gem.type]?.color }"
          @click="handleGemSelect(gem.type)"
        >
          <canvas
            :ref="el => gemCanvasRefs[gem.type] = el"
            class="gem-sprite-large"
            width="48"
            height="48"
          />
          <div class="gem-name">{{ gemConfig[gem.type]?.name }}</div>

          <!-- Bonuses -->
          <div class="gem-bonuses">
            <div
              v-for="(value, key) in gemConfig[gem.type]?.bonuses"
              :key="key"
              class="bonus-item"
            >
              <span v-if="key === 'damage'">⚔️ +{{ value }}</span>
              <span v-else-if="key === 'cooldown'">⏱️ -{{ Math.abs(value) }}s</span>
              <span v-else-if="key === 'healthRegen'">❤️ +{{ value }}/s</span>
              <span v-else-if="key === 'manaRegen'">💧 +{{ value }}/s</span>
              <span v-else-if="key === 'manaCost'">🔮 -{{ Math.abs(value) }}</span>
            </div>
          </div>

          <!-- Count badge -->
          <div class="gem-count-badge">{{ gem.count }}</div>
        </div>
      </div>

      <div v-if="availableGems.length === 0" class="no-gems">
        <div class="no-gems-icon">💎</div>
        <div class="no-gems-text">No gems available</div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { gemConfig } from '../config/gemConfig'
import { spriteConfig } from '../config/spriteConfig'
import { useSpriteManager } from '../composables/useSpriteManager'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  inventory: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'close'])

const gemCanvasRefs = {}
const { loadSpritesheet, isLoaded, getSpritesheet } = useSpriteManager()

// Group gems by type and count them
const availableGems = computed(() => {
  const gemTypes = ['ruby', 'sapphire', 'emerald', 'topaz', 'amethyst', 'diamond']
  const gems = props.inventory.filter(item => gemTypes.includes(item.type))

  // Group by type and count
  const grouped = {}
  gems.forEach(gem => {
    if (!grouped[gem.type]) {
      grouped[gem.type] = {
        type: gem.type,
        count: 0
      }
    }
    // If gem has a count property (stackable items), use it; otherwise count as 1
    grouped[gem.type].count += gem.count || 1
  })

  return Object.values(grouped)
})

const handleGemSelect = (gemType) => {
  emit('select', gemType)
}

const handleClose = () => {
  emit('close')
}

const drawGemSprites = () => {
  if (!isLoaded.value) return

  const itemsSpritesheet = getSpritesheet('items')
  if (!itemsSpritesheet) return

  availableGems.value.forEach(gem => {
    const canvas = gemCanvasRefs[gem.type]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.webkitImageSmoothingEnabled = false
    ctx.mozImageSmoothingEnabled = false
    ctx.msImageSmoothingEnabled = false

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get gem sprite config
    const gemSpriteConfig = spriteConfig.items?.[gem.type]
    if (!gemSpriteConfig) {
      console.warn(`No sprite config found for gem: ${gem.type}`)
      return
    }

    // Draw gem sprite from spritesheet (scaled 16x16 -> 48x48)
    ctx.drawImage(
      itemsSpritesheet,
      gemSpriteConfig.x, gemSpriteConfig.y, gemSpriteConfig.width, gemSpriteConfig.height,
      0, 0, canvas.width, canvas.height
    )
  })
}

onMounted(async () => {
  await loadSpritesheet()
  drawGemSprites()
})

// Redraw when panel becomes visible
watch(() => props.visible, (visible) => {
  if (visible && isLoaded.value) {
    setTimeout(drawGemSprites, 100)
  }
})

// Redraw when available gems change
watch(availableGems, () => {
  if (isLoaded.value && props.visible) {
    setTimeout(drawGemSprites, 100)
  }
})

// Redraw when spritesheet is loaded
watch(isLoaded, (loaded) => {
  if (loaded && props.visible) {
    drawGemSprites()
  }
})
</script>

<style scoped>
.gem-selection-panel {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  padding: 16px;
  margin-bottom: 16px;
  max-width: 800px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.close-button {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.gem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.gem-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.gem-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.gem-card:active {
  transform: translateY(0px);
}

.gem-sprite-large {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.5));
  margin-bottom: 2px;
}

.gem-name {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  text-align: center;
}

.gem-bonuses {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.bonus-item {
  font-size: 10px;
  color: rgba(34, 197, 94, 0.9);
  font-weight: 600;
  text-align: center;
}

.gem-count-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  background: rgba(59, 130, 246, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.no-gems {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 16px;
  opacity: 0.6;
}

.no-gems-icon {
  font-size: 48px;
}

.no-gems-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

/* Panel transitions */
.panel-slide-enter-active {
  transition: all 0.3s ease;
}

.panel-slide-leave-active {
  transition: all 0.2s ease;
}

.panel-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 640px) {
  .gem-grid {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 10px;
  }

  .gem-card {
    padding: 10px;
  }

  .gem-sprite-large {
    width: 40px;
    height: 40px;
  }
}
</style>
