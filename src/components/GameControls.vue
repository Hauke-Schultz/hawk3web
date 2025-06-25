<script setup>
import { defineProps, defineEmits } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import Icon from './Icon.vue'

const props = defineProps({
  gameState: {
    type: String,
    default: 'playing',
    validator: (value) => ['playing', 'paused', 'completed'].includes(value)
  },
  showPause: {
    type: Boolean,
    default: true
  },
  showReset: {
    type: Boolean,
    default: true
  },
  showBack: {
    type: Boolean,
    default: true
  },
  // Button labels
  pauseLabel: {
    type: String,
    default: 'Pause'
  },
  resumeLabel: {
    type: String,
    default: 'Resume'
  },
  resetLabel: {
    type: String,
    default: 'Reset'
  },
  backLabel: {
    type: String,
    default: 'Back'
  }
})

const emit = defineEmits([
  'pause-game',
  'resume-game',
  'reset-game',
  'back-to-gaming'
])

const { t } = useI18n()
// Event handlers
const handlePause = () => {
  emit('pause-game')
}

const handleResume = () => {
  emit('resume-game')
}

const handleReset = () => {
  emit('reset-game')
}

const handleBack = () => {
  emit('back-to-gaming')
}
</script>

<template>
  <!-- Game Controls -->
  <div class="game-controls">
    <button
      v-if="gameState === 'playing' && showPause"
      class="btn btn--ghost btn--small"
      @click="handlePause"
    >
      {{ pauseLabel }}
    </button>
    <button
      v-else-if="gameState === 'paused' && showPause"
      class="btn btn--primary btn--small"
      @click="handleResume"
    >
      {{ resumeLabel }}
    </button>
    <button
      v-if="showReset"
      class="btn btn--ghost btn--small"
      @click="handleReset"
    >
      {{ resetLabel }}
    </button>
    <button
      v-if="showBack"
      class="btn btn--ghost btn--small"
      @click="handleBack"
    >
      {{ backLabel }}
    </button>
  </div>

  <!-- Pause Overlay -->
  <div v-if="gameState === 'paused'" class="pause-overlay">
    <div class="pause-content">
      <h3>{{ t('memory.game_paused') }}</h3>
      <button class="btn btn--primary" @click="handleResume">
        <Icon name="play" size="20" />
        {{ resumeLabel }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Game Controls
.game-controls {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  flex-wrap: wrap;
}

// Pause Overlay
.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-lg);
  z-index: 30;
}

.pause-content {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--space-6);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  h3 {
    margin: 0;
    color: var(--text-color);
  }
}
</style>