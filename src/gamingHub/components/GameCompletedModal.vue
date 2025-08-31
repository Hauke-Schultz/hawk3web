<script setup>
import {computed, ref, watch} from 'vue'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'

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
  return `${props.gameTitle} - ${t('memory.level_title', { level: props.level })}`
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

const canTransition = ref(false)
const transitionDelay = 2000

const handleFirstPhaseClick = (event) => {
	if (!props.enablePhaseTransition || !canTransition.value) return
	if (event) {
		event.stopPropagation()
	}

	showFirstPhase.value = false
	showSecondPhase.value = true
}

const handleFirstPhaseKeyDown = (event) => {
	if ((event.key === 'Enter' || event.key === 'Escape') && canTransition.value) {
		handleFirstPhaseClick()
	}
}

watch(() => props.visible, (newVisible) => {
	if (newVisible && props.showCompletionPhases) {
		// Start with first phase
		showFirstPhase.value = true
		showSecondPhase.value = false
		canTransition.value = false

		// Enable transition after delay
		setTimeout(() => {
			canTransition.value = true
		}, transitionDelay)
	} else if (!newVisible) {
		// Reset phases when hidden
		showFirstPhase.value = false
		showSecondPhase.value = false
		canTransition.value = false
	}
})

</script>

<template>
  <Teleport to="body">
	  <div
		  v-if="shouldShowModal"
		  class="game-completed-overlay"
		  :class="{
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
			  :data-can-transition="canTransition"
			  @click="handleFirstPhaseClick"
			  @keydown="handleFirstPhaseKeyDown"
			  tabindex="0"
		  >
			  <div class="completion-overlay">
				  <div class="completion-content">
					  <!-- Stars Display -->
					  <div v-if="showStars" class="stars-display">
						  <Icon
							  v-for="starIndex in 3"
							  :key="starIndex"
							  :name="starIndex <= starsEarned ? 'star-filled' : 'star'"
							  size="48"
							  :class="{
									'star--earned': starIndex <= starsEarned,
									'star--empty': starIndex > starsEarned
								}"
							  :style="{
									'--star-delay': `${(starIndex - 1) * 0.5}s`
								}"
						  />
					  </div>

					  <!-- Score Display -->
					  <div class="score-display">
						  <div class="score-label">{{ t('stats.final_score') }}</div>
						  <div class="score-value">{{ finalScore }}</div>
					  </div>

					  <!-- Transition Hint -->
					  <div v-if="enablePhaseTransition" class="transition-hint" :class="{ 'transition-hint--ready': canTransition }">
						  <div class="hint-text">{{ canTransition ? t('common.continue') : '' }}</div>
						  <div v-if="!canTransition" class="countdown-indicator">
							  <div class="countdown-bar" :style="{ animationDuration: `${transitionDelay}ms` }"></div>
						  </div>
					  </div>
				  </div>
			  </div>
		  </div>

		  <div
			  v-if="showSecondPhase || (!showCompletionPhases && visible)"
			  ref="modalContent"
			  class="game-completed-modal"
			  @click.stop
			  role="dialog"
			  aria-modal="true"
			  :aria-labelledby="getModalTitle"
		  >
        <div class="completed-content">
	        <h3 id="completed-title" class="completed-title">
		        {{ getModalTitle }}
	        </h3>

	        <div v-if="showRewardBreakdown && rewardBreakdown?.items?.length" class="rewards-breakdown">
		        <!-- Reward Items -->
		        <div
				        v-for="(item, index) in rewardBreakdown.items"
				        :key="`${item.type}-${index}`"
				        class="reward-item"
				        :class="`reward-item--${item.style}`"
		        >
			        <!-- Info items (like difficulty multiplier) -->
			        <template v-if="item.isInfo">
				        <div class="reward-info">
					        <Icon :name="item.icon" size="16" />
					        <span class="reward-info-text">{{ item.source }}</span>
				        </div>
			        </template>

			        <!-- Regular reward items -->
			        <template v-else>
				        <div class="reward-source">
					        <Icon :name="item.icon" size="16" />
					        {{ item.source }}
				        </div>
				        <div class="reward-amounts">
					        <span
							        v-if="item.diamonds > 0"
							        class="reward-amount reward-amount--diamonds"
					        >
				            +{{ item.diamonds }} 💎
				          </span>
				          <span
						          v-if="item.coins > 0"
						          class="reward-amount reward-amount--coins"
				          >
				            +{{ item.coins }} 💰
				          </span>
				        </div>
			        </template>
		        </div>
	        </div>

	        <!-- Total Summary -->
	        <div v-if="rewardBreakdown?.total" class="reward-summary">
		        <span class="reward-summary-label">{{ t('rewards.total_earned') }}</span>
		        <div class="reward-summary-amounts">
			        <span v-if="rewardBreakdown.total.diamonds > 0" class="reward-total reward-total--diamonds">
				        {{ rewardBreakdown.total.diamonds }} 💎
				      </span>
				      <span v-if="rewardBreakdown.total.coins > 0" class="reward-total reward-total--coins">
				        {{ rewardBreakdown.total.coins }} 💰
				      </span>
		        </div>
	        </div>

          <!-- Action Buttons (dynamisch basierend auf Modus) -->
          <div class="completed-actions">
	          <button
			          v-if="showBackToGames"
			          class="btn btn--info"
			          @click="handleBackToGames"
	          >
		          {{ backToGamesLabel }}
	          </button>
            <button
              v-if="showPlayAgain"
              class="btn btn--ghost"
              @click="handlePlayAgain"
            >
              {{ playAgainLabel }}
            </button>
	          <button
			          v-if="showNextLevel"
			          class="btn btn--gradient"
			          @click="handleNextLevel"
	          >
		          {{ nextLevelLabel }}
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
  padding: var(--space-4);
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
	justify-content: space-between;
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


