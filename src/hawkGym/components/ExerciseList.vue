<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'
import { getExercise } from '../config/exercisesConfig.js'

const props = defineProps({
	exercises: {
		type: Array,
		required: true,
		default: () => []
	},
	mode: {
		type: String,
		default: 'preview', // 'preview' or 'active'
		validator: (value) => ['preview', 'active'].includes(value)
	},
	currentExerciseIndex: {
		type: Number,
		default: -1
	},
	currentRound: {
		type: Number,
		default: 1
	},
	totalRounds: {
		type: Number,
		default: 1
	},
	timerState: {
		type: String,
		default: null
	},
	timeRemaining: {
		type: Number,
		default: 0
	},
	stateLabel: {
		type: String,
		default: ''
	},
	isPaused: {
		type: Boolean,
		default: false
	},
	countdownColor: {
		type: String,
		default: 'var(--primary-color)'
	}
})

const { t } = useI18n()
const emit = defineEmits(['pause', 'resume', 'skip', 'reset'])
const expandedExercises = ref(new Set())
const listRef = ref(null)
const isTimerPaused = computed(() => props.isPaused)

// Get exercise details with translations
const exercisesList = computed(() => {
	return props.exercises.map((exerciseId, index) => {
		const exercise = getExercise(exerciseId)
		if (!exercise) return { id: exerciseId, name: exerciseId, description: '' }

		return {
			id: exercise.id,
			name: t(exercise.nameKey),
			description: t(exercise.descriptionKey),
			category: exercise.category,
			image: exercise.image,
			index: index
		}
	})
})

// Check if exercise is completed (only in active mode)
const isExerciseCompleted = (index) => {
	if (props.mode !== 'active') return false
	return index < props.currentExerciseIndex
}

// Check if exercise is current (only in active mode)
const isExerciseCurrent = (index) => {
	if (props.mode !== 'active') return false
	return index === props.currentExerciseIndex
}

// Check if exercise is upcoming (only in active mode)
const isExerciseUpcoming = (index) => {
	if (props.mode !== 'active') return false
	return index > props.currentExerciseIndex
}

// Toggle exercise expansion
const toggleExercise = (exerciseId) => {
	if (expandedExercises.value.has(exerciseId)) {
		expandedExercises.value.delete(exerciseId)
	} else {
		expandedExercises.value.add(exerciseId)
	}
}

// Check if exercise is expanded
const isExerciseExpanded = (exerciseId) => {
	return expandedExercises.value.has(exerciseId)
}

// Scroll to current exercise
const scrollToCurrentExercise = (index) => {
	if (!listRef.value) return

	const exerciseElement = listRef.value.querySelector(`[data-exercise-index="${index}"]`)
	if (exerciseElement) {
		// Calculate offset to position timer at top of viewport
		const headerHeight = 0 // Approximate header height
		const offset = headerHeight + 16 // Header + small padding

		const elementTop = exerciseElement.getBoundingClientRect().top
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop
		const targetPosition = elementTop + scrollTop - offset

		// Smooth scroll to position
		window.scrollTo({
			top: targetPosition,
			behavior: 'smooth'
		})
	}
}

// Get exercise state class
const getExerciseStateClass = (index) => {
	if (isExerciseCompleted(index)) return 'exercise-item--completed'
	if (isExerciseCurrent(index)) return 'exercise-item--current'
	if (isExerciseUpcoming(index)) return 'exercise-item--upcoming'
	return ''
}
// Timer control handlers
const handleStart = () => emit('start')

const handlePause = () => {
	emit('pause')
}
const handleResume = () => {
	emit('resume')
}
const handleSkip = () => {
	emit('skip')
}
const handleReset = () => emit('reset')

// Check if we should show timer in exercise content
const showTimerInExercise = computed(() => {
	return props.mode === 'active' && props.timerState !== null
})

