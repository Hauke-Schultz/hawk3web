<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'

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
const { gameData, claimDailyReward, canClaimDailyReward } = useLocalStorage()
const { t } = useI18n()

// Game state
const gamePhase = ref('start') // 'start', 'showing', 'shuffling', 'playing', 'revealed', 'claimed'
const selectedShell = ref(null)
const correctShell = ref(null)
const shells = ref([0, 1, 2])
const isShuffling = ref(false)
const showingPrize = ref(false)
const reward = ref(null)

// Shell positions for animation - track which shell contains the prize
const shellContents = ref([
	{ id: 0, hasPrize: false, position: 0 },
	{ id: 1, hasPrize: false, position: 1 },
	{ id: 2, hasPrize: false, position: 2 }
])

// Rewards configuration
const rewards = {
	big: { coins: 100, diamonds: 3, icon: '💎', name: 'Big Diamond' },
	small1: { coins: 30, diamonds: 1, icon: '🪙', name: 'Coins' },
	small2: { coins: 25, diamonds: 1, icon: '🪙', name: 'Coins' }
}

const canClaim = computed(() => canClaimDailyReward())

// Initialize game
const initializeGame = () => {
	gamePhase.value = 'start'
	selectedShell.value = null
	correctShell.value = Math.floor(Math.random() * 3)
	reward.value = null
	showingPrize.value = false
	isShuffling.value = false

	// Reset shell contents mit erweiterten Properties
	shellContents.value = [
		{
			id: 0,
			hasPrize: 0 === correctShell.value,
			position: 0,
			originalIndex: 0
		},
		{
			id: 1,
			hasPrize: 1 === correctShell.value,
			position: 1,
			originalIndex: 1
		},
		{
			id: 2,
			hasPrize: 2 === correctShell.value,
			position: 2,
			originalIndex: 2
		}
	]
}

// Start the minigame
const startGame = () => {
	if (!canClaim.value) return

	gamePhase.value = 'showing'
	showingPrize.value = true

	// Show the prize location for 3 seconds, then start shuffling
	setTimeout(() => {
		startShuffling()
	}, 3000)
}

// Start shuffling phase
const startShuffling = () => {
	showingPrize.value = false
	gamePhase.value = 'shuffling'
	shuffleShells()
}

const shuffleShells = () => {
	isShuffling.value = true

	const shuffleCount = Math.floor(Math.random() * 3) + 4
	let currentShuffle = 0

	const performSwap = () => {
		if (currentShuffle < shuffleCount) {
			let shell1Index, shell2Index
			do {
				shell1Index = Math.floor(Math.random() * 3)
				shell2Index = Math.floor(Math.random() * 3)
			} while (shell1Index === shell2Index)

			performVisualSwap(shell1Index, shell2Index)

			currentShuffle++

			setTimeout(performSwap, 1200)
		} else {
			finishShuffling()
		}
	}

	setTimeout(performSwap, 300)
}

const performVisualSwap = (index1, index2) => {
	const shell1 = shellContents.value[index1]
	const shell2 = shellContents.value[index2]
	const tempPosition = shell1.position
	shell1.position = shell2.position
	shell2.position = tempPosition

	const prizeShell = shellContents.value.find(shell => shell.hasPrize)
	correctShell.value = prizeShell.position
}

const getShellTransform = (shellIndex) => {
	if (!isShuffling.value) return 'translateX(0)'

	const shell = shellContents.value[shellIndex]
	const targetPosition = shell.position

	const positions = [-100, 0, 100]
	const targetX = positions[targetPosition]
	const currentX = positions[shellIndex]

	return `translateX(${targetX - currentX}px)`
}

const getShellClass = (shellIndex) => {
	const classes = ['shell']

	if (gamePhase.value === 'showing' && shellIndex === correctShell.value) {
		classes.push('shell--has-prize')
	}

	if (gamePhase.value === 'shuffling') {
		classes.push('shell--shuffling')
	}

	if (gamePhase.value === 'playing') {
		if (selectedShell.value === shellIndex) {
			classes.push('shell--selected')
		}
		if (selectedShell.value !== null) {
			classes.push('shell--disabled')
		}
	}

	if (gamePhase.value === 'revealed') {
		classes.push('shell--revealed')
		if (shellIndex === correctShell.value) {
			classes.push('shell--winner')
		}
		if (shellIndex === selectedShell.value) {
			classes.push('shell--selected')
		}
	}

	return classes.join(' ')
}

