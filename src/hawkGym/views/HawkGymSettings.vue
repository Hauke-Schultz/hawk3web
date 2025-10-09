<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../../composables/useI18n.js'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { useGymLocalStorage } from '../composables/useGymLocalStorage.js'
import {TIMER_CONFIG, WORKOUT_PLANS} from '../config/workoutPlans.js'
import { EXERCISES, getExercise } from '../config/exercisesConfig.js'

const router = useRouter()
const { t } = useI18n()
const { gameData } = useLocalStorage()
const { gymData, updateTimerSettings, resetTimerSettings } = useGymLocalStorage()

// Local state for editing
const editedSettings = ref({
	exerciseDuration: gymData.timerSettings.exerciseDuration,
	restDuration: gymData.timerSettings.restDuration,
	breakDuration: gymData.timerSettings.breakDuration,
	rounds: gymData.timerSettings.rounds,
	getReadyDuration: gymData.timerSettings.getReadyDuration
})

// Track if settings have been changed
const hasChanges = computed(() => {
	return (
		editedSettings.value.exerciseDuration !== gymData.timerSettings.exerciseDuration ||
		editedSettings.value.restDuration !== gymData.timerSettings.restDuration ||
		editedSettings.value.breakDuration !== gymData.timerSettings.breakDuration ||
		editedSettings.value.rounds !== gymData.timerSettings.rounds ||
		editedSettings.value.getReadyDuration !== gymData.timerSettings.getReadyDuration
	)
})

// Check if settings are at default values
const isDefault = computed(() => {
	return (
		editedSettings.value.exerciseDuration === TIMER_CONFIG.exerciseDuration &&
		editedSettings.value.restDuration === TIMER_CONFIG.restDuration &&
		editedSettings.value.breakDuration === TIMER_CONFIG.breakDuration &&
		editedSettings.value.rounds === TIMER_CONFIG.rounds &&
		editedSettings.value.getReadyDuration === TIMER_CONFIG.getReadyDuration
	)
})

// Validation rules
const validationRules = {
	exerciseDuration: { min: 10, max: 300 },
	restDuration: { min: 5, max: 120 },
	breakDuration: { min: 10, max: 300 },
	rounds: { min: 1, max: 10 },
	getReadyDuration: { min: 3, max: 30 }
}

// Validate a setting
const isValid = (key, value) => {
	const rules = validationRules[key]
	return value >= rules.min && value <= rules.max
}

// Check if all settings are valid
const allValid = computed(() => {
	return Object.keys(editedSettings.value).every(key =>
		isValid(key, editedSettings.value[key])
	)
})

// Save settings
const saveSettings = () => {
	if (!allValid.value) {
		return
	}

	updateTimerSettings(editedSettings.value)

	// Show success feedback
	showSuccessMessage.value = true
	setTimeout(() => {
		showSuccessMessage.value = false
	}, 2000)
}

// Reset to defaults
const resetToDefaults = () => {
	editedSettings.value = {
		exerciseDuration: TIMER_CONFIG.exerciseDuration,
		restDuration: TIMER_CONFIG.restDuration,
		breakDuration: TIMER_CONFIG.breakDuration,
		rounds: TIMER_CONFIG.rounds,
		getReadyDuration: TIMER_CONFIG.getReadyDuration
	}

	resetTimerSettings()

	// Show success feedback
	showSuccessMessage.value = true
	setTimeout(() => {
		showSuccessMessage.value = false
	}, 2000)
}

// Cancel and go back
const cancel = () => {
	router.push('/hawk-gym')
}

// Navigate back to gym home
const handleMenuClick = () => {
	router.push('/hawk-gym')
}

// Success message state
const showSuccessMessage = ref(false)

// Calculate estimated workout time
const estimatedTime = computed(() => {
	const exercisesPerRound = 6 // Average
	const exerciseTime = exercisesPerRound * editedSettings.value.exerciseDuration
	const restTime = (exercisesPerRound - 1) * editedSettings.value.restDuration
	const roundTime = exerciseTime + restTime
	const totalTime = (roundTime * editedSettings.value.rounds) +
		((editedSettings.value.rounds - 1) * editedSettings.value.breakDuration) +
		editedSettings.value.getReadyDuration

	return Math.ceil(totalTime / 60) // Convert to minutes
})