// Rewards Breakdown
.rewards-breakdown {
	border-radius: var(--border-radius-lg);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.rewards-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--success-color);
	margin: 0 0 var(--space-3) 0;
	text-align: center;
}

.reward-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--space-1) var(--space-2);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-md);
	border-left: 3px solid var(--success-color);

	&--special {
		border-left-color: var(--error-color);
		background: linear-gradient(90deg, var(--card-bg) 0%, rgba(245, 158, 11, 0.1) 100%);
	}

	&--performance {
		border-left-color: var(--primary-color);
		background: linear-gradient(90deg, var(--card-bg) 0%, rgba(79, 70, 229, 0.1) 100%);
	}

	&--perfect {
		border-left-color: var(--success-color);
		background: linear-gradient(90deg, var(--card-bg) 0%, rgba(245, 158, 11, 0.15) 100%);
		box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
	}

	&--achievement {
		border-left-color: var(--warning-color);
		background: linear-gradient(90deg, var(--card-bg) 0%, rgba(107, 114, 128, 0.1) 100%);
	}

	&--info {
		border-left-color: var(--info-color);
		background: linear-gradient(90deg, var(--card-bg) 0%, rgba(107, 114, 128, 0.05) 100%);
		justify-content: center;
	}
}

.reward-source {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-sm);
	color: var(--text-color);
	text-align: left;
	flex: 1;
	line-height: 1;
}

.reward-amounts {
	display: flex;
	gap: var(--space-1);
	align-items: center;
}

.reward-amount {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	padding: var(--space-1);
	border-radius: var(--border-radius-sm);

	&--coins {
		background-color: var(--warning-color);
		color: var(--white);
	}

	&--diamonds {
		background: linear-gradient(135deg, var(--button-gradient-start), var(--button-gradient-end));
		color: var(--white);
	}
}

// Info items styling
.reward-info {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	width: 100%;
	justify-content: flex-start;
}

.reward-info-text {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-style: italic;
}

