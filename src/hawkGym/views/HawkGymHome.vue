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
					~{{ Math.ceil((exercisesList.length * (gymData.timerSettings.exerciseDuration + gymData.timerSettings.restDuration) * gymData.timerSettings.rounds) / 60) }} {{ t('time.minutes') }}
				</p>

				<div class="exercise-list">
					<div
							v-for="(exercise, index) in exercisesList"
							:key="exercise.id"
							class="exercise-item"
					>
						<span class="exercise-number">{{ index + 1 }}</span>
						<div class="exercise-details">
							<span class="exercise-name">{{ exercise.name }}</span>
							<span class="exercise-description">{{ exercise.description }}</span>
						</div>
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
	display: flex;
	align-items: flex-start;
	gap: var(--space-3);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
	text-align: left;
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
	margin-top: var(--space-1);
}

.exercise-details {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	flex: 1;
}

.exercise-name {
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-base);
}

.exercise-description {
	color: var(--text-secondary);
	font-size: var(--font-size-sm);
	line-height: 1.4;
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