// Get current selected day
const selectedDay = computed(() => {
	const selected = gymData.preferences.selectedPlan
	// If it's 'default', use today
	if (selected === 'default') {
		const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
		const today = new Date().getDay()
		return days[today]
	}
	// If it's a day key, use it
	if (WORKOUT_PLANS[selected]) {
		return selected
	}
	// Fallback to today
	const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
	const today = new Date().getDay()
	return days[today]
})

// Current plan exercises (editable)
const editedExercises = ref([...WORKOUT_PLANS[selectedDay.value].exercises])

// Track if exercises have been changed
const hasExerciseChanges = computed(() => {
	const original = WORKOUT_PLANS[selectedDay.value].exercises

	// Check length
	if (editedExercises.value.length !== original.length) {
		return true
	}

	// Check each exercise
	return editedExercises.value.some((ex, index) => ex !== original[index])
})

// Available exercises grouped by category
const exercisesByCategory = computed(() => {
	const categories = {}

	Object.values(EXERCISES).forEach(exercise => {
		if (!categories[exercise.category]) {
			categories[exercise.category] = []
		}
		categories[exercise.category].push(exercise)
	})

	return categories
})

// Show/hide exercise picker
const showExercisePicker = ref(false)

// Add exercise to plan
const addExercise = (exerciseId) => {
	editedExercises.value.push(exerciseId)
	showExercisePicker.value = false
}

// Remove exercise from plan
const removeExercise = (index) => {
	editedExercises.value.splice(index, 1)
}

// Move exercise up
const moveExerciseUp = (index) => {
	if (index === 0) return

	const temp = editedExercises.value[index]
	editedExercises.value[index] = editedExercises.value[index - 1]
	editedExercises.value[index - 1] = temp
}

// Move exercise down
const moveExerciseDown = (index) => {
	if (index === editedExercises.value.length - 1) return

	const temp = editedExercises.value[index]
	editedExercises.value[index] = editedExercises.value[index + 1]
	editedExercises.value[index + 1] = temp
}

// Reset exercises to original
const resetExercises = () => {
	editedExercises.value = [...WORKOUT_PLANS[selectedDay.value].exercises]
}

// Save exercise changes (for now, just show in console - will implement custom plans later)
const saveExerciseChanges = () => {
	console.log('Saving exercise changes:', editedExercises.value)
	// TODO: Implement custom plan creation/update
	// For now, just show success message
	showSuccessMessage.value = true
	setTimeout(() => {
		showSuccessMessage.value = false
	}, 2000)
}

// Get exercise details for display
const getExerciseDetails = (exerciseId) => {
	const exercise = getExercise(exerciseId)
	if (!exercise) return { name: exerciseId, category: 'unknown' }

	return {
		id: exercise.id,
		name: t(exercise.nameKey),
		description: t(exercise.descriptionKey),
		category: exercise.category
	}
}

// Category display names
const getCategoryName = (category) => {
	const categoryNames = {
		lower_body: t('hawkGym.categories.lower_body'),
		upper_body: t('hawkGym.categories.upper_body'),
		core: t('hawkGym.categories.core'),
		cardio: t('hawkGym.categories.cardio'),
		combination: t('hawkGym.categories.combination'),
		recovery: t('hawkGym.categories.recovery')
	}
	return categoryNames[category] || category
}
</script>

