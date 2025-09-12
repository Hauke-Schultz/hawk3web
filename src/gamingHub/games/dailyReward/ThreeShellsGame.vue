<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../../composables/useI18n.js'
import CurrencyDisplay from "../../components/CurrencyDisplay.vue";

const props = defineProps({
	reward: {
		type: Object,
		default: () => null
	}
})

const emit = defineEmits(['game-complete'])

const { t } = useI18n()

// Game state
const gamePhase = ref('start') // 'start', 'showing', 'shuffling', 'playing', 'revealed'
const selectedShell = ref(null)
const correctShell = ref(null)
const shells = ref([0, 1, 2])
const isShuffling = ref(false)
const showingPrize = ref(false)
const gameReward = ref(null)

// Shell positions for animation - track which shell contains the prize
const shellContents = ref([
	{ id: 0, hasPrize: false, position: 0 },
	{ id: 1, hasPrize: false, position: 1 },
	{ id: 2, hasPrize: false, position: 2 }
])

// Rewards configuration
const rewards = {
	big: { coins: 100, diamonds: 3, icon: '💎', name: 'Big Diamond', type: 'dailyRewardCard' },
	small: { coins: 25, diamonds: 1, icon: '🪙', name: 'Coins', type: 'dailyRewardCard' }
}

// Initialize game
const initializeGame = () => {
	gamePhase.value = 'start'
	selectedShell.value = null
	correctShell.value = Math.floor(Math.random() * 3)
	gameReward.value = null
	showingPrize.value = false
	isShuffling.value = false

	// Reset shell contents with extended properties
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

	const shuffleCount = Math.floor(Math.random() * 2) + 3 // 3 to 4 shuffles
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

// Reveal results and determine reward
const revealResults = () => {
	gamePhase.value = 'revealed'
	gameReward.value = selectedShell.value === correctShell.value ? rewards.big : rewards.small
}

// Emit completion with reward
const completeGame = () => {
	emit('game-complete', gameReward.value)
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

const handleCompleteGame = (event) => {
	handleGameAction(event, completeGame)
}

// Initialize on mount
onMounted(() => {
	initializeGame()
})
</script>

<template>
	<div class="three-shells-game" @click.stop>
		<!-- Start Phase -->
		<div v-if="gamePhase === 'start'" class="game-start">
			<!-- Initial shells display -->
			<div class="shells-container">
				<div
						v-for="(shell, index) in shells"
						:key="`start-shell-${index}`"
						class="shell"
				>
					🥥
				</div>
			</div>

			<div class="game-instructions">
				<button
						class="btn btn--primary start-game-btn"
						@click="handleStartGame"
						@mousedown.stop
						@touchstart.stop
				>
					{{ t('daily_rewards.play_for_reward') }}
				</button>
			</div>
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

			<div class="reward-earned">
				<CurrencyDisplay
					:coins="gameReward.coins"
					:diamonds="gameReward.diamonds"
					size="large"
					layout="vertical"
					variant="card"
				/>
				<div class="game-instructions">
					<p v-if="selectedShell === correctShell">
						🎉 {{ t('daily_rewards.big_win') }}
					</p>
					<p v-else>
						{{ t('daily_rewards.consolation_prize') }}
					</p>
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
.three-shells-game {
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

	&--has-prize {
		animation: highlightPrize 0.8s ease-in-out infinite alternate;

		.shell-content--showing {
			animation: showPrize 1s ease-out, prizeGlow 2s ease-in-out infinite 1s;
		}
	}

	&--revealed {
		cursor: default;

		&.shell--winner {
			background-color: rgba(255, 215, 0, 0.3);
			box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
		}

		&:hover {
			transform: none;
		}
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

.start-game-btn,
.collect-reward-btn {
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

.reward-earned {
	display: flex;
	gap: var(--space-3);
	align-items: center;
	justify-content: space-between;
}

// Animations
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
}
</style>