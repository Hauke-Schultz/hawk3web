import { ref, computed, watch } from 'vue'
import { TIMER_CONFIG } from '../config/workoutPlans.js'

// Timer states
export const TIMER_STATES = {
  IDLE: 'idle',
  GET_READY: 'getReady',
  EXERCISE: 'exercise',
  REST: 'rest',
  BREAK: 'break',
  FINISHED: 'finished'
}

export function useWorkoutTimer(exercises) {
  // State
  const state = ref(TIMER_STATES.IDLE)
  const currentRound = ref(1)
  const currentExerciseIndex = ref(0)
  const timeRemaining = ref(0)
  const isPaused = ref(false)

  // Timer interval
  let timerInterval = null

  // Computed properties
  const totalExercises = computed(() => exercises.length)
  const currentExercise = computed(() => exercises[currentExerciseIndex.value])
  const nextExercise = computed(() => {
    const nextIndex = currentExerciseIndex.value + 1
    if (nextIndex < exercises.length) {
      return exercises[nextIndex]
    }
    // If last exercise in round
    if (currentRound.value < TIMER_CONFIG.rounds) {
      return exercises[0] // First exercise of next round
    }
    return null // Workout finished
  })

  const progress = computed(() => {
    const totalSeconds = getTotalDuration()
    const elapsed = getElapsedSeconds()
    return Math.min(100, Math.round((elapsed / totalSeconds) * 100))
  })

  const isLastExerciseInRound = computed(() => {
    return currentExerciseIndex.value === exercises.length - 1
  })

  const isLastRound = computed(() => {
    return currentRound.value === TIMER_CONFIG.rounds
  })

  // Get total workout duration in seconds
  const getTotalDuration = () => {
    const exercisesPerRound = exercises.length
    const exerciseTime = exercisesPerRound * TIMER_CONFIG.exerciseDuration
    const restTime = (exercisesPerRound - 1) * TIMER_CONFIG.restDuration
    const roundTime = exerciseTime + restTime
    const totalTime = (roundTime * TIMER_CONFIG.rounds) +
        ((TIMER_CONFIG.rounds - 1) * TIMER_CONFIG.breakDuration) +
        TIMER_CONFIG.getReadyDuration
    return totalTime
  }

  // Get elapsed seconds
  const getElapsedSeconds = () => {
    let elapsed = 0

    // Add get ready time if past it
    if (state.value !== TIMER_STATES.IDLE && state.value !== TIMER_STATES.GET_READY) {
      elapsed += TIMER_CONFIG.getReadyDuration
    }

    // Add completed rounds
    if (currentRound.value > 1) {
      const exercisesPerRound = exercises.length
      const exerciseTime = exercisesPerRound * TIMER_CONFIG.exerciseDuration
      const restTime = (exercisesPerRound - 1) * TIMER_CONFIG.restDuration
      const roundTime = exerciseTime + restTime
      elapsed += (currentRound.value - 1) * roundTime
      elapsed += (currentRound.value - 1) * TIMER_CONFIG.breakDuration
    }

    // Add completed exercises in current round
    if (currentExerciseIndex.value > 0) {
      elapsed += currentExerciseIndex.value * TIMER_CONFIG.exerciseDuration
      elapsed += currentExerciseIndex.value * TIMER_CONFIG.restDuration
    }

    // Add current phase progress
    const maxTime = getMaxTimeForState()
    elapsed += (maxTime - timeRemaining.value)

    return elapsed
  }

  // Get max time for current state
  const getMaxTimeForState = () => {
    switch (state.value) {
      case TIMER_STATES.GET_READY:
        return TIMER_CONFIG.getReadyDuration
      case TIMER_STATES.EXERCISE:
        return TIMER_CONFIG.exerciseDuration
      case TIMER_STATES.REST:
        return TIMER_CONFIG.restDuration
      case TIMER_STATES.BREAK:
        return TIMER_CONFIG.breakDuration
      default:
        return 0
    }
  }

  // Start the timer
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

  // Stop the timer
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // Advance to next state
  const advance = () => {
    switch (state.value) {
      case TIMER_STATES.GET_READY:
        // Start first exercise
        state.value = TIMER_STATES.EXERCISE
        timeRemaining.value = TIMER_CONFIG.exerciseDuration
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
            timeRemaining.value = TIMER_CONFIG.breakDuration
            currentRound.value++
            currentExerciseIndex.value = 0
          }
        } else {
          // Rest between exercises
          state.value = TIMER_STATES.REST
          timeRemaining.value = TIMER_CONFIG.restDuration
        }
        break

      case TIMER_STATES.REST:
        // Move to next exercise
        currentExerciseIndex.value++
        state.value = TIMER_STATES.EXERCISE
        timeRemaining.value = TIMER_CONFIG.exerciseDuration
        break

      case TIMER_STATES.BREAK:
        // Start next round
        state.value = TIMER_STATES.EXERCISE
        timeRemaining.value = TIMER_CONFIG.exerciseDuration
        break

      default:
        break
    }
  }

  // Public methods
  const start = () => {
    if (state.value === TIMER_STATES.IDLE) {
      state.value = TIMER_STATES.GET_READY
      timeRemaining.value = TIMER_CONFIG.getReadyDuration
      currentRound.value = 1
      currentExerciseIndex.value = 0
    }
    isPaused.value = false
    startTimer()
  }

  const pause = () => {
    isPaused.value = true
  }

  const resume = () => {
    isPaused.value = false
  }

  const skip = () => {
    timeRemaining.value = 0
    advance()
  }

  const reset = () => {
    stopTimer()
    state.value = TIMER_STATES.IDLE
    currentRound.value = 1
    currentExerciseIndex.value = 0
    timeRemaining.value = 0
    isPaused.value = false
  }

  // Cleanup on unmount
  const cleanup = () => {
    stopTimer()
  }

  return {
    state: computed(() => state.value),
    currentRound: computed(() => currentRound.value),
    currentExerciseIndex: computed(() => currentExerciseIndex.value),
    timeRemaining: computed(() => timeRemaining.value),
    isPaused: computed(() => isPaused.value),

    // Computed
    totalExercises,
    currentExercise,
    nextExercise,
    progress,

    // Config
    config: TIMER_CONFIG,

    // Methods
    start,
    pause,
    resume,
    skip,
    reset,
    cleanup,

    // Add STATES for template access
    STATES: TIMER_STATES
  }
}