<template>
	<Header
		:game-data="gameData"
		:player="gameData.player"
		:achievements="gameData.achievements"
		:show-menu-button="true"
		@menu-click="handleMenuClick"
	/>

	<main class="content settings-view">
		<!-- Header -->
		<section class="settings-header">
			<h1 class="settings-title">
				<Icon name="settings" size="32" />
				{{ t('hawkGym.settings.title') }}
			</h1>
			<p class="settings-subtitle">{{ t('hawkGym.settings.subtitle') }}</p>
		</section>

		<!-- Success Message -->
		<transition name="fade">
			<div v-if="showSuccessMessage" class="success-message">
				<Icon name="check" size="20" />
				{{ t('hawkGym.settings.saved') }}
			</div>
		</transition>

		<!-- Timer Settings -->
		<section class="settings-section">
			<div class="section-header">
				<h2 class="section-title">
					<Icon name="clock" size="24" />
					{{ t('hawkGym.settings.timer_settings') }}
				</h2>
				<button
					v-if="!isDefault"
					class="btn btn--ghost btn--small"
					@click="resetToDefaults"
				>
					<Icon name="refresh" size="16" />
					{{ t('hawkGym.settings.reset_defaults') }}
				</button>
			</div>

			<div class="settings-grid">
				<!-- Exercise Duration -->
				<div class="setting-item">
					<label :for="'exercise-duration'" class="setting-label">
						{{ t('hawkGym.settings.exercise_duration') }}
						<span class="setting-unit">({{ t('time.seconds') }})</span>
					</label>
					<div class="input-group">
						<input
							id="exercise-duration"
							v-model.number="editedSettings.exerciseDuration"
							type="number"
							:min="validationRules.exerciseDuration.min"
							:max="validationRules.exerciseDuration.max"
							class="setting-input"
							:class="{ 'input-error': !isValid('exerciseDuration', editedSettings.exerciseDuration) }"
						/>
						<span class="input-hint">
							{{ validationRules.exerciseDuration.min }}-{{ validationRules.exerciseDuration.max }}s
						</span>
					</div>
				</div>

				<!-- Rest Duration -->
				<div class="setting-item">
					<label :for="'rest-duration'" class="setting-label">
						{{ t('hawkGym.settings.rest_duration') }}
						<span class="setting-unit">({{ t('time.seconds') }})</span>
					</label>
					<div class="input-group">
						<input
							id="rest-duration"
							v-model.number="editedSettings.restDuration"
							type="number"
							:min="validationRules.restDuration.min"
							:max="validationRules.restDuration.max"
							class="setting-input"
							:class="{ 'input-error': !isValid('restDuration', editedSettings.restDuration) }"
						/>
						<span class="input-hint">
							{{ validationRules.restDuration.min }}-{{ validationRules.restDuration.max }}s
						</span>
					</div>
				</div>

				<!-- Break Duration -->
				<div class="setting-item">
					<label :for="'break-duration'" class="setting-label">
						{{ t('hawkGym.settings.break_duration') }}
						<span class="setting-unit">({{ t('time.seconds') }})</span>
					</label>
					<div class="input-group">
						<input
							id="break-duration"
							v-model.number="editedSettings.breakDuration"
							type="number"
							:min="validationRules.breakDuration.min"
							:max="validationRules.breakDuration.max"
							class="setting-input"
							:class="{ 'input-error': !isValid('breakDuration', editedSettings.breakDuration) }"
						/>
						<span class="input-hint">
							{{ validationRules.breakDuration.min }}-{{ validationRules.breakDuration.max }}s
						</span>
					</div>
				</div>

				<!-- Rounds -->
				<div class="setting-item">
					<label :for="'rounds'" class="setting-label">
						{{ t('hawkGym.settings.rounds') }}
					</label>
					<div class="input-group">
						<input
							id="rounds"
							v-model.number="editedSettings.rounds"
							type="number"
							:min="validationRules.rounds.min"
							:max="validationRules.rounds.max"
							class="setting-input"
							:class="{ 'input-error': !isValid('rounds', editedSettings.rounds) }"
						/>
						<span class="input-hint">
							{{ validationRules.rounds.min }}-{{ validationRules.rounds.max }}
						</span>
					</div>
				</div>

				<!-- Get Ready Duration -->
				<div class="setting-item">
					<label :for="'get-ready-duration'" class="setting-label">
						{{ t('hawkGym.settings.get_ready_duration') }}
						<span class="setting-unit">({{ t('time.seconds') }})</span>
					</label>
					<div class="input-group">
						<input
							id="get-ready-duration"
							v-model.number="editedSettings.getReadyDuration"
							type="number"
							:min="validationRules.getReadyDuration.min"
							:max="validationRules.getReadyDuration.max"
							class="setting-input"
							:class="{ 'input-error': !isValid('getReadyDuration', editedSettings.getReadyDuration) }"
						/>
						<span class="input-hint">
							{{ validationRules.getReadyDuration.min }}-{{ validationRules.getReadyDuration.max }}s
						</span>
					</div>
				</div>
			</div>
			<!-- Workout Plan Editor -->
			<section class="settings-section">
				<div class="section-header">
					<h2 class="section-title">
						<Icon name="list" size="24" />
						{{ t('hawkGym.settings.workout_plan') }}
					</h2>
					<button
							v-if="hasExerciseChanges"
							class="btn btn--ghost btn--small"
							@click="resetExercises"
					>
						<Icon name="refresh" size="16" />
						{{ t('hawkGym.settings.reset') }}
					</button>
				</div>

				<div class="plan-info">
					<p class="plan-day">
						{{ t('hawkGym.settings.editing_plan') }}:
						<strong>{{ t(`hawkGym.days.${selectedDay}`) }}</strong>
					</p>
					<p class="plan-note">{{ t('hawkGym.settings.plan_note') }}</p>
				</div>

				<!-- Exercise List -->
				<div class="exercise-editor-list">
					<div
							v-for="(exerciseId, index) in editedExercises"
							:key="`${exerciseId}-${index}`"
							class="exercise-editor-item"
					>
						<div class="exercise-info">
							<span class="exercise-number">{{ index + 1 }}</span>
							<div class="exercise-text">
								<span class="exercise-name">{{ getExerciseDetails(exerciseId).name }}</span>
								<span class="exercise-category">{{ getCategoryName(getExerciseDetails(exerciseId).category) }}</span>
							</div>
						</div>

						<div class="exercise-actions">
							<button
									class="btn-icon"
									:disabled="index === 0"
									@click="moveExerciseUp(index)"
									:aria-label="t('hawkGym.settings.move_up')"
							>
								<Icon name="chevron-up" size="20" />
							</button>
							<button
									class="btn-icon"
									:disabled="index === editedExercises.length - 1"
									@click="moveExerciseDown(index)"
									:aria-label="t('hawkGym.settings.move_down')"
							>
								<Icon name="chevron-down" size="20" />
							</button>
							<button
									class="btn-icon btn-icon--danger"
									@click="removeExercise(index)"
									:aria-label="t('hawkGym.settings.remove')"
							>
								<Icon name="trash" size="20" />
							</button>
						</div>
					</div>
				</div>

				<!-- Add Exercise Button -->
				<button
						class="btn btn--secondary"
						@click="showExercisePicker = true"
				>
					<Icon name="plus" size="20" />
					{{ t('hawkGym.settings.add_exercise') }}
				</button>

				<!-- Save Exercise Changes -->
				<button
						v-if="hasExerciseChanges"
						class="btn btn--primary"
						@click="saveExerciseChanges"
				>
					<Icon name="check" size="20" />
					{{ t('hawkGym.settings.save_changes') }}
				</button>
			</section>

			<!-- Exercise Picker Modal -->
			<div v-if="showExercisePicker" class="modal-overlay" @click="showExercisePicker = false">
				<div class="modal-content" @click.stop>
					<div class="modal-header">
						<h3 class="modal-title">{{ t('hawkGym.settings.select_exercise') }}</h3>
						<button
								class="btn-icon"
								@click="showExercisePicker = false"
								:aria-label="t('common.close')"
						>
							<Icon name="x" size="24" />
						</button>
					</div>

					<div class="modal-body">
						<div
								v-for="(exercises, category) in exercisesByCategory"
								:key="category"
								class="exercise-category"
						>
							<h4 class="category-title">{{ getCategoryName(category) }}</h4>
							<div class="category-exercises">
								<button
										v-for="exercise in exercises"
										:key="exercise.id"
										class="exercise-option"
										@click="addExercise(exercise.id)"
								>
									<span class="exercise-option-name">{{ t(exercise.nameKey) }}</span>
									<Icon name="plus" size="16" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Estimated Time Info -->
			<div class="info-box">
				<Icon name="info" size="20" />
				<div>
					<strong>{{ t('hawkGym.settings.estimated_time') }}:</strong>
					~{{ estimatedTime }} {{ t('time.minutes') }}
					<span class="info-note">({{ t('hawkGym.settings.based_on_6_exercises') }})</span>
				</div>
			</div>
		</section>



		<!-- Action Buttons -->
		<section class="actions-section">
			<button
				class="btn btn--ghost"
				@click="cancel"
			>
				{{ t('common.cancel') }}
			</button>
			<button
				class="btn btn--primary"
				:disabled="!hasChanges || !allValid"
				@click="saveSettings"
			>
				<Icon name="check" size="20" />
				{{ t('common.save') }}
			</button>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.settings-view {
	padding-bottom: var(--space-8);
}

