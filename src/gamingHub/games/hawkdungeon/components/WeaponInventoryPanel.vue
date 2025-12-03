<template>
  <div class="weapon-inventory-panel">
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

          <!-- Damage Stats -->
          <div class="weapon-stats">
            <div class="stat-damage">
              ⚔️ {{ getWeaponStats(weapon).totalDamage }}
              <span v-if="getWeaponStats(weapon).gemDamageBonus > 0" class="stat-bonus">
                +{{ getWeaponStats(weapon).gemDamageBonus }}
              </span>
            </div>
          </div>

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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { weaponConfig } from '../config/weaponConfig'
import { spriteConfig, SPRITE_SCALE } from '../config/spriteConfig'
import { useSpriteManager } from '../composables/useSpriteManager'
import { gemConfig, calculateGemBonuses } from '../config/gemConfig'

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

const emit = defineEmits(['select-weapon', 'socket-gem', 'unsocket-gem'])

// Use plain objects for template refs (not reactive refs)
const weaponCanvasRefs = {}
const { loadSpritesheet, isLoaded, getSpritesheet } = useSpriteManager()

// Calculate weapon stats with gem bonuses
const getWeaponStats = (weapon) => {
  const baseDamage = weaponConfig[weapon.name]?.damage || 0
  const gemBonuses = calculateGemBonuses(weapon.sockets)

  return {
    baseDamage,
    gemDamageBonus: gemBonuses.damage,
    totalDamage: baseDamage + gemBonuses.damage,
    bonuses: gemBonuses
  }
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
  if (!isLoaded.value) return

  const weaponSpritesheet = getSpritesheet('weapons')
  if (!weaponSpritesheet) return

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
      weaponSpritesheet,
      weaponSpriteConfig.x, weaponSpriteConfig.y, weaponSpriteConfig.width, weaponSpriteConfig.height,
      x, y, spriteWidth, spriteHeight
    )
  })
}

onMounted(async () => {
  await loadSpritesheet()
  drawWeaponSprites()
})

// Redraw when weapons change
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
.weapon-inventory-panel {
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

.inventory-slot:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.inventory-slot:active {
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

.item-name {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.weapon-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 4px 0;
}

.stat-damage {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stat-bonus {
  font-size: 10px;
  color: rgb(34, 197, 94);
  font-weight: 700;
  text-shadow: 0 0 4px rgba(34, 197, 94, 0.6);
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

/* Custom scrollbar */
.weapon-inventory-panel::-webkit-scrollbar {
  width: 8px;
}

.weapon-inventory-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.weapon-inventory-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.weapon-inventory-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Touch devices */
@media (hover: none) {
  .inventory-slot:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    transform: none;
  }

  .inventory-slot:active {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(0.95);
  }
}
</style>
