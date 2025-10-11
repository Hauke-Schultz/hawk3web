<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n.js'
import Header from '../../gamingHub/components/Header.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { useGymLocalStorage } from '../composables/useGymLocalStorage.js'
import { getTodaysWorkout, TIMER_CONFIG } from '../config/workoutPlans.js'
import { getExercise } from '../config/exercisesConfig.js'
import ExerciseList from '../components/ExerciseList.vue'

const router = useRouter()
const { t } = useI18n()
const { gameData } = useLocalStorage()
const { gymData, getCurrentWorkoutPlan, addWorkoutToHistory } = useGymLocalStorage()

const { dayKey } = getTodaysWorkout()
const exercisesArray = computed(() => plan.exercises)
const currentPlan = getCurrentWorkoutPlan()
const plan = currentPlan.plan

const emit = defineEmits(['pause', 'resume', 'skip', 'reset', 'start'])

// Timer configuration - uses gym settings with fallback to defaults
const timerConfig = computed(() => {
	return {
		exerciseDuration: gymData.timerSettings?.exerciseDuration ?? TIMER_CONFIG.exerciseDuration,
		restDuration: gymData.timerSettings?.restDuration ?? TIMER_CONFIG.restDuration,
		breakDuration: gymData.timerSettings?.breakDuration ?? TIMER_CONFIG.breakDuration,
		rounds: gymData.timerSettings?.rounds ?? TIMER_CONFIG.rounds,
		getReadyDuration: gymData.timerSettings?.getReadyDuration ?? TIMER_CONFIG.getReadyDuration
	}
})

// Timer states
const TIMER_STATES = {
	IDLE: 'idle',
	GET_READY: 'getReady',
	EXERCISE: 'exercise',
	REST: 'rest',
	BREAK: 'break',
	FINISHED: 'finished'
}

// Reactive state
const state = ref(TIMER_STATES.IDLE)
const currentRound = ref(1)
const currentExerciseIndex = ref(0)
const timeRemaining = ref(0)
const isPaused = ref(false)

// Timer interval reference
let timerInterval = null

// Computed properties
const totalExercises = computed(() => plan.exercises.length)

const isLastExerciseInRound = computed(() => {
	return currentExerciseIndex.value === plan.exercises.length - 1
})

const isLastRound = computed(() => {
	return currentRound.value === timerConfig.value.rounds
})

const progress = computed(() => {
	const totalSeconds = getTotalDuration()
	const elapsed = getElapsedSeconds()
	return Math.min(100, Math.round((elapsed / totalSeconds) * 100))
})

const stateLabel = computed(() => {
	switch (state.value) {
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
			return t('hawkGym.idle')
	}
})

