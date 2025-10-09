// Workout plans configuration for Hawk Gym
export const WORKOUT_PLANS = {
  monday: {
    nameKey: 'hawkGym.plans.monday.name',
    exercises: [
      'squats',
      'lunges',
      'calf_raises',
      'glute_bridge',
      'squats_dumbbells',
      'stretching'
    ]
  },
  tuesday: {
    nameKey: 'hawkGym.plans.tuesday.name',
    exercises: [
      'push_ups',
      'dumbbell_rows',
      'shoulder_press',
      'bicep_curls',
      'tricep_extensions',
      'stretching'
    ]
  },
  wednesday: {
    nameKey: 'hawkGym.plans.wednesday.name',
    exercises: [
      'sit_ups',
      'russian_twist',
      'plank',
      'leg_raises',
      'superman',
      'stretching'
    ]
  },
  thursday: {
    nameKey: 'hawkGym.plans.thursday.name',
    exercises: [
      'squat_shoulder_press',
      'push_up_row',
      'glute_bridge_leg_raises',
      'side_plank',
      'jumping_jacks',
      'stretching'
    ]
  },
  friday: {
    nameKey: 'hawkGym.plans.friday.name',
    exercises: [
      'deadlifts',
      'bent_over_rows',
      'push_ups',
      'slow_squats',
      'plank_shoulder_taps',
      'stretching'
    ]
  },
  saturday: {
    nameKey: 'hawkGym.plans.saturday.name',
    exercises: [
      'jumping_jacks',
      'sit_ups',
      'mountain_climbers',
      'superman_hold',
      'crunches_twist',
      'stretching'
    ]
  },
  sunday: {
    nameKey: 'hawkGym.plans.sunday.name',
    exercises: [
      'light_walking',
      'stretching',
      'deep_breathing',
      'foam_rolling',
      'yoga',
      'meditation'
    ]
  }
}

// Timer configuration
export const TIMER_CONFIG = {
  exerciseDuration: 40,    // seconds
  restDuration: 20,        // seconds
  breakDuration: 60,       // seconds between rounds
  rounds: 2,               // number of rounds
  getReadyDuration: 5      // seconds to get ready before starting
}

// Get today's workout plan
export const getTodaysWorkout = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = new Date().getDay()
  const dayKey = days[today]
  return {
    dayKey,
    plan: WORKOUT_PLANS[dayKey]
  }
}