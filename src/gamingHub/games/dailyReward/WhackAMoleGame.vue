<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
const gamePhase = ref('start') // 'start', 'playing', 'finished'
const gameReward = ref(null)
const score = ref(0)
const molesHit = ref(0)
const currentMole = ref(null)
const moleTimer = ref(null)
const molesShown = ref(0)
const totalMoles = 6

// Grid holes (0-8 for 3x3 grid)
const holes = ref(Array.from({ length: 9 }, (_, i) => ({
	id: i,
	hasMole: false,
	isHit: false
})))

// Rewards configuration
const rewards = {
	big: { coins: 100, diamonds: 3, icon: '💎', name: 'Perfect Score!', type: 'dailyRewardCard' },
	small: { coins: 25, diamonds: 1, icon: '🪙', name: 'Good Try!', type: 'dailyRewardCard' }
}

// Initialize game
const initializeGame = () => {
	gamePhase.value = 'start'
	score.value = 0
	molesHit.value = 0
	currentMole.value = null
	molesShown.value = 0
	gameReward.value = null

	// Reset all holes
	holes.value.forEach(hole => {
		hole.hasMole = false
		hole.isHit = false
	})
}

// Start the game
const startGame = () => {
	gamePhase.value = 'playing'
	showNextMole()
}

// Show next mole
const showNextMole = () => {
	if (molesShown.value >= totalMoles) {
		finishGame()
		return
	}

	// Clear previous mole
	if (currentMole.value !== null) {
		holes.value[currentMole.value].hasMole = false
	}

	// Select random hole (avoid same hole twice in a row)
	let newMoleHole
	do {
		newMoleHole = Math.floor(Math.random() * 9)
	} while (newMoleHole === currentMole.value && holes.value.length > 1)

	// Show mole
	currentMole.value = newMoleHole
	holes.value[newMoleHole].hasMole = true
	holes.value[newMoleHole].isHit = false
	molesShown.value++

	// Hide mole after 1-2 seconds
	const hideDelay = 1000 + Math.random() * 1000 // 1-2 seconds
	moleTimer.value = setTimeout(() => {
		if (currentMole.value === newMoleHole && holes.value[newMoleHole].hasMole) {
			holes.value[newMoleHole].hasMole = false
			currentMole.value = null

			// Show next mole after short delay
			setTimeout(() => {
				showNextMole()
			}, 500)
		}
	}, hideDelay)
}

// Hit mole
const hitMole = (holeId) => {
	if (gamePhase.value !== 'playing') return
	if (!holes.value[holeId].hasMole) return
	if (holes.value[holeId].isHit) return

	// Mark as hit
	holes.value[holeId].isHit = true
	holes.value[holeId].hasMole = false
	molesHit.value++
	score.value += 10

	// Clear timer
	if (moleTimer.value) {
		clearTimeout(moleTimer.value)
		moleTimer.value = null
	}

	// Show next mole after short delay
	setTimeout(() => {
		showNextMole()
	}, 300)
}

// Finish game
const finishGame = () => {
	gamePhase.value = 'finished'

	// Clear any remaining timer
	if (moleTimer.value) {
		clearTimeout(moleTimer.value)
		moleTimer.value = null
	}

	// Determine reward
	gameReward.value = molesHit.value === totalMoles ? rewards.big : rewards.small
}

// Complete game
const completeGame = () => {
	emit('game-complete', gameReward.value)
}

// Prevent event bubbling
const handleGameAction = (event, action) => {
	if (event) {
		event.stopPropagation()
		event.preventDefault()
	}
	if (typeof action === 'function') {
		action()
	}
}

const handleStartGame = (event) => {
	handleGameAction(event, startGame)
}

const handleHitMole = (event, holeId) => {
	handleGameAction(event, () => hitMole(holeId))
}

const handleCompleteGame = (event) => {
	handleGameAction(event, completeGame)
}

// Get hole class
const getHoleClass = (hole) => {
	const classes = ['hole']
	if (hole.hasMole) classes.push('hole--has-mole')
	if (hole.isHit) classes.push('hole--hit')
	return classes.join(' ')
}

// Cleanup on unmount
onUnmounted(() => {
	if (moleTimer.value) {
		clearTimeout(moleTimer.value)
	}
})

// Initialize on mount
onMounted(() => {
	initializeGame()
})
</script>

