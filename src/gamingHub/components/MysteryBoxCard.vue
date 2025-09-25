<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from '../../composables/useI18n.js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { MYSTERY_BOX_CONFIG } from '../config/mysteryBoxConfig.js'
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
	hasPendingMysteryBox,
	getPendingMysteryBox,
	claimPendingMysteryBox
} = useLocalStorage()

// State
const isAnimating = ref(false)
const mysteryBoxState = ref('progress') // 'progress', 'ready', 'pending', 'claiming'

// Computed Properties
const progressData = computed(() => getMysteryBoxProgressData())
const canClaim = computed(() => canClaimMysteryBox())
const pendingBox = computed(() => getPendingMysteryBox())
const hasPending = computed(() => hasPendingMysteryBox())

// Determine card status
const cardStatus = computed(() => {
	if (hasPending.value) return 'pending'
	if (canClaim.value) return 'ready'
	if (mysteryBoxState.value === 'claiming') return 'claiming'
	return 'progress'
})

// Methods
const handleClaimMysteryBox = (event) => {
	if (event) {
		event.stopPropagation()
		event.preventDefault()
	}

	// If there's a pending box, claim it
	if (hasPending.value) {
		mysteryBoxState.value = 'claiming'
		isAnimating.value = true

		setTimeout(() => {
			try {
				const result = claimPendingMysteryBox()

				if (result) {
					emit('claim-mystery-box', result)
					mysteryBoxState.value = 'progress'
				} else {
					mysteryBoxState.value = 'pending'
				}
			} catch (error) {
				mysteryBoxState.value = 'pending'
			} finally {
				isAnimating.value = false
			}
		}, MYSTERY_BOX_CONFIG.animationDuration)
	}
}

watch([() => gameData.currency.dailyRewards.counter, hasPending], ([newCount, newHasPending], [oldCount, oldHasPending]) => {
	// Update state based on current conditions
	if (newHasPending) {
		mysteryBoxState.value = 'pending'
	} else if (canClaim.value) {
		mysteryBoxState.value = 'ready'
	} else {
		mysteryBoxState.value = 'progress'
	}
}, { immediate: true })
</script>

<template>
	<div
			class="mystery-box-card"
			:class="`mystery-box-card--${cardStatus}`"
			@click.stop
	>
		<!-- Pending Item Display -->
		<div v-if="cardStatus === 'pending'" class="mystery-item-display">
			<div class="item-reveal-header">
				<Icon name="star-filled" size="16" />
				<span>{{ t('daily_rewards.mystery_item_discovered') }}</span>
			</div>

			<div class="revealed-item">
				<div class="item-icon-large">
					{{ pendingBox.item.icon }}
				</div>
				<div class="item-info">
					<h3 class="item-name">{{ pendingBox.item.name }}</h3>
					<p class="item-description">{{ pendingBox.item.description }}</p>
				</div>
			</div>

			<button
				v-if="cardStatus === 'pending'"
				class="item-reveal-button btn btn--warning"
				@click="handleClaimMysteryBox"
				@mousedown.stop
				@touchstart.stop
			>
				<Icon name="star-filled" size="16" />
				{{ t('daily_rewards.claim_mystery_item') }}
			</button>
		</div>

		<!-- Progress Bar (only show when not pending) -->
		<div v-if="cardStatus !== 'pending'" class="mystery-box-progress">
			<div class="progress-header">
        <span class="progress-label">
          {{ t('daily_rewards.mystery_box_title') }}
        </span>
				<span class="progress-counter">
          {{ progressData.current }}/{{ progressData.required }}
        </span>
			</div>

			<div class="progress-bar-container">
				<div class="progress-bar">
					<div
						class="progress-fill"
						:style="{ width: `${progressData.percentage}%` }"
					>
						<div class="progress-shine"></div>
					</div>
				</div>
			</div>
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
	background: linear-gradient(90deg, var(--info-color), var(--info-hover));
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

// Mystery Item Display
.mystery-item-display {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: var(--space-3);
}

.item-reveal-header {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--warning-color);
}

.revealed-item {
	display: flex;
	gap: var(--space-3);
	align-items: center;
}

.item-reveal-button {
	width: 100%;
}

.item-icon-large {
	font-size: 3rem;
	width: 80px;
	height: 80px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--border-radius-lg);
	border: 2px solid;
	flex-shrink: 0;
	border-color: var(--primary-color);
	background: rgba(79, 70, 229, 0.1);
}

.item-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.item-name {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.item-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

// Pending state styling
.mystery-box-card--pending {
	border-color: #FFD700;
	animation: mysteryBoxPendingGlow 2s ease-in-out infinite;
	filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
}

@keyframes mysteryBoxPendingGlow {
	0%, 100% {
		box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
	}
	50% {
		box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
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

@keyframes progressShine {
	0% { left: -100%; }
	100% { left: 100%; }
}
</style>