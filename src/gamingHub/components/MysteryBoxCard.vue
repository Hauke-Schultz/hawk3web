<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from '../../composables/useI18n.js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { MYSTERY_BOX_CONFIG } from '../config/mysteryBoxConfig.js'
import CurrencyDisplay from './CurrencyDisplay.vue'
import Icon from '../../components/Icon.vue'

// Props
const props = defineProps({
	title: {
		type: String,
		default: 'Mystery Box'
	},
	cardType: {
		type: String,
		default: 'mysteryBoxCard'
	}
})

// Emits
const emit = defineEmits(['claim-mystery-box'])

// Services
const { t } = useI18n()
const {
	gameData,
	getMysteryBoxProgressData,
	canClaimMysteryBox,
	claimMysteryBox
} = useLocalStorage()

// State
const isAnimating = ref(false)
const mysteryBoxState = ref('progress') // 'progress', 'ready', 'claiming'

// Computed Properties
const progressData = computed(() => getMysteryBoxProgressData())
const canClaim = computed(() => canClaimMysteryBox())

const cardStatus = computed(() => {
	if (canClaim.value) return 'ready'
	if (mysteryBoxState.value === 'claiming') return 'claiming'
	return 'progress'
})

const getStatusText = () => {
	switch (cardStatus.value) {
		case 'ready':
			return t('daily_rewards.mystery_box_ready_subtitle')
		case 'claiming':
			return t('daily_rewards.mystery_box_claiming_subtitle')
		default:
			return t('daily_rewards.mystery_box_progress_subtitle', {
				remaining: progressData.value.remaining
			})
	}
}

// Methods
const handleClaimMysteryBox = (event) => {
	if (!canClaim.value) return

	if (event) {
		event.stopPropagation()
		event.preventDefault()
	}

	mysteryBoxState.value = 'claiming'
	isAnimating.value = true

	// Simulate mystery box opening animation
	setTimeout(() => {
		try {
			const reward = claimMysteryBox()

			if (reward) {
				emit('claim-mystery-box', reward)
				mysteryBoxState.value = 'progress'
				console.log(`🎁 Mystery Box claimed successfully!`, reward)
			} else {
				console.error('Failed to claim mystery box')
				mysteryBoxState.value = 'ready'
			}
		} catch (error) {
			console.error('Error claiming mystery box:', error)
			mysteryBoxState.value = 'ready'
		} finally {
			isAnimating.value = false
		}
	}, MYSTERY_BOX_CONFIG.animationDuration)
}

// Initialize on mount
onMounted(() => {
	console.log(`🎁 MysteryBoxCard mounted. Can claim: ${canClaim.value}, Counter: ${gameData.player.dailyRewardsCounter}`)

	if (canClaim.value) {
		mysteryBoxState.value = 'ready'
	}
})

// Watch for changes in dailyRewardsCounter
watch(() => gameData.player.dailyRewardsCounter, (newCount, oldCount) => {
	const mysteryBoxData = gameData.currency.mysteryBoxes || { lastClaimedCounter: 0 }

	console.log(`🎁 Daily rewards counter changed: ${oldCount} → ${newCount}`)
	console.log(`🎁 Mystery box tracking:`, {
		lastClaimedCounter: mysteryBoxData.lastClaimedCounter,
		totalClaimed: mysteryBoxData.totalClaimed,
		canClaim: canClaim.value
	})

	// Check if we just reached a mystery box milestone
	if (canClaim.value && mysteryBoxState.value !== 'ready') {
		console.log(`🎁 Mystery Box is now ready! (${newCount} daily rewards)`)
		mysteryBoxState.value = 'ready'
	}

	// Reset to progress if we're no longer at a milestone
	if (!canClaim.value && mysteryBoxState.value === 'ready') {
		console.log(`🎁 Mystery Box no longer available`)
		mysteryBoxState.value = 'progress'
	}
}, { immediate: true })

