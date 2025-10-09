<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n.js'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { getTodaysWorkout } from '../config/workoutPlans.js'
import { getExercise } from '../config/exercisesConfig.js'
import { computed } from "vue"

const router = useRouter()
const { t } = useI18n()
const { gameData } = useLocalStorage()
const { dayKey, plan } = getTodaysWorkout()

// Get exercise details with translations
const exercisesList = computed(() => {
	return plan.exercises.map(exerciseId => {
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

// Navigate back to home
const handleMenuClick = () => {
	router.push('/')
}

// Get today's day name
const getTodayName = () => {
	const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
	const today = new Date().getDay()
	return days[today]
}

const todayKey = getTodayName()
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
			<p class="gym-subtitle">{{ t(`hawkGym.days.${todayKey}`) }}</p>
		</section>

		<section class="workout-info">
			<div class="info-card">
				<h2>{{ t(plan.nameKey) }}</h2>
				<p class="workout-duration">
					2 {{ t('hawkGym.round') }}s • 6 {{ t('hawkGym.exercise_count') }}s • ~20 {{ t('time.minutes') }}
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

.gym-subtitle {
	font-size: var(--font-size-lg);
	color: var(--text-secondary);
	margin: 0;
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

	h2 {
		font-size: var(--font-size-xl);
		color: var(--text-color);
		margin: 0 0 var(--space-2) 0;
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