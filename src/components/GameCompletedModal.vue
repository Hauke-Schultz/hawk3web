<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
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
  newAchievements: {
    type: Array,
    default: () => []
  },
  showAchievements: {
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

  gameOverMode: {
    type: Boolean,
    default: false
  },
  gameOverTitle: {
    type: String,
    default: 'Game Over'
  },
  gameOverMessage: {
    type: String,
    default: 'Better luck next time!'
  },
  gameOverIcon: {
    type: String,
    default: '💥'
  },
  showTryAgain: {
    type: Boolean,
    default: true
  },
  tryAgainLabel: {
    type: String,
    default: 'Try Again'
  },

  // Custom button labels
  nextLevelLabel: {
    type: String,
    default: 'Next Level'
  },
  playAgainLabel: {
    type: String,
    default: 'Play Again'
  },
  backToGamesLabel: {
    type: String,
    default: 'Back to Levels'
  },
  currencyEarned: {
    type: Object,
    default: () => ({ coins: 0, diamonds: 0 })
  },
  showCurrencyReward: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'next-level',
  'play-again',
  'back-to-games',
  'close',
  'try-again'
])

const { t } = useI18n()

const getPerformanceMessage = () => {
  switch (props.starsEarned) {
    case 3:
      return t('memory.perfect_performance')
    case 2:
      return t('memory.great_job')
    case 1:
      return t('memory.well_done')
    default:
      return t('memory.level_complete')
  }
}

const getModalTitle = computed(() => {
  if (props.gameOverMode) {
    return props.gameOverTitle
  }
  return `${props.gameTitle} - ${t('memory.level_title', { level: props.level })}`
})

const getModalMessage = computed(() => {
  if (props.gameOverMode) {
    return props.gameOverMessage
  }
  return getPerformanceMessage()
})

const getModalIcon = computed(() => {
  if (props.gameOverMode) {
    return props.gameOverIcon
  }
  return null // Für Erfolg verwenden wir Sterne
})

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