.settings-header {
	text-align: center;
	padding: var(--space-6) 0;
}

.settings-title {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-3);
	font-size: var(--font-size-2xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-2) 0;
}

.settings-subtitle {
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	margin: 0;
}

.success-message {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	padding: var(--space-3);
	background-color: var(--success-color);
	color: var(--white);
	border-radius: var(--border-radius-md);
	margin-bottom: var(--space-4);
	font-weight: var(--font-weight-bold);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.settings-section {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	margin-bottom: var(--space-4);
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: var(--space-4);
	gap: var(--space-2);
}

.section-title {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.settings-grid {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.setting-item {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.setting-label {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	display: flex;
	align-items: baseline;
	gap: var(--space-1);
}

.setting-unit {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-base);
	color: var(--text-secondary);
}

.input-group {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.setting-input {
	width: 100%;
	padding: var(--space-3);
	font-size: var(--font-size-base);
	font-family: var(--font-family-base);
	color: var(--text-color);
	background-color: var(--bg-secondary);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
	}

	&.input-error {
		border-color: var(--error-color);

		&:focus {
			box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
		}
	}
}

.input-hint {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
}

.info-box {
	display: flex;
	align-items: flex-start;
	gap: var(--space-3);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
	margin-top: var(--space-4);
	font-size: var(--font-size-sm);
	color: var(--text-color);

	strong {
		color: var(--text-color);
	}
}

.info-note {
	color: var(--text-secondary);
	font-size: var(--font-size-xs);
}

.actions-section {
	display: flex;
	gap: var(--space-3);
	justify-content: space-between;

	.btn {
		flex: 1;
	}
}


.plan-info {
	margin-bottom: var(--space-4);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.plan-day {
	font-size: var(--font-size-base);
	color: var(--text-color);
	margin: 0 0 var(--space-1) 0;

	strong {
		color: var(--primary-color);
	}
}

.plan-note {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
}

.exercise-editor-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	margin-bottom: var(--space-4);
}

.exercise-editor-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	gap: var(--space-3);
}

.exercise-info {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	flex: 1;
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

.exercise-text {
	display: flex;
	flex-direction: column;
	gap: var(--space-0);
}

.exercise-name {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
}

.exercise-category {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.exercise-actions {
	display: flex;
	gap: var(--space-1);
}

.btn-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	color: var(--text-color);
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: var(--card-bg-hover);
		border-color: var(--primary-color);
		color: var(--primary-color);
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	&--danger {
		&:hover:not(:disabled) {
			border-color: var(--error-color);
			color: var(--error-color);
		}
	}
}

// Modal styles
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: var(--space-4);
}

.modal-content {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	max-width: 500px;
	width: 100%;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--space-4);
	border-bottom: 1px solid var(--card-border);
}

.modal-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.modal-body {
	padding: var(--space-4);
	overflow-y: auto;
	flex: 1;
}

.exercise-category {
	margin-bottom: var(--space-4);

	&:last-child {
		margin-bottom: 0;
	}
}

.category-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-2) 0;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.category-exercises {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.exercise-option {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	color: var(--text-color);
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: var(--font-family-base);
	font-size: var(--font-size-base);
	text-align: left;

	&:hover {
		background-color: var(--card-bg-hover);
		border-color: var(--primary-color);
		color: var(--primary-color);
	}
}

.exercise-option-name {
	font-weight: var(--font-weight-bold);
}
</style>