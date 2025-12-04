<template>
  <div class="weapon-button-container">
    <div
      class="weapon-display"
      :class="{ 'weapon-display--active': isActive }"
      @click="handleClick"
    >
      <canvas
        ref="weaponCanvas"
        class="weapon-sprite"
        width="80"
        height="140"
      />

      <div class="weapon-info">
        <div class="weapon-damage">⚔️{{ totalDamage }}</div>
      </div>

      <!-- Gem Sockets -->
      <div class="gem-sockets">
        <div
          v-for="(gemType, index) in currentWeaponData.sockets"
          :key="`socket-${index}`"
          class="gem-socket"
          :class="{ 'gem-socket--empty': !gemType, 'gem-socket--filled': gemType }"
          :style="gemType ? { borderColor: gemColors[gemType] } : {}"
        >
          <canvas
            v-if="gemType"
            :ref="el => gemCanvasRefs[`socket-${index}`] = el"
            class="gem-sprite"
            width="16"
            height="16"
          />
        </div>
      </div>

      <div v-if="isActive" class="active-indicator"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { weaponConfig } from '../config/weaponConfig'
import { gemConfig, calculateGemBonuses } from '../config/gemConfig'
import { spriteConfig, SPRITE_SCALE } from '../config/spriteConfig'
import { useSpriteManager } from '../composables/useSpriteManager'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  currentWeapon: {
    type: String,
    required: true
  },
  weaponData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle'])

const weaponCanvas = ref(null)
const gemCanvasRefs = {}
const { loadSpritesheet, isLoaded, getSpritesheet } = useSpriteManager()

const currentWeaponConfig = computed(() => {
  return weaponConfig[props.currentWeapon] || { icon: '⚔️', damage: 0 }
})

const currentWeaponData = computed(() => {
  return props.weaponData || { sockets: [] }
})

const totalDamage = computed(() => {
  const baseDamage = currentWeaponConfig.value.damage || 0
  const gemBonuses = calculateGemBonuses(currentWeaponData.value.sockets || [])
  return baseDamage + gemBonuses.damage
})

const gemColors = computed(() => {
  const colors = {}
  Object.keys(gemConfig).forEach(gemType => {
    colors[gemType] = gemConfig[gemType].color
  })
  return colors
})

const drawWeaponSprite = () => {
  if (!isLoaded.value || !weaponCanvas.value) return

  const weaponSpritesheet = getSpritesheet('weapons')
  if (!weaponSpritesheet) return

  const canvas = weaponCanvas.value
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.webkitImageSmoothingEnabled = false
  ctx.mozImageSmoothingEnabled = false
  ctx.msImageSmoothingEnabled = false

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Get weapon sprite config
  const weaponSpriteConfig = spriteConfig.weapons?.[props.currentWeapon]
  if (!weaponSpriteConfig) {
    console.warn(`No sprite config found for weapon: ${props.currentWeapon}`)
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
    weaponSpritesheet,
    weaponSpriteConfig.x, weaponSpriteConfig.y, weaponSpriteConfig.width, weaponSpriteConfig.height,
    x, y, spriteWidth, spriteHeight
  )
}

const drawGemSprites = () => {
  if (!isLoaded.value) return

  const itemsSpritesheet = getSpritesheet('items')
  if (!itemsSpritesheet) return

  currentWeaponData.value.sockets.forEach((gemType, index) => {
    if (!gemType) return

    const canvas = gemCanvasRefs[`socket-${index}`]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.webkitImageSmoothingEnabled = false
    ctx.mozImageSmoothingEnabled = false
    ctx.msImageSmoothingEnabled = false

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get gem sprite config
    const gemSpriteConfig = spriteConfig.items?.[gemType]
    if (!gemSpriteConfig) {
      console.warn(`No sprite config found for gem: ${gemType}`)
      return
    }

    // Draw gem sprite from spritesheet (no scaling, 16x16 -> 16x16)
    ctx.drawImage(
      itemsSpritesheet,
      gemSpriteConfig.x, gemSpriteConfig.y, gemSpriteConfig.width, gemSpriteConfig.height,
      0, 0, canvas.width, canvas.height
    )
  })
}

const handleClick = () => {
  emit('toggle')
}

onMounted(async () => {
  await loadSpritesheet()
  drawWeaponSprite()
  drawGemSprites()
})

// Redraw when weapon changes
watch(() => props.currentWeapon, () => {
  if (isLoaded.value) {
    drawWeaponSprite()
  }
})

// Redraw when weapon data changes (gem sockets)
watch(() => props.weaponData, () => {
  if (isLoaded.value) {
    setTimeout(() => {
      drawGemSprites()
    }, 50)
  }
}, { deep: true })

// Redraw when spritesheet is loaded
watch(isLoaded, (loaded) => {
  if (loaded) {
    drawWeaponSprite()
    drawGemSprites()
  }
})
</script>

<style scoped>
.weapon-button-container {
  position: relative;
}

.weapon-display {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 60px;
  min-height: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.weapon-sprite {
  width: 80px;
  height: 140px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
  pointer-events: none;
}

.weapon-info {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.weapon-damage {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
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

.gem-sprite {
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
  pointer-events: none;
}

.active-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  animation: pulse-indicator 1s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse-indicator {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

/* Touch devices */
@media (hover: none) {
  .weapon-display:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    transform: none;
  }

  .weapon-display:active {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(0.95);
  }
}
</style>
