<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'
import ThreeShellsGame from '../games/dailyReward/ThreeShellsGame.vue'

// Props
const props = defineProps({
	title: {
		type: String,
		default: 'Daily Reward'
	},
	visible: {
		type: Boolean,
		default: false
	},
	cardType: {
		type: String,
		default: 'dailyRewardCard'
	}
})

// Emits
const emit = defineEmits(['mark-as-read', 'click'])

// Services
const { gameData, canClaimDailyReward } = useLocalStorage()
const { t } = useI18n()

// State
const gamePhase = ref('minigame') // 'minigame', 'claimed'

const canClaim = computed(() => canClaimDailyReward())

// Handle game completion
const handleGameComplete = (reward) => {
	if (!reward) return

	// Give the player their reward
	gameData.player.coins = (gameData.player.coins || 0) + reward.coins
	gameData.player.diamonds = (gameData.player.diamonds || 0) + reward.diamonds

	// Record transaction
	if (!gameData.currency) {
		gameData.currency = getDefaultData().currency
	}

	const transaction = {
		id: `daily_minigame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		timestamp: new Date().toISOString(),
		type: 'earn',
		source: 'daily_minigame',
		description: t('daily_rewards.minigame_reward'),
		amounts: {
			coins: reward.coins,
			diamonds: reward.diamonds
		},
		balanceAfter: {
			coins: gameData.player.coins,
			diamonds: gameData.player.diamonds
		},
		metadata: {
			rewardType: 'daily_minigame',
			gameResult: 'reward_claimed',
			rewardAmount: reward
		}
	}

	gameData.currency.transactions.push(transaction)
	gameData.currency.dailyRewards.lastClaimed = new Date().toISOString().split('T')[0]

	gamePhase.value = 'claimed'

	console.log(`🎁 Daily reward claimed: +${reward.coins} coins, +${reward.diamonds} diamonds`, reward)
	emit('mark-as-read', props.cardType)
	emit('click')
}

// Initialize on mount
onMounted(() => {
	if (canClaim.value) {
		gamePhase.value = 'minigame'
	}
})
</script>

<template>
	<div
			v-if="canClaim"
			class="daily-reward-card"
			@click.stop
	>
		<div class="reward-card-header">
			<h4 class="reward-title">{{ t('daily_rewards.title') }}</h4>
			<p class="reward-subtitle">{{ t('daily_rewards.minigame_subtitle') }}</p>
		</div>

		<!-- Minigame Phase -->
		<div v-if="gamePhase === 'minigame'">
			<ThreeShellsGame @game-complete="handleGameComplete" />
		</div>

		<!-- Claimed Phase -->
		<div v-else-if="gamePhase === 'claimed'" class="game-claimed">
			<div class="success-message">
				<Icon name="completion-badge" size="32" />
				<h4>{{ t('daily_rewards.reward_claimed') }}</h4>
				<p>{{ t('daily_rewards.come_back_tomorrow') }}</p>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.daily-reward-card {
	background: linear-gradient(135deg, var(--warning-color), var(--warning-hover));
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	color: white;
	position: relative;
	overflow: hidden;
	pointer-events: auto;

	* {
		pointer-events: auto;
	}
}

.reward-card-header {
	text-align: center;
	margin-bottom: var(--space-4);
}

.reward-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	margin: 0 0 var(--space-1) 0;
}

.reward-subtitle {
	font-size: var(--font-size-sm);
	opacity: 0.9;
	margin: 0;
}

.game-claimed {
	text-align: center;
}

.success-message {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);

	h4 {
		font-size: var(--font-size-lg);
		margin: 0;
	}

	p {
		font-size: var(--font-size-sm);
		opacity: 0.9;
		margin: 0;
	}
}
</style>