// Also watch mystery box data changes
watch(() => gameData.currency.mysteryBoxes, (newData) => {
	console.log(`🎁 Mystery box data changed:`, newData)

	// Update state if needed
	if (!canClaim.value && mysteryBoxState.value === 'ready') {
		mysteryBoxState.value = 'progress'
	}
}, { deep: true })
</script>

<template>
	<div
			class="mystery-box-card"
			:class="`mystery-box-card--${cardStatus}`"
			@click.stop
	>
		<div class="mystery-box-header">
			<div class="mystery-box-icon-container">
				<div
						class="mystery-box-icon"
						:class="{
            'mystery-box-icon--ready': cardStatus === 'ready',
            'mystery-box-icon--claiming': cardStatus === 'claiming',
            'mystery-box-icon--progress': cardStatus === 'progress'
          }"
				>
					🎁
				</div>
				<div v-if="progressData.mysteryBoxNumber > 0" class="mystery-box-counter">
					{{ progressData.mysteryBoxNumber }}
				</div>
			</div>

			<div class="mystery-box-info">
				<h4 class="mystery-box-title">
					{{ t('daily_rewards.mystery_box_title') }}
				</h4>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="mystery-box-progress">
			<div class="progress-header">
        <span class="progress-label">
          {{ t('daily_rewards.daily_rewards_progress') }}
        </span>
				<div class="progress-counter">
					{{ progressData.current }}/{{ progressData.required }}
				</div>
			</div>

			<div class="progress-bar-container">
				<div class="progress-bar">
					<div
							class="progress-fill"
							:class="`progress-fill--${cardStatus}`"
							:style="{ width: `${progressData.percentage}%` }"
					>
						<div class="progress-shine"></div>
					</div>
				</div>
			</div>

			<div v-if="cardStatus === 'ready'" class="progress-text">
				<Icon name="star-filled" size="14" />
				{{ t('daily_rewards.mystery_box_ready') }}
			</div>
			<div v-if="cardStatus === 'claiming'" class="progress-text">
				<Icon name="loading" size="14" />
				{{ t('daily_rewards.mystery_box_opening') }}
			</div>
		</div>

		<!-- Action Button -->
		<div class="mystery-box-actions">
			<button
					v-if="cardStatus === 'ready'"
					class="btn btn--success mystery-box-claim-btn"
					@click="handleClaimMysteryBox"
					@mousedown.stop
					@touchstart.stop
			>
				<Icon name="star-filled" size="16" />
				{{ t('daily_rewards.claim_mystery_box') }}
			</button>

			<button
					v-else-if="cardStatus === 'claiming'"
					class="btn mystery-box-claiming-btn"
					disabled
			>
				<Icon name="loading" size="16" class="icon-spin" />
				{{ t('daily_rewards.mystery_box_opening') }}
			</button>
		</div>

		<!-- Sparkles for Ready State -->
		<div
				v-if="cardStatus === 'ready'"
				class="mystery-box-sparkles"
		>
			<div class="sparkle sparkle-1">✨</div>
			<div class="sparkle sparkle-2">⭐</div>
			<div class="sparkle sparkle-3">💫</div>
			<div class="sparkle sparkle-4">🌟</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.mystery-box-card {
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	position: relative;
	overflow: hidden;
	pointer-events: auto;
	transition: all 0.3s ease;
	border: 2px solid;

	* {
		pointer-events: auto;
	}

	// Status-based styling
	&--progress {
		background: linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(156, 163, 175, 0.2));
		border-color: var(--info-color);
		color: var(--text-color);
	}

	&--ready {
		background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.3));
		border-color: #FFD700;
		color: var(--text-color);
		animation: mysteryBoxReadyPulse 2s ease-in-out infinite;
	}

	&--claiming {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3));
		border-color: var(--success-color);
		color: var(--text-color);
		animation: mysteryBoxClaiming 1s ease-in-out infinite;
	}
}

.mystery-box-header {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	margin-bottom: var(--space-3);
}

.mystery-box-icon-container {
	position: relative;
	flex-shrink: 0;
}

