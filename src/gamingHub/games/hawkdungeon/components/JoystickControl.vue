<template>
  <div class="joystick-container">
    <div
      class="joystick-base"
      ref="joystickBase"
      @touchstart.prevent="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend.prevent="handleTouchEnd"
      @mousedown.prevent="handleMouseDown"
    >
      <div class="joystick-directions">
        <div class="direction-marker up" :class="{ active: direction === 'up' }">▲</div>
        <div class="direction-marker down" :class="{ active: direction === 'down' }">▼</div>
        <div class="direction-marker left" :class="{ active: direction === 'left' }">◀</div>
        <div class="direction-marker right" :class="{ active: direction === 'right' }">▶</div>
      </div>
      <div
        class="joystick-stick"
        :style="{
          transform: `translate(${stickPosition.x}px, ${stickPosition.y}px)`
        }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['move', 'stop'])

const joystickBase = ref(null)
const direction = ref(null)
const stickPosition = reactive({ x: 0, y: 0 })
const isActive = ref(false)

const maxDistance = 35 // Maximum distance stick can move from center

const calculateDirection = (x, y) => {
  const angle = Math.atan2(y, x) * (180 / Math.PI)

  // 4-axis only: up, down, left, right
  if (angle >= -45 && angle < 45) {
    return 'right'
  } else if (angle >= 45 && angle < 135) {
    return 'down'
  } else if (angle >= -135 && angle < -45) {
    return 'up'
  } else {
    return 'left'
  }
}

const updateStick = (clientX, clientY) => {
  if (!joystickBase.value) return

  const rect = joystickBase.value.getBoundingClientRect()
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  let deltaX = clientX - rect.left - centerX
  let deltaY = clientY - rect.top - centerY

  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  if (distance > maxDistance) {
    const ratio = maxDistance / distance
    deltaX *= ratio
    deltaY *= ratio
  }

  stickPosition.x = deltaX
  stickPosition.y = deltaY

  const newDirection = calculateDirection(deltaX, deltaY)

  if (newDirection !== direction.value) {
    direction.value = newDirection
    emit('move', newDirection)
  }
}

const resetStick = () => {
  stickPosition.x = 0
  stickPosition.y = 0
  direction.value = null
  isActive.value = false
  emit('stop')
}

const handleTouchStart = (e) => {
  isActive.value = true
  const touch = e.touches[0]
  updateStick(touch.clientX, touch.clientY)
}

const handleTouchMove = (e) => {
  if (!isActive.value) return
  const touch = e.touches[0]
  updateStick(touch.clientX, touch.clientY)
}

const handleTouchEnd = () => {
  resetStick()
}

const handleMouseDown = (e) => {
  isActive.value = true
  updateStick(e.clientX, e.clientY)

  const handleMouseMove = (e) => {
    if (!isActive.value) return
    updateStick(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    resetStick()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<style scoped>
.joystick-container {
  position: relative;
}

.joystick-base {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border: 4px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 2px 8px rgba(0,0,0,0.3);
  position: relative;
  cursor: pointer;
}

.joystick-directions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.direction-marker {
  position: absolute;
  color: rgba(255,255,255,0.3);
  font-size: 20px;
  transition: all 0.1s;
}

.direction-marker.active {
  color: rgba(255,255,255,0.9);
  text-shadow: 0 0 8px rgba(255,255,255,0.8);
  transform: scale(1.2);
}

.direction-marker.up {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.direction-marker.down {
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.direction-marker.left {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.direction-marker.right {
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.joystick-stick {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  margin-top: -25px;
  margin-left: -25px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%);
  border: 3px solid rgba(255,255,255,0.5);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  transition: transform 0.1s;
  pointer-events: none;
}
</style>