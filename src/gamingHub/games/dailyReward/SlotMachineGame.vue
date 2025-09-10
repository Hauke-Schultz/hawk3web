<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../../composables/useI18n.js'
import CurrencyDisplay from "../../components/CurrencyDisplay.vue"

const props = defineProps({
	reward: {
		type: Object,
		default: () => null
	}
})

const emit = defineEmits(['game-complete'])

const { t } = useI18n()

// Game state
const gamePhase = ref('start') // 'start', 'spinning', 'finished'
const isSpinning = ref(false)
const gameReward = ref(null)
const spinCount = ref(0)
const maxSpins = ref(3) // Maximum spins per day

// Slot machine symbols (only coins and diamonds)
const symbols = ['💰', '💎']

// Slot reels (3 reels with current symbols)
const reels = ref([
	{ id: 0, symbol: '💰', spinning: false, finalSymbol: '💰' },
	{ id: 1, symbol: '💎', spinning: false, finalSymbol: '💎' },
	{ id: 2, symbol: '💰', spinning: false, finalSymbol: '💰' }
])

// Rewards configuration
const rewards = {
	jackpot: { coins: 200, diamonds: 8, icon: '💎', name: 'Triple Diamonds!', type: 'dailyRewardCard' }, // 3 diamonds
	triple_coins: { coins: 150, diamonds: 3, icon: '💰', name: 'Triple Coins!', type: 'dailyRewardCard' }, // 3 coins
	double_diamonds: { coins: 120, diamonds: 5, icon: '💎', name: 'Double Diamonds!', type: 'dailyRewardCard' }, // 2 diamonds
	double_coins: { coins: 80, diamonds: 2, icon: '💰', name: 'Double Coins!', type: 'dailyRewardCard' }, // 2 coins
	mixed: { coins: 60, diamonds: 2, icon: '🎰', name: 'Mixed!', type: 'dailyRewardCard' }, // 1 of each or different
	small: { coins: 30, diamonds: 1, icon: '🎲', name: 'Try Again!', type: 'dailyRewardCard' } // fallback
}

// Initialize game
const initializeGame = () => {
	gamePhase.value = 'start'
	isSpinning.value = false
	gameReward.value = null
	spinCount.value = 0

	// Reset reels to random starting positions
	reels.value.forEach(reel => {
		reel.symbol = symbols[Math.floor(Math.random() * symbols.length)]
		reel.spinning = false
		reel.finalSymbol = reel.symbol
	})
}

// Can spin more?
const canSpinAgain = computed(() => {
	return spinCount.value < maxSpins.value && gamePhase.value === 'finished'
})

// Start spinning
const startSpin = () => {
	if ((gamePhase.value !== 'start' && gamePhase.value !== 'finished') || isSpinning.value) return

	spinCount.value++
	gamePhase.value = 'spinning'
	isSpinning.value = true
	gameReward.value = null

	// Generate final results
	const finalResults = []
	for (let i = 0; i < 3; i++) {
		finalResults.push(symbols[Math.floor(Math.random() * symbols.length)])
	}

	// Start reel spinning animations
	reels.value.forEach((reel, index) => {
		reel.spinning = true
		reel.finalSymbol = finalResults[index]

		// Stop each reel with a delay for dramatic effect
		setTimeout(() => {
			reel.spinning = false
			reel.symbol = reel.finalSymbol

			// Check if all reels stopped
			if (index === 2) {
				setTimeout(() => {
					finishSpin(finalResults)
				}, 500) // Small delay after last reel stops
			}
		}, 1000 + (index * 400)) // Staggered stopping (bit slower for drama)
	})
}