watch(() => props.currentExerciseIndex, (newIndex, oldIndex) => {
	if (props.mode === 'active' && newIndex >= 0 && newIndex < props.exercises.length) {
		const newExerciseId = props.exercises[newIndex]

		// Collapse previous exercise if it exists
		if (oldIndex >= 0 && oldIndex < props.exercises.length) {
			const oldExerciseId = props.exercises[oldIndex]
			expandedExercises.value.delete(oldExerciseId)
		}

		// Expand current exercise
		expandedExercises.value.add(newExerciseId)
		setTimeout(() => {
			scrollToCurrentExercise(newIndex)
		}, 310)
	}
}, { immediate: true })
</script>

<template>
	<div class="exercise-list" ref="listRef">
		<div
			v-for="(exercise, index) in exercisesList"
			:key="`${exercise.id}-${index}`"
			:data-exercise-index="index"
			class="exercise-item"
			:class="[
        getExerciseStateClass(index),
        { 'exercise-item--expanded': isExerciseExpanded(exercise.id) }
      ]"
		>
			<button
				class="exercise-header"
				@click="toggleExercise(exercise.id)"
				:aria-expanded="isExerciseExpanded(exercise.id)"
				:aria-controls="`exercise-${exercise.id}`"
			>
				<span class="exercise-number">{{ index + 1 }}</span>
				<span class="exercise-name">{{ exercise.name }}</span>
				<Icon
					name="chevron-down"
					size="20"
					class="exercise-toggle-icon"
				/>
			</button>

			<transition name="accordion">
				<div
					v-if="isExerciseExpanded(exercise.id)"
					:id="`exercise-${exercise.id}`"
					class="exercise-content"
				>
					<!-- Timer Display (only for current exercise in active mode) -->
					<div
							v-if="showTimerInExercise && isExerciseCurrent(index)"
							class="exercise-timer-section"
					>
						<!-- Large Timer Display -->
						<div class="timer-display">
							<div
								class="timer-countdown"
								:style="{ color: countdownColor }"
							>
								{{ timeRemaining }}
							</div>
							<div class="timer-label">{{ stateLabel }}</div>
						</div>

						<!-- Main Controls -->
						<div class="timer-main-controls">

							<button
									class="btn-timer btn-timer--secondary"
									:disabled="timerState === 'idle'"
									@click="handleReset"
							>
								<Icon name="reset" size="20" />
							</button>
							<button
								v-if="timerState === 'idle'"
								class="btn-timer btn-timer--primary"
								@click="handleStart"
								:aria-label="t('hawkGym.resume')"
							>
								<Icon name="play" size="32" />
							</button>
							<button
								v-else-if="isTimerPaused"
								class="btn-timer btn-timer--primary"
								@click="handleResume"
								:aria-label="t('hawkGym.resume')"
							>
								<Icon name="play" size="32" />
							</button>
							<button
									v-else
									class="btn-timer btn-timer--primary"
									@click="handlePause"
									:aria-label="t('hawkGym.pause')"
							>
								<Icon name="pause" size="32" />
							</button>

							<!-- Skip Button -->
							<button
									class="btn-timer btn-timer--secondary"
									@click="handleSkip"
									:aria-label="t('hawkGym.skip')"
							>
								<Icon name="skip" size="24" />
							</button>
						</div>
					</div>

					<!-- Exercise Description -->
					<p class="exercise-description">{{ exercise.description }}</p>
				</div>
			</transition>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.exercise-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	width: 100%;
}

.exercise-item {
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
	overflow: hidden;
	transition: all 0.3s ease;

	&--expanded {
		background-color: var(--card-bg);
		border: 1px solid var(--card-border);
	}

	// Active mode states
	&--completed {
		opacity: 0.5;

		.exercise-number {
			background-color: rgba(255, 255, 255, 0.3);
		}
	}

	&--current {
		border: 2px solid var(--primary-color);
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);

		.exercise-header {
			background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
			color: var(--white);
		}

		.exercise-number {
			background-color: var(--white);
			color: var(--primary-color);
		}
	}

	&--upcoming {
		// Default styling
	}
}

