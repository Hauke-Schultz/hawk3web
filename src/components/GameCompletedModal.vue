<script setup>
import {computed, ref, watch} from 'vue'
import { useI18n } from '../composables/useI18n.js'
import Icon from './Icon.vue'
import PerformanceStats from "./PerformanceStats.vue";
import CurrencyDisplay from "./CurrencyDisplay.vue";

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
	rewardBreakdown: {
		type: Object,
		default: () => ({
			levelReward: { coins: 0, diamonds: 0, source: 'Level Completion' },
			achievementRewards: [],
			comboRewards: { coins: 0, diamonds: 0, source: 'Combo Bonus' },
			perfectBonus: { coins: 0, diamonds: 0, source: 'Perfect Score' }
		})
	},
	showRewardBreakdown: {
		type: Boolean,
		default: false
	},
	showCompletionPhases: {
		type: Boolean,
		default: false
	},
	enablePhaseTransition: {
		type: Boolean,
		default: true
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
    default: 'Back'
  },
  reward: {
    type: Object,
    default: () => ({ coins: 0, diamonds: 0 })
  },
  showReward: {
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

const showFirstPhase = ref(false)
const showSecondPhase = ref(false)
const modalContent = ref(null)

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
  return null
})

const shouldShowModal = computed(() => {
	if (props.showCompletionPhases) {
		return showFirstPhase.value || showSecondPhase.value
	}
	return props.visible
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
	if (showSecondPhase.value || !props.showCompletionPhases) {
		emit('close')
	}
	if (showFirstPhase.value && props.enablePhaseTransition) {
		handleFirstPhaseClick()
	} else if (showSecondPhase.value) {
		emit('close')
	} else {
		emit('close')
	}
}

const handleTryAgain = () => {
  emit('try-again')
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

const handleFirstPhaseClick = (event) => {
	if (!props.enablePhaseTransition) return
	if (event) {
		event.stopPropagation()
	}

	showFirstPhase.value = false
	showSecondPhase.value = true
}

const handleFirstPhaseKeyDown = (event) => {
	if (event.key === 'Enter' || event.key === 'Escape') {
		handleFirstPhaseClick()
	}
}

watch(() => props.visible, (newVisible) => {
	if (newVisible && props.showCompletionPhases) {
		// Start with first phase
		showFirstPhase.value = true
		showSecondPhase.value = false
	} else if (!newVisible) {
		// Reset phases when hidden
		showFirstPhase.value = false
		showSecondPhase.value = false
	}
})
</script>

<template>
  <Teleport to="body">
	  <div
		  v-if="shouldShowModal"
		  class="game-completed-overlay"
		  :class="{
	      'game-completed-overlay--game-over': gameOverMode,
	      'game-completed-overlay--first-phase': showFirstPhase,
	      'game-completed-overlay--second-phase': showSecondPhase
	    }"
		  @click="handleOverlayClick"
		  @keydown="handleKeyDown"
		  tabindex="-1"
	  >
		  <div
			  v-if="showFirstPhase"
			  class="completion-first-phase"
			  @click="handleFirstPhaseClick"
			  @keydown="handleFirstPhaseKeyDown"
			  tabindex="0"
		  >
			  <div class="completion-overlay">
				  <div class="completion-content">
					  <!-- Stars Display -->
					  <div v-if="showStars && !gameOverMode" class="stars-display">
						  <Icon
								  v-for="starIndex in 3"
								  :key="starIndex"
								  :name="starIndex <= starsEarned ? 'star-filled' : 'star'"
								  size="48"
								  :class="{
                'star--earned': starIndex <= starsEarned,
                'star--empty': starIndex > starsEarned
              }"
						  />
					  </div>

					  <!-- Score Display -->
					  <div class="score-display">
						  <div class="score-label">{{ t('stats.final_score') }}</div>
						  <div class="score-value">{{ finalScore }}</div>
					  </div>
				  </div>
			  </div>
		  </div>

		  <div
			  v-if="showSecondPhase || (!showCompletionPhases && visible)"
			  ref="modalContent"
			  class="game-completed-modal"
			  :class="{ 'game-completed-modal--game-over': gameOverMode }"
			  @click.stop
			  role="dialog"
			  aria-modal="true"
			  :aria-labelledby="getModalTitle"
		  >
        <div class="completed-content">
	        <h3 id="completed-title" class="completed-title" :class="{ 'completed-title--game-over': gameOverMode }">
		        {{ getModalTitle }}
	        </h3>
          <!-- Achievements Section -->
	        <div v-if="showAchievements && newAchievements.length > 0 && !gameOverMode" class="achievements-compact">
		        <div class="achievements-compact-list">
			        <div v-for="achievement in newAchievements" :key="achievement.id" class="achievement-compact-item">
				        <Icon :name="achievement.icon" size="20" />
				        <span class="achievement-compact-name">{{ t(`achievements.definitions.${achievement.id}.name`) }}</span>
				        <div class="achievement-compact-reward">
                  <span v-if="achievement.rewards.coins > 0" class="reward-amount reward-amount--coins">
                    +{{ achievement.rewards.coins }} 💰
                  </span>
					        <span v-if="achievement.rewards.diamonds > 0" class="reward-amount reward-amount--diamonds">
                    +{{ achievement.rewards.diamonds }} 💎
                  </span>
				        </div>
			        </div>
		        </div>
	        </div>

	        <!-- Compact Rewards Breakdown -->
	        <div v-if="showRewardBreakdown && !gameOverMode" class="rewards-breakdown">
		        <div v-if="rewardBreakdown.levelReward.coins > 0 || rewardBreakdown.levelReward.diamonds > 0"
		             class="reward-item">
			        <span class="reward-source">{{ t('rewards.level_completion') }}</span>
			        <div class="reward-amounts">
                <span v-if="rewardBreakdown.levelReward.coins > 0" class="reward-amount reward-amount--coins">
                  +{{ rewardBreakdown.levelReward.coins }} 💰
                </span>
				        <span v-if="rewardBreakdown.levelReward.diamonds > 0" class="reward-amount reward-amount--diamonds">
                  +{{ rewardBreakdown.levelReward.diamonds }} 💎
                </span>
			        </div>
		        </div>

		        <!-- Achievement Rewards -->
		        <div v-for="achievement in rewardBreakdown.achievementRewards"
		             :key="achievement.id"
		             class="reward-item">
              <span class="reward-source">
                <Icon :name="achievement.icon" size="16" />
                {{ t(`achievements.definitions.${achievement.id}.name`) }}
              </span>
			        <div class="reward-amounts">
                <span v-if="achievement.coins > 0" class="reward-amount reward-amount--coins">
                  +{{ achievement.coins }} 💰
                </span>
				        <span v-if="achievement.diamonds > 0" class="reward-amount reward-amount--diamonds">
                  +{{ achievement.diamonds }} 💎
                </span>
			        </div>
		        </div>

		        <!-- Combo Rewards -->
		        <div v-if="rewardBreakdown.comboRewards.coins > 0" class="reward-item">
			        <span class="reward-source">{{ t('rewards.combo_bonus') }}</span>
			        <div class="reward-amounts">
                <span class="reward-amount reward-amount--coins">
                  +{{ rewardBreakdown.comboRewards.coins }} 💰
                </span>
			        </div>
		        </div>

		        <!-- Perfect Bonus -->
		        <div v-if="rewardBreakdown.perfectBonus.coins > 0 || rewardBreakdown.perfectBonus.diamonds > 0"
		             class="reward-item">
			        <span class="reward-source">{{ t('rewards.perfect_bonus') }}</span>
			        <div class="reward-amounts">
                <span v-if="rewardBreakdown.perfectBonus.coins > 0" class="reward-amount reward-amount--coins">
                  +{{ rewardBreakdown.perfectBonus.coins }} 💰
                </span>
				        <span v-if="rewardBreakdown.perfectBonus.diamonds > 0" class="reward-amount reward-amount--diamonds">
                  +{{ rewardBreakdown.perfectBonus.diamonds }} 💎
                </span>
			        </div>
		        </div>
	        </div>

	        <!-- Total Summary -->
	        <div class="reward-summary">
		        <span class="reward-summary-label">{{ t('rewards.total_earned') }}</span>
		        <div class="reward-summary-amounts">
              <span v-if="reward.coins > 0" class="reward-total reward-total--coins">
                {{ reward.coins }} 💰
              </span>
			        <span v-if="reward.diamonds > 0" class="reward-total reward-total--diamonds">
                {{ reward.diamonds }} 💎
              </span>
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
  background-color: rgba(0, 0, 0, 0.4);
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
  width: calc(var(--content-width) - var(--space-2));
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
  flex-direction: row;
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
	align-items: flex-start;
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
	text-align: left;
}

