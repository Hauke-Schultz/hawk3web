<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
import PerformanceStats from "./PerformanceStats.vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  level: {
    type: Number,
    required: true
  },
  gameTitle: {
    type: String,
    default: 'Game'
  },
  finalScore: {
    type: Number,
    required: true
  },
  timeElapsed: {
    type: Number,
    required: true
  },
  moves: {
    type: Number,
    required: true
  },
  matches: {
    type: Number,
    required: true
  },
  totalPairs: {
    type: Number,
    required: true
  },
  starsEarned: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 3
  },
  showStars: {
    type: Boolean,
    default: true
  },
  // Action button configurations
  showNextLevel: {
    type: Boolean,
    default: true
  },
  showPlayAgain: {
    type: Boolean,
    default: true
  },
  showBackToGames: {
    type: Boolean,
    default: true
  },
  // Custom button labels
  nextLevelLabel: {
    type: String,
    default: 'Back to Levels'
  },
  playAgainLabel: {
    type: String,
    default: 'Play Again'
  },
  backToGamesLabel: {
    type: String,
    default: 'Back to Games'
  }
})

const emit = defineEmits([
  'next-level',
  'play-again',
  'back-to-games',
  'close'
])

// Format time display
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getPerformanceMessage = () => {
  switch (props.starsEarned) {
    case 3:
      return 'Perfect Performance!'
    case 2:
      return 'Great Job!'
    case 1:
      return 'Well Done!'
    default:
      return 'Level Complete!'
  }
}

// Event handlers
const handleNextLevel = () => {
  emit('next-level')
}

const handlePlayAgain = () => {
  emit('play-again')
}

const handleBackToGames = () => {
  emit('back-to-games')
}

const handleOverlayClick = () => {
  emit('close')
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="game-completed-overlay"
      @click="handleOverlayClick"
      @keydown="handleKeyDown"
      tabindex="-1"
    >
      <div
        class="game-completed-modal"
        @click.stop
        role="dialog"
        aria-modal="true"
        aria-labelledby="completed-title"
      >
        <div class="completed-content">
          <div class="completion-header">
            <h3 id="completed-title" class="completed-title">{{ gameTitle }} - Level {{ level }}</h3>

            <!-- Stars Display -->
            <div v-if="showStars" class="stars-display">
              <Icon
                v-for="starIndex in 3"
                :key="starIndex"
                :name="starIndex <= starsEarned ? 'star-filled' : 'star'"
                size="32"
                :class="{
                  'star--earned': starIndex <= starsEarned,
                  'star--empty': starIndex > starsEarned
                }"
              />
            </div>

            <!-- Performance message -->
            <p class="performance-message">{{ getPerformanceMessage() }}</p>
          </div>
          <PerformanceStats
            :score="finalScore"
            :time-elapsed="timeElapsed"
            :moves="moves"
            :matches="matches"
            :total-pairs="totalPairs"
            layout="grid"
            theme="default"
            size="large"
            :show-score="true"
            :show-time="true"
            :show-moves="true"
            :show-matches="true"
            score-label="Final Score"
          />

          <div class="completed-actions">
            <button
              v-if="showNextLevel"
              class="btn btn--primary"
              @click="handleNextLevel"
            >
              {{ nextLevelLabel }}
            </button>
            <button
              v-if="showPlayAgain"
              class="btn btn--ghost"
              @click="handlePlayAgain"
            >
              {{ playAgainLabel }}
            </button>
            <button
              v-if="showBackToGames"
              class="btn btn--ghost"
              @click="handleBackToGames"
            >
              {{ backToGamesLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
// Modal Overlay
.game-completed-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

// Modal Container
.game-completed-modal {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-xl);
  border: 1px solid var(--card-border);
  width: calc(var(--content-width) - var(--space-16));
  max-width: var(--content-width);
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.5);
  animation: slideInScale 0.4s ease;
  max-height: 90vh;
  overflow-y: auto;
}

// Content
.completed-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
}

.completed-title {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.8;
}

.completed-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.completion-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
}

.completed-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.8;
}

// Stars Display
.stars-display {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  margin: var(--space-2) 0;
}

.star--earned {
  color: var(--warning-color);
  animation: starGlow 0.6s ease-in-out;
}

.star--empty {
  color: var(--text-muted);
  opacity: 0.4;
}

.performance-message {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  margin: 0;
  animation: messageSlide 0.8s ease-out;
}

// Star animations
@keyframes starGlow {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInScale {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

</style>