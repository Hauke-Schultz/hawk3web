// Gym-specific localStorage management
import { reactive, watch } from 'vue'
import { WORKOUT_PLANS, TIMER_CONFIG } from '../config/workoutPlans.js'

// Storage key
const GYM_STORAGE_KEY = 'hawk3_gym_data'

// Default gym data structure
const getDefaultGymData = () => ({
  // Custom workout plans created by user
  customPlans: {},

  // Timer settings (can be customized by user)
  timerSettings: {
    exerciseDuration: TIMER_CONFIG.exerciseDuration,
    restDuration: TIMER_CONFIG.restDuration,
    breakDuration: TIMER_CONFIG.breakDuration,
    rounds: TIMER_CONFIG.rounds,
    getReadyDuration: TIMER_CONFIG.getReadyDuration
  },

  // Workout history
  workoutHistory: [],

  // User preferences
  preferences: {
    selectedPlan: 'default', // 'default' or custom plan ID or day key (monday, tuesday, etc.)
    soundEnabled: true,
    vibrationEnabled: true,
    autoAdvance: true // Automatically advance to next exercise
  },

  // Statistics
  stats: {
    totalWorkouts: 0,
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    favoriteExercises: {} // exerciseId: count
  }
})

// Load gym data from localStorage
const loadGymData = () => {
  try {
    const stored = localStorage.getItem(GYM_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to ensure all properties exist
      return {
        ...getDefaultGymData(),
        ...parsed,
        timerSettings: {
          ...getDefaultGymData().timerSettings,
          ...(parsed.timerSettings || {})
        },
        preferences: {
          ...getDefaultGymData().preferences,
          ...(parsed.preferences || {})
        },
        stats: {
          ...getDefaultGymData().stats,
          ...(parsed.stats || {})
        }
      }
    }
  } catch (error) {
    console.error('Error loading gym data from localStorage:', error)
  }
  return getDefaultGymData()
}

