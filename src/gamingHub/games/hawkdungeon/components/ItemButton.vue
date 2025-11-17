<template>
  <div class="item-button-container">
    <button
      class="item-button"
      :class="{ 'active': isActive }"
      @click="handleClick"
    >
      <div class="button-content">
        <div class="item-icon">🎒</div>
        <div class="button-text">ITEMS</div>
      </div>
      <div v-if="isActive" class="active-indicator"></div>
    </button>
  </div>
</template>

<script setup>
defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

const handleClick = () => {
  emit('toggle')
}
</script>

<style scoped>
.item-button-container {
  position: relative;
}

.item-button {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border: 3px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 -2px 8px rgba(0,0,0,0.3);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.1s, box-shadow 0.1s, background 0.2s;
}

.item-button:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 8px rgba(0,0,0,0.3);
}

.item-button.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.6), inset 0 -2px 8px rgba(0,0,0,0.3);
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

.item-icon {
  font-size: 24px;
  margin-bottom: 2px;
}

.button-text {
  font-size: 9px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.active-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  animation: pulse-indicator 1s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse-indicator {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
}
</style>
