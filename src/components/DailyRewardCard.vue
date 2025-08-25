<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import {REWARDS} from "../config/achievementsConfig.js";

const props = defineProps({
	title: {
		type: String,
		default: 'Claim your daily bonus!'
	},
	visible: {
		type: Boolean,
		default: true
	},
	cardType: {
		type: String,
		default: 'dailyRewardCard'
	}
})

const emit = defineEmits([
	'claim-reward',
	'mark-as-read'
])

const { t } = useI18n()
const { gameData, claimDailyReward, canClaimDailyReward } = useLocalStorage()

const canClaim = computed(() => canClaimDailyReward())
const currentStreak = computed(() => {
	const lastClaimed = gameData.currency.dailyRewards.lastClaimed
	if (!lastClaimed || lastClaimed === '2023-01-01') {
		return 1 // First time
	}

	const now = new Date()
	const today = now.toISOString().split('T')[0]
	const lastClaimedDate = new Date(lastClaimed + 'T00:00:00')
	const todayDate = new Date(today + 'T00:00:00')
	const daysDiff = Math.floor((todayDate - lastClaimedDate) / (1000 * 60 * 60 * 24))

	// Show 2x if it would be consecutive, otherwise 1x
	return daysDiff === 1 ? 2 : 1
})

const nextReward = computed(() => {
	const baseReward = REWARDS.dailyRewards.base
	const multiplier = currentStreak.value

	return {
		coins: baseReward.coins * multiplier,
		diamonds: baseReward.diamonds * multiplier
	}
})

// Reactive state for checkbox
const isMarkedAsRead = ref(false)

// Event handlers
const handleClick = () => {
	// Emit click events for backward compatibility
	emit('click')
	emit('package-click')
}

const handleCheckboxChange = (event) => {
	// Prevent card click when clicking checkbox area
	event.stopPropagation()
	isMarkedAsRead.value = event.target.checked

	if (event.target.checked) {
		emit('mark-as-read', props.cardType)
	}
}

const handleCheckboxClick = (event) => {
	// Prevent card click when clicking checkbox area
	event.stopPropagation()
}

const handleKeyDown = (event) => {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault()
		handleClick()
	}
}

</script>

<template>
	<section
			v-if="visible && canClaim"
			class="daily-reward-card"
			@click="handleClick"
			@keydown="handleKeyDown"
			tabindex="0"
			:aria-label="`${title}`"
	>
		<div class="daily-reward-content">
			<!-- Read Checkbox -->
			<div class="read-checkbox-container" @click="handleCheckboxClick">
				<label class="read-checkbox-label">
					<input
							type="checkbox"
							class="read-checkbox"
							:checked="isMarkedAsRead"
							@change="handleCheckboxChange"
							@click="handleCheckboxClick"
							:aria-label="t('common.mark_as_read')"
					/>
					<span class="checkbox-custom"></span>
				</label>
			</div>

			<!-- Streak Display -->
			<div class="streak-info">
				<div class="reward-title">{{ currentStreak === 2 ? t('daily_rewards.consecutive_bonus') : t('daily_rewards.normal_bonus') }}</div>
			</div>

			<!-- Reward Preview -->
			<div class="reward-preview">
				<h2 class="streak-label">
				  {{ t('daily_rewards.tap_to_claim') }}
				</h2>

				<div class="reward-amounts">
					<div class="reward-item">
						<span class="reward-icon">💰</span>
						<span class="reward-value">+{{ nextReward.coins }}</span>
					</div>
					<div class="reward-item">
						<span class="reward-icon">💎</span>
						<span class="reward-value">+{{ nextReward.diamonds }}</span>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<style lang="scss" scoped>
.daily-reward-card {
	background: var(--highlight-purple-background);
	border-radius: var(--border-radius-xl);
	padding: var(--space-6);
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	text-align: center;
	position: relative;
	color: var(--white);

	&:hover {
		transform: translateY(-2px);
		box-shadow: var(--highlight-purple-box-shadow);
	}

	&:focus-visible {
		outline: var(--focus-outline);
		outline-offset: 2px;
	}
}

.daily-reward-content {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.streak-info {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: var(--space-4);
}

.streak-label {
	font-size: var(--font-size-sm);
	text-transform: uppercase;
	font-weight: var(--font-weight-bold);
}

.reward-preview {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	align-items: center;
}

.reward-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	margin: 0;
}

.reward-subtitle {
	font-size: var(--font-size-base);
	margin: 0;
}

.reward-amounts {
	display: flex;
	gap: var(--space-4);
	align-items: center;
}

.reward-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: var(--space-1);
	background: rgba(255, 255, 255, 0.2);
	padding: var(--space-3);
	border-radius: var(--border-radius-lg);
	backdrop-filter: blur(10px);
}

.reward-icon {
	font-size: var(--font-size-xl);
}

.reward-value {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
}


// Read Checkbox Styles
.read-checkbox-container {
	position: absolute;
	top: var(--space-3);
	right: var(--space-3);
	z-index: 10;
	cursor: pointer;
}

.read-checkbox-label {
	display: flex;
	align-items: center;
	cursor: pointer;
	user-select: none;
}

.read-checkbox {
	position: absolute;
	opacity: 0;
	cursor: pointer;
	height: 0;
	width: 0;

	&:checked + .checkbox-custom {
		background-color: rgba(255, 255, 255, 0.9);
		border-color: rgba(255, 255, 255, 0.9);

		&::after {
			display: block;
		}
	}

	&:focus + .checkbox-custom {
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
	}
}

.checkbox-custom {
	position: relative;
	height: var(--space-5);
	width: var(--space-5);
	background-color: rgba(255, 255, 255, 0.2);
	border: 2px solid rgba(255, 255, 255, 0.5);
	border-radius: var(--border-radius-sm);
	transition: all 0.2s ease;
	backdrop-filter: blur(4px);

	&:hover {
		background-color: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.7);
	}

	// Checkmark
	&::after {
		content: '';
		position: absolute;
		display: none;
		left: 6px;
		top: 2px;
		width: 6px;
		height: 10px;
		border: solid var(--primary-color);
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}
}
</style>