// Calculate reward based on results
const finishSpin = (results) => {
	isSpinning.value = false
	gamePhase.value = 'finished'

	// Count symbols
	const coinCount = results.filter(symbol => symbol === '💰').length
	const diamondCount = results.filter(symbol => symbol === '💎').length

	// Determine reward based on combination
	if (diamondCount === 3) {
		gameReward.value = rewards.jackpot // Triple diamonds - best reward
	} else if (coinCount === 3) {
		gameReward.value = rewards.triple_coins // Triple coins
	} else if (diamondCount === 2) {
		gameReward.value = rewards.double_diamonds // Double diamonds
	} else if (coinCount === 2) {
		gameReward.value = rewards.double_coins // Double coins
	} else {
		gameReward.value = rewards.mixed // Mixed or single
	}
}

// Emit completion with reward
const completeGame = () => {
	emit('game-complete', gameReward.value)
}

// Spin again
const spinAgain = () => {
	if (!canSpinAgain.value) return
	startSpin()
}

// Prevent event bubbling to parent components
const handleGameAction = (event, action) => {
	if (event) {
		event.stopPropagation()
		event.preventDefault()
	}

	if (typeof action === 'function') {
		action()
	}
}

const handleStartSpin = (event) => {
	handleGameAction(event, startSpin)
}

const handleSpinAgain = (event) => {
	handleGameAction(event, spinAgain)
}

const handleCompleteGame = (event) => {
	handleGameAction(event, completeGame)
}

// Get reel classes for animation
const getReelClass = (reel) => {
	const classes = ['slot-reel']
	if (reel.spinning) {
		classes.push('slot-reel--spinning')
	}
	return classes.join(' ')
}

// Get reward message
const getRewardMessage = computed(() => {
	if (!gameReward.value) return ''

	const coinCount = reels.value.filter(reel => reel.symbol === '💰').length
	const diamondCount = reels.value.filter(reel => reel.symbol === '💎').length

	if (diamondCount === 3) {
		return t('daily_rewards.triple_diamonds') || '💎💎💎 TRIPLE DIAMONDS!'
	} else if (coinCount === 3) {
		return t('daily_rewards.triple_coins') || '💰💰💰 TRIPLE COINS!'
	} else if (diamondCount === 2) {
		return t('daily_rewards.double_diamonds') || '💎💎 DOUBLE DIAMONDS!'
	} else if (coinCount === 2) {
		return t('daily_rewards.double_coins') || '💰💰 DOUBLE COINS!'
	} else {
		return t('daily_rewards.mixed_result') || '🎰 Mixed symbols!'
	}
})

// Get reward color based on quality
const getRewardColorClass = computed(() => {
	if (!gameReward.value) return ''

	if (gameReward.value === rewards.jackpot) return 'reward-message--jackpot'
	if (gameReward.value === rewards.triple_coins) return 'reward-message--triple'
	if (gameReward.value === rewards.double_diamonds || gameReward.value === rewards.double_coins) return 'reward-message--double'
	return 'reward-message--mixed'
})

// Initialize on mount
onMounted(() => {
	initializeGame()
})
</script>

