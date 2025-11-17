<template>
  <div class="weapon-selector">
    <div
      v-for="(weaponName, index) in weapons"
      :key="weaponName"
      class="weapon-slot"
      :class="{ 'weapon-slot--active': weaponName === currentWeapon }"
      @click="$emit('select', weaponName)"
    >
      <div class="weapon-hotkey">{{ index + 1 }}</div>
      <canvas
        :ref="el => canvasRefs[weaponName] = el"
        class="weapon-sprite"
        width="80"
        height="140"
      />
      <div class="weapon-name">{{ weaponConfig[weaponName]?.name || weaponName }}</div>
      <div v-if="weaponName === currentWeapon" class="weapon-active-indicator">✓</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { weaponConfig } from '../config/weaponConfig'
import { spriteConfig, SPRITE_SCALE } from '../config/spriteConfig'
import { useSpriteManager } from '../composables/useSpriteManager'

const props = defineProps({
  weapons: {
    type: Array,
    required: true
  },
  currentWeapon: {
    type: String,
    required: true
  }
})

defineEmits(['select'])

const canvasRefs = ref({})
const { loadSpritesheet, isLoaded, spritesheet } = useSpriteManager()

const drawWeaponSprites = () => {
  if (!isLoaded.value || !spritesheet.value) return

  props.weapons.forEach(weaponName => {
    const canvas = canvasRefs.value[weaponName]
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

onMounted(async () => {
  await loadSpritesheet()
  drawWeaponSprites()
})

// Redraw when weapons change (e.g., when new weapons are unlocked)
watch(() => props.weapons, () => {
  if (isLoaded.value) {
    setTimeout(drawWeaponSprites, 100)
  }
}, { deep: true })

// Redraw when spritesheet is loaded
watch(isLoaded, (loaded) => {
  if (loaded) {
    drawWeaponSprites()
  }
})
</script>

<style scoped>
.weapon-selector {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.weapon-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 80px;
  height: 140px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.weapon-slot:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.weapon-slot:active {
  transform: translateY(0px);
}

.weapon-slot--active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
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

.weapon-name {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.weapon-hotkey {
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

.weapon-active-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 16px;
  color: rgb(34, 197, 94);
  filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.8));
}

/* Touch devices */
@media (hover: none) {
  .weapon-slot:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    transform: none;
  }

  .weapon-slot:active {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(0.95);
  }
}
</style>
