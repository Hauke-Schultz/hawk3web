<template>
  <div class="inventory-panel">
    <!-- Weapons Section -->
    <div class="inventory-section">
      <div class="inventory-grid">
        <div
          v-for="(weapon, index) in weapons"
          :key="weapon.name"
          class="inventory-slot"
          :class="{ 'inventory-slot--active': weapon.name === currentWeapon }"
          @click="$emit('select-weapon', weapon.name)"
        >
          <div class="item-hotkey">{{ index + 1 }}</div>
          <canvas
            :ref="el => weaponCanvasRefs[weapon.name] = el"
            class="item-sprite"
            width="80"
            height="140"
          />
          <div class="item-name">{{ weaponConfig[weapon.name]?.name || weapon.name }}</div>
          <div v-if="weapon.name === currentWeapon" class="item-active-indicator">✓</div>

          <!-- Gem Sockets -->
          <div class="gem-sockets">
            <div
              v-for="(gemType, socketIndex) in weapon.sockets"
              :key="`${weapon.name}-socket-${socketIndex}`"
              class="gem-socket"
              :class="{ 'gem-socket--empty': !gemType, 'gem-socket--filled': gemType }"
              :style="gemType ? { borderColor: gemConfig[gemType]?.color } : {}"
              @click.stop="handleSocketClick(weapon.name, socketIndex, gemType)"
            >
              <span v-if="gemType" class="gem-icon" :style="{ color: gemConfig[gemType]?.color }">
                {{ gemConfig[gemType]?.icon }}
              </span>
            </div>
          </div>
        </div>
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
          <div v-if="itemGroup.count > 1" class="item-count">{{ itemGroup.count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { weaponConfig } from '../config/weaponConfig'
import { spriteConfig, SPRITE_SCALE } from '../config/spriteConfig'
import { useSpriteManager } from '../composables/useSpriteManager'
import { gemConfig } from '../config/gemConfig'

const props = defineProps({
  weapons: {
    type: Array,
    required: true
  },
  currentWeapon: {
    type: String,
    required: true
  },
  inventory: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select-weapon', 'socket-gem', 'unsocket-gem'])

// Use plain objects for template refs (not reactive refs)
const weaponCanvasRefs = {}
const itemCanvasRefs = {}
const { loadSpritesheet, isLoaded, spritesheet } = useSpriteManager()

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
    groups[type].count++
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

const handleSocketClick = (weaponName, socketIndex, gemType) => {
  if (gemType) {
    // Socket is filled - emit unsocket event
    emit('unsocket-gem', weaponName, socketIndex)
  } else {
    // Socket is empty - emit socket event (will be handled in parent to show gem selection)
    emit('socket-gem', weaponName, socketIndex)
  }
}

const drawWeaponSprites = () => {
  if (!isLoaded.value || !spritesheet.value) return

  props.weapons.forEach(weapon => {
    const weaponName = weapon.name
    const canvas = weaponCanvasRefs[weaponName]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.webkitImageSmoothingEnabled = false
    ctx.mozImageSmoothingEnabled = false
    ctx.msImageSmoothingEnabled = false

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get weapon sprite config
    const weaponSpriteConfig = spriteConfig.weapons?.[weaponName]
    if (!weaponSpriteConfig) {
      console.warn(`No sprite config found for weapon: ${weaponName}`)
      return
    }

    // Calculate scaled dimensions from sprite config
    const spriteWidth = weaponSpriteConfig.width * SPRITE_SCALE
    const spriteHeight = weaponSpriteConfig.height * SPRITE_SCALE

    // Center the weapon sprite in the canvas
    const x = (canvas.width - spriteWidth) / 2
    const y = (canvas.height - spriteHeight) / 2

    // Draw weapon sprite from spritesheet
    ctx.drawImage(
      spritesheet.value,
      weaponSpriteConfig.x, weaponSpriteConfig.y, weaponSpriteConfig.width, weaponSpriteConfig.height,
      x, y, spriteWidth, spriteHeight
    )
  })
}

const drawItemSprites = () => {
  if (!isLoaded.value || !spritesheet.value) return

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
      spritesheet.value,
      itemSpriteConfig.x, itemSpriteConfig.y, itemSpriteConfig.width, itemSpriteConfig.height,
      x, y, spriteWidth, spriteHeight
    )
  })
}

const drawAllSprites = () => {
  drawWeaponSprites()
  drawItemSprites()
}

onMounted(async () => {
  await loadSpritesheet()
  drawAllSprites()
})

// Redraw when weapons change
watch(() => props.weapons, () => {
  if (isLoaded.value) {
    setTimeout(drawWeaponSprites, 100)
  }
}, { deep: true })

// Redraw when inventory changes
watch(() => props.inventory, () => {
  if (isLoaded.value) {
    setTimeout(drawItemSprites, 100)
  }
}, { deep: true })

// Redraw when spritesheet is loaded
watch(isLoaded, (loaded) => {
  if (loaded) {
    drawAllSprites()
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
  min-height: 140px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  padding: 8px 4px;
}

.inventory-slot--item {
  min-height: 100px;
  cursor: default;
}

.inventory-slot:not(.inventory-slot--item):hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.inventory-slot:not(.inventory-slot--item):active {
  transform: translateY(0px);
}

.inventory-slot--active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
}

.item-sprite {
  width: 80px;
  height: 140px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
  pointer-events: none;
}

.item-sprite--small {
  width: 64px;
  height: 64px;
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

.item-hotkey {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
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

.item-active-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 16px;
  color: rgb(34, 197, 94);
  filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.8));
}

/* Gem Sockets */
.gem-sockets {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
  margin-top: 4px;
}

.gem-socket {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.gem-socket--empty:hover {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.gem-socket--filled {
  background: rgba(0, 0, 0, 0.6);
  box-shadow: 0 0 8px currentColor;
}

.gem-socket--filled:hover {
  transform: scale(1.15);
  filter: brightness(1.2);
}

.gem-icon {
  font-size: 14px;
  filter: drop-shadow(0 0 4px currentColor);
  pointer-events: none;
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

/* Touch devices */
@media (hover: none) {
  .inventory-slot:not(.inventory-slot--item):hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    transform: none;
  }

  .inventory-slot:not(.inventory-slot--item):active {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(0.95);
  }
}
</style>