.mystery-box-icon {
	font-size: 2.5rem;
	line-height: 1;
	transition: all 0.3s ease;
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));

	&--progress {
		opacity: 0.6;
		transform: scale(0.9);
	}

	&--ready {
		animation: mysteryBoxIconReady 1.5s ease-in-out infinite;
		filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
	}

	&--claiming {
		animation: mysteryBoxIconSpin 2s linear infinite;
		filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.6));
	}
}

.mystery-box-counter {
	position: absolute;
	top: -4px;
	right: -4px;
	background: var(--primary-color);
	color: white;
	border-radius: 50%;
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.mystery-box-info {
	flex: 1;
	min-width: 0;
}

.mystery-box-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	margin: 0 0 var(--space-1) 0;
	color: var(--text-color);
}

.mystery-box-subtitle {
	font-size: var(--font-size-sm);
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.3;
}

.progress-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--space-2);
}

.progress-label {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
}

.progress-counter {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-secondary);
}

.progress-bar {
	height: 8px;
	background-color: var(--card-border);
	border-radius: var(--border-radius-md);
	overflow: hidden;
	position: relative;
}

.progress-fill {
	height: 100%;
	border-radius: var(--border-radius-md);
	transition: all 0.5s ease;
	position: relative;
	overflow: hidden;

	&--progress {
		background: linear-gradient(90deg, var(--info-color), var(--info-hover));
	}

	&--ready {
		background: linear-gradient(90deg, #FFD700, #FFA500);
		box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
	}

	&--claiming {
		background: linear-gradient(90deg, var(--success-color), var(--success-hover));
		box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
	}
}

.progress-shine {
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(
					90deg,
					transparent,
					rgba(255, 255, 255, 0.4),
					transparent
	);
	animation: progressShine 2s ease-in-out infinite;
}

.progress-text {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	justify-content: center;
}

.mystery-box-actions {
	display: flex;
	justify-content: center;
}

.mystery-box-claim-btn {
	background: linear-gradient(135deg, #FFD700, #FFA500);
	border: none;
	color: #1a1a1a;
	font-weight: var(--font-weight-bold);
	padding: var(--space-2) var(--space-4);
	border-radius: var(--border-radius-lg);
	box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);

	&:hover {
		background: linear-gradient(135deg, #FBBF24, #F59E0B);
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
	}
}

.mystery-box-claiming-btn {
	background: var(--success-color);
	border: none;
	color: white;
	font-weight: var(--font-weight-bold);
	padding: var(--space-2) var(--space-4);
	border-radius: var(--border-radius-lg);
	cursor: not-allowed;
	opacity: 0.8;
}

.mystery-box-info-btn {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.mystery-box-sparkles {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	z-index: 1;
}

.sparkle {
	position: absolute;
	font-size: 1rem;
	animation: sparkleFloat 3s ease-in-out infinite;
	opacity: 0.8;

	&.sparkle-1 {
		top: 15%;
		left: 15%;
		animation-delay: 0s;
	}

	&.sparkle-2 {
		top: 20%;
		right: 20%;
		animation-delay: 0.5s;
	}

	&.sparkle-3 {
		bottom: 25%;
		left: 20%;
		animation-delay: 1s;
	}

	&.sparkle-4 {
		bottom: 15%;
		right: 15%;
		animation-delay: 1.5s;
	}
}

// Animations
@keyframes mysteryBoxReadyPulse {
	0%, 100% {
		box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
	}
	50% {
		box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
	}
}

@keyframes mysteryBoxClaiming {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.02);
	}
}

@keyframes mysteryBoxIconReady {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.1);
	}
}

@keyframes mysteryBoxIconSpin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

@keyframes progressShine {
	0% { left: -100%; }
	100% { left: 100%; }
}

@keyframes sparkleFloat {
	0%, 100% {
		transform: translateY(0) rotate(0deg);
		opacity: 0.6;
	}
	50% {
		transform: translateY(-8px) rotate(180deg);
		opacity: 1;
	}
}

.icon-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

</style>