const finishShuffling = () => {
	isShuffling.value = false
	gamePhase.value = 'playing'
}

const selectShell = (shellIndex) => {
	if (gamePhase.value !== 'playing' || selectedShell.value !== null) return

	selectedShell.value = shellIndex
	revealResults()
}

// Reveal results and give rewards
const revealResults = () => {
	gamePhase.value = 'revealed'

	// Determine reward based on selection
	if (selectedShell.value === correctShell.value) {
		reward.value = rewards.big
	} else {
		// Random small reward
		reward.value = Math.random() > 0.5 ? rewards.small1 : rewards.small2
	}

	// Auto-claim after showing results
	setTimeout(claimRewards, 2000)
}

// Claim the rewards
const claimRewards = () => {
	if (!reward.value) return

	// Give the player their reward
	gameData.player.coins += reward.value.coins
	gameData.player.diamonds += reward.value.diamonds

	// Record transaction
	const transaction = {
		id: `daily_minigame_${Date.now()}`,
		timestamp: new Date().toISOString(),
		type: 'earn',
		source: 'daily_minigame',
		description: t('daily_rewards.minigame_reward'),
		amounts: {
			coins: reward.value.coins,
			diamonds: reward.value.diamonds
		},
		balanceAfter: {
			coins: gameData.player.coins,
			diamonds: gameData.player.diamonds
		},
		metadata: {
			rewardType: 'daily_minigame',
			gameResult: selectedShell.value === correctShell.value ? 'big_win' : 'small_win',
			selectedShell: selectedShell.value,
			correctShell: correctShell.value
		}
	}

	gameData.currency.transactions.push(transaction)

	gameData.currency.dailyRewards.lastClaimed = new Date().toISOString().split('T')[0]

	gamePhase.value = 'claimed'

	// Mark card as read and emit events
	setTimeout(() => {
		emit('mark-as-read', props.cardType)
		emit('click')
	}, 1000)
}

// Prevent event bubbling to parent components
const handleGameAction = (event, action) => {
	if (event) {
		event.stopPropagation()
		event.preventDefault()
	}

	// Execute the actual action
	if (typeof action === 'function') {
		action()
	}
}

// Wrapper functions for game actions
const handleStartGame = (event) => {
	handleGameAction(event, startGame)
}

const handleSelectShell = (event, shellIndex) => {
	handleGameAction(event, () => selectShell(shellIndex))
}