.level-rewards-section {
  text-align: center;
}

.level-rewards-display {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  align-items: center;
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
// Rewards Breakdown
.rewards-breakdown {
	background-color: var(--card-bg-hover);
	border: 1px solid var(--success-color);
	border-radius: var(--border-radius-lg);
	padding: var(--space-2);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.rewards-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--success-color);
	margin: 0 0 var(--space-2) 0;
	text-align: center;
}

.reward-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--space-2);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-md);
	border-left: 3px solid var(--success-color);
}

.reward-source {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-sm);
	color: var(--text-color);
	flex: 1;
}

.reward-amounts {
	display: flex;
	gap: var(--space-2);
	align-items: center;
}

.reward-amount {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	padding: var(--space-0) var(--space-2);
	border-radius: var(--border-radius-sm);

	&--coins {
		background-color: var(--card-bg);
		color: var(--white);
	}

	&--diamonds {
		background: linear-gradient(135deg, var(--button-gradient-start), var(--button-gradient-end));
		color: var(--white);
	}
}

.reward-summary {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--space-3);
	background: linear-gradient(135deg, var(--success-color), var(--primary-color));
	border-radius: var(--border-radius-md);
	color: white;
}

.reward-summary-label {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
}

.reward-summary-amounts {
	display: flex;
	gap: var(--space-3);
	align-items: center;
}

