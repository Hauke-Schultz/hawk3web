<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'
import ThreeShellsGame from '../games/dailyReward/ThreeShellsGame.vue'
import SlotMachineGame from '../games/dailyReward/SlotMachineGame.vue'
import WhackAMoleGame from '../games/dailyReward/WhackAMoleGame.vue'

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
const games = ['shells', 'slots', 'whack'] // ← Drittes Spiel hinzugefügt
const selectedGame = ref('shells') // 'shells', 'slots', 'whack'

const canClaim = computed(() => canClaimDailyReward())

const selectDailyGame = () => {
	const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

	// Einfacher Hash vom Datum für deterministische Zufälligkeit
	let hash = 0
	for (let i = 0; i < today.length; i++) {
		const char = today.charCodeAt(i)
		hash = ((hash << 5) - hash) + char
		hash = hash & hash // Convert to 32-bit integer
	}
	const gameIndex = Math.abs(hash) % games.length
	selectedGame.value = games[gameIndex]

	console.log(`🎲 Daily game for ${today}: ${selectedGame.value} (index: ${gameIndex})`)
}

// Game-specific subtitles
const getGameSubtitle = computed(() => {
	switch (selectedGame.value) {
		case 'shells':
			return t('daily_rewards.shells_subtitle')
		case 'slots':
			return t('daily_rewards.slots_subtitle')
		case 'whack':
			return t('daily_rewards.whack_subtitle')
		default:
			return t('daily_rewards.minigame_subtitle')
	}
})

// Handle game completion
const handleGameComplete = (reward) => {
	if (!reward) return

	gamePhase.value = 'claimed'

	console.log(`🎁 Daily rewards counter: ${gameData.currency.dailyRewards.counter}`, reward)

	emit('mark-as-read', reward)
	emit('click')
}

// Initialize on mount
onMounted(() => {
	if (canClaim.value) {
		gamePhase.value = 'minigame'
		selectDailyGame() // ← Deterministische Spielauswahl
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
			<p class="reward-subtitle">{{ getGameSubtitle }}</p>
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
			<WhackAMoleGame
					v-if="selectedGame === 'whack'"
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