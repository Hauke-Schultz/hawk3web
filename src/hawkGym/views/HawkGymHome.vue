<script setup>
import { computed, ref } from "vue"
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import ExerciseList from '../components/ExerciseList.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { useGymLocalStorage } from '../composables/useGymLocalStorage.js'
import { WORKOUT_PLANS } from '../config/workoutPlans.js'
import { getExercise } from '../config/exercisesConfig.js'
import { useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n.js'

const router = useRouter()
const { t } = useI18n()
const { gameData } = useLocalStorage()
const { gymData, getCurrentWorkoutPlan, setSelectedPlan, getCustomPlanForDay } = useGymLocalStorage()

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
	// Check if there's a custom plan for the selected day
	const customPlan = getCustomPlanForDay(selectedDay.value)

	if (customPlan) {
		return {
			type: 'custom',
			dayKey: selectedDay.value,
			plan: {
				nameKey: customPlan.name, // Use the custom name directly
				exercises: customPlan.exercises
			}
		}
	}

	// Return default plan
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
	// If custom plan, the nameKey is already the full name
	if (currentWorkout.value.type === 'custom') {
		return currentWorkout.value.plan.nameKey
	}

	// For default plans, translate the nameKey
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
					<span v-if="currentWorkout.type === 'custom'" class="custom-badge">
					  {{ t('hawkGym.settings.custom') }}
					</span>
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

				<ExerciseList
						:exercises="workoutPlan.exercises"
						mode="preview"
				/>
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
	display: flex;
	flex-direction: column;
	align-items: center;
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-3);
	gap: var(--space-3);
	text-align: center;

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);

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

.custom-badge {
	display: inline-block;
	padding: var(--space-1) var(--space-2);
	background-color: var(--primary-color);
	color: var(--white);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
	letter-spacing: 0.5px;
}
</style>