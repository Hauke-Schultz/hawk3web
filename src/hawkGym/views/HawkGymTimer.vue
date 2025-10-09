<script setup>
import { computed, watch,  onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n.js'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { getTodaysWorkout } from '../config/workoutPlans.js'
import { useWorkoutTimer, TIMER_STATES } from '../composables/useWorkoutTimer.js'

const router = useRouter()
const { t } = useI18n()
const { gameData } = useLocalStorage()

// Get today's workout
const { dayKey, plan } = getTodaysWorkout()

// Setup timer with exercises as translation keys
const timer = useWorkoutTimer(plan.exercises)

// Computed properties
const stateLabel = computed(() => {
	const currentState = timer.state.value || timer.state // Handle both
	switch (currentState) {
		case TIMER_STATES.GET_READY:
			return t('hawkGym.get_ready')
		case TIMER_STATES.EXERCISE:
			return t('hawkGym.exercise')
		case TIMER_STATES.REST:
			return t('hawkGym.rest')
		case TIMER_STATES.BREAK:
			return t('hawkGym.break')
		case TIMER_STATES.FINISHED:
			return t('hawkGym.finished')
		default:
			return ''
	}
})

const currentExerciseName = computed(() => {
	const currentState = timer.state.value || timer.state
	const exercise = timer.currentExercise.value || timer.currentExercise

	if (currentState === TIMER_STATES.EXERCISE ||
			currentState === TIMER_STATES.REST) {
		return t(exercise)
	}
	return ''
})

const nextExerciseName = computed(() => {
	const nextEx = timer.nextExercise.value || timer.nextExercise
	if (nextEx) {
		return t(nextEx)
	}
	return ''
})

const countdownColor = computed(() => {
	const currentState = timer.state.value || timer.state
	switch (currentState) {
		case TIMER_STATES.GET_READY:
			return 'var(--warning-color)'
		case TIMER_STATES.EXERCISE:
			return 'var(--primary-color)'
		case TIMER_STATES.REST:
			return 'var(--success-color)'
		case TIMER_STATES.BREAK:
			return 'var(--secondary-color)'
		case TIMER_STATES.FINISHED:
			return 'var(--success-color)'
		default:
			return 'var(--text-color)'
	}
})

// Methods
const handleStart = () => {
	timer.start()
}

const handlePause = () => {
	timer.pause()
}

const handleResume = () => {
	timer.resume()
}

const handleSkip = () => {
	timer.skip()
}

const handleReset = () => {
	timer.reset()
}

const handleFinish = () => {
	router.push('/hawk-gym')
}

// Navigate back
const handleMenuClick = () => {
	timer.cleanup()
	router.push('/hawk-gym')
}

// Cleanup on unmount
onUnmounted(() => {
	timer.cleanup()
})

watch(() => timer.state.value, (newState) => {
	console.log('Timer state changed:', newState, 'Time:', timer.timeRemaining.value)
})

watch(() => timer.isPaused.value, (paused) => {
	console.log('Timer paused:', paused)
})
</script>

<template>
	<Header
			:game-data="gameData"
			:player="gameData.player"
			:achievements="gameData.achievements"
			:show-menu-button="true"
			@menu-click="handleMenuClick"
	/>

	<main class="content timer-view">
		<section class="timer-display">
			<!-- Timer Info -->
			<div v-if="timer.state !== timer.STATES.IDLE && timer.state !== timer.STATES.FINISHED" class="timer-info">
				<p class="round-indicator">{{ t('hawkGym.round') }} {{ timer.currentRound }}/{{ timer.config.rounds }}</p>
				<p v-if="timer.state === timer.STATES.EXERCISE || timer.state === timer.STATES.REST" class="exercise-indicator">
					{{ t('hawkGym.exercise_count') }} {{ timer.currentExerciseIndex + 1 }}/{{ timer.totalExercises }}
				</p>
			</div>

			<!-- Countdown Display -->
			<div class="countdown">
				<div
						class="countdown-number"
						:style="{ color: countdownColor }"
				>
					{{ timer.timeRemaining.value || timer.timeRemaining }}
				</div>
				<div class="countdown-label">{{ stateLabel }}</div>
				<div v-if="currentExerciseName" class="exercise-name">{{ currentExerciseName }}</div>
			</div>

			<!-- Progress Bar -->
			<div v-if="(timer.state.value || timer.state) !== TIMER_STATES.IDLE && (timer.state.value || timer.state) !== TIMER_STATES.FINISHED" class="progress-bar">
				<div
						class="progress-fill"
						:style="{ width: `${timer.progress.value || timer.progress}%` }"
				></div>
			</div>

			<!-- Next Exercise -->
			<div v-if="nextExerciseName && (timer.state.value || timer.state) !== TIMER_STATES.FINISHED" class="next-exercise">
				<span>{{ t('hawkGym.next') }}: {{ nextExerciseName }}</span>
			</div>

			<!-- Timer Controls -->
			<div class="timer-controls">
				<!-- Idle State -->
				<button
						v-if="(timer.state.value || timer.state) === TIMER_STATES.IDLE"
						class="btn btn--primary btn--large"
						@click="handleStart"
				>
					<Icon name="play" size="20" />
					{{ t('hawkGym.start') }}
				</button>

				<!-- Running State -->
				<template v-else-if="(timer.state.value || timer.state) !== TIMER_STATES.FINISHED">
					<button
						class="btn btn--warning"
						@click="handlePause"
					>
						{{ t('hawkGym.pause') }}
					</button>

					<button
						class="btn btn--success"
						@click="handleResume"
					>
						{{ t('hawkGym.resume') }}
					</button>

					<button
						class="btn btn--ghost"
						@click="handleSkip"
					>
						{{ t('hawkGym.skip') }}
					</button>

					<button
						class="btn btn--danger"
						@click="handleReset"
					>
						{{ t('hawkGym.reset') }}
					</button>
				</template>

				<!-- Finished State -->
				<button
						v-else
						class="btn btn--success btn--large"
						@click="handleFinish"
				>
					<Icon name="check" size="20" />
					{{ t('common.finish') }}
				</button>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.timer-view {
	display: flex;
	flex-direction: column;
	justify-content: center;
	min-height: calc(100vh - 120px);
}

.timer-display {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
	padding: var(--space-4);
}

.timer-info {
	display: flex;
	justify-content: space-between;
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
	letter-spacing: 1px;
}

.countdown {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-8) 0;
}

.countdown-number {
	font-size: 120px;
	font-weight: var(--font-weight-bold);
	line-height: 1;
	transition: color 0.3s ease;
}

.countdown-label {
	font-size: var(--font-size-lg);
	color: var(--text-secondary);
	text-transform: uppercase;
	letter-spacing: 2px;
	font-weight: var(--font-weight-bold);
}

.exercise-name {
	font-size: var(--font-size-2xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	text-align: center;
	margin-top: var(--space-2);
}

.progress-bar {
	height: 8px;
	background-color: var(--card-border);
	border-radius: var(--border-radius-md);
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, var(--primary-color), var(--success-color));
	border-radius: var(--border-radius-md);
	transition: width 0.3s ease;
}

.next-exercise {
	text-align: center;
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
	font-weight: var(--font-weight-bold);
}

.timer-controls {
	display: flex;
	gap: var(--space-2);
	justify-content: center;
	flex-wrap: nowrap;

	.btn {
		min-width: 80px;
		flex: 1;
		font-size: var(--font-size-sm);
		padding: var(--space-2) var(--space-1);

		&--large {
			flex: 1 1 100%;
			font-size: var(--font-size-base);
			padding: var(--space-3) var(--space-4);
		}
	}
}
</style>