// Initialize on mount
onMounted(() => {
	if (canClaim.value) {
		initializeGame()
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

		<!-- Start Phase -->
		<div v-if="gamePhase === 'start'" class="game-start">
			<div class="reward-preview">
				<div class="big-reward">
					<span class="reward-icon">💎</span>
					<span class="reward-text">{{ t('daily_rewards.big_reward') }}</span>
				</div>
				<div class="vs-text">{{ t('daily_rewards.or') }}</div>
				<div class="small-reward">
					<span class="reward-icon">🪙</span>
					<span class="reward-text">{{ t('daily_rewards.small_reward') }}</span>
				</div>
			</div>

			<button
					class="btn btn--primary start-game-btn"
					@click="handleStartGame"
					@mousedown.stop
					@touchstart.stop
			>
				{{ t('daily_rewards.play_for_reward') }}
			</button>
		</div>

		<!-- Showing Prize Phase -->
		<div v-else-if="gamePhase === 'showing'" class="game-showing">
			<div class="shells-container">
				<div
					v-for="(shell, index) in shells"
					:key="`showing-shell-${index}`"
					:class="getShellClass(index)"
				>
					<div v-if="index === correctShell" class="shell-content shell-content--showing">
						💎
					</div>
					<div class="shell-base">🥥</div>
				</div>
			</div>
			<div class="game-instructions">
				<p>{{ t('daily_rewards.watch_carefully') }}</p>
			</div>
		</div>

		<!-- Shuffling Phase -->
		<div v-else-if="gamePhase === 'shuffling'" class="game-shuffling">
			<div class="shells-container shells-container--shuffling">
				<div
						v-for="(shell, index) in shells"
						:key="`shuffling-shell-${index}`"
						:class="getShellClass(index)"
						:style="{
            transform: getShellTransform(index),
            zIndex: 1
          }"
				>
					<div class="shell-base">🥥</div>
				</div>
			</div>
			<div class="game-instructions">
				<p>{{ t('daily_rewards.shells_shuffling') }}</p>
			</div>
		</div>

		<!-- Playing Phase -->
		<div v-else-if="gamePhase === 'playing'" class="game-playing">
			<div class="shells-container">
				<div
						v-for="(shell, index) in shells"
						:key="`shell-${index}`"
						:class="getShellClass(index)"
						@click="(event) => handleSelectShell(event, index)"
						@mousedown.stop
						@touchstart.stop
				>
					🥥
				</div>
			</div>
			<div class="game-instructions">
				<p>{{ t('daily_rewards.choose_shell_now') }}</p>
			</div>

		</div>

		<!-- Revealed Phase -->
		<div v-else-if="gamePhase === 'revealed'" class="game-revealed">
			<div class="shells-container">
				<div
						v-for="(shell, index) in shells"
						:key="`revealed-shell-${index}`"
						:class="getShellClass(index)"
				>
					<div v-if="index === correctShell" class="shell-content">
						💎
					</div>
					<div v-else class="shell-content">
						🪙
					</div>
					<div class="shell-base">🥥</div>
				</div>
			</div>
			<div class="reveal-message">
				<h4 v-if="selectedShell === correctShell">
					🎉 {{ t('daily_rewards.big_win') }}
				</h4>
				<h4 v-else>
					{{ t('daily_rewards.consolation_prize') }}
				</h4>
			</div>

			<div class="reward-earned">
				<div class="reward-display">
					<span class="reward-icon">{{ reward.icon }}</span>
					<div class="reward-amounts">
						<span v-if="reward.coins > 0">+{{ reward.coins }} 💰</span>
						<span v-if="reward.diamonds > 0">+{{ reward.diamonds }} 💎</span>
					</div>
				</div>
			</div>
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

// Start Phase
.game-start {
	text-align: center;
}

.reward-preview {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	margin-bottom: var(--space-4);
	flex-wrap: wrap;
}

.big-reward,
.small-reward {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-2);
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: var(--border-radius-lg);
	min-width: 80px;
}

.reward-icon {
	font-size: var(--font-size-xl);
}

.reward-text {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
}

.vs-text {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	opacity: 0.8;
}

.start-game-btn {
	background-color: rgba(255, 255, 255, 0.2);
	color: white;
	border: 2px solid white;
	font-weight: var(--font-weight-bold);
	pointer-events: auto;
	touch-action: manipulation;

	&:hover {
		background-color: rgba(255, 255, 255, 0.3);
	}

	&:active {
		transform: translateY(1px);
		background-color: rgba(255, 255, 255, 0.4);
	}
}

// Playing Phase
.game-playing {
	text-align: center;
}

.game-instructions {
	margin-bottom: var(--space-4);

	p {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		margin: 0;
	}
}

.shells-container {
	display: flex;
	justify-content: center;
	gap: var(--space-4);
	margin-bottom: var(--space-4);
	height: 100px;
	position: relative;
	align-items: center;
}

.shell {
	font-size: 3rem;
	cursor: pointer;
	transition: all 0.3s ease;
	padding: var(--space-2);
	border-radius: var(--border-radius-lg);
	position: relative;

	&:hover:not(.shell--disabled):not(.shell--shuffling) {
		transform: translateY(-4px);
		background-color: rgba(255, 255, 255, 0.1);
	}

	&--shuffling {
		cursor: default;
		transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);

		&:hover {
			transform: none;
			background-color: transparent;
		}
	}

	&--selected {
		background-color: rgba(255, 255, 255, 0.3);
		transform: scale(1.1);
	}

	&--disabled {
		opacity: 0.6;
		cursor: not-allowed;
		pointer-events: none;
	}
}

