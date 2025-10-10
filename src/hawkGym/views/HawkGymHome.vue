<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n.js'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { useGymLocalStorage } from '../composables/useGymLocalStorage.js'
import { WORKOUT_PLANS } from '../config/workoutPlans.js'
import { getExercise } from '../config/exercisesConfig.js'
import { computed, ref } from "vue"

const router = useRouter()
const { t } = useI18n()
const { gameData } = useLocalStorage()
const { gymData, getCurrentWorkoutPlan, setSelectedPlan } = useGymLocalStorage()

// Get today's day key
const getTodayKey = () => {
	const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
	const today = new Date().getDay()
	return days[today]
}

const expandedExercises = ref(new Set())
const todayKey = getTodayKey()

// Available days for selection
const availableDays = [
	{ key: 'monday', nameKey: 'hawkGym.days.monday' },
	{ key: 'tuesday', nameKey: 'hawkGym.days.tuesday' },
	{ key: 'wednesday', nameKey: 'hawkGym.days.wednesday' },
	{ key: 'thursday', nameKey: 'hawkGym.days.thursday' },
	{ key: 'friday', nameKey: 'hawkGym.days.friday' },
	{ key: 'saturday', nameKey: 'hawkGym.days.saturday' },
	{ key: 'sunday', nameKey: 'hawkGym.days.sunday' }
]

// Selected day - initialize with current selection or today
const selectedDay = computed({
	get: () => {
		// If selectedPlan is 'default', use today
		if (gymData.preferences.selectedPlan === 'default') {
			return todayKey
		}
		// If it's a day key, use it
		if (WORKOUT_PLANS[gymData.preferences.selectedPlan]) {
			return gymData.preferences.selectedPlan
		}
		// Fallback to today
		return todayKey
	},
	set: (value) => {
		setSelectedPlan(value)
	}
})

// Get current workout plan based on selected day
const currentWorkout = computed(() => {
	return {
		type: 'default',
		dayKey: selectedDay.value,
		plan: WORKOUT_PLANS[selectedDay.value]
	}
})

const workoutPlan = computed(() => currentWorkout.value.plan)

// Get exercise details with translations
const exercisesList = computed(() => {
	return workoutPlan.value.exercises.map(exerciseId => {
		const exercise = getExercise(exerciseId)
		if (!exercise) return { name: exerciseId, description: '' }

		return {
			id: exercise.id,
			name: t(exercise.nameKey),
			description: t(exercise.descriptionKey),
			category: exercise.category,
			image: exercise.image
		}
	})
})

const toggleExercise = (exerciseId) => {
	if (expandedExercises.value.has(exerciseId)) {
		expandedExercises.value.delete(exerciseId)
	} else {
		expandedExercises.value.add(exerciseId)
	}
}

const isExerciseExpanded = (exerciseId) => {
	return expandedExercises.value.has(exerciseId)
}

// Calculate estimated workout time
const estimatedTime = computed(() => {
	const exerciseCount = exercisesList.value.length
	const { exerciseDuration, restDuration, rounds, breakDuration } = gymData.timerSettings
	return Math.ceil(((exerciseCount * (exerciseDuration + restDuration) * rounds) + (breakDuration * (rounds - 1))) / 60) // in minutes
})

// Navigate to timer
const startWorkout = () => {
	router.push('/hawk-gym/timer')
}

// Navigate to settings
const openSettings = () => {
	router.push('/hawk-gym/settings')
}

// Navigate back to home
const handleMenuClick = () => {
	router.push('/')
}

// Get workout title
const workoutTitle = computed(() => {
	return t(workoutPlan.value.nameKey)
})

// Check if selected day is today
const isToday = computed(() => selectedDay.value === todayKey)
</script>

<template>
	<Header
			:game-data="gameData"
			:player="gameData.player"
			:achievements="gameData.achievements"
			:show-menu-button="true"
			@menu-click="handleMenuClick"
	/>

	<main class="content">
		<section class="gym-header">
			<Icon name="dumbbell" size="48" />
			<h1 class="gym-title">{{ t('hawkGym.title') }}</h1>

			<!-- Day Selection Dropdown -->
			<div class="day-selector">
				<label for="day-select" class="visually-hidden">{{ t('hawkGym.select_day') }}</label>
				<select
						id="day-select"
						v-model="selectedDay"
						class="day-select"
				>
					<option
							v-for="day in availableDays"
							:key="day.key"
							:value="day.key"
					>
						{{ t(day.nameKey) }}
						<template v-if="day.key === todayKey"> ({{ t('hawkGym.today') }})</template>
					</option>
				</select>
				<Icon name="chevron-down" size="16" class="select-icon" />
			</div>
		</section>

		<section class="workout-info">
			<div class="info-card">
				<div class="card-header">
					<h2>{{ workoutTitle }}</h2>
					<button
							class="btn btn--ghost btn--small"
							@click="openSettings"
							:aria-label="t('settings.title')"
					>
						<Icon name="settings" size="20" />
					</button>
				</div>

				<p class="workout-duration">
					{{ gymData.timerSettings.rounds }} {{ t('hawkGym.round') }}s •
					{{ exercisesList.length }} {{ t('hawkGym.exercise_count') }}s •
					~{{ estimatedTime }} {{ t('time.minutes') }}
				</p>

				<div class="exercise-list">
					<div
							v-for="(exercise, index) in exercisesList"
							:key="exercise.id"
							class="exercise-item"
							:class="{ 'exercise-item--expanded': isExerciseExpanded(exercise.id) }"
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
								<p class="exercise-description">{{ exercise.description }}</p>
							</div>
						</transition>
					</div>
				</div>
			</div>
		</section>

		<section class="action-section">
			<button class="btn btn--primary btn--large" @click="startWorkout">
				{{ t('hawkGym.start') }}
			</button>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.gym-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-6) 0;
	text-align: center;
}

.gym-title {
	font-size: var(--font-size-2xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.day-selector {
	position: relative;
	display: inline-flex;
	align-items: center;
}

.day-select {
	appearance: none;
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	padding: var(--space-2) var(--space-8) var(--space-2) var(--space-3);
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: var(--font-family-base);

	&:hover {
		background-color: var(--card-bg-hover);
		border-color: var(--primary-color);
	}

	&:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
	}
}

.select-icon {
	position: absolute;
	right: var(--space-3);
	pointer-events: none;
	color: var(--text-secondary);
}

.workout-info {
	margin-bottom: var(--space-6);
}

.info-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	text-align: center;

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2);

		h2 {
			font-size: var(--font-size-xl);
			color: var(--text-color);
			margin: 0;
			flex: 1;
		}
	}
}

.workout-duration {
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	margin: 0;
}

.exercise-list {
	margin-top: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
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
}

.exercise-name {
	flex: 1;
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-base);
}

.exercise-toggle-icon {
	color: var(--text-secondary);
	transition: transform 0.3s ease;
	flex-shrink: 0;

	.exercise-item--expanded & {
		transform: rotate(180deg);
	}
}

.exercise-content {
	padding: 0 var(--space-3) var(--space-3);
	text-align: left;
}

.exercise-description {
	color: var(--text-secondary);
	font-size: var(--font-size-sm);
	line-height: 1.5;
	margin: 0;
}

// Accordion animation
.accordion-enter-active,
.accordion-leave-active {
	transition: all 0.3s ease;
	max-height: 200px;
	overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
	max-height: 0;
	opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
	max-height: 200px;
	opacity: 1;
}

.action-section {
	display: flex;
	justify-content: center;

	.btn {
		width: 100%;
		max-width: 300px;
	}
}
</style>