<template>
	<div class="slot-machine-game" @click.stop>
		<!-- Start Phase -->
		<div v-if="gamePhase === 'start'" class="game-start">
			<!-- Slot Machine Display -->
			<div class="slot-machine">
				<div class="slot-machine-frame">
					<div class="reels-container">
						<div
								v-for="reel in reels"
								:key="`start-reel-${reel.id}`"
								:class="getReelClass(reel)"
						>
							<div class="reel-symbol">{{ reel.symbol }}</div>
						</div>
					</div>
				</div>
			</div>

			<div class="game-instructions">
				<button
					class="btn btn--primary spin-button"
					@click="handleStartSpin"
					@mousedown.stop
					@touchstart.stop
				>
					🎰 {{ t('daily_rewards.spin_slots') || 'Spin the Slots!' }}
				</button>
			</div>
		</div>

		<!-- Spinning Phase -->
		<div v-else-if="gamePhase === 'spinning'" class="game-spinning">
			<div class="slot-machine">
				<div class="slot-machine-frame">
					<div class="reels-container">
						<div
							v-for="reel in reels"
							:key="`spinning-reel-${reel.id}`"
							:class="getReelClass(reel)"
						>
							<div class="reel-symbol">{{ reel.symbol }}</div>
							<div v-if="reel.spinning" class="reel-blur">
								<div class="spinning-symbols">
									<div v-for="symbol in symbols" :key="symbol" class="blur-symbol">
										{{ symbol }}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="game-instructions">
				<p>{{ t('daily_rewards.slots_spinning') || '🎰 Spinning...' }}</p>
			</div>
		</div>

		<!-- Finished Phase -->
		<div v-else-if="gamePhase === 'finished'" class="game-finished">
			<div class="slot-machine">
				<div class="slot-machine-frame">
					<div class="reels-container">
						<div
							v-for="reel in reels"
							:key="`finished-reel-${reel.id}`"
							class="slot-reel slot-reel--finished"
						>
							<div class="reel-symbol">{{ reel.symbol }}</div>
						</div>
					</div>
				</div>
			</div>

			<div class="game-instructions">
				<!-- Spin Again Button -->
				<button
					v-if="canSpinAgain"
					class="btn btn--warning spin-again-btn"
					@click="handleSpinAgain"
					@mousedown.stop
					@touchstart.stop
				>
					🎰 {{ t('daily_rewards.spin_again') || 'Spin Again' }} ({{ maxSpins - spinCount }} {{ t('daily_rewards.left') || 'left' }})
				</button>
			</div>

			<div class="reward-earned">
				<CurrencyDisplay
						:coins="gameReward.coins"
						:diamonds="gameReward.diamonds"
						size="large"
						layout="vertical"
						variant="card"
				/>

				<div class="game-actions">
					<p>{{ getRewardMessage }}</p>
					<!-- Collect Button -->
					<button
							class="btn btn--success collect-reward-btn"
							@click="handleCompleteGame"
							@mousedown.stop
							@touchstart.stop
					>
						{{ t('daily_rewards.collect_reward') }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.slot-machine-game {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	text-align: center;
	pointer-events: auto;

	* {
		pointer-events: auto;
	}
}

.game-instructions {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-3);

	p {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		margin: 0;
		color: white;
	}

	h4 {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		margin: 0;
		color: white;
	}
}

// Slot Machine Structure
.slot-machine {
	display: flex;
	justify-content: center;
	margin-bottom: var(--space-4);
}

