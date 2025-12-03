<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="gem-selection-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Select Gem to Socket</h3>
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
            <div class="gem-icon-large" :style="{ color: gemConfig[gem.type]?.color }">
              {{ gemConfig[gem.type]?.icon }}
            </div>
            <div class="gem-name">{{ gemConfig[gem.type]?.name }}</div>
            <div class="gem-description">{{ gemConfig[gem.type]?.description }}</div>

            <!-- Bonuses -->
            <div class="gem-bonuses">
              <div
                v-for="(value, key) in gemConfig[gem.type]?.bonuses"
                :key="key"
                class="bonus-item"
              >
                <span v-if="key === 'damage'">⚔️ Damage {{ value > 0 ? '+' : '' }}{{ value }}</span>
                <span v-else-if="key === 'cooldown'">⏱️ Cooldown {{ value }}s</span>
                <span v-else-if="key === 'healthRegen'">❤️ Health Regen {{ value }}s</span>
                <span v-else-if="key === 'manaRegen'">💧 Mana Regen {{ value }}s</span>
                <span v-else-if="key === 'manaCost'">🔮 Mana Cost {{ value }}</span>
              </div>
            </div>

            <!-- Count badge -->
            <div class="gem-count-badge">{{ gem.count }}x</div>
          </div>
        </div>

        <div v-if="availableGems.length === 0" class="no-gems">
          <div class="no-gems-icon">💎</div>
          <div class="no-gems-text">No gems available in inventory</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { gemConfig } from '../config/gemConfig'

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

const handleOverlayClick = () => {
  handleClose()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.gem-selection-modal {
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 50, 0.95));
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.close-button {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
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
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.gem-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.gem-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.gem-card:active {
  transform: translateY(-2px);
}

.gem-icon-large {
  font-size: 48px;
  filter: drop-shadow(0 0 8px currentColor);
  margin-bottom: 4px;
}

.gem-name {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.gem-description {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  line-height: 1.3;
}

.gem-bonuses {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.bonus-item {
  font-size: 11px;
  color: rgba(34, 197, 94, 0.9);
  font-weight: 600;
  text-align: center;
}

.gem-count-badge {
  position: absolute;
  top: 8px;
  right: 8px;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.no-gems {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  opacity: 0.6;
}

.no-gems-icon {
  font-size: 64px;
}

.no-gems-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

/* Modal transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Scrollbar */
.gem-selection-modal::-webkit-scrollbar {
  width: 8px;
}

.gem-selection-modal::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.gem-selection-modal::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.gem-selection-modal::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Responsive */
@media (max-width: 640px) {
  .gem-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .gem-card {
    padding: 12px;
  }

  .gem-icon-large {
    font-size: 36px;
  }
}
</style>
