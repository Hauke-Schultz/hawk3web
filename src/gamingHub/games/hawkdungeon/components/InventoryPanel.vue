<template>
  <div class="inventory-panel">
    <!-- Items Section -->
    <div class="inventory-section">
      <div class="inventory-grid">
        <!-- Group items by type and count them -->
        <div
          v-for="itemGroup in groupedInventory"
          :key="itemGroup.type"
          class="inventory-slot inventory-slot--item"
        >
          <canvas
            :ref="el => itemCanvasRefs[itemGroup.type] = el"
            class="item-sprite item-sprite--small"
            width="64"
            height="64"
          />
          <div class="item-name">{{ getItemDisplayName(itemGroup.type) }}</div>
          <div v-if="itemGroup.count > 1" class="item-count">{{ itemGroup.count }}x</div>
        </div>
      </div>

      <div v-if="!groupedInventory || groupedInventory.length === 0" class="inventory-empty">
        <div class="empty-icon">🎒</div>
        <div class="empty-text">No items</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { spriteConfig, SPRITE_SCALE } from '../config/spriteConfig'
import { useSpriteManager } from '../composables/useSpriteManager'

const props = defineProps({
  inventory: {
    type: Array,
    default: () => []
  }
})

// Use plain objects for template refs (not reactive refs)
const itemCanvasRefs = {}
const { loadSpritesheet, isLoaded, getSpritesheet } = useSpriteManager()

// Group inventory items by type and count them
const groupedInventory = computed(() => {
  if (!props.inventory || props.inventory.length === 0) return []

  const groups = {}

  props.inventory.forEach(item => {
    const type = item.type
    if (!groups[type]) {
      groups[type] = {
        type: type,
        name: item.name || type,
        count: 0
      }
    }
    // If item has a count property (stackable items), use it; otherwise count as 1
    groups[type].count += item.count || 1
  })

  return Object.values(groups)
})

const getItemDisplayName = (type) => {
  const names = {
    'key': 'Key',
    'health': 'Health',
    'mana': 'Mana',
    'healthPotion': 'Health Potion',
    'manaPotion': 'Mana Potion',
    'ruby': 'Ruby',
    'sapphire': 'Sapphire',
    'emerald': 'Emerald',
    'topaz': 'Topaz',
    'amethyst': 'Amethyst',
    'diamond': 'Diamond'
  }
  return names[type] || type
}

const drawItemSprites = () => {
  if (!isLoaded.value) return

  const itemSpritesheet = getSpritesheet('items')
  if (!itemSpritesheet) return

  groupedInventory.value.forEach(itemGroup => {
    const canvas = itemCanvasRefs[itemGroup.type]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.webkitImageSmoothingEnabled = false
    ctx.mozImageSmoothingEnabled = false
    ctx.msImageSmoothingEnabled = false

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get item sprite config
    const itemSpriteConfig = spriteConfig.items?.[itemGroup.type]
    if (!itemSpriteConfig) {
      console.warn(`No sprite config found for item: ${itemGroup.type}`)
      return
    }

    // Calculate scaled dimensions from sprite config
    const spriteWidth = itemSpriteConfig.width * SPRITE_SCALE
    const spriteHeight = itemSpriteConfig.height * SPRITE_SCALE

    // Center the item sprite in the canvas
    const x = (canvas.width - spriteWidth) / 2
    const y = (canvas.height - spriteHeight) / 2

    // Draw item sprite from spritesheet
    ctx.drawImage(
      itemSpritesheet,
      itemSpriteConfig.x, itemSpriteConfig.y, itemSpriteConfig.width, itemSpriteConfig.height,
      x, y, spriteWidth, spriteHeight
    )
  })
}

onMounted(async () => {
  await loadSpritesheet()
  drawItemSprites()
})

// Redraw when inventory changes
watch(() => props.inventory, () => {
  if (isLoaded.value) {
    setTimeout(drawItemSprites, 100)
  }
}, { deep: true })

// Redraw when spritesheet is loaded
watch(isLoaded, (loaded) => {
  if (loaded) {
    drawItemSprites()
  }
})
</script>

<style scoped>
.inventory-panel {
  display: flex;
  flex-direction: row;
  gap: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  max-width: 800px;
	min-width: 340px;
  max-height: 70vh;
  overflow-y: auto;
}

.inventory-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
	width: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.section-icon {
  font-size: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.inventory-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.inventory-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 80px;
  min-height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: default;
  transition: all 0.2s ease;
  user-select: none;
  padding: 8px 4px;
}

.item-sprite {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
  pointer-events: none;
}

.item-name {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.item-count {
  position: absolute;
  bottom: 4px;
  right: 4px;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  background: rgba(59, 130, 246, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.inventory-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 32px 16px;
  opacity: 0.5;
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Custom scrollbar */
.inventory-panel::-webkit-scrollbar {
  width: 8px;
}

.inventory-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.inventory-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.inventory-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