const handleTryAgain = () => {
  emit('try-again')
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
      :class="{ 'game-completed-overlay--game-over': gameOverMode }"
      @click="handleOverlayClick"
      @keydown="handleKeyDown"
      tabindex="-1"
    >
      <div
        class="game-completed-modal"
        :class="{ 'game-completed-modal--game-over': gameOverMode }"
        @click.stop
        role="dialog"
        aria-modal="true"
        :aria-labelledby="getModalTitle"
      >
        <div class="completed-content">
          <div class="completion-header">
            <!-- Game Over Icon (nur bei Game Over) -->
            <div v-if="gameOverMode" class="game-over-icon">
              {{ getModalIcon }}
            </div>

            <h3 id="completed-title" class="completed-title" :class="{ 'completed-title--game-over': gameOverMode }">
              {{ getModalTitle }}
            </h3>

            <!-- Stars Display (nur bei Erfolg) -->
            <div v-if="showStars && !gameOverMode" class="stars-display">
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
            <p class="performance-message" :class="{ 'performance-message--game-over': gameOverMode }">
              {{ getModalMessage }}
            </p>
          </div>

          <!-- Performance Stats (immer anzeigen) -->
          <PerformanceStats
            :score="finalScore"
            :time-elapsed="timeElapsed"
            :moves="moves"
            :matches="matches"
            :total-pairs="totalPairs"
            :layout="gameOverMode ? 'horizontal' : 'grid'"
            :theme="gameOverMode ? 'compact' : 'default'"
            :size="gameOverMode ? 'normal' : 'large'"
            :show-score="true"
            :show-time="false"
            :show-moves="true"
            :show-matches="false"
            :score-label="gameOverMode ? 'Final Score' : 'Score'"
          />
          <div
            v-if="showCurrencyReward && (currencyEarned.coins > 0 || currencyEarned.diamonds > 0)"
            class="currency-rewards-section"
          >
            <div class="currency-rewards-display">
              <div v-if="currencyEarned.coins > 0" class="currency-reward-item">
                <span class="currency-icon">💰</span>
                <span class="currency-amount">+{{ currencyEarned.coins }}</span>
                <span class="currency-label">{{ t('currency.coins') }}</span>
              </div>
              <div v-if="currencyEarned.diamonds > 0" class="currency-reward-item currency-reward-item--premium">
                <span class="currency-icon">💎</span>
                <span class="currency-amount">+{{ currencyEarned.diamonds }}</span>
                <span class="currency-label">{{ t('currency.diamonds') }}</span>
              </div>
            </div>
          </div>
          <!-- Achievements Section (nur bei Erfolg) -->
          <div v-if="showAchievements && newAchievements.length > 0 && !gameOverMode" class="achievements-section">
            <h4 class="achievements-title">🏆 {{ t('achievements.new_achievements') }}</h4>
            <div class="achievements-list">
              <div
                v-for="achievement in newAchievements"
                :key="achievement.id"
                class="achievement-item"
              >
                <div class="achievement-icon">
                  <Icon :name="achievement.icon" size="20" />
                </div>
                <div class="achievement-info">
                  <span class="achievement-name">{{ t(`achievements.definitions.${achievement.id}.name`) }}</span>
                  <span class="achievement-description">{{ t(`achievements.definitions.${achievement.id}.description`) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons (dynamisch basierend auf Modus) -->
          <div class="completed-actions">
            <!-- Game Over Actions -->
            <template v-if="gameOverMode">
              <button
                v-if="showTryAgain"
                class="btn btn--primary"
                @click="handleTryAgain"
              >
                {{ tryAgainLabel }}
              </button>
              <button
                v-if="showBackToGames"
                class="btn btn--ghost"
                @click="handleBackToGames"
              >
                {{ backToGamesLabel }}
              </button>
            </template>

            <!-- Success Actions -->
            <template v-else>
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
            </template>
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
// Achievements Section
.achievements-section {
  background-color: var(--card-bg-hover);
  border: 1px solid var(--success-color);
  border-radius: var(--border-radius-lg);
  padding: var(--space-4);
}

.achievements-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--success-color);
  margin: 0 0 var(--space-3) 0;
  text-align: center;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background-color: var(--card-bg);
  border-radius: var(--border-radius-md);
  padding: var(--space-2) var(--space-3);
  animation: achievementSlide 0.5s ease-out;
}

.achievement-icon {
  width: var(--space-8);
  height: var(--space-8);
  border-radius: 50%;
  background-color: var(--success-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.achievement-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.achievement-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  line-height: 1.2;
}

.achievement-description {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: 1.2;
}

.currency-rewards-section {
  text-align: center;
}

.currency-rewards-display {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  align-items: center;
}

.currency-reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  background-color: var(--card-bg);
  border-radius: var(--border-radius-md);
  min-width: 80px;

  &--premium {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(99, 102, 241, 0.1));
    border: 1px solid var(--primary-color);

    .currency-icon {
      filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.6));
    }

    .currency-amount {
      color: var(--primary-color);
    }
  }
}

.currency-icon {
  font-size: var(--font-size-lg);
}

.currency-amount {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--warning-color);
}

.currency-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
}

// Game Over Specific Styles
.game-completed-overlay--game-over {
  background-color: rgba(0, 0, 0, 0.9);
}

.game-completed-modal--game-over {
  border-color: var(--error-color);
  animation: gameOverSlide 0.5s ease;
}

.game-over-icon {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--space-2);
  animation: shake 0.6s ease-in-out;
}

.completed-title--game-over {
  color: var(--error-color);
}

.performance-message--game-over {
  color: var(--error-color);
  font-weight: var(--font-weight-bold);
}

// Game Over Animation
@keyframes gameOverSlide {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.8);
    filter: hue-rotate(0deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: hue-rotate(360deg);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
  20%, 40%, 60%, 80% { transform: translateX(3px); }
}

@keyframes achievementSlide {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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