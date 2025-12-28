<template>
  <div
    v-if="visible"
    class="dialogue-bubble"
    :style="bubbleStyle"
    @click="handleClick"
  >
    <div class="dialogue-content">
      <div class="npc-name">{{ npcName }}</div>
      <div class="dialogue-text">{{ displayedText }}</div>
      <div v-if="hasMoreText" class="continue-indicator">
        {{ continueText }}
      </div>
    </div>
    <div class="dialogue-tail"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { DIALOGUE_CONFIG } from '../config/npcConfig'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  npcName: {
    type: String,
    default: 'NPC'
  },
  text: {
    type: String,
    default: ''
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  hasMoreText: {
    type: Boolean,
    default: false
  },
  continueText: {
    type: String,
    default: '▼ Klicke zum Fortfahren'
  }
})

const emit = defineEmits(['advance', 'close'])

const displayedText = ref('')
let textAnimationInterval = null

// Bubble position style
const bubbleStyle = computed(() => {
  return {
    left: `${props.position.x}px`,
    top: `${props.position.y}px`,
  }
})

// Animate text typing effect
const animateText = () => {
  if (!props.text) {
    displayedText.value = ''
    return
  }

  displayedText.value = ''
  let currentIndex = 0
  const chars = props.text.split('')

  // Clear any existing animation
  if (textAnimationInterval) {
    clearInterval(textAnimationInterval)
  }

  // Type out text character by character
  textAnimationInterval = setInterval(() => {
    if (currentIndex < chars.length) {
      displayedText.value += chars[currentIndex]
      currentIndex++
    } else {
      clearInterval(textAnimationInterval)
      textAnimationInterval = null
    }
  }, 1000 / DIALOGUE_CONFIG.textSpeed)
}

// Handle click on dialogue bubble
const handleClick = () => {
  // If text is still animating, complete it immediately
  if (textAnimationInterval) {
    clearInterval(textAnimationInterval)
    textAnimationInterval = null
    displayedText.value = props.text
    return
  }

  // Otherwise, advance to next dialogue
  if (props.hasMoreText) {
    emit('advance')
  } else {
    emit('close')
  }
}

// Watch for text changes
watch(() => props.text, () => {
  if (props.visible) {
    animateText()
  }
}, { immediate: true })

// Watch for visibility changes
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    animateText()
  } else {
    // Clear animation when hidden
    if (textAnimationInterval) {
      clearInterval(textAnimationInterval)
      textAnimationInterval = null
    }
    displayedText.value = ''
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (textAnimationInterval) {
    clearInterval(textAnimationInterval)
    textAnimationInterval = null
  }
})
</script>

<style lang="scss" scoped>
.dialogue-bubble {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #fff;
  border-radius: 12px;
  padding: 16px;
  min-width: 200px;
  max-width: 300px;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  animation: bubbleAppear 0.3s ease-out;
  z-index: 1000;

  &:hover {
    background: rgba(0, 0, 0, 0.95);
    border-color: #ffd700;
  }
}

.dialogue-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.npc-name {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.dialogue-text {
  font-size: 14px;
  color: #fff;
  line-height: 1.4;
  text-align: center;
  min-height: 40px;
  white-space: pre-wrap;
}

.continue-indicator {
  font-size: 11px;
  color: #aaa;
  text-align: center;
  margin-top: 4px;
  animation: blink 1.5s infinite;
}

.dialogue-tail {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #fff;

  &::after {
    content: '';
    position: absolute;
    top: -12px;
    left: -9px;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 9px solid rgba(0, 0, 0, 0.9);
  }
}

@keyframes bubbleAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

// Mobile responsive
@media (max-width: 480px) {
  .dialogue-bubble {
    min-width: 180px;
    max-width: 250px;
    padding: 12px;
  }

  .dialogue-text {
    font-size: 12px;
  }

  .npc-name {
    font-size: 12px;
  }

  .continue-indicator {
    font-size: 10px;
  }
}
</style>