// Save gym data to localStorage
const saveGymData = (data) => {
  try {
    localStorage.setItem(GYM_STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error saving gym data to localStorage:', error)
    return false
  }
}

// Reactive gym data
const gymData = reactive(loadGymData())

// Watch for changes and auto-save
watch(
    () => gymData,
    (newData) => {
      saveGymData(newData)
    },
    { deep: true }
)

/**
 * Composable for Gym localStorage management
 */
export function useGymLocalStorage() {

  // ==================== Custom Plans ====================

  /**
   * Create a new custom workout plan
   */
  const createCustomPlan = (planId, planData) => {
    if (!planId || !planData) {
      console.error('Invalid plan data')
      return false
    }

    gymData.customPlans[planId] = {
      id: planId,
      name: planData.name || 'Custom Plan',
      exercises: planData.exercises || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return true
  }

  /**
   * Update an existing custom plan
   */
  const updateCustomPlan = (planId, updates) => {
    if (!gymData.customPlans[planId]) {
      console.error('Plan not found:', planId)
      return false
    }

    gymData.customPlans[planId] = {
      ...gymData.customPlans[planId],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return true
  }

  /**
   * Delete a custom plan
   */
  const deleteCustomPlan = (planId) => {
    if (!gymData.customPlans[planId]) {
      return false
    }

    delete gymData.customPlans[planId]

    // If this was the selected plan, reset to default
    if (gymData.preferences.selectedPlan === planId) {
      gymData.preferences.selectedPlan = 'default'
    }

    return true
  }

  /**
   * Get a custom plan by ID
   */
  const getCustomPlan = (planId) => {
    return gymData.customPlans[planId] || null
  }

  /**
   * Get all custom plans
   */
  const getAllCustomPlans = () => {
    return Object.values(gymData.customPlans)
  }

  // ==================== Timer Settings ====================

  /**
   * Update timer settings
   */
  const updateTimerSettings = (settings) => {
    gymData.timerSettings = {
      ...gymData.timerSettings,
      ...settings
    }
  }

  /**
   * Reset timer settings to default
   */
  const resetTimerSettings = () => {
    gymData.timerSettings = { ...getDefaultGymData().timerSettings }
  }

  // ==================== Preferences ====================

  /**
   * Update user preferences
   */
  const updatePreferences = (preferences) => {
    gymData.preferences = {
      ...gymData.preferences,
      ...preferences
    }
  }

  /**
   * Set selected workout plan
   */
  const setSelectedPlan = (planId) => {
    gymData.preferences.selectedPlan = planId
  }

  // ==================== Workout History ====================

  /**
   * Add a completed workout to history
   */
  const addWorkoutToHistory = (workoutData) => {
    const workout = {
      id: Date.now().toString(),
      planId: workoutData.planId || 'default',
      planName: workoutData.planName || 'Workout',
      exercises: workoutData.exercises || [],
      completedAt: new Date().toISOString(),
      duration: workoutData.duration || 0, // in seconds
      rounds: workoutData.rounds || 0,
      skippedExercises: workoutData.skippedExercises || 0
    }

    gymData.workoutHistory.unshift(workout)

    // Keep only last 100 workouts
    if (gymData.workoutHistory.length > 100) {
      gymData.workoutHistory = gymData.workoutHistory.slice(0, 100)
    }

    // Update stats
    updateStatsAfterWorkout(workout)

    return workout
  }

  /**
   * Get workout history
   */
  const getWorkoutHistory = (limit = 10) => {
    return gymData.workoutHistory.slice(0, limit)
  }

  /**
   * Clear workout history
   */
  const clearWorkoutHistory = () => {
    gymData.workoutHistory = []
  }

  // ==================== Statistics ====================

  /**
   * Update statistics after a workout
   */
  const updateStatsAfterWorkout = (workout) => {
    // Increment total workouts
    gymData.stats.totalWorkouts++

    // Add to total minutes
    gymData.stats.totalMinutes += Math.floor(workout.duration / 60)

    // Update streak
    updateWorkoutStreak(workout.completedAt)

    // Update favorite exercises
    workout.exercises.forEach(exerciseId => {
      if (!gymData.stats.favoriteExercises[exerciseId]) {
        gymData.stats.favoriteExercises[exerciseId] = 0
      }
      gymData.stats.favoriteExercises[exerciseId]++
    })

    // Update last workout date
    gymData.stats.lastWorkoutDate = workout.completedAt
  }

  /**
   * Update workout streak
   */
  const updateWorkoutStreak = (completedAt) => {
    const today = new Date(completedAt).toDateString()
    const lastWorkout = gymData.stats.lastWorkoutDate
        ? new Date(gymData.stats.lastWorkoutDate).toDateString()
        : null

    if (!lastWorkout) {
      // First workout
      gymData.stats.currentStreak = 1
    } else {
      const lastDate = new Date(lastWorkout)
      const currentDate = new Date(today)
      const diffTime = currentDate - lastDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // Same day, no change
        return
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        gymData.stats.currentStreak++
      } else {
        // Streak broken, reset to 1
        gymData.stats.currentStreak = 1
      }
    }

    // Update longest streak if current is higher
    if (gymData.stats.currentStreak > gymData.stats.longestStreak) {
      gymData.stats.longestStreak = gymData.stats.currentStreak
    }
  }

  /**
   * Get most performed exercises
   */
  const getMostPerformedExercises = (limit = 5) => {
    const sorted = Object.entries(gymData.stats.favoriteExercises)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)

    return sorted.map(([exerciseId, count]) => ({
      exerciseId,
      count
    }))
  }

  // ==================== Utility Functions ====================

  /**
   * Get current workout plan (default or custom)
   */
  const getCurrentWorkoutPlan = () => {
    const selectedPlan = gymData.preferences.selectedPlan

    // Check if it's a custom plan
    if (selectedPlan !== 'default' && gymData.customPlans[selectedPlan]) {
      return {
        type: 'custom',
        plan: gymData.customPlans[selectedPlan]
      }
    }

    // Check if it's a default day plan
    if (WORKOUT_PLANS[selectedPlan]) {
      return {
        type: 'default',
        dayKey: selectedPlan,
        plan: WORKOUT_PLANS[selectedPlan]
      }
    }

    // Fallback to today's default plan
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = new Date().getDay()
    const dayKey = days[today]

    return {
      type: 'default',
      dayKey,
      plan: WORKOUT_PLANS[dayKey]
    }
  }

  /**
   * Export gym data
   */
  const exportGymData = () => {
    return JSON.stringify(gymData, null, 2)
  }

  /**
   * Import gym data
   */
  const importGymData = (jsonData) => {
    try {
      const imported = JSON.parse(jsonData)
      Object.assign(gymData, {
        ...getDefaultGymData(),
        ...imported
      })
      return true
    } catch (error) {
      console.error('Error importing gym data:', error)
      return false
    }
  }

  /**
   * Reset all gym data
   */
  const resetGymData = () => {
    Object.assign(gymData, getDefaultGymData())
    return true
  }

  // ==================== Return Public API ====================

  return {
    // Data
    gymData,

    // Custom Plans
    createCustomPlan,
    updateCustomPlan,
    deleteCustomPlan,
    getCustomPlan,
    getAllCustomPlans,

    // Timer Settings
    updateTimerSettings,
    resetTimerSettings,

    // Preferences
    updatePreferences,
    setSelectedPlan,

    // Workout History
    addWorkoutToHistory,
    getWorkoutHistory,
    clearWorkoutHistory,

    // Statistics
    getMostPerformedExercises,

    // Utility
    getCurrentWorkoutPlan,
    exportGymData,
    importGymData,
    resetGymData
  }
}