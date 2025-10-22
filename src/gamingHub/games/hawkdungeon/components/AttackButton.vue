<template>
  <div class="attack-button-container">
    <button
      class="attack-button"
      :class="{ 'on-cooldown': cooldown > 0, 'charging': isCharging }"
      @mousedown="handlePressStart"
      @mouseup="handlePressEnd"
      @mouseleave="handlePressCancel"
      @touchstart.prevent="handlePressStart"
      @touchend.prevent="handlePressEnd"
      @touchcancel.prevent="handlePressCancel"
    >
      <div class="button-content">
        <div class="weapon-icon">⚔️</div>
        <div class="button-text">{{ isCharging ? 'CHARGING...' : 'ATTACK' }}</div>
      </div>
      <div
        v-if="cooldown > 0"
        class="cooldown-overlay"
        :style="{ height: `${(cooldown / maxCooldown) * 100}%` }"
      />
      <div
        v-if="isCharging"
        class="charge-overlay"
        :style="{ height: `${Math.min((chargeDuration / 300) * 100, 100)}%` }"
      />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  cooldown: {
    type: Number,
    default: 0
  },
  weapon: {
    type: String,
    default: 'sword'
  }
})

const emit = defineEmits(['attack'])

const maxCooldown = ref(0.5)
const isCharging = ref(false)
const chargeDuration = ref(0)
let chargeStartTime = 0
let chargeInterval = null

const handlePressStart = () => {
  if (props.cooldown > 0) return

  isCharging.value = true
  chargeStartTime = performance.now()
  chargeDuration.value = 0

  // Update charge duration every 16ms
  chargeInterval = setInterval(() => {
    chargeDuration.value = performance.now() - chargeStartTime

    // Auto-execute charged attack when reaching 300ms
    if (chargeDuration.value >= 300) {
      clearInterval(chargeInterval)
      isCharging.value = false
      chargeDuration.value = 0
      emit('attack', { charged: true })
    }
  }, 16)
}

const handlePressEnd = () => {
  if (!isCharging.value) return

  clearInterval(chargeInterval)

  const duration = performance.now() - chargeStartTime

  // Only execute normal attack if released before 300ms
  // (charged attack already executed automatically at 300ms)
  if (duration < 300) {
    isCharging.value = false
    chargeDuration.value = 0
    emit('attack', { charged: false })
  } else {
    // Just reset state if already charged
    isCharging.value = false
    chargeDuration.value = 0
  }
}

const handlePressCancel = () => {
  if (!isCharging.value) return

  clearInterval(chargeInterval)
  isCharging.value = false
  chargeDuration.value = 0
}
</script>

<style scoped>
.attack-button-container {
  position: relative;
}

.attack-button {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
  border: 4px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 -2px 8px rgba(0,0,0,0.3);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.1s, box-shadow 0.1s;
}

.attack-button:active:not(.on-cooldown) {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 8px rgba(0,0,0,0.3);
}

.attack-button.on-cooldown {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  font-weight: bold;
}

.weapon-icon {
  font-size: 32px;
  margin-bottom: 4px;
}

.button-text {
  font-size: 12px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.cooldown-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.5);
  transition: height 0.05s linear;
  z-index: 1;
}

.charge-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.6) 0%, rgba(255, 165, 0, 0.8) 100%);
  transition: none;
  z-index: 1;
}

.attack-button.charging {
  animation: pulse 0.3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>