<template>
	<div class="whack-a-mole-game" @click.stop>
		<!-- Start Phase -->
		<div v-if="gamePhase === 'start'" class="game game-start">
			<div class="game-instructions">
				<h4>{{ t('daily_rewards.whack_mole_title') || 'Whack-a-Mole!' }}</h4>
			</div>
			<div class="game-grid">
				<div
						v-for="hole in holes"
						:key="`start-hole-${hole.id}`"
						class="hole"
				>
					🕳️
				</div>
			</div>

			<div class="game-instructions">
				<p>{{ t('daily_rewards.whack_mole_instructions') || 'Hit 6 moles for the big reward!' }}</p>
				<button
						class="btn btn--primary start-game-btn"
						@click="handleStartGame"
						@mousedown.stop
						@touchstart.stop
				>
					🎯 {{ t('daily_rewards.play_for_reward') }}
				</button>
			</div>
		</div>

		<!-- Playing Phase -->
		<div v-else class="game game-playing">
			<div class="game-stats">
				<div class="stat">
					<span class="stat-label">{{ t('daily_rewards.moles_hit') || 'Hits' }}</span>
					<span class="stat-value">{{ molesHit }}/{{ totalMoles }}</span>
				</div>
			</div>

			<div class="game-grid">
				<div
					v-for="hole in holes"
					:key="`playing-hole-${hole.id}`"
					:class="getHoleClass(hole)"
					@click="(event) => handleHitMole(event, hole.id)"
					@mousedown.stop
					@touchstart.stop
				>
					<div v-if="hole.hasMole" class="mole">🐹</div>
					<div v-else-if="hole.isHit" class="hit-effect">💥</div>
					<div v-else class="hole-empty">🕳️</div>
				</div>
			</div>

			<div v-if="gamePhase === 'playing'" class="game-instructions">
				<p>{{ t('daily_rewards.whack_mole_playing') || 'Quick! Hit the moles!' }}</p>
			</div>

			<div v-else class="reward-earned">
				<CurrencyDisplay
						:coins="gameReward.coins"
						:diamonds="gameReward.diamonds"
						size="large"
						layout="vertical"
						variant="card"
				/>
				<div class="game-instructions">
					<h4 v-if="molesHit === totalMoles">
						🎉 {{ t('daily_rewards.perfect_score') || 'Perfect Score!' }}
					</h4>
					<h4 v-else>
						{{ t('daily_rewards.good_try') || 'Good Try!' }}
					</h4>
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
.whack-a-mole-game {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	text-align: center;
	pointer-events: auto;
	touch-action: manipulation;
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	overscroll-behavior: contain;
	overscroll-behavior-y: contain;
	-webkit-tap-highlight-color: transparent;
	-webkit-overflow-scrolling: touch;

	* {
		pointer-events: auto;
	}
}

.game {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-3);
}

.game-instructions {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-3);

	h4, p {
		font-weight: var(--font-weight-bold);
		margin: 0;
		color: white;
	}

	h4 {
		font-size: var(--font-size-lg);
	}

	p {
		font-size: var(--font-size-base);
	}
}

.game-stats {
	display: flex;
	justify-content: space-around;
}

.stat {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.stat-label {
	font-size: var(--font-size-lg);;
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
}

.stat-value {
	font-size: var(--font-size-lg);
	color: white;
	font-weight: var(--font-weight-bold);
}

.game-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: repeat(3, 1fr);
	gap: var(--space-2);
	width: 280px;
	margin: 0 auto;
	aspect-ratio: 1;
}

.hole {
	aspect-ratio: 1;
	border: 3px solid #8B4513;
	border-radius: 50%;
	background: radial-gradient(circle, #654321, #3C2415);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 2rem;
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;
	overflow: hidden;

	&:hover:not(.hole--finished) {
		transform: scale(1.05);
		box-shadow: 0 0 15px rgba(139, 69, 19, 0.5);
	}

	&--has-mole {
		cursor: pointer;
		animation: moleWiggle 0.5s ease-in-out infinite alternate;
	}

	&--hit {
		background: radial-gradient(circle, #FFD700, #FFA500);
		animation: hitFlash 0.3s ease-out;
	}

	&--finished {
		cursor: default;
		opacity: 0.6;

		&:hover {
			transform: none;
			box-shadow: none;
		}
	}
}

.mole {
	font-size: 1.8rem;
	animation: moleAppear 0.3s ease-out;
}

.hit-effect {
	font-size: 1.5rem;
	animation: hitExplosion 0.3s ease-out;
}

.hole-empty {
	font-size: 1.5rem;
	opacity: 0.7;
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
@keyframes moleWiggle {
	0% { transform: rotate(-2deg) scale(1); }
	100% { transform: rotate(2deg) scale(1.1); }
}

@keyframes moleAppear {
	0% {
		transform: translateY(20px) scale(0.8);
		opacity: 0;
	}
	100% {
		transform: translateY(0) scale(1);
		opacity: 1;
	}
}

@keyframes hitFlash {
	0% {
		background: radial-gradient(circle, #FFD700, #FFA500);
		transform: scale(1.2);
	}
	100% {
		background: radial-gradient(circle, #654321, #3C2415);
		transform: scale(1);
	}
}

@keyframes hitExplosion {
	0% {
		transform: scale(0.5);
		opacity: 1;
	}
	50% {
		transform: scale(1.3);
		opacity: 1;
	}
	100% {
		transform: scale(1);
		opacity: 0;
	}
}

// Responsive adjustments
@media (max-width: 375px) {
	.game-grid {
		max-width: 250px;
		gap: var(--space-1);
	}

	.hole {
		font-size: 1.5rem;
		border-width: 2px;
	}

	.mole {
		font-size: 1.3rem;
	}
}
</style>