// Difficulty Multiplier Info
.reward-multiplier {
	padding: var(--space-2);
	background: linear-gradient(90deg, var(--card-bg) 0%, rgba(16, 185, 129, 0.1) 100%);
	border-radius: var(--border-radius-md);
	border-left: 3px solid var(--success-color);
}

.multiplier-info {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.multiplier-text {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-style: italic;
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
			animation: starSequentialPopIn 0.8s ease-out var(--star-delay, 0s) both;
			filter: drop-shadow(0 0 8px var(--warning-color));

			&::after {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				width: 100%;
				height: 100%;
				background: radial-gradient(circle, var(--warning-color) 0%, transparent 70%);
				border-radius: 50%;
				transform: translate(-50%, -50%) scale(0);
				opacity: 0;
				animation: starSparkle 0.6s ease-out calc(var(--star-delay, 0s) + 0.4s) infinite;
				pointer-events: none;
				z-index: -1;
			}
		}

		.star--empty {
			color: var(--text-muted);
			opacity: 0.4;
			animation: starFadeIn 0.4s ease-out calc(var(--star-delay, 0s) + 0.6s) both;
		}
	}

	@keyframes starSparkle {
		0% {
			transform: translate(-50%, -50%) scale(0);
			opacity: 0;
		}
		50% {
			transform: translate(-50%, -50%) scale(1.5);
			opacity: 0.6;
		}
		100% {
			transform: translate(-50%, -50%) scale(2);
			opacity: 0;
		}
	}

	@keyframes starSequentialPopIn {
		0% {
			transform: scale(0) rotate(-270deg);
			opacity: 0;
			filter: drop-shadow(0 0 0px var(--warning-color)) brightness(1);
		}
		20% {
			transform: scale(0.2) rotate(-180deg);
			opacity: 0.3;
			filter: drop-shadow(0 0 4px var(--warning-color)) brightness(1.2);
		}
		40% {
			transform: scale(0.8) rotate(-45deg);
			opacity: 0.7;
			filter: drop-shadow(0 0 8px var(--warning-color)) brightness(1.5);
		}
		60% {
			transform: scale(1.4) rotate(15deg);
			opacity: 0.9;
			filter: drop-shadow(0 0 12px var(--warning-color)) brightness(1.8);
		}
		75% {
			transform: scale(0.85) rotate(-8deg);
			opacity: 1;
			filter: drop-shadow(0 0 10px var(--warning-color)) brightness(1.4);
		}
		90% {
			transform: scale(1.1) rotate(3deg);
			opacity: 1;
			filter: drop-shadow(0 0 8px var(--warning-color)) brightness(1.1);
		}
		100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
			filter: drop-shadow(0 0 8px var(--warning-color)) brightness(1);
		}
	}

	@keyframes starFadeIn {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 0.4;
			transform: scale(1);
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

.transition-hint {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	opacity: 0.7;
	min-height: var(--space-6);
	transition: opacity 0.3s ease;

	&--ready {
		opacity: 1;

		.hint-text {
			animation: pulseHint 1s ease-in-out infinite alternate;
		}
	}
}

.hint-text {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.countdown-indicator {
	width: 120px;
	height: 4px;
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: var(--border-radius-sm);
	overflow: hidden;
	backdrop-filter: blur(4px);
}

.countdown-bar {
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, var(--primary-color), var(--success-color));
	border-radius: var(--border-radius-sm);
	transform: translateX(-100%);
	animation: countdownProgress linear forwards;
	box-shadow: 0 0 8px rgba(79, 70, 229, 0.6);
}

@keyframes countdownProgress {
	from {
		transform: translateX(-100%);
	}
	to {
		transform: translateX(0%);
	}
}

@keyframes pulseHint {
	from {
		transform: scale(1);
		opacity: 0.8;
	}
	to {
		transform: scale(1.05);
		opacity: 1;
	}
}

// Cursor-Status je nach Transition-Bereitschaft
.completion-first-phase {
	cursor: wait;

	&[data-can-transition="true"] {
		cursor: pointer;
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