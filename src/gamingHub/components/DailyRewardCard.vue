<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'
import ThreeShellsGame from '../games/dailyReward/ThreeShellsGame.vue'
import SlotMachineGame from '../games/dailyReward/SlotMachineGame.vue'

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
const games = ['shells', 'slots'];
const selectedGame = ref('shells') // 'shells', 'slots'

const canClaim = computed(() => canClaimDailyReward())

const selectRandomGame = () => {
	const idx = Math.floor(Math.random() * games.length)
	selectedGame.value = games[idx]
	console.log(`🎲 Daily game selected: ${selectedGame.value}`)
}

// Handle game completion
const handleGameComplete = (reward) => {
	if (!reward) return

	gamePhase.value = 'claimed'

	console.log(`🎁 Daily rewards counter: ${gameData.player.dailyRewardsCounter}`, reward)

	emit('mark-as-read', reward)
	emit('click')
}

// Initialize on mount
onMounted(() => {
	if (canClaim.value) {
		gamePhase.value = 'minigame'
		selectRandomGame()
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
			<p class="reward-subtitle">
				{{ selectedGame === 'shells' ? t('daily_rewards.shells_subtitle') : t('daily_rewards.slots_subtitle') }}
			</p>
		</div>

		<!-- Minigame Phase -->
		<div v-if="gamePhase === 'minigame'">
			<ThreeShellsGame
					v-if="selectedGame === 'shells'"
					@game-complete="handleGameComplete"
			/>
			<SlotMachineGame
					v-if="selectedGame === 'slots'"
					@game-complete="handleGameComplete"
			/>
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