.slot-machine-frame {
	background: linear-gradient(145deg, #FFD700, #FFA500);
	border: 4px solid #B8860B;
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	box-shadow:
			0 8px 16px rgba(0, 0, 0, 0.3),
			inset 0 2px 4px rgba(255, 255, 255, 0.2);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.reels-container {
	display: flex;
	gap: var(--space-2);
	background-color: #1a1a1a;
	border: 2px solid #333;
	border-radius: var(--border-radius-md);
	padding: var(--space-2);
}

.slot-reel {
	width: 60px;
	height: 60px;
	background-color: white;
	border: 2px solid #ddd;
	border-radius: var(--border-radius-md);
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	overflow: hidden;
	box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

	&--finished {
		border-color: #FFD700;
		box-shadow:
				inset 0 2px 4px rgba(0, 0, 0, 0.1),
				0 0 12px rgba(255, 215, 0, 0.5);
		animation: reelGlow 0.8s ease-out;
	}

	&--spinning {
		animation: reelShake 0.1s infinite;
	}
}

.reel-symbol {
	font-size: 2.2rem;
	line-height: 1;
	z-index: 2;
	position: relative;
	transition: transform 0.3s ease;

	.slot-reel--finished & {
		animation: symbolPop 0.8s ease-out;
	}
}

// Spin Counter
.spin-counter {
	background-color: #1a1a1a;
	color: #FFD700;
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	text-align: center;
	border: 1px solid #333;
}

// Spinning Animation Overlay
.reel-blur {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(
					to bottom,
					transparent 0%,
					rgba(255, 255, 255, 0.8) 20%,
					rgba(255, 255, 255, 0.8) 80%,
					transparent 100%
	);
	z-index: 3;
}

.spinning-symbols {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	animation: symbolBlur 0.1s linear infinite;
}

.blur-symbol {
	font-size: 1.5rem;
	opacity: 0.8;
	filter: blur(2px);
	line-height: 1;
}

// Reward Messages with Colors
.reward-message {
	h4 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: white;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
		animation: rewardPulse 0.6s ease-out;
	}

	&--jackpot h4 {
		color: #FFD700;
		text-shadow:
				0 2px 4px rgba(0, 0, 0, 0.5),
				0 0 15px rgba(255, 215, 0, 0.8);
		animation: jackpotGlow 1s ease-out infinite alternate;
	}

	&--triple h4 {
		color: #FFA500;
		text-shadow:
				0 2px 4px rgba(0, 0, 0, 0.5),
				0 0 10px rgba(255, 165, 0, 0.6);
	}

	&--double h4 {
		color: #32CD32;
		text-shadow:
				0 2px 4px rgba(0, 0, 0, 0.5),
				0 0 8px rgba(50, 205, 50, 0.5);
	}

	&--mixed h4 {
		color: #87CEEB;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}
}

// Buttons
.spin-button,
.spin-again-btn,
.collect-reward-btn {
	background-color: rgba(255, 255, 255, 0.2);
	color: white;
	border: 2px solid white;
	font-weight: var(--font-weight-bold);
	pointer-events: auto;
	touch-action: manipulation;
	font-size: var(--font-size-base);
	padding: var(--space-3) var(--space-6);
	transition: all 0.2s ease;

	&:hover {
		background-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(1px);
		background-color: rgba(255, 255, 255, 0.4);
	}
}

.spin-again-btn {
	background-color: rgba(255, 165, 0, 0.3);
	border-color: #FFA500;

	&:hover {
		background-color: rgba(255, 165, 0, 0.4);
	}
}

.reward-earned {
	display: flex;
	flex-direction: row;
	gap: var(--space-3);
	align-items: center;
	padding-top: var(--space-3);

	p {
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-bold);
		margin: 0;
		color: white;
	}
}

.game-actions {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	width: 100%;
}

// Animations
@keyframes reelShake {
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-1px); }
	75% { transform: translateX(1px); }
}

@keyframes reelGlow {
	0% {
		box-shadow:
				inset 0 2px 4px rgba(0, 0, 0, 0.1),
				0 0 0px rgba(255, 215, 0, 0);
	}
	100% {
		box-shadow:
				inset 0 2px 4px rgba(0, 0, 0, 0.1),
				0 0 12px rgba(255, 215, 0, 0.8);
	}
}

@keyframes symbolBlur {
	0% { transform: translateY(-15px); }
	100% { transform: translateY(15px); }
}

@keyframes symbolPop {
	0% {
		transform: scale(0.7);
		opacity: 0.7;
	}
	50% {
		transform: scale(1.4);
		opacity: 1;
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes rewardPulse {
	0% {
		transform: scale(0.9);
		opacity: 0.8;
	}
	50% {
		transform: scale(1.1);
		opacity: 1;
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes jackpotGlow {
	0% {
		text-shadow:
				0 2px 4px rgba(0, 0, 0, 0.5),
				0 0 15px rgba(255, 215, 0, 0.8);
	}
	100% {
		text-shadow:
				0 2px 4px rgba(0, 0, 0, 0.5),
				0 0 25px rgba(255, 215, 0, 1);
	}
}

// Responsive adjustments
@media (max-width: 375px) {
	.slot-machine-frame {
		padding: var(--space-3);
	}

	.slot-reel {
		width: 50px;
		height: 50px;
	}

	.reel-symbol {
		font-size: 1.8rem;
	}

	.game-actions {
		.spin-again-btn,
		.collect-reward-btn {
			font-size: var(--font-size-sm);
			padding: var(--space-2) var(--space-4);
		}
	}
}
</style>