.exercise-header {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-3);
	width: 100%;
	background: none;
	border: none;
	cursor: pointer;
	text-align: left;
	color: var(--text-color);
	font-family: var(--font-family-base);
	transition: background-color 0.2s ease;

	&:hover {
		background-color: rgba(79, 70, 229, 0.05);
	}

	&:active {
		background-color: rgba(79, 70, 229, 0.1);
	}

	// Override hover for completed/current states
	.exercise-item--completed &:hover,
	.exercise-item--current &:hover {
		filter: brightness(1.1);
	}
}

.exercise-number {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	background-color: var(--primary-color);
	color: var(--white);
	border-radius: 50%;
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-sm);
	flex-shrink: 0;
	transition: all 0.3s ease;
}

.exercise-name {
	flex: 1;
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-base);

	.exercise-item--current & {
		color: var(--white);
	}

	.exercise-item--completed & {
		color: var(--white);
	}
}

.exercise-status {
	display: flex;
	align-items: center;
	margin-right: var(--space-2);
}

.status-icon {
	&--completed {
		color: var(--white);
	}

	&--current {
		color: var(--white);
		animation: pulse 2s ease-in-out infinite;
	}
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

.exercise-toggle-icon {
	color: var(--text-secondary);
	transition: transform 0.3s ease;
	flex-shrink: 0;

	.exercise-item--expanded & {
		transform: rotate(180deg);
	}

	.exercise-item--current &,
	.exercise-item--completed & {
		color: var(--white);
	}
}

.exercise-content {
	padding: var(--space-3);
	text-align: left;
}

.exercise-description {
	color: var(--text-secondary);
	font-size: var(--font-size-sm);
	line-height: 1.5;
	margin: 0;

	.exercise-item--current & {
		color: var(--text-color);
		background-color: var(--bg-secondary);
		padding: var(--space-3);
		border-radius: var(--border-radius-md);
	}
}

// Accordion animation
.accordion-enter-active,
.accordion-leave-active {
	transition: all 0.3s ease;
	max-height: 600px;
	overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
	max-height: 0;
	opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
	max-height: 600px;
	opacity: 1;
}

.exercise-timer-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-4);
	padding: var(--space-6) var(--space-4);
	background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(139, 92, 246, 0.1));
	border-radius: var(--border-radius-md);
	margin-bottom: var(--space-4);
	position: relative;
}

.timer-display {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	width: 100%;
}

.timer-countdown {
	font-size: 96px;
	font-weight: var(--font-weight-bold);
	line-height: 1;
	transition: color 0.3s ease;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.timer-label {
	font-size: var(--font-size-lg);
	color: var(--text-secondary);
	text-transform: uppercase;
	letter-spacing: 2px;
	font-weight: var(--font-weight-bold);
}

// Main timer controls
.timer-main-controls {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-4);
	width: 100%;
}

.btn-timer {
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	border-radius: 50%;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

	&:active {
		transform: scale(0.95);
	}

	&--primary {
		width: 88px;
		height: 88px;
		background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
		color: var(--white);

		&:hover {
			box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
			transform: scale(1.05);
		}
	}

	&--secondary {
		width: 64px;
		height: 64px;
		background-color: var(--card-bg);
		border: 2px solid var(--card-border);
		color: var(--text-color);

		&:hover {
			background-color: var(--card-bg-hover);
			border-color: var(--primary-color);
			color: var(--primary-color);
		}
	}
}

// Reset button
.btn-reset {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	padding: var(--space-2) var(--space-4);
	background-color: transparent;
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: var(--font-size-sm);
	font-family: var(--font-family-base);

	&:hover {
		background-color: var(--card-bg-hover);
		border-color: var(--warning-color);
		color: var(--warning-color);
	}

	&:active {
		transform: scale(0.98);
	}
}
</style>