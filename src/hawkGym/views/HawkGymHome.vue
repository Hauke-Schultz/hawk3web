<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n.js'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { getTodaysWorkout } from '../config/workoutPlans.js'
import {computed} from "vue";

const router = useRouter()
const { t } = useI18n()
const { gameData } = useLocalStorage()
const { dayKey, plan } = getTodaysWorkout()

const exercisesList = computed(() => {
	return plan.exercises.map(key => t(key))
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
							:key="index"
							class="exercise-item"
					>
						<span class="exercise-number">{{ index + 1 }}</span>
						<span class="exercise-name">{{ exercise }}</span>
					</div>
				</div>
			</div>
		</section>

		<section class="action-section">
			<button class="btn btn--primary btn--large" @click="startWorkout">
				<Icon name="play" size="20" />
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
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
}

.exercise-number {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	background-color: var(--primary-color);
	color: var(--white);
	border-radius: 50%;
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-xs);
	flex-shrink: 0;
}

.exercise-name {
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
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