const countdownColor = computed(() => {
	switch (state.value) {
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

// Helper functions
const getTotalDuration = () => {
	const exercisesPerRound = plan.exercises.length
	const config = timerConfig.value
	const exerciseTime = exercisesPerRound * config.exerciseDuration
	const restTime = (exercisesPerRound - 1) * config.restDuration
	const roundTime = exerciseTime + restTime
	const totalTime = (roundTime * config.rounds) +
			((config.rounds - 1) * config.breakDuration) +
			config.getReadyDuration
	return totalTime
}

const getElapsedSeconds = () => {
	const config = timerConfig.value
	let elapsed = 0

	// Add get ready time if past it
	if (state.value !== TIMER_STATES.IDLE && state.value !== TIMER_STATES.GET_READY) {
		elapsed += config.getReadyDuration
	}

	// Add completed rounds
	if (currentRound.value > 1) {
		const exercisesPerRound = plan.exercises.length
		const exerciseTime = exercisesPerRound * config.exerciseDuration
		const restTime = (exercisesPerRound - 1) * config.restDuration
		const roundTime = exerciseTime + restTime
		elapsed += (currentRound.value - 1) * roundTime
		elapsed += (currentRound.value - 1) * config.breakDuration
	}

	// Add completed exercises in current round
	if (currentExerciseIndex.value > 0) {
		elapsed += currentExerciseIndex.value * config.exerciseDuration
		elapsed += currentExerciseIndex.value * config.restDuration
	}

	// Add current phase progress
	const maxTime = getMaxTimeForState()
	elapsed += (maxTime - timeRemaining.value)

	return elapsed
}

const getMaxTimeForState = () => {
	const config = timerConfig.value
	switch (state.value) {
		case TIMER_STATES.GET_READY:
			return config.getReadyDuration
		case TIMER_STATES.EXERCISE:
			return config.exerciseDuration
		case TIMER_STATES.REST:
			return config.restDuration
		case TIMER_STATES.BREAK:
			return config.breakDuration
		default:
			return 0
	}
}

// Timer control functions
const startTimer = () => {
	if (timerInterval) return // Already running

	timerInterval = setInterval(() => {
		if (isPaused.value) return

		if (timeRemaining.value > 0) {
			timeRemaining.value--
		} else {
			advance()
		}
	}, 1000)
}

const stopTimer = () => {
	if (timerInterval) {
		clearInterval(timerInterval)
		timerInterval = null
	}
}

const advance = () => {
	const config = timerConfig.value

	switch (state.value) {
		case TIMER_STATES.GET_READY:
			// Start first exercise
			state.value = TIMER_STATES.EXERCISE
			timeRemaining.value = config.exerciseDuration
			break

		case TIMER_STATES.EXERCISE:
			// After exercise, check if last in round
			if (isLastExerciseInRound.value) {
				// Check if last round
				if (isLastRound.value) {
					// Workout finished
					state.value = TIMER_STATES.FINISHED
					stopTimer()
				} else {
					// Break between rounds
					state.value = TIMER_STATES.BREAK
					timeRemaining.value = config.breakDuration
					currentRound.value++
					currentExerciseIndex.value = 0
				}
			} else {
				// Rest between exercises
				state.value = TIMER_STATES.REST
				timeRemaining.value = config.restDuration
			}
			break

		case TIMER_STATES.REST:
			// Move to next exercise
			currentExerciseIndex.value++
			state.value = TIMER_STATES.EXERCISE
			timeRemaining.value = config.exerciseDuration
			break

		case TIMER_STATES.BREAK:
			// Start next round
			state.value = TIMER_STATES.EXERCISE
			timeRemaining.value = config.exerciseDuration
			break

		default:
			break
	}
}

// Button handlers
const handleStart = () => {
	const config = timerConfig.value
	state.value = TIMER_STATES.GET_READY
	timeRemaining.value = config.getReadyDuration
	currentRound.value = 1
	currentExerciseIndex.value = 0
	isPaused.value = false
	startTimer()
}

const handlePause = () => {
	isPaused.value = true
}

const handleResume = () => {
	isPaused.value = false
}

const handleSkip = () => {
	timeRemaining.value = 0
	advance()
}

const handleReset = () => {
	stopTimer()
	state.value = TIMER_STATES.IDLE
	currentRound.value = 1
	currentExerciseIndex.value = 0
	timeRemaining.value = 0
	isPaused.value = false
}

const handleFinish = () => {
	// Calculate workout data
	const workoutDuration = getTotalDuration() - timeRemaining.value
	const currentPlan = getCurrentWorkoutPlan()

	// Add to history
	addWorkoutToHistory({
		planId: currentPlan.type === 'custom' ? currentPlan.plan.id : currentPlan.dayKey,
		planName: currentPlan.type === 'custom' ? currentPlan.plan.name : t(currentPlan.plan.nameKey),
		exercises: currentPlan.plan.exercises,
		duration: workoutDuration,
		rounds: currentRound.value,
		skippedExercises: 0 // Could track this if you add skip functionality
	})

	stopTimer()
	router.push('/hawk-gym')
}

const handleMenuClick = () => {
	stopTimer()
	router.push('/hawk-gym')
}

// Cleanup on unmount
onUnmounted(() => {
	stopTimer()
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
		<section class="timer-container">
			<!-- Top Info Bar -->
			<div v-if="state !== TIMER_STATES.FINISHED" class="timer-info-bar">
				<div class="info-item">
					<span class="info-label">{{ t('hawkGym.round') }}</span>
					<span class="info-value">{{ currentRound }}/{{ timerConfig.rounds }}</span>
				</div>
				<div class="info-item">
					<span class="info-label">{{ t('hawkGym.exercise_count') }}</span>
					<span class="info-value">{{ currentExerciseIndex + 1 }}/{{ totalExercises }}</span>
				</div>
			</div>

			<!-- Progress Bar -->
			<div v-if="state !== TIMER_STATES.FINISHED" class="progress-bar">
				<div
					class="progress-fill"
					:style="{ width: `${progress}%` }"
				></div>
			</div>

			<!-- Exercise List with integrated Timer -->
			<div v-if="state !== TIMER_STATES.FINISHED" class="timer-exercise-list">
				<ExerciseList
					:exercises="exercisesArray"
					mode="active"
					:current-exercise-index="currentExerciseIndex"
					:current-round="currentRound"
					:total-rounds="timerConfig.rounds"
					:timer-state="state"
					:time-remaining="timeRemaining"
					:state-label="stateLabel"
					:countdown-color="countdownColor"
					:is-paused="isPaused"
					@start="handleStart"
					@pause="handlePause"
					@resume="handleResume"
					@skip="handleSkip"
					@reset="handleReset"
				/>
			</div>

			<!-- Finished State -->
			<div v-else class="finished-section">
				<div class="countdown">
					<div class="countdown-number" style="color: var(--success-color)">
						✓
					</div>
					<div class="countdown-label">{{ t('hawkGym.finished') }}</div>

					<div class="timer-controls">
						<button
								class="btn btn--success btn--large"
								@click="handleFinish"
						>
							{{ t('common.finish') }}
						</button>
					</div>
				</div>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.timer-view {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	min-height: calc(100vh - 120px);
}

.timer-container {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding: 0 var(--space-4);
	padding-bottom: var(--space-8);
}

.timer-info-bar {
	display: flex;
	justify-content: space-around;
	padding: var(--space-3);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-md);
	border: 1px solid var(--card-border);
}

.info-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-1);
}

.info-label {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	text-transform: uppercase;
	letter-spacing: 1px;
	font-weight: var(--font-weight-bold);
}

.info-value {
	font-size: var(--font-size-xl);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
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

.timer-exercise-list {
	width: 100%;
}

.finished-section,
.start-section {
	display: flex;
	justify-content: center;
}

.countdown {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-4);
}

.countdown-number {
	font-size: 120px;
	font-weight: var(--font-weight-bold);
	line-height: 1;
}

.countdown-label {
	font-size: var(--font-size-lg);
	color: var(--text-secondary);
	text-transform: uppercase;
	letter-spacing: 2px;
	font-weight: var(--font-weight-bold);
}

.timer-controls {
	display: flex;
	gap: var(--space-2);
	justify-content: center;
	flex-wrap: wrap;

	.btn {
		flex: 1;
	}
}
</style>