.shell--has-prize {
	animation: highlightPrize 1s ease-in-out infinite alternate;

	.shell-content--showing {
		animation: showPrize 1s ease-out, prizeGlow 2s ease-in-out infinite 1s;
	}
}

.shell--revealed {
	cursor: default;

	&.shell--winner {
		background-color: rgba(255, 215, 0, 0.3);
		box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
	}

	&:hover {
		transform: none;
	}
}


.game-revealed {
	text-align: center;
}

.reveal-message {
	margin-bottom: var(--space-3);

	h4 {
		font-size: var(--font-size-lg);
		margin: 0;
	}
}

.shell-content {
	position: absolute;
	top: -25px;
	left: 50%;
	transform: translateX(-50%);
	font-size: 2rem;

	&--showing {
		animation: showPrize 1s ease-out;
	}
}

.shell-base {
	position: relative;
	z-index: 1;
}

.shell--winner .shell-content {
	animation: revealBounce 0.6s ease-out, sparkle 2s ease-in-out infinite 1s;
}

.reward-earned {
	margin-top: var(--space-4);
}

.reward-display {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-3);
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: var(--border-radius-lg);

	.reward-icon {
		font-size: var(--font-size-2xl);
	}
}

.reward-amounts {
	display: flex;
	gap: var(--space-3);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-base);
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

.game-showing {
	text-align: center;
}

.shell--showing {
	cursor: default;

	&.shell--has-prize {
		animation: highlightPrize 0.8s ease-in-out infinite alternate;
	}
}

.game-shuffling {
	text-align: center;
}

@keyframes highlightPrize {
	0% {
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: 0 0 0 rgba(255, 215, 0, 0);
	}
	100% {
		background-color: rgba(255, 215, 0, 0.3);
		box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
	}
}

@keyframes showPrize {
	0% {
		opacity: 0;
		transform: translateX(-50%) translateY(10px) scale(0.8);
	}
	50% {
		opacity: 1;
		transform: translateX(-50%) translateY(-15px) scale(1.3);
	}
	100% {
		opacity: 1;
		transform: translateX(-50%) translateY(0) scale(1);
	}
}

@keyframes prizeGlow {
	0%, 100% {
		filter: brightness(1) drop-shadow(0 0 0 rgba(255, 215, 0, 0));
	}
	50% {
		filter: brightness(1.4) drop-shadow(0 0 12px rgba(255, 215, 0, 0.8));
	}
}

@keyframes revealBounce {
	0% {
		opacity: 0;
		transform: translateX(-50%) translateY(20px) scale(0.5);
	}
	60% {
		opacity: 1;
		transform: translateX(-50%) translateY(-10px) scale(1.2);
	}
	100% {
		opacity: 1;
		transform: translateX(-50%) translateY(0) scale(1);
	}
}

@keyframes countdown {
	0% { width: 100%; }
	100% { width: 0%; }
}

@keyframes shuffle {
	0%, 100% {
		transform: translateY(0) rotate(0deg);
	}
	25% {
		transform: translateY(-5px) rotate(-2deg);
	}
	75% {
		transform: translateY(-5px) rotate(2deg);
	}
}

@keyframes pulse {
	0%, 100% { opacity: 0.8; }
	50% { opacity: 1; }
}

@keyframes revealBounce {
	0% {
		opacity: 0;
		transform: translateX(-50%) translateY(20px) scale(0.5);
	}
	60% {
		opacity: 1;
		transform: translateX(-50%) translateY(-10px) scale(1.2);
	}
	100% {
		opacity: 1;
		transform: translateX(-50%) translateY(0) scale(1);
	}
}

@keyframes sparkle {
	0%, 100% {
		filter: brightness(1) drop-shadow(0 0 0 rgba(255, 215, 0, 0));
	}
	50% {
		filter: brightness(1.3) drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
	}
}

// Responsive adjustments
@media (max-width: 375px) {
	.shells-container {
		gap: var(--space-2);
	}

	.shell {
		font-size: 2.5rem;
	}

	.reward-preview {
		flex-direction: column;
		gap: var(--space-1);
	}

	.big-reward,
	.small-reward {
		min-width: 60px;
	}
}
</style>