.reward-total {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	display: flex;
	align-items: center;
	gap: var(--space-1);

	&--coins {
		color: #FFF8DC;
	}

	&--diamonds {
		color: #E6E6FA;
	}
}


// Compact Achievements
.achievements-compact {
	background-color: var(--card-bg-hover);
	border: 1px solid var(--warning-color);
	border-radius: var(--border-radius-lg);
	padding: var(--space-2);
}

.achievements-compact-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.achievement-compact-item {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-md);
	border-left: 3px solid var(--warning-color);
}

.achievement-compact-name {
	flex: 1;
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	text-align: left;
}

.achievement-compact-reward {
	display: flex;
	gap: var(--space-1);
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

.game-completed-overlay--first-phase {
	.completion-first-phase {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		animation: fadeInOverlay 0.5s ease;

		&:focus-visible {
			outline: none;
		}
	}

	.completion-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}

	.completion-content {
		position: relative;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		text-align: center;
		pointer-events: none;
		justify-content: center;
		height: 100vh;
	}

	.stars-display {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		justify-content: center;

		.star--earned {
			color: var(--warning-color);
			animation: starPopIn 4s ease-in-out infinite 2s;
			filter: drop-shadow(0 0 8px var(--warning-color));
		}

		.star--empty {
			color: var(--text-muted);
			opacity: 0.4;
		}
	}

	.score-display {
		background: linear-gradient(135deg, var(--button-gradient-start), var(--button-gradient-end));
		border: 2px solid var(--primary-color);
		border-radius: var(--border-radius-xl);
		padding: var(--space-6) var(--space-8);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		animation: scoreSlideIn 0.8s ease-out 0.3s both;
	}

	.score-label {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		text-transform: uppercase;
		font-weight: var(--font-weight-bold);
		margin-bottom: var(--space-2);
	}

	.score-value {
		font-size: var(--font-size-4xl);
		font-weight: var(--font-weight-bold);
		color: var(--text-secondary);
		line-height: 1;
	}
}

// Second Phase Specific Styles
.game-completed-overlay--second-phase {
	.game-completed-modal {
		animation: modalSlideIn 0.4s ease;
	}
}

// Animations
@keyframes fadeInOverlay {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes starPopIn {
	0% {
		transform: scale(0.3) rotate(-180deg);
		opacity: 1;
	}
	10% {
		transform: scale(1.2) rotate(0deg);
	}
	20% {
		transform: scale(1) rotate(0deg);
		opacity: 1;
	}
}

@keyframes scoreSlideIn {
	from {
		transform: translateY(30px) scale(0.8);
		opacity: 0;
	}
	to {
		transform: translateY(0) scale(1);
		opacity: 1;
	}
}

@